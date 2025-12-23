const HINTS_RECEIVED_KEY = "qa_agent_hints_received";

export interface HintReceivedEntry {
  baseUrl: string;
  timestamp: number;
}

/**
 * Sync hints received from agent (merges with existing, keeping the latest)
 */
export const syncHintsReceived = (agentEntries: HintReceivedEntry[]): void => {
  const localEntries = getHintsReceivedEntries();
  // Merge entries, keeping unique combinations of baseUrl and timestamp
  const entryMap = new Map<string, Set<number>>();
  
  // Add local entries
  localEntries.forEach((entry) => {
    if (!entryMap.has(entry.baseUrl)) {
      entryMap.set(entry.baseUrl, new Set());
    }
    entryMap.get(entry.baseUrl)!.add(entry.timestamp);
  });
  
  // Add agent entries
  agentEntries.forEach((entry) => {
    if (!entryMap.has(entry.baseUrl)) {
      entryMap.set(entry.baseUrl, new Set());
    }
    entryMap.get(entry.baseUrl)!.add(entry.timestamp);
  });
  
  // Convert back to array
  const merged: HintReceivedEntry[] = [];
  entryMap.forEach((timestamps, baseUrl) => {
    timestamps.forEach((timestamp) => {
      merged.push({ baseUrl, timestamp });
    });
  });
  
  // Sort by timestamp
  merged.sort((a, b) => a.timestamp - b.timestamp);
  
  localStorage.setItem(HINTS_RECEIVED_KEY, JSON.stringify(merged));
};

/**
 * Get all hints received entries
 */
const getHintsReceivedEntries = (): HintReceivedEntry[] => {
  const stored = localStorage.getItem(HINTS_RECEIVED_KEY);
  if (!stored) return [];
  try {
    const entries = JSON.parse(stored) as HintReceivedEntry[];
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
};

export interface HintsReceivedStats {
  lastHour: number;
  lastDay: number;
  lastWeek: number;
  last30Days: number;
  sinceStart: number;
}

/**
 * Get hints received statistics grouped by time frames
 */
export const getHintsReceivedStats = (): HintsReceivedStats => {
  const entries = getHintsReceivedEntries();
  const now = Date.now();
  
  const lastHour = now - 3600000; // 1 hour in milliseconds
  const lastDay = now - 86400000; // 24 hours in milliseconds
  const lastWeek = now - 604800000; // 7 days in milliseconds
  const last30Days = now - 2592000000; // 30 days in milliseconds

  return {
    lastHour: entries.filter((entry) => entry.timestamp >= lastHour).length,
    lastDay: entries.filter((entry) => entry.timestamp >= lastDay).length,
    lastWeek: entries.filter((entry) => entry.timestamp >= lastWeek).length,
    last30Days: entries.filter((entry) => entry.timestamp >= last30Days).length,
    sinceStart: entries.length,
  };
};

/**
 * Get hints received entries grouped by website
 */
export const getHintsReceivedByWebsite = (): Map<string, HintReceivedEntry[]> => {
  const entries = getHintsReceivedEntries();
  const byWebsite = new Map<string, HintReceivedEntry[]>();
  
  entries.forEach((entry) => {
    if (!byWebsite.has(entry.baseUrl)) {
      byWebsite.set(entry.baseUrl, []);
    }
    byWebsite.get(entry.baseUrl)!.push(entry);
  });
  
  return byWebsite;
};

