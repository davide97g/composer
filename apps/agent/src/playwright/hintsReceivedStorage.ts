import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { mkdir } from "fs/promises";

const HINTS_RECEIVED_DIR = join(process.cwd(), ".composer");
const HINTS_RECEIVED_FILE = join(HINTS_RECEIVED_DIR, "hints-received.json");

export interface HintReceivedEntry {
  baseUrl: string;
  timestamp: number;
}

type HintsReceivedData = HintReceivedEntry[];

/**
 * Ensure the hints received directory exists
 */
const ensureHintsReceivedDir = async (): Promise<void> => {
  if (!existsSync(HINTS_RECEIVED_DIR)) {
    await mkdir(HINTS_RECEIVED_DIR, { recursive: true });
  }
};

/**
 * Load hints received from JSON file
 */
export const loadHintsReceived = (): HintReceivedEntry[] => {
  if (!existsSync(HINTS_RECEIVED_FILE)) {
    return [];
  }

  try {
    const fileContent = readFileSync(HINTS_RECEIVED_FILE, "utf-8");
    const data: HintsReceivedData = JSON.parse(fileContent);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to load hints received:", error);
    return [];
  }
};

/**
 * Add a hint received entry
 */
export const addHintReceived = async (baseUrl: string): Promise<void> => {
  try {
    await ensureHintsReceivedDir();
    
    const entries = loadHintsReceived();
    entries.push({
      baseUrl,
      timestamp: Date.now(),
    });
    
    // Write to file with pretty formatting
    writeFileSync(HINTS_RECEIVED_FILE, JSON.stringify(entries, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save hint received:", error);
  }
};

