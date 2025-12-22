import { Theme, THEME_METADATA, ThemeMetadata } from "@composer/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getActiveTheme, setActiveTheme, saveCustomTheme, getCustomThemes } from "@/lib/storage";
import { useState, useEffect } from "react";

const themes: Theme[] = [
  Theme.STAR_WARS_HERO,
  Theme.MARVEL_SUPERHERO,
  Theme.HARRY_POTTER_WIZARD,
  Theme.THE_OFFICE_EMPLOYEE,
  Theme.GAME_OF_THRONES_NOBLE,
];

interface ThemeOption {
  id: string;
  metadata: ThemeMetadata;
}

export const ThemeSelector = () => {
  const [activeTheme, setActiveThemeState] = useState<string>(getActiveTheme());
  const [customThemes, setCustomThemes] = useState<Record<string, ThemeMetadata>>({});
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  useEffect(() => {
    setCustomThemes(getCustomThemes());
  }, []);

  const handleThemeSelect = (themeId: string) => {
    setActiveTheme(themeId);
    setActiveThemeState(themeId);
  };

  const handleAddCustomTheme = () => {
    if (!customTitle.trim()) {
      alert("Please enter a theme title");
      return;
    }
    if (!customDescription.trim()) {
      alert("Please enter a theme description");
      return;
    }

    const themeId = customTitle.trim();
    const metadata: ThemeMetadata = {
      title: customTitle.trim(),
      description: customDescription.trim(),
    };

    saveCustomTheme(themeId, metadata);
    setCustomThemes({ ...customThemes, [themeId]: metadata });
    setCustomTitle("");
    setCustomDescription("");
    setShowCustomDialog(false);
  };

  const allThemes: ThemeOption[] = [
    ...themes.map((theme) => ({
      id: theme,
      metadata: THEME_METADATA[theme],
    })),
    ...Object.entries(customThemes).map(([id, metadata]) => ({
      id,
      metadata,
    })),
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Themes</CardTitle>
          <CardDescription>Select a theme for fake data generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {allThemes.map((themeOption) => (
            <button
              key={themeOption.id}
              onClick={() => handleThemeSelect(themeOption.id)}
              className={`w-full text-left p-3 rounded-md border transition-colors ${
                activeTheme === themeOption.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{themeOption.metadata.title}</div>
                  <div
                    className={`text-sm mt-1 ${
                      activeTheme === themeOption.id
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {themeOption.metadata.description}
                  </div>
                </div>
                {activeTheme === themeOption.id && (
                  <span className="ml-2 text-lg">✓</span>
                )}
              </div>
            </button>
          ))}
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => setShowCustomDialog(true)}
          >
            + Add Custom Theme
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Theme</DialogTitle>
            <DialogDescription>
              Create your own theme with a custom title and description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="custom-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="custom-title"
                type="text"
                placeholder="e.g., Sci-Fi Explorer"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="custom-description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="custom-description"
                type="text"
                placeholder="e.g., Generate data for space explorers"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomTheme}>Add Theme</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

