import { Theme, Website, ThemeMetadata } from "@composer/shared";

const WEBSITES_KEY = "qa_agent_websites";
const ACTIVE_THEME_KEY = "qa_agent_active_theme";
const CUSTOM_THEMES_KEY = "qa_agent_custom_themes";

export const saveWebsite = (url: string, theme: Theme | string, navigationHistory: string[] = []): void => {
  const websites = getWebsites();
  const existingWebsite = websites.find((w) => w.url === url);
  const newWebsite: Website = {
    url,
    theme,
    createdAt: existingWebsite?.createdAt || Date.now(),
    navigationHistory: navigationHistory.length > 0 ? navigationHistory : (existingWebsite?.navigationHistory || []),
    customPrompt: existingWebsite?.customPrompt,
  };
  const updated = [newWebsite, ...websites.filter((w) => w.url !== url)];
  localStorage.setItem(WEBSITES_KEY, JSON.stringify(updated));
};

export const updateWebsiteCustomPrompt = (url: string, customPrompt: string | undefined): void => {
  const websites = getWebsites();
  const website = websites.find((w) => w.url === url);
  if (website) {
    if (customPrompt) {
      website.customPrompt = customPrompt;
    } else {
      delete website.customPrompt;
    }
    localStorage.setItem(WEBSITES_KEY, JSON.stringify(websites));
  }
};

export const getWebsiteCustomPrompt = (url: string): string | undefined => {
  const websites = getWebsites();
  const website = websites.find((w) => w.url === url);
  return website?.customPrompt;
};

export const updateWebsiteNavigationHistory = (url: string, navigationHistory: string[]): void => {
  const websites = getWebsites();
  const website = websites.find((w) => w.url === url);
  if (website) {
    website.navigationHistory = navigationHistory;
    localStorage.setItem(WEBSITES_KEY, JSON.stringify(websites));
  }
};

export const updateWebsiteTitle = (url: string, customTitle: string | undefined): void => {
  const websites = getWebsites();
  const website = websites.find((w) => w.url === url);
  if (website) {
    (website as any).customTitle = customTitle;
    localStorage.setItem(WEBSITES_KEY, JSON.stringify(websites));
  }
};

export const getWebsiteTitle = (url: string): string | undefined => {
  const websites = getWebsites();
  const website = websites.find((w) => w.url === url);
  return (website as any)?.customTitle;
};

export const getWebsites = (): Website[] => {
  const stored = localStorage.getItem(WEBSITES_KEY);
  if (!stored) return [];
  try {
    const websites = JSON.parse(stored) as Website[];
    // Ensure navigationHistory exists for backward compatibility
    return websites.map((w) => ({
      ...w,
      navigationHistory: w.navigationHistory || [],
      customPrompt: w.customPrompt,
    }));
  } catch {
    return [];
  }
};

export const getActiveTheme = (): Theme | string => {
  const stored = localStorage.getItem(ACTIVE_THEME_KEY);
  if (!stored) return Theme.STAR_WARS_HERO;
  try {
    return stored;
  } catch {
    return Theme.STAR_WARS_HERO;
  }
};

export const setActiveTheme = (theme: Theme | string): void => {
  localStorage.setItem(ACTIVE_THEME_KEY, theme);
};

export const saveCustomTheme = (theme: string, metadata: ThemeMetadata): void => {
  const customThemes = getCustomThemes();
  customThemes[theme] = metadata;
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customThemes));
};

export const getCustomThemes = (): Record<string, ThemeMetadata> => {
  const stored = localStorage.getItem(CUSTOM_THEMES_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored) as Record<string, ThemeMetadata>;
  } catch {
    return {};
  }
};
