import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { mkdir } from "fs/promises";

const TAB_USAGE_DIR = join(process.cwd(), ".composer");
const TAB_USAGE_FILE = join(TAB_USAGE_DIR, "tab-usage.json");

type TabUsageData = number[];

/**
 * Ensure the tab usage directory exists
 */
const ensureTabUsageDir = async (): Promise<void> => {
  if (!existsSync(TAB_USAGE_DIR)) {
    await mkdir(TAB_USAGE_DIR, { recursive: true });
  }
};

/**
 * Load tab usage from JSON file
 */
export const loadTabUsage = (): number[] => {
  if (!existsSync(TAB_USAGE_FILE)) {
    return [];
  }

  try {
    const fileContent = readFileSync(TAB_USAGE_FILE, "utf-8");
    const data: TabUsageData = JSON.parse(fileContent);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to load tab usage:", error);
    return [];
  }
};

/**
 * Increment tab usage by adding a new timestamp
 */
export const incrementTabUsage = async (): Promise<void> => {
  try {
    await ensureTabUsageDir();
    
    const timestamps = loadTabUsage();
    timestamps.push(Date.now());
    
    // Write to file with pretty formatting
    writeFileSync(TAB_USAGE_FILE, JSON.stringify(timestamps, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save tab usage:", error);
  }
};

