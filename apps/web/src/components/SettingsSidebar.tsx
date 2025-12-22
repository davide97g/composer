import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAvailableModels, saveSettingsToAgent } from "@/lib/api";
import { getSettings, saveSettings } from "@/lib/settingsStorage";
import { DEFAULT_SETTINGS, Settings, SYSTEM_PROMPT_PART } from "@composer/shared";
import { useEffect, useState } from "react";

interface SettingsSidebarProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsSidebar = ({ open, onClose }: SettingsSidebarProps) => {
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["aiModel", "scraper", "filler"])
  );

  useEffect(() => {
    if (open) {
      setSettings(getSettings());
      loadModels();
    }
  }, [open]);

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const models = await getAvailableModels();
      setAvailableModels(models);
    } catch (error) {
      console.error("Failed to load models:", error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleToggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleSave = async () => {
    saveSettings(settings);
    // Also save to shared file via API
    await saveSettingsToAgent(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background border-l shadow-lg z-50 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Settings</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              ×
            </Button>
          </div>

          {/* AI Model Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Model</CardTitle>
                  <CardDescription>
                    Configure AI provider and model settings
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleSection("aiModel")}
                >
                  {expandedSections.has("aiModel") ? "−" : "+"}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.has("aiModel") && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider</label>
                  <Select
                    value={settings.aiModel.provider}
                    disabled
                    className="w-full"
                  >
                    <option value="openai">OpenAI</option>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Currently only OpenAI is supported
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Model</label>
                  {loadingModels ? (
                    <div className="text-sm text-muted-foreground">
                      Loading models...
                    </div>
                  ) : (
                    <Select
                      value={settings.aiModel.model}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          aiModel: { ...settings.aiModel, model: e.target.value },
                        })
                      }
                      className="w-full"
                    >
                      {availableModels.length > 0 ? (
                        availableModels.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))
                      ) : (
                        <option value={settings.aiModel.model}>
                          {settings.aiModel.model}
                        </option>
                      )}
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <div className="flex gap-2">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={settings.aiModel.apiKey}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          aiModel: {
                            ...settings.aiModel,
                            apiKey: e.target.value,
                          },
                        })
                      }
                      placeholder="Enter your OpenAI API key"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API key is stored locally and will be used instead of
                    environment variables
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Scraper Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scraper</CardTitle>
                  <CardDescription>
                    Configure form detection and scraping settings
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleSection("scraper")}
                >
                  {expandedSections.has("scraper") ? "−" : "+"}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.has("scraper") && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timeout (ms)</label>
                  <Input
                    type="number"
                    value={settings.scraper.timeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        scraper: {
                          ...settings.scraper,
                          timeout: parseInt(e.target.value) || 30000,
                        },
                      })
                    }
                    min="1000"
                    step="1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum time to wait for form detection
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Retries</label>
                  <Input
                    type="number"
                    value={settings.scraper.retries}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        scraper: {
                          ...settings.scraper,
                          retries: parseInt(e.target.value) || 3,
                        },
                      })
                    }
                    min="0"
                    max="10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of retry attempts for form detection
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.scraper.optimization}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          scraper: {
                            ...settings.scraper,
                            optimization: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Optimization</span>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Enable HTML optimization for faster form detection
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Filler Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Filler</CardTitle>
                  <CardDescription>
                    Configure form filling and data generation settings
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleSection("filler")}
                >
                  {expandedSections.has("filler") ? "−" : "+"}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.has("filler") && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">System Prompt (Read-only)</label>
                  <Textarea
                    value={SYSTEM_PROMPT_PART}
                    readOnly
                    rows={4}
                    className="font-mono text-xs bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    This part is always included in the system prompt and cannot be modified.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Prompt</label>
                  <Textarea
                    value={settings.filler.prompt}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        filler: {
                          ...settings.filler,
                          prompt: e.target.value,
                        },
                      })
                    }
                    rows={12}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom prompt for data generation. Use {"{theme}"} as a placeholder. The system prompt part above is automatically included.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Timeout (ms)</label>
                  <Input
                    type="number"
                    value={settings.filler.timeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        filler: {
                          ...settings.filler,
                          timeout: parseInt(e.target.value) || 30000,
                        },
                      })
                    }
                    min="1000"
                    step="1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum time to wait for data generation
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </div>
      </div>
    </>
  );
};

