import { Theme } from "@composer/shared";

// Type definition for Electron API
declare global {
  interface Window {
    electronAPI?: {
      getApiUrl: () => Promise<string>;
      getBackendStatus: () => Promise<{ running: boolean }>;
    };
  }
}

// Get API URL from Electron if available, otherwise use default
let cachedApiUrl: string | null = null;

const getApiUrl = async (): Promise<string> => {
  if (cachedApiUrl) {
    return cachedApiUrl;
  }

  if (typeof window !== "undefined" && window.electronAPI) {
    try {
      cachedApiUrl = await window.electronAPI.getApiUrl();
      return cachedApiUrl;
    } catch (error) {
      console.error("Failed to get API URL from Electron:", error);
    }
  }
  
  cachedApiUrl = "http://localhost:3001/api";
  return cachedApiUrl;
};

export const startAgent = async (
  url: string,
  theme: Theme | string,
  customPrompt?: string
): Promise<void> => {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/start`, {
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
    const apiUrl = await getApiUrl();
    const encodedBaseUrl = encodeURIComponent(baseUrl);
    const response = await fetch(`${apiUrl}/navigation/${encodedBaseUrl}`);
    
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
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/models`);
    
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
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/settings`, {
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

export const getGenerations = async (baseUrl: string): Promise<any[]> => {
  try {
    const apiUrl = await getApiUrl();
    const encodedBaseUrl = encodeURIComponent(baseUrl);
    const response = await fetch(`${apiUrl}/generations/${encodedBaseUrl}`);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.generations || [];
  } catch {
    return [];
  }
};

