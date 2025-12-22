import "dotenv/config";
import { Theme } from "@composer/shared";
import cors from "cors";
import express from "express";
import { startBrowserSession, getNavigationHistory } from "./playwright/handler";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post("/api/start", async (req, res) => {
  try {
    const { url, theme } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Invalid URL" });
    }

    if (!theme || typeof theme !== "string") {
      return res.status(400).json({ error: "Invalid theme" });
    }

    // Start browser session (non-blocking)
    startBrowserSession(url, theme).catch((error) => {
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

app.listen(PORT, () => {
  console.log(`Agent server running on http://localhost:${PORT}`);
});
