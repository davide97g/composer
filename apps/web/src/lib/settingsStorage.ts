import { DEFAULT_SETTINGS, Settings } from "@composer/shared";

const SETTINGS_KEY = "qa_agent_settings";

/**
 * Get settings from localStorage
 */
export const getSettings = (): Settings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    return DEFAULT_SETTINGS;
  }
  try {
    const settings = JSON.parse(stored) as Settings;
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
  } catch {
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save settings to localStorage
 */
export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

/**
 * Get API key from settings or environment variable
 * Note: In browser, we can't access process.env, so we only use settings
 */
export const getApiKey = (): string => {
  const settings = getSettings();
  return settings.aiModel.apiKey || "";
};

