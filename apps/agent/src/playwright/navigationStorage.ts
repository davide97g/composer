import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { mkdir } from "fs/promises";

const NAVIGATION_HISTORY_DIR = join(process.cwd(), ".composer");
const NAVIGATION_HISTORY_FILE = join(NAVIGATION_HISTORY_DIR, "navigation-history.json");

type NavigationHistoryData = Record<string, string[]>;

/**
 * Ensure the navigation history directory exists
 */
const ensureNavigationHistoryDir = async (): Promise<void> => {
  if (!existsSync(NAVIGATION_HISTORY_DIR)) {
    await mkdir(NAVIGATION_HISTORY_DIR, { recursive: true });
  }
};

/**
 * Load navigation history from JSON file
 */
export const loadNavigationHistory = (): Map<string, string[]> => {
  const historyMap = new Map<string, string[]>();
  
  if (!existsSync(NAVIGATION_HISTORY_FILE)) {
    return historyMap;
  }

  try {
    const fileContent = readFileSync(NAVIGATION_HISTORY_FILE, "utf-8");
    const data: NavigationHistoryData = JSON.parse(fileContent);
    
    // Convert object to Map
    Object.entries(data).forEach(([baseUrl, urls]) => {
      if (Array.isArray(urls)) {
        historyMap.set(baseUrl, urls);
      }
    });
  } catch (error) {
    console.error("Failed to load navigation history:", error);
  }

  return historyMap;
};

/**
 * Save navigation history to JSON file
 */
export const saveNavigationHistory = async (historyMap: Map<string, string[]>): Promise<void> => {
  try {
    await ensureNavigationHistoryDir();
    
    // Convert Map to object
    const data: NavigationHistoryData = {};
    historyMap.forEach((urls, baseUrl) => {
      data[baseUrl] = urls;
    });
    
    // Write to file with pretty formatting
    writeFileSync(NAVIGATION_HISTORY_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save navigation history:", error);
  }
};

