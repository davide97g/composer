import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_SETTINGS } from "@composer/shared";
import { Website } from "@composer/shared";
import { useEffect, useState } from "react";

interface GhostWriterPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  website: Website | null;
  websites: Website[];
  onSave: (url: string, prompt: string | undefined) => void;
}

export const GhostWriterPromptDialog = ({
  open,
  onOpenChange,
  website,
  websites,
  onSave,
}: GhostWriterPromptDialogProps) => {
  const [prompt, setPrompt] = useState("");
  const [cloneSource, setCloneSource] = useState("");
  const [mode, setMode] = useState<"edit" | "clone">("edit");

  useEffect(() => {
    if (open && website) {
      if (mode === "clone" && cloneSource) {
        const sourceWebsite = websites.find((w) => w.url === cloneSource);
        if (sourceWebsite?.customGhostWriterPrompt) {
          setPrompt(sourceWebsite.customGhostWriterPrompt);
        } else {
          setPrompt(DEFAULT_SETTINGS.ghostWriter.prompt);
        }
      } else {
        setPrompt(website.customGhostWriterPrompt || DEFAULT_SETTINGS.ghostWriter.prompt);
      }
    }
  }, [open, website, mode, cloneSource, websites]);

  const handleSave = () => {
    if (website) {
      const trimmedPrompt = prompt.trim();
      const defaultPrompt = DEFAULT_SETTINGS.ghostWriter.prompt.trim();
      const finalPrompt =
        trimmedPrompt === defaultPrompt ? undefined : trimmedPrompt;
      onSave(website.url, finalPrompt);
      onOpenChange(false);
      setMode("edit");
      setCloneSource("");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state when closing
    setTimeout(() => {
      setMode("edit");
      setCloneSource("");
      if (website) {
        setPrompt(website.customGhostWriterPrompt || DEFAULT_SETTINGS.ghostWriter.prompt);
      }
    }, 100);
  };

  const handleRestore = () => {
    setPrompt(DEFAULT_SETTINGS.ghostWriter.prompt);
  };

  const handleClone = () => {
    if (cloneSource) {
      const sourceWebsite = websites.find((w) => w.url === cloneSource);
      if (sourceWebsite?.customGhostWriterPrompt) {
        setPrompt(sourceWebsite.customGhostWriterPrompt);
      } else {
        setPrompt(DEFAULT_SETTINGS.ghostWriter.prompt);
      }
      setMode("edit");
    }
  };

  if (!website) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Custom Ghost Writer Prompt</DialogTitle>
          <DialogDescription>
            Customize the prompt used for generating input hints in Ghost Writer mode for this website.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {mode === "clone" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Clone from website</label>
              <div className="flex gap-2">
                <Select
                  value={cloneSource}
                  onChange={(e) => setCloneSource(e.target.value)}
                  className="flex-1"
                >
                  <option value="">Select a website...</option>
                  {websites
                    .filter((w) => w.url !== website.url)
                    .map((w) => (
                      <option key={w.url} value={w.url}>
                        {w.url}
                      </option>
                    ))}
                </Select>
                <Button
                  onClick={handleClone}
                  disabled={!cloneSource}
                  variant="outline"
                >
                  Clone
                </Button>
                <Button
                  onClick={() => {
                    setMode("edit");
                    setCloneSource("");
                  }}
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => setMode("clone")}
                variant="outline"
                className="w-full"
              >
                Clone from another website
              </Button>
              <Button
                onClick={handleRestore}
                variant="outline"
                className="w-full"
              >
                Restore to Default
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={12}
              className="font-mono text-xs"
              placeholder={DEFAULT_SETTINGS.ghostWriter.prompt}
            />
            <p className="text-xs text-muted-foreground">
              Website: {website.url}. Use {"{theme}"} as a placeholder.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

