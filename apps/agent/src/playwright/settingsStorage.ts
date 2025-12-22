import { DEFAULT_SETTINGS, Settings } from "@composer/shared";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { mkdir } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

// Get settings directory - use home directory for better cross-platform support
// In packaged apps, process.cwd() might not be writable, so use home directory
const getSettingsDir = (): string => {
  // Always use home directory for consistency and to ensure writability
  // This works in both development and packaged Electron apps
  return join(homedir(), ".composer");
};

const SETTINGS_DIR = getSettingsDir();
const SETTINGS_FILE = join(SETTINGS_DIR, "settings.json");

/**
 * Ensure the settings directory exists
 */
const ensureSettingsDir = async (): Promise<void> => {
  if (!existsSync(SETTINGS_DIR)) {
    await mkdir(SETTINGS_DIR, { recursive: true });
  }
};

/**
 * Load settings from JSON file
 */
export const loadSettings = (): Settings => {
  if (!existsSync(SETTINGS_FILE)) {
    return DEFAULT_SETTINGS;
  }

  try {
    const fileContent = readFileSync(SETTINGS_FILE, "utf-8");
    const settings = JSON.parse(fileContent) as Settings;
    // Merge with defaults to ensure all fields exist
    return {
      aiModel: {
        ...DEFAULT_SETTINGS.aiModel,
        ...settings.aiModel,
      },
      scraper: {
        ...DEFAULT_SETTINGS.scraper,
        ...settings.scraper,
      },
      filler: {
        ...DEFAULT_SETTINGS.filler,
        ...settings.filler,
      },
    };
  } catch (error) {
    console.error("Failed to load settings:", error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save settings to JSON file
 */
export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    await ensureSettingsDir();
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
};

/**
 * Get API key from settings or environment variable
 */
export const getApiKey = (): string => {
  const settings = loadSettings();
  // Prefer settings API key, fallback to env var
  if (settings.aiModel.apiKey) {
    return settings.aiModel.apiKey;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY not found in settings or environment variables"
    );
  }
  return apiKey;
};
