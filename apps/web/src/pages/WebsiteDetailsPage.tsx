import { GenerationsTab } from "@/components/GenerationsTab";
import { GhostWriterPromptDialog } from "@/components/GhostWriterPromptDialog";
import { PromptDialog } from "@/components/PromptDialog";
import { TabUsageStats } from "@/components/TabUsageStats";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@/components/ui/tabs";
import { getNavigationHistory, startAgent } from "@/lib/api";
import {
  getActiveTheme,
  getWebsiteTitle,
  getWebsites,
  updateWebsiteCustomGhostWriterPrompt,
  updateWebsiteCustomPrompt,
  updateWebsiteNavigationHistory,
} from "@/lib/storage";
import { fetchWebsiteTitle, getFaviconUrl } from "@/lib/utils";
import { THEME_METADATA, Theme, Website } from "@composer/shared";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const getBaseUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    return url;
  }
};

const getRelativePath = (baseUrl: string, fullUrl: string): string => {
  try {
    const baseUrlObj = new URL(baseUrl);
    const fullUrlObj = new URL(fullUrl);

    if (baseUrlObj.origin === fullUrlObj.origin) {
      const path = fullUrlObj.pathname + fullUrlObj.search + fullUrlObj.hash;
      if (path === "/" || path === "") {
        return "home";
      }
      return path.startsWith("/") ? path.slice(1) : path;
    }
    return fullUrl;
  } catch {
    const relative = fullUrl.replace(baseUrl, "");
    return relative || "home";
  }
};

export const WebsiteDetailsPage = () => {
  const navigate = useNavigate();
  const { url: encodedUrl } = useParams<{ url: string }>();
  const [website, setWebsite] = useState<Website | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [websiteMetadata, setWebsiteMetadata] = useState<{
    title: string | null;
    favicon: string;
  } | null>(null);
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [ghostWriterPromptDialogOpen, setGhostWriterPromptDialogOpen] =
    useState(false);
  const [allWebsites, setAllWebsites] = useState<Website[]>([]);

  useEffect(() => {
    if (!encodedUrl) {
      navigate("/websites");
      return;
    }

    const decodedUrl = decodeURIComponent(encodedUrl);
    const websites = getWebsites();
    const foundWebsite = websites.find((w) => w.url === decodedUrl);

    if (!foundWebsite) {
      navigate("/websites");
      return;
    }

    setWebsite(foundWebsite);
    setAllWebsites(websites);

    // Load navigation history
    const baseUrl = getBaseUrl(decodedUrl);
    setLoadingHistory(true);
    getNavigationHistory(baseUrl)
      .then((history) => {
        setNavigationHistory(history);
        if (history.length > 0) {
          updateWebsiteNavigationHistory(decodedUrl, history);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch navigation history:", error);
        setNavigationHistory(foundWebsite.navigationHistory || []);
      })
      .finally(() => {
        setLoadingHistory(false);
      });

    // Load website metadata
    fetchWebsiteTitle(decodedUrl)
      .then((title) => {
        setWebsiteMetadata({
          title,
          favicon: getFaviconUrl(decodedUrl),
        });
      })
      .catch(() => {
        setWebsiteMetadata({
          title: null,
          favicon: getFaviconUrl(decodedUrl),
        });
      });
  }, [encodedUrl, navigate]);

  const handleOpenWebsite = async () => {
    if (!website) return;
    try {
      const theme = getActiveTheme();
      await startAgent(
        website.url,
        theme,
        website.customPrompt,
        website.customGhostWriterPrompt
      );
    } catch (error) {
      console.error("Failed to start agent:", error);
      alert("Failed to start agent. Make sure the agent server is running.");
    }
  };

  const handleRefresh = () => {
    if (!website) return;
    const websites = getWebsites();
    const updatedWebsite = websites.find((w) => w.url === website.url);
    if (updatedWebsite) {
      setWebsite(updatedWebsite);
    }
    setAllWebsites(websites);
  };

  if (!website) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading website details...</p>
          </div>
        </div>
      </div>
    );
  }

  const baseUrl = getBaseUrl(website.url);
  const customTitle = getWebsiteTitle(website.url);
  const displayTitle = customTitle || websiteMetadata?.title || website.url;
  const themeName = website.theme;
  const themeMetadata =
    typeof themeName === "string" && themeName in THEME_METADATA
      ? THEME_METADATA[themeName as Theme]
      : null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate("/websites")}>
            ← Back to Websites
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <img
                src={websiteMetadata?.favicon || getFaviconUrl(website.url)}
                alt=""
                className="w-8 h-8 shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="flex-1 min-w-0">
                <CardTitle className="truncate">{displayTitle}</CardTitle>
                <CardDescription className="truncate">
                  {website.url}
                </CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  {website.customPrompt && (
                    <span
                      className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                      title="Custom filler prompt"
                    >
                      Custom
                    </span>
                  )}
                  {website.customGhostWriterPrompt && (
                    <span
                      className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-1.5 py-0.5 rounded"
                      title="Custom ghost writer prompt"
                    >
                      GW
                    </span>
                  )}
                </div>
              </div>
              <Button onClick={handleOpenWebsite}>Open in Browser</Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="generations">
          <TabList>
            <Tab value="generations">Generations</Tab>
            <Tab value="history">Navigation History</Tab>
            <Tab value="settings">Settings</Tab>
            <Tab value="theme">Theme</Tab>
            <Tab value="tab-usage">Tab Usage</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="generations">
              <GenerationsTab baseUrl={baseUrl} websiteUrl={website.url} />
            </TabPanel>
            <TabPanel value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Navigation History</CardTitle>
                  <CardDescription>
                    Pages visited within this website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="text-sm text-muted-foreground py-4">
                      Loading navigation history...
                    </div>
                  ) : navigationHistory.length > 0 ? (
                    <div className="space-y-1">
                      {navigationHistory.map((url, index) => {
                        const relativePath = getRelativePath(baseUrl, url);
                        return (
                          <Button
                            key={index}
                            variant="ghost"
                            className="w-full justify-start text-left text-sm h-auto py-2"
                            onClick={() => {
                              handleOpenWebsite();
                            }}
                            title={url}
                          >
                            <span className="text-muted-foreground truncate block w-full text-left">
                              {relativePath}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground py-4">
                      No navigation history yet. Navigate within the website to
                      see visited pages.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabPanel>
            <TabPanel value="settings">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Filler Prompt</CardTitle>
                    <CardDescription>
                      Customize the prompt used for generating fake data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setPromptDialogOpen(true)}
                      variant="outline"
                    >
                      {website.customPrompt
                        ? "Edit Custom Prompt"
                        : "Set Custom Prompt"}
                    </Button>
                    {website.customPrompt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Custom prompt is active
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Ghost Writer Prompt</CardTitle>
                    <CardDescription>
                      Customize the prompt used for generating input hints
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setGhostWriterPromptDialogOpen(true)}
                      variant="outline"
                    >
                      {website.customGhostWriterPrompt
                        ? "Edit Custom Prompt"
                        : "Set Custom Prompt"}
                    </Button>
                    {website.customGhostWriterPrompt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Custom prompt is active
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabPanel>
            <TabPanel value="theme">
              <Card>
                <CardHeader>
                  <CardTitle>Theme</CardTitle>
                  <CardDescription>
                    Theme used for generating data for this website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-lg font-semibold">{themeName}</div>
                    {themeMetadata && (
                      <p className="text-sm text-muted-foreground">
                        {themeMetadata.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-4">
                      Created: {new Date(website.createdAt).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabPanel>
            <TabPanel value="tab-usage">
              <TabUsageStats />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>

      <PromptDialog
        open={promptDialogOpen}
        onOpenChange={setPromptDialogOpen}
        website={website}
        websites={allWebsites}
        onSave={(url, prompt) => {
          updateWebsiteCustomPrompt(url, prompt);
          handleRefresh();
        }}
      />
      <GhostWriterPromptDialog
        open={ghostWriterPromptDialogOpen}
        onOpenChange={setGhostWriterPromptDialogOpen}
        website={website}
        websites={allWebsites}
        onSave={(url, prompt) => {
          updateWebsiteCustomGhostWriterPrompt(url, prompt);
          handleRefresh();
        }}
      />
    </div>
  );
};
