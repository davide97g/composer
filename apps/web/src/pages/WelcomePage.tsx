import { ThemeSelector } from "@/components/ThemeSelector";
import { SettingsSidebar } from "@/components/SettingsSidebar";
import { Button } from "@/components/ui/button";
import { WebsiteList } from "@/components/WebsiteList";
import { getWebsites } from "@/lib/storage";
import { AddWebsiteDialog } from "@/pages/AddWebsiteDialog";
import { Website } from "@composer/shared";
import { useEffect, useState } from "react";

export const WelcomePage = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setWebsites(getWebsites());
  }, []);

  const handleRefresh = () => {
    setWebsites(getWebsites());
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">QA Form Agent</h1>
            <p className="text-muted-foreground">
              Automated QA Form Agent - Detect forms and generate fake data based
              on themes
            </p>
          </div>
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
        </div>

        <div className="flex justify-center">
          <Button size="lg" onClick={() => setDialogOpen(true)}>
            Add new website
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <WebsiteList websites={websites} onWebsiteClick={handleRefresh} />
          <ThemeSelector />
        </div>
      </div>

      <AddWebsiteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleRefresh}
      />

      <SettingsSidebar open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};
