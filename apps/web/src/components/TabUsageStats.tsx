import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTabUsageStats } from "@/lib/tabUsageStorage";
import { syncTabUsageFromAgent } from "@/lib/api";
import { useEffect, useState } from "react";

export const TabUsageStats = () => {
  const [stats, setStats] = useState(getTabUsageStats());

  useEffect(() => {
    // Sync tab usage from agent on mount
    syncTabUsageFromAgent().then(() => {
      setStats(getTabUsageStats());
    });

    // Refresh stats every second to keep them up to date
    const interval = setInterval(() => {
      syncTabUsageFromAgent().then(() => {
        setStats(getTabUsageStats());
      });
    }, 5000); // Sync every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  if (stats.sinceStart === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tab Usage</CardTitle>
          <CardDescription>
            Statistics for ghost writer suggestions accepted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground py-4">
            No tab usage recorded yet. Accept a ghost writer suggestion to see
            statistics here.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tab Usage</CardTitle>
        <CardDescription>
          Statistics for ghost writer suggestions accepted
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                Last Hour
              </div>
              <div className="text-2xl font-bold">{formatNumber(stats.lastHour)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                Last Day
              </div>
              <div className="text-2xl font-bold">{formatNumber(stats.lastDay)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                Last Week
              </div>
              <div className="text-2xl font-bold">{formatNumber(stats.lastWeek)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                Last 30 Days
              </div>
              <div className="text-2xl font-bold">{formatNumber(stats.last30Days)}</div>
            </div>
          </div>
          <div className="pt-4 border-t">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                Since Start
              </div>
              <div className="text-3xl font-bold">{formatNumber(stats.sinceStart)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

