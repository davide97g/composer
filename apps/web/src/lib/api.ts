import { Theme } from "@composer/shared";

const AGENT_API_URL = "http://localhost:3001/api";

export const startAgent = async (
  url: string,
  theme: Theme | string,
  customPrompt?: string
): Promise<void> => {
  const response = await fetch(`${AGENT_API_URL}/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, theme, customPrompt }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start agent: ${response.statusText}`);
  }
};

export const getNavigationHistory = async (baseUrl: string): Promise<string[]> => {
  try {
    const encodedBaseUrl = encodeURIComponent(baseUrl);
    const response = await fetch(`${AGENT_API_URL}/navigation/${encodedBaseUrl}`);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.navigationHistory || [];
  } catch {
    return [];
  }
};

export const getAvailableModels = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${AGENT_API_URL}/models`);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.models || [];
  } catch {
    return [];
  }
};

export const saveSettingsToAgent = async (settings: unknown): Promise<void> => {
  try {
    const response = await fetch(`${AGENT_API_URL}/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Failed to save settings to agent:", error);
    // Don't throw - settings are saved locally anyway
  }
};

