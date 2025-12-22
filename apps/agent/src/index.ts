import "dotenv/config";
import { Theme } from "@composer/shared";
import cors from "cors";
import express from "express";
import { startBrowserSession, getNavigationHistory } from "./playwright/handler";
import { getApiKey, saveSettings } from "./playwright/settingsStorage";
import OpenAI from "openai";

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

app.listen(PORT, () => {
  console.log(`Agent server running on http://localhost:${PORT}`);
});
