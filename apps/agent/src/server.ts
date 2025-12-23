import { Generation } from "@composer/shared";
import cors from "cors";
import express from "express";
import { createServer } from "net";
import OpenAI from "openai";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { addGeneration, getGenerations } from "./playwright/generationsStorage";
import {
  getNavigationHistory,
  startBrowserSession,
} from "./playwright/handler";
import { getApiKey, saveSettings } from "./playwright/settingsStorage";
import { incrementTabUsage, loadTabUsage } from "./playwright/tabUsageStorage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3001;

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

const createExpressApp = () => {
  const app = express();

  app.use(cors());
  // Increase body size limit to 50MB to handle screenshots
  app.use(express.json({ limit: "50mb" }));

  // Serve static files (logo)
  app.use("/static", express.static(path.join(__dirname, "../public")));

  app.post("/api/start", async (req, res) => {
    try {
      const { url, theme, customPrompt, customGhostWriterPrompt } = req.body;

      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "Invalid URL" });
      }

      if (!theme || typeof theme !== "string") {
        return res.status(400).json({ error: "Invalid theme" });
      }

      // Start browser session (non-blocking)
      startBrowserSession(
        url,
        theme,
        customPrompt,
        customGhostWriterPrompt
      ).catch((error) => {
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

  app.post("/api/generations", async (req, res) => {
    try {
      const { baseUrl, generation } = req.body;

      if (!baseUrl || typeof baseUrl !== "string") {
        return res.status(400).json({ error: "Invalid baseUrl" });
      }

      if (!generation || typeof generation !== "object") {
        return res.status(400).json({ error: "Invalid generation" });
      }

      await addGeneration(baseUrl, generation as Generation);
      res.json({ success: true, message: "Generation saved" });
    } catch (error) {
      console.error("Error saving generation:", error);
      res.status(500).json({ error: "Failed to save generation" });
    }
  });

  app.get("/api/generations/:baseUrl", (req, res) => {
    try {
      const { baseUrl } = req.params;
      const decodedBaseUrl = decodeURIComponent(baseUrl);
      const generations = getGenerations(decodedBaseUrl);
      res.json({ success: true, generations });
    } catch (error) {
      console.error("Error getting generations:", error);
      res.status(500).json({ error: "Failed to get generations" });
    }
  });

  app.post("/api/tab-usage", async (req, res) => {
    try {
      await incrementTabUsage();
      res.json({ success: true, message: "Tab usage incremented" });
    } catch (error) {
      console.error("Error handling tab usage:", error);
      res.status(500).json({ error: "Failed to handle tab usage" });
    }
  });

  app.get("/api/tab-usage", (req, res) => {
    try {
      const timestamps = loadTabUsage();
      res.json({ success: true, timestamps });
    } catch (error) {
      console.error("Error getting tab usage:", error);
      res.status(500).json({ error: "Failed to get tab usage" });
    }
  });

  return app;
};

export const startServer = async (port: number = PORT): Promise<void> => {
  const host = "127.0.0.1"; // Explicitly bind to localhost

  // Check if port is available
  const isAvailable = await checkPortAvailable(port);

  if (!isAvailable) {
    console.error(`Port ${port} is already in use.`);
    throw new Error(`Port ${port} is not available`);
  }

  const app = createExpressApp();

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      console.log(`Agent server running on http://${host}:${port}`);
      resolve();
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      console.error(`Failed to start server on ${host}:${port}:`, error);
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use.`);
      }
      reject(error);
    });
  });
};

export { createExpressApp };
