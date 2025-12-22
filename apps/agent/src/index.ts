import { exec } from "child_process";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { createServer } from "net";
import OpenAI from "openai";
import { promisify } from "util";
import {
  getNavigationHistory,
  startBrowserSession,
} from "./playwright/handler";
import { getApiKey, saveSettings } from "./playwright/settingsStorage";

const execAsync = promisify(exec);
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post("/api/start", async (req, res) => {
  try {
    const { url, theme, customPrompt } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Invalid URL" });
    }

    if (!theme || typeof theme !== "string") {
      return res.status(400).json({ error: "Invalid theme" });
    }

    // Start browser session (non-blocking)
    startBrowserSession(url, theme, customPrompt).catch((error) => {
      console.error("Browser session error:", error);
    });

    res.json({ success: true, message: "Browser session started" });
  } catch (error) {
    console.error("Error starting browser session:", error);
    res.status(500).json({ error: "Failed to start browser session" });
  }
});

app.get("/api/navigation/:baseUrl", (req, res) => {
  try {
    const { baseUrl } = req.params;
    const decodedBaseUrl = decodeURIComponent(baseUrl);
    const history = getNavigationHistory(decodedBaseUrl);
    res.json({ success: true, navigationHistory: history });
  } catch (error) {
    console.error("Error getting navigation history:", error);
    res.status(500).json({ error: "Failed to get navigation history" });
  }
});

app.get("/api/models", async (req, res) => {
  try {
    const apiKey = getApiKey();
    const openai = new OpenAI({ apiKey });

    const models = await openai.models.list();
    const modelIds = models.data
      .map((model) => model.id)
      .filter((id) => id.startsWith("gpt-") || id.startsWith("o1-"))
      .sort();

    res.json({ success: true, models: modelIds });
  } catch (error) {
    console.error("Error fetching models:", error);
    // Return default models if API call fails
    res.json({
      success: true,
      models: [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
        "gpt-4",
        "gpt-3.5-turbo",
      ],
    });
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    const settings = req.body;
    await saveSettings(settings);
    res.json({ success: true, message: "Settings saved" });
  } catch (error) {
    console.error("Error saving settings:", error);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

const checkPortAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      server.removeAllListeners();
      if (err.code === "EADDRINUSE") {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.listen(port, "127.0.0.1", () => {
      server.once("close", () => {
        resolve(true);
      });
      server.close();
    });
  });
};

const findAvailablePort = async (startPort: number): Promise<number> => {
  for (let port = startPort; port < startPort + 100; port++) {
    const available = await checkPortAvailable(port);
    if (available) {
      return port;
    }
  }
  throw new Error("No available port found");
};

const killProcessOnPort = async (port: number): Promise<void> => {
  try {
    if (process.platform === "darwin" || process.platform === "linux") {
      // Find process using the port
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      const pid = stdout.trim();
      if (pid) {
        console.log(`Killing process ${pid} on port ${port}`);
        await execAsync(`kill -9 ${pid}`);
        // Wait a bit for the port to be released
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } else if (process.platform === "win32") {
      // Windows: find and kill process
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split("\n");
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(Number(pid))) {
          console.log(`Killing process ${pid} on port ${port}`);
          await execAsync(`taskkill /F /PID ${pid}`);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    // Ignore errors - port might not be in use or process might not exist
    console.log(`No process found on port ${port} or unable to kill it`);
  }
};

const startServer = async (): Promise<void> => {
  const port = PORT;
  const host = "127.0.0.1"; // Explicitly bind to localhost

  // Check if port is available
  const isAvailable = await checkPortAvailable(port);

  if (!isAvailable) {
    console.log(`Port ${port} is in use, attempting to free it...`);
    await killProcessOnPort(port);

    // Check again after killing
    const isNowAvailable = await checkPortAvailable(port);

    if (!isNowAvailable) {
      console.error(`Port ${port} is still in use and could not be freed.`);
      console.error(`Please close the application using port ${port} and try again.`);
      throw new Error(`Port ${port} is not available`);
    } else {
      console.log(`Port ${port} is now available`);
    }
  }

  app.listen(port, host, () => {
    console.log(`Agent server running on http://${host}:${port}`);
  }).on("error", (error: NodeJS.ErrnoException) => {
    console.error(`Failed to start server on ${host}:${port}:`, error);
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Please close the application using this port.`);
    }
    process.exit(1);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
