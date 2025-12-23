import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getGenerationsStatsData } from "@/lib/statsUtils";
import { getWebsites } from "@/lib/storage";
import { getFaviconUrl } from "@/lib/utils";
import { useEffect, useState } from "react";

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

export const GenerationsStatsSection = () => {
  const [generationsData, setGenerationsData] = useState(
    getGenerationsStatsData()
  );
  const [websites] = useState(getWebsites());

  useEffect(() => {
    // Refresh data when websites change
    const refreshData = () => {
      setGenerationsData(getGenerationsStatsData());
    };

    refreshData();

    // Refresh every 5 seconds
    const interval = setInterval(refreshData, 5000);

    return () => clearInterval(interval);
  }, []);

  const getWebsiteTitle = (baseUrl: string): string => {
    const website = websites.find((w) => getBaseUrl(w.url) === baseUrl);
    return website?.url || baseUrl;
  };

  const totalFields = generationsData.total.fieldsCount;
  const totalGenerations = generationsData.total.generationsCount;

  return (
    <div className="space-y-6">
      {/* Total Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Generations Overview</CardTitle>
          <CardDescription>
            Total input fields generated across all websites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Total Generations
              </div>
              <div className="text-3xl font-bold">
                {formatNumber(totalGenerations)}
              </div>
              <div className="text-xs text-muted-foreground">
                Number of form fills completed
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Total Fields Generated
              </div>
              <div className="text-3xl font-bold">
                {formatNumber(totalFields)}
              </div>
              <div className="text-xs text-muted-foreground">
                Total input fields filled
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Frame Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>By Time Frame</CardTitle>
          <CardDescription>
            Fields generated grouped by time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Fields Generated
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last Hour
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(generationsData.byTimeFrame.lastHour)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last Day
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(generationsData.byTimeFrame.lastDay)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last Week
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(generationsData.byTimeFrame.lastWeek)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last 30 Days
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(generationsData.byTimeFrame.last30Days)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Since Start
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(generationsData.byTimeFrame.sinceStart)}
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">Generations</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last Hour
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(generationsData.total.lastHour)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last Day
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(generationsData.total.lastDay)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last Week
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(generationsData.total.lastWeek)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Last 30 Days
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(generationsData.total.last30Days)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Since Start
                  </div>
                  <div className="text-xl font-bold">
                    {formatNumber(generationsData.total.sinceStart)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Website */}
      {generationsData.byWebsite.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>By Website</CardTitle>
            <CardDescription>
              Statistics grouped by website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generationsData.byWebsite.map((website) => {
                const websiteTitle = getWebsiteTitle(website.baseUrl);
                const avgFieldsPerGeneration =
                  website.generationsCount > 0
                    ? (
                        website.fieldsCount / website.generationsCount
                      ).toFixed(1)
                    : "0.0";

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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          Generations
                        </div>
                        <div className="text-lg font-bold">
                          {formatNumber(website.generationsCount)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          Fields Generated
                        </div>
                        <div className="text-lg font-bold">
                          {formatNumber(website.fieldsCount)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          Avg Fields/Gen
                        </div>
                        <div className="text-lg font-bold">
                          {avgFieldsPerGeneration}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          Since Start
                        </div>
                        <div className="text-lg font-bold">
                          {formatNumber(website.stats.sinceStart)}
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

      {totalGenerations === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-sm text-muted-foreground">
              No generations yet. Fill forms to see statistics here.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

