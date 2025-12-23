import { Button } from "@/components/ui/button";
import { WebsiteListSimple } from "@/components/WebsiteListSimple";
import { getWebsites } from "@/lib/storage";
import { Website } from "@composer/shared";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const WebsitesPage = () => {
  const navigate = useNavigate();
  const [websites, setWebsites] = useState<Website[]>([]);

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
            <h1 className="text-4xl font-bold">All Websites</h1>
            <p className="text-muted-foreground">
              View and manage all your websites
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>

        <WebsiteListSimple
          websites={websites}
          onWebsiteClick={handleRefresh}
          showSeeAll={false}
        />
      </div>
    </div>
  );
};

