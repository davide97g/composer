import { Theme } from "@composer/shared";

const AGENT_API_URL = "http://localhost:3001/api";

export const startAgent = async (
  url: string,
  theme: Theme | string
): Promise<void> => {
  const response = await fetch(`${AGENT_API_URL}/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, theme }),
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

