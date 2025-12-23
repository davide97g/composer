import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getTabUsageStatsData,
  getHintsReceivedStatsData,
} from "@/lib/statsUtils";
import { syncTabUsageFromAgent, syncHintsReceivedFromAgent } from "@/lib/api";
import { useEffect, useState } from "react";
import { getWebsites } from "@/lib/storage";
import { getFaviconUrl } from "@/lib/utils";

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const getBaseUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    return url;
  }
};

export const TabUsageStatsSection = () => {
  const [tabUsageData, setTabUsageData] = useState(getTabUsageStatsData());
  const [hintsReceivedData, setHintsReceivedData] = useState(
    getHintsReceivedStatsData()
  );
  const [websites] = useState(getWebsites());

  useEffect(() => {
    const refreshData = () => {
      syncTabUsageFromAgent().then(() => {
        setTabUsageData(getTabUsageStatsData());
      });
      syncHintsReceivedFromAgent().then(() => {
        setHintsReceivedData(getHintsReceivedStatsData());
      });
    };

    // Sync on mount
    refreshData();

    // Refresh every 5 seconds
    const interval = setInterval(refreshData, 5000);

    return () => clearInterval(interval);
  }, []);

  const getWebsiteTitle = (baseUrl: string): string => {
    const website = websites.find((w) => getBaseUrl(w.url) === baseUrl);
    return website?.url || baseUrl;
  };

  const totalHintsReceived = hintsReceivedData.total.sinceStart;
  const totalHintsAccepted = tabUsageData.total.sinceStart;
  const acceptanceRate =
    totalHintsReceived > 0
      ? ((totalHintsAccepted / totalHintsReceived) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      {/* Total Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Tab Usage Overview</CardTitle>
          <CardDescription>
            Hints received vs hints accepted (Tab key pressed)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Hints Received
              </div>
              <div className="text-3xl font-bold">
                {formatNumber(totalHintsReceived)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Hints Accepted
              </div>
              <div className="text-3xl font-bold">
                {formatNumber(totalHintsAccepted)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Acceptance Rate
              </div>
              <div className="text-3xl font-bold">{acceptanceRate}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Frame Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>By Time Frame</CardTitle>
          <CardDescription>
            Statistics grouped by time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Hints Received</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last Hour
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(hintsReceivedData.total.lastHour)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last Day
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(hintsReceivedData.total.lastDay)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last Week
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(hintsReceivedData.total.lastWeek)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last 30 Days
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(hintsReceivedData.total.last30Days)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Since Start
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(hintsReceivedData.total.sinceStart)}
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">Hints Accepted</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last Hour
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(tabUsageData.total.lastHour)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last Day
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(tabUsageData.total.lastDay)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last Week
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(tabUsageData.total.lastWeek)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last 30 Days
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(tabUsageData.total.last30Days)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Since Start
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(tabUsageData.total.sinceStart)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Website */}
      {hintsReceivedData.byWebsite.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>By Website</CardTitle>
            <CardDescription>
              Statistics grouped by website. Note: Hints accepted cannot be broken down by website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hintsReceivedData.byWebsite.map((website) => {
                const websiteTitle = getWebsiteTitle(website.baseUrl);

                return (
                  <div
                    key={website.baseUrl}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getFaviconUrl(website.baseUrl)}
                        alt=""
                        className="w-5 h-5 shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {websiteTitle}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {website.baseUrl}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          Since Start
                        </div>
                        <div className="text-lg font-bold">
                          {formatNumber(website.stats.sinceStart)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          Last Hour
                        </div>
                        <div className="text-lg font-bold">
                          {formatNumber(website.stats.lastHour)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          Last Day
                        </div>
                        <div className="text-lg font-bold">
                          {formatNumber(website.stats.lastDay)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          Last Week
                        </div>
                        <div className="text-lg font-bold">
                          {formatNumber(website.stats.lastWeek)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          Last 30 Days
                        </div>
                        <div className="text-lg font-bold">
                          {formatNumber(website.stats.last30Days)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {totalHintsReceived === 0 && totalHintsAccepted === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-sm text-muted-foreground">
              No tab usage data yet. Use ghost writer suggestions to see
              statistics here.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

