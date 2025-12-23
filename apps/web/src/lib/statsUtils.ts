import { Generation } from "@composer/shared";
import {
  getHintsReceivedByWebsite,
  getHintsReceivedStats,
  HintsReceivedStats,
} from "./hintsReceivedStorage";
import { getWebsites } from "./storage";
import { getTabUsageStats, TabUsageStats } from "./tabUsageStorage";

export interface TimeFrameStats {
  lastHour: number;
  lastDay: number;
  lastWeek: number;
  last30Days: number;
  sinceStart: number;
}

export interface WebsiteStats {
  baseUrl: string;
  stats: TimeFrameStats;
}

/**
 * Get tab usage stats (total and by time frames)
 * Note: Tab usage doesn't have website association, so only total stats are available
 */
export const getTabUsageStatsData = (): {
  total: TabUsageStats;
  byWebsite: WebsiteStats[];
  byTimeFrame: TabUsageStats;
} => {
  const total = getTabUsageStats();

  // Tab usage doesn't have website association, so byWebsite is empty
  const byWebsite: WebsiteStats[] = [];

  return {
    total,
    byWebsite,
    byTimeFrame: total,
  };
};

/**
 * Get hints received stats (total, by website, by time frames)
 */
export const getHintsReceivedStatsData = (): {
  total: HintsReceivedStats;
  byWebsite: WebsiteStats[];
  byTimeFrame: HintsReceivedStats;
} => {
  const total = getHintsReceivedStats();
  const byWebsiteMap = getHintsReceivedByWebsite();

  const now = Date.now();
  const lastHour = now - 3600000;
  const lastDay = now - 86400000;
  const lastWeek = now - 604800000;
  const last30Days = now - 2592000000;

  const byWebsite: WebsiteStats[] = Array.from(byWebsiteMap.entries()).map(
    ([baseUrl, entries]) => {
      const stats: TimeFrameStats = {
        lastHour: entries.filter((e) => e.timestamp >= lastHour).length,
        lastDay: entries.filter((e) => e.timestamp >= lastDay).length,
        lastWeek: entries.filter((e) => e.timestamp >= lastWeek).length,
        last30Days: entries.filter((e) => e.timestamp >= last30Days).length,
        sinceStart: entries.length,
      };
      return { baseUrl, stats };
    }
  );

  // Sort by sinceStart descending
  byWebsite.sort((a, b) => b.stats.sinceStart - a.stats.sinceStart);

  return {
    total,
    byWebsite,
    byTimeFrame: total,
  };
};

/**
 * Get generations stats (total fields, by website, by time frames)
 */
export const getGenerationsStatsData = (): {
  total: { fieldsCount: number; generationsCount: number } & TimeFrameStats;
  byWebsite: (WebsiteStats & {
    fieldsCount: number;
    generationsCount: number;
  })[];
  byTimeFrame: {
    fieldsCount: number;
    generationsCount: number;
  } & TimeFrameStats;
} => {
  const websites = getWebsites();
  const now = Date.now();
  const lastHour = now - 3600000;
  const lastDay = now - 86400000;
  const lastWeek = now - 604800000;
  const last30Days = now - 2592000000;

  // Helper to get baseUrl from full URL
  const getBaseUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      return url;
    }
  };

  // Collect all generations
  const allGenerations: Array<{ generation: Generation; baseUrl: string }> = [];
  websites.forEach((website) => {
    const baseUrl = getBaseUrl(website.url);
    if (website.generations) {
      website.generations.forEach((generation) => {
        allGenerations.push({ generation, baseUrl });
      });
    }
  });

  // Calculate total stats
  const totalFieldsCount = allGenerations.reduce(
    (sum, { generation }) => sum + (generation.fields?.length || 0),
    0
  );
  const totalGenerationsCount = allGenerations.length;

  const total: {
    fieldsCount: number;
    generationsCount: number;
  } & TimeFrameStats = {
    fieldsCount: totalFieldsCount,
    generationsCount: totalGenerationsCount,
    lastHour: allGenerations.filter(
      ({ generation }) => generation.createdAt >= lastHour
    ).length,
    lastDay: allGenerations.filter(
      ({ generation }) => generation.createdAt >= lastDay
    ).length,
    lastWeek: allGenerations.filter(
      ({ generation }) => generation.createdAt >= lastWeek
    ).length,
    last30Days: allGenerations.filter(
      ({ generation }) => generation.createdAt >= last30Days
    ).length,
    sinceStart: totalGenerationsCount,
  };

  // Calculate by website
  const byWebsiteMap = new Map<
    string,
    Array<{ generation: Generation; baseUrl: string }>
  >();
  allGenerations.forEach((item) => {
    if (!byWebsiteMap.has(item.baseUrl)) {
      byWebsiteMap.set(item.baseUrl, []);
    }
    byWebsiteMap.get(item.baseUrl)!.push(item);
  });

  const byWebsite: (WebsiteStats & {
    fieldsCount: number;
    generationsCount: number;
  })[] = Array.from(byWebsiteMap.entries()).map(([baseUrl, items]) => {
    const fieldsCount = items.reduce(
      (sum, { generation }) => sum + (generation.fields?.length || 0),
      0
    );
    const generationsCount = items.length;

    const stats: TimeFrameStats = {
      lastHour: items.filter(
        ({ generation }) => generation.createdAt >= lastHour
      ).length,
      lastDay: items.filter(({ generation }) => generation.createdAt >= lastDay)
        .length,
      lastWeek: items.filter(
        ({ generation }) => generation.createdAt >= lastWeek
      ).length,
      last30Days: items.filter(
        ({ generation }) => generation.createdAt >= last30Days
      ).length,
      sinceStart: generationsCount,
    };

    return {
      baseUrl,
      stats,
      fieldsCount,
      generationsCount,
    };
  });

  // Sort by sinceStart descending
  byWebsite.sort((a, b) => b.stats.sinceStart - a.stats.sinceStart);

  // Calculate by time frame (for fields count)
  const byTimeFrame: {
    fieldsCount: number;
    generationsCount: number;
  } & TimeFrameStats = {
    fieldsCount: totalFieldsCount,
    generationsCount: totalGenerationsCount,
    lastHour: allGenerations
      .filter(({ generation }) => generation.createdAt >= lastHour)
      .reduce(
        (sum, { generation }) => sum + (generation.fields?.length || 0),
        0
      ),
    lastDay: allGenerations
      .filter(({ generation }) => generation.createdAt >= lastDay)
      .reduce(
        (sum, { generation }) => sum + (generation.fields?.length || 0),
        0
      ),
    lastWeek: allGenerations
      .filter(({ generation }) => generation.createdAt >= lastWeek)
      .reduce(
        (sum, { generation }) => sum + (generation.fields?.length || 0),
        0
      ),
    last30Days: allGenerations
      .filter(({ generation }) => generation.createdAt >= last30Days)
      .reduce(
        (sum, { generation }) => sum + (generation.fields?.length || 0),
        0
      ),
    sinceStart: totalFieldsCount,
  };

  return {
    total,
    byWebsite,
    byTimeFrame,
  };
};
