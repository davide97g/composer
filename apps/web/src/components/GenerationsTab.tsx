import { useState, useEffect } from "react";
import { Generation, GenerationStatus } from "@composer/shared";
import { getGenerations as getGenerationsFromStorage } from "@/lib/storage";
import { getGenerations as getGenerationsFromAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface GenerationsTabProps {
  baseUrl: string;
  websiteUrl: string;
}

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

const getStatusColor = (status: GenerationStatus): string => {
  switch (status) {
    case GenerationStatus.SUCCESS:
      return "text-green-600 bg-green-50";
    case GenerationStatus.WARNING:
      return "text-yellow-600 bg-yellow-50";
    case GenerationStatus.ERROR:
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const getStatusIcon = (status: GenerationStatus): string => {
  switch (status) {
    case GenerationStatus.SUCCESS:
      return "✓";
    case GenerationStatus.WARNING:
      return "⚠";
    case GenerationStatus.ERROR:
      return "✗";
    default:
      return "•";
  }
};

export const GenerationsTab = ({ baseUrl, websiteUrl }: GenerationsTabProps) => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  useEffect(() => {
    const loadGenerations = async () => {
      setLoading(true);
      try {
        // Try to get from API first (most up-to-date)
        const apiGenerations = await getGenerationsFromAPI(baseUrl);
        if (apiGenerations.length > 0) {
          setGenerations(apiGenerations);
        } else {
          // Fallback to localStorage
          const storedGenerations = getGenerationsFromStorage(baseUrl);
          setGenerations(storedGenerations);
        }
      } catch (error) {
        console.error("Failed to load generations:", error);
        // Fallback to localStorage
        const storedGenerations = getGenerationsFromStorage(baseUrl);
        setGenerations(storedGenerations);
      } finally {
        setLoading(false);
      }
    };

    loadGenerations();
  }, [baseUrl]);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Loading generations...
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No generations yet. Fill a form to see generated data here.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {generations.map((generation) => {
          const relativePath = getRelativePath(baseUrl, generation.url);
          return (
            <div
              key={generation.id}
              className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{relativePath}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(generation.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {generation.resourceDescription}
                  </p>
                </div>
              </div>

              {/* Screenshots */}
              {(generation.screenshotBefore || generation.screenshotAfter) && (
                <div className="flex gap-2">
                  {generation.screenshotBefore && (
                    <button
                      onClick={() => setSelectedScreenshot(generation.screenshotBefore!)}
                      className="relative group"
                    >
                      <img
                        src={`data:image/png;base64,${generation.screenshotBefore}`}
                        alt="Before"
                        className="w-24 h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                      />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5 rounded-b">
                        Before
                      </span>
                    </button>
                  )}
                  {generation.screenshotAfter && (
                    <button
                      onClick={() => setSelectedScreenshot(generation.screenshotAfter!)}
                      className="relative group"
                    >
                      <img
                        src={`data:image/png;base64,${generation.screenshotAfter}`}
                        alt="After"
                        className="w-24 h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                      />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5 rounded-b">
                        After
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Fields */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Generated Fields:
                </div>
                {generation.fields.map((field, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs p-2 rounded bg-background"
                  >
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(
                        field.status
                      )}`}
                    >
                      {getStatusIcon(field.status)}
                    </span>
                    <span className="font-medium">{field.label}:</span>
                    <span className="text-muted-foreground">{field.type}</span>
                    <span className="ml-auto text-muted-foreground truncate max-w-[200px]">
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Screenshot Viewer Modal */}
      <Dialog
        open={selectedScreenshot !== null}
        onOpenChange={(open) => !open && setSelectedScreenshot(null)}
      >
        <DialogContent className="max-w-4xl">
          {selectedScreenshot && (
            <img
              src={`data:image/png;base64,${selectedScreenshot}`}
              alt="Screenshot"
              className="w-full h-auto rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

