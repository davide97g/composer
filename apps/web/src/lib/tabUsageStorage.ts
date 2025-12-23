const TAB_USAGE_KEY = "qa_agent_tab_usage";

/**
 * Increment tab usage by adding a new timestamp
 */
export const incrementTabUsage = (): void => {
  const timestamps = getTabUsageTimestamps();
  timestamps.push(Date.now());
  localStorage.setItem(TAB_USAGE_KEY, JSON.stringify(timestamps));
};

/**
 * Sync tab usage from agent (merges with existing, keeping the latest)
 */
export const syncTabUsage = (agentTimestamps: number[]): void => {
  const localTimestamps = getTabUsageTimestamps();
  // Merge and deduplicate, keeping all unique timestamps
  const merged = [...new Set([...localTimestamps, ...agentTimestamps])].sort(
    (a, b) => a - b
  );
  localStorage.setItem(TAB_USAGE_KEY, JSON.stringify(merged));
};

/**
 * Get all tab usage timestamps
 */
const getTabUsageTimestamps = (): number[] => {
  const stored = localStorage.getItem(TAB_USAGE_KEY);
  if (!stored) return [];
  try {
    const timestamps = JSON.parse(stored) as number[];
    return Array.isArray(timestamps) ? timestamps : [];
  } catch {
    return [];
  }
};

export interface TabUsageStats {
  lastHour: number;
  lastDay: number;
  lastWeek: number;
  last30Days: number;
  sinceStart: number;
}

/**
 * Get tab usage statistics grouped by time frames
 */
export const getTabUsageStats = (): TabUsageStats => {
  const timestamps = getTabUsageTimestamps();
  const now = Date.now();
  
  const lastHour = now - 3600000; // 1 hour in milliseconds
  const lastDay = now - 86400000; // 24 hours in milliseconds
  const lastWeek = now - 604800000; // 7 days in milliseconds
  const last30Days = now - 2592000000; // 30 days in milliseconds

  return {
    lastHour: timestamps.filter((ts) => ts >= lastHour).length,
    lastDay: timestamps.filter((ts) => ts >= lastDay).length,
    lastWeek: timestamps.filter((ts) => ts >= lastWeek).length,
    last30Days: timestamps.filter((ts) => ts >= last30Days).length,
    sinceStart: timestamps.length,
  };
};

