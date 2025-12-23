import { GenerationsStatsSection } from "@/components/stats/GenerationsStatsSection";
import { TabUsageStatsSection } from "@/components/stats/TabUsageStatsSection";
import { Button } from "@/components/ui/button";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

export const StatsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Statistics</h1>
            <p className="text-muted-foreground">
              View comprehensive statistics for tab usage and generations
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            ← Back to Home
          </Button>
        </div>

        <Tabs defaultValue="tab-usage">
          <TabList>
            <Tab value="tab-usage">Tab Usage</Tab>
            <Tab value="generations">Generations</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="tab-usage">
              <TabUsageStatsSection />
            </TabPanel>
            <TabPanel value="generations">
              <GenerationsStatsSection />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
};
