import { PromptDialog } from "@/components/PromptDialog";
import { GenerationsTab } from "@/components/GenerationsTab";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@/components/ui/tabs";
import { getNavigationHistory, startAgent } from "@/lib/api";
import {
  getActiveTheme,
  getWebsiteTitle,
  updateWebsiteCustomPrompt,
  updateWebsiteNavigationHistory,
  updateWebsiteTitle,
} from "@/lib/storage";
import { fetchWebsiteTitle, getFaviconUrl } from "@/lib/utils";
import { Website } from "@composer/shared";
import { useCallback, useEffect, useState } from "react";

interface WebsiteListProps {
  websites: Website[];
  onWebsiteClick: (url: string) => void;
}

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
      // Remove leading slash and format nicely
      return path.startsWith("/") ? path.slice(1) : path;
    }
    return fullUrl;
  } catch {
    const relative = fullUrl.replace(baseUrl, "");
    return relative || "home";
  }
};

interface WebsiteMetadata {
  title: string | null;
  favicon: string;
}

export const WebsiteList = ({ websites, onWebsiteClick }: WebsiteListProps) => {
  const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set());
  const [navigationHistories, setNavigationHistories] = useState<
    Map<string, string[]>
  >(new Map());
  const [loadingHistories, setLoadingHistories] = useState<Set<string>>(
    new Set()
  );
  const [websiteMetadata, setWebsiteMetadata] = useState<
    Map<string, WebsiteMetadata>
  >(new Map());
  const [loadingMetadata, setLoadingMetadata] = useState<Set<string>>(
    new Set()
  );
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleValues, setTitleValues] = useState<Map<string, string>>(
    new Map()
  );
  const [customTitles, setCustomTitles] = useState<Map<string, string>>(
    new Map()
  );

  const handleWebsiteClick = async (website: Website) => {
    try {
      const theme = getActiveTheme();
      await startAgent(website.url, theme, website.customPrompt);
      onWebsiteClick(website.url);
      // Refresh navigation history after starting agent
      setTimeout(() => {
        const baseUrl = getBaseUrl(website.url);
        fetchNavigationHistory(baseUrl, website.url);
      }, 1000);
    } catch (error) {
      console.error("Failed to start agent:", error);
      alert("Failed to start agent. Make sure the agent server is running.");
    }
  };

  const fetchWebsiteMetadata = useCallback(async (url: string) => {
    setLoadingMetadata((prev) => {
      if (prev.has(url)) return prev;
      return new Set(prev).add(url);
    });

    try {
      const title = await fetchWebsiteTitle(url);
      const favicon = getFaviconUrl(url);

      setWebsiteMetadata((prev) => {
        // Skip if already set (race condition protection)
        if (prev.has(url)) return prev;
        const newMetadata = new Map(prev);
        newMetadata.set(url, { title, favicon });
        return newMetadata;
      });
    } catch (error) {
      console.error("Failed to fetch website metadata:", error);
      // Set fallback metadata
      setWebsiteMetadata((prev) => {
        if (prev.has(url)) return prev;
        const newMetadata = new Map(prev);
        newMetadata.set(url, { title: null, favicon: getFaviconUrl(url) });
        return newMetadata;
      });
    } finally {
      setLoadingMetadata((prev) => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  }, []);

  const fetchNavigationHistory = async (
    baseUrl: string,
    websiteUrl: string
  ) => {
    if (loadingHistories.has(baseUrl)) return;

    setLoadingHistories((prev) => new Set(prev).add(baseUrl));
    try {
      const history = await getNavigationHistory(baseUrl);
      const newHistories = new Map(navigationHistories);
      newHistories.set(baseUrl, history);
      setNavigationHistories(newHistories);

      // Update localStorage
      if (history.length > 0) {
        updateWebsiteNavigationHistory(websiteUrl, history);
      }
    } catch (error) {
      console.error("Failed to fetch navigation history:", error);
    } finally {
      setLoadingHistories((prev) => {
        const next = new Set(prev);
        next.delete(baseUrl);
        return next;
      });
    }
  };

  const handleToggleExpand = async (website: Website, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const baseUrl = getBaseUrl(website.url);
    const isExpanded = expandedUrls.has(website.url);

    if (isExpanded) {
      const newExpanded = new Set(expandedUrls);
      newExpanded.delete(website.url);
      setExpandedUrls(newExpanded);
    } else {
      const newExpanded = new Set(expandedUrls);
      newExpanded.add(website.url);
      setExpandedUrls(newExpanded);

      // Always fetch fresh navigation history when expanding
      await fetchNavigationHistory(baseUrl, website.url);
    }
  };

  const handleStartEditTitle = (website: Website, e: React.MouseEvent) => {
    e.stopPropagation();
    const customTitle = customTitles.get(website.url);
    const metadata = websiteMetadata.get(website.url);
    const displayTitle = customTitle || metadata?.title || website.url;
    setEditingTitle(website.url);
    setTitleValues((prev) => {
      const newValues = new Map(prev);
      newValues.set(website.url, displayTitle);
      return newValues;
    });
  };

  const handleSaveTitle = (website: Website) => {
    const newTitle = titleValues.get(website.url)?.trim();
    if (newTitle) {
      updateWebsiteTitle(website.url, newTitle);
      setCustomTitles((prev) => {
        const newTitles = new Map(prev);
        newTitles.set(website.url, newTitle);
        return newTitles;
      });
    } else {
      // If empty, remove custom title
      updateWebsiteTitle(website.url, undefined);
      setCustomTitles((prev) => {
        const newTitles = new Map(prev);
        newTitles.delete(website.url);
        return newTitles;
      });
    }
    setEditingTitle(null);
  };

  const handleCancelEditTitle = () => {
    setEditingTitle(null);
  };

  const handleTitleKeyDown = (
    website: Website,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      handleSaveTitle(website);
    } else if (e.key === "Escape") {
      handleCancelEditTitle();
    }
  };

  // Load navigation history from stored websites
  useEffect(() => {
    const histories = new Map<string, string[]>();
    const titles = new Map<string, string>();
    websites.forEach((website) => {
      const baseUrl = getBaseUrl(website.url);
      if (website.navigationHistory && website.navigationHistory.length > 0) {
        histories.set(baseUrl, website.navigationHistory);
      }
      const customTitle = getWebsiteTitle(website.url);
      if (customTitle) {
        titles.set(website.url, customTitle);
      }
    });
    setNavigationHistories(histories);
    setCustomTitles(titles);
  }, [websites]);

  // Fetch website metadata (favicon and title) for each website
  useEffect(() => {
    websites.forEach((website) => {
      // Only fetch if we don't already have metadata for this URL
      if (
        !websiteMetadata.has(website.url) &&
        !loadingMetadata.has(website.url)
      ) {
        fetchWebsiteMetadata(website.url).catch(() => {
          // Ignore errors - metadata fetching is optional
        });
      }
    });
  }, [websites, fetchWebsiteMetadata, websiteMetadata, loadingMetadata]);

  // Fetch fresh navigation history from agent when component mounts or websites change
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    websites.forEach((website) => {
      const baseUrl = getBaseUrl(website.url);
      // Fetch fresh data from agent (non-blocking, debounced)
      const timer = setTimeout(() => {
        fetchNavigationHistory(baseUrl, website.url).catch(() => {
          // Ignore errors - agent might not be running
        });
      }, 500);
      timers.push(timer);
    });
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [websites]);

  if (websites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Last websites visited</CardTitle>
          <CardDescription>No websites visited yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last websites visited</CardTitle>
        <CardDescription>
          Click on a website to reopen it in the browser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {websites.map((website) => {
          const baseUrl = getBaseUrl(website.url);
          const isExpanded = expandedUrls.has(website.url);
          const history =
            navigationHistories.get(baseUrl) || website.navigationHistory || [];
          const hasHistory = history.length > 0;
          const isLoading = loadingHistories.has(baseUrl);
          const metadata = websiteMetadata.get(website.url);
          const customTitle = customTitles.get(website.url);
          const isEditing = editingTitle === website.url;
          const displayTitle = customTitle || metadata?.title || website.url;

          return (
            <div
              key={website.url}
              className="border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="p-3" onClick={() => handleWebsiteClick(website)}>
                <div className="flex items-start gap-3 w-full">
                  <img
                    src={metadata?.favicon || getFaviconUrl(website.url)}
                    alt=""
                    className="w-5 h-5 shrink-0 mt-0.5"
                    onError={(e) => {
                      // Hide image on error
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="flex flex-col items-start w-full min-w-0 flex-1">
                    <div className="flex items-center gap-2 w-full">
                      {isEditing ? (
                        <Input
                          value={titleValues.get(website.url) || ""}
                          onChange={(e) => {
                            setTitleValues((prev) => {
                              const newValues = new Map(prev);
                              newValues.set(website.url, e.target.value);
                              return newValues;
                            });
                          }}
                          onBlur={() => handleSaveTitle(website)}
                          onKeyDown={(e) => handleTitleKeyDown(website, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 text-sm font-medium"
                          autoFocus
                        />
                      ) : (
                        <>
                          <span
                            className="font-medium truncate flex-1 text-left cursor-pointer hover:text-primary"
                            onClick={(e) => handleStartEditTitle(website, e)}
                            title="Click to edit title"
                          >
                            {displayTitle}
                          </span>
                          {website.customPrompt && (
                            <span
                              className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0"
                              title="Custom prompt"
                            >
                              Custom
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate w-full text-left">
                      {website.url}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(website.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWebsite(website);
                        setPromptDialogOpen(true);
                      }}
                      aria-label="Edit prompt"
                      title="Edit custom prompt"
                    >
                      <span className="text-sm">✎</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleToggleExpand(website, e)}
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="text-sm animate-spin">⟳</span>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t">
                  <Tabs defaultValue="generations">
                    <TabList>
                      <Tab value="generations">Generations</Tab>
                      <Tab value="history">Navigation History</Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel value="generations">
                        <GenerationsTab baseUrl={baseUrl} websiteUrl={website.url} />
                      </TabPanel>
                      <TabPanel value="history">
                        <div className="space-y-1 pt-2">
                          {isLoading ? (
                            <div className="text-sm text-muted-foreground py-2">
                              Loading navigation history...
                            </div>
                          ) : hasHistory ? (
                            history.map((url, index) => {
                              const relativePath = getRelativePath(baseUrl, url);
                              return (
                                <Button
                                  key={index}
                                  variant="ghost"
                                  className="w-full justify-start text-left text-sm h-auto py-1.5"
                                  onClick={() =>
                                    handleWebsiteClick({ ...website, url })
                                  }
                                  title={url}
                                >
                                  <span className="text-muted-foreground truncate block w-full text-left">
                                    {relativePath}
                                  </span>
                                </Button>
                              );
                            })
                          ) : (
                            <div className="text-sm text-muted-foreground py-2">
                              No navigation history yet. Navigate within the website to
                              see visited pages.
                            </div>
                          )}
                        </div>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>

      <PromptDialog
        open={promptDialogOpen}
        onOpenChange={setPromptDialogOpen}
        website={selectedWebsite}
        websites={websites}
        onSave={(url, prompt) => {
          updateWebsiteCustomPrompt(url, prompt);
          onWebsiteClick(url);
        }}
      />
    </Card>
  );
};
