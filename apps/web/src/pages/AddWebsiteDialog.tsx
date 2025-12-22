import { useState, useEffect } from "react";
import { Theme, THEME_METADATA } from "@composer/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { startAgent } from "@/lib/api";
import { saveWebsite, getCustomThemes } from "@/lib/storage";

interface AddWebsiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const themes: Theme[] = [
  Theme.STAR_WARS_HERO,
  Theme.MARVEL_SUPERHERO,
  Theme.HARRY_POTTER_WIZARD,
  Theme.THE_OFFICE_EMPLOYEE,
  Theme.GAME_OF_THRONES_NOBLE,
];

export const AddWebsiteDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: AddWebsiteDialogProps) => {
  const [url, setUrl] = useState("");
  const [theme, setTheme] = useState<string>(Theme.STAR_WARS_HERO);
  const [customThemes, setCustomThemes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCustomThemes(getCustomThemes());
  }, [open]);

  const handleStart = async () => {
    if (!url.trim()) {
      alert("Please enter a valid URL");
      return;
    }

    setLoading(true);
    try {
      await startAgent(url.trim(), theme);
      saveWebsite(url.trim(), theme, [url.trim()]);
      setUrl("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to start agent:", error);
      alert("Failed to start agent. Make sure the agent server is running.");
    } finally {
      setLoading(false);
    }
  };

  const allThemes = [
    ...themes.map((t) => ({ id: t, metadata: THEME_METADATA[t] })),
    ...Object.entries(customThemes).map(([id, metadata]) => ({ id, metadata })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new website</DialogTitle>
          <DialogDescription>
            Enter the URL and select a theme for fake data generation
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              URL
            </label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="theme" className="text-sm font-medium">
              Theme
            </label>
            <Select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              {allThemes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.metadata.title}
                </option>
              ))}
            </Select>
            {allThemes.find((t) => t.id === theme) && (
              <p className="text-sm text-muted-foreground">
                {allThemes.find((t) => t.id === theme)?.metadata.description}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={loading}>
            {loading ? "Starting..." : "Start"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

