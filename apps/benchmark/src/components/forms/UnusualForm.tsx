import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

const UnusualForm = () => {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    datetime: "",
    color: "#000000",
    volume: "50",
    brightness: "75",
    opacity: "100",
    rating: "3",
    file: "",
    files: "",
    url: "",
    email: "",
    number: "",
    range: "50",
    notifications: false,
    darkMode: false,
    autoSave: true,
    theme: "light",
    preferences: [] as string[],
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (pref: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      preferences: checked
        ? [...prev.preferences, pref]
        : prev.preferences.filter((p) => p !== pref),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Unusual Form Data:", formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unusual Inputs Form</CardTitle>
        <CardDescription>
          Various non-standard input types including date pickers, color pickers, sliders, and more
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date Picker</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time Picker</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange("time", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="datetime">Date & Time</Label>
              <Input
                id="datetime"
                type="datetime-local"
                value={formData.datetime}
                onChange={(e) => handleInputChange("datetime", e.target.value)}
              />
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label htmlFor="color">Color Picker</Label>
            <div className="flex items-center gap-4">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          {/* Range Sliders */}
          <div className="space-y-4">
            <Slider
              id="volume"
              label="Volume"
              min="0"
              max="100"
              value={formData.volume}
              onChange={(e) => handleInputChange("volume", e.target.value)}
            />
            <div className="text-sm text-muted-foreground">Value: {formData.volume}%</div>
          </div>

          <div className="space-y-4">
            <Slider
              id="brightness"
              label="Brightness"
              min="0"
              max="100"
              value={formData.brightness}
              onChange={(e) => handleInputChange("brightness", e.target.value)}
            />
            <div className="text-sm text-muted-foreground">Value: {formData.brightness}%</div>
          </div>

          <div className="space-y-4">
            <Slider
              id="opacity"
              label="Opacity"
              min="0"
              max="100"
              value={formData.opacity}
              onChange={(e) => handleInputChange("opacity", e.target.value)}
            />
            <div className="text-sm text-muted-foreground">Value: {formData.opacity}%</div>
          </div>

          {/* Number Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Number Input</Label>
              <Input
                id="number"
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="Enter a number"
                value={formData.number}
                onChange={(e) => handleInputChange("number", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="range">Range Input</Label>
              <Input
                id="range"
                type="range"
                min="0"
                max="100"
                value={formData.range}
                onChange={(e) => handleInputChange("range", e.target.value)}
              />
              <div className="text-sm text-muted-foreground">Value: {formData.range}</div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="file">Single File Upload</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) =>
                  handleInputChange("file", e.target.files?.[0]?.name || "")
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="files">Multiple File Upload</Label>
              <Input
                id="files"
                type="file"
                multiple
                onChange={(e) =>
                  handleInputChange(
                    "files",
                    Array.from(e.target.files || []).map((f) => f.name).join(", ")
                  )
                }
              />
            </div>
          </div>

          {/* URL and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL Input</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => handleInputChange("url", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Input</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Toggle Switches</h3>
            <div className="space-y-4">
              <Switch
                id="notifications"
                label="Enable Notifications"
                checked={formData.notifications}
                onChange={(e) => handleInputChange("notifications", e.target.checked)}
              />
              <Switch
                id="darkMode"
                label="Dark Mode"
                checked={formData.darkMode}
                onChange={(e) => handleInputChange("darkMode", e.target.checked)}
              />
              <Switch
                id="autoSave"
                label="Auto Save"
                checked={formData.autoSave}
                onChange={(e) => handleInputChange("autoSave", e.target.checked)}
              />
            </div>
          </div>

          {/* Radio Groups */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Theme Selection</h3>
            <RadioGroup>
              <RadioItem
                id="theme-light"
                name="theme"
                value="light"
                checked={formData.theme === "light"}
                onChange={(e) => handleInputChange("theme", e.target.value)}
                label="Light"
              />
              <RadioItem
                id="theme-dark"
                name="theme"
                value="dark"
                checked={formData.theme === "dark"}
                onChange={(e) => handleInputChange("theme", e.target.value)}
                label="Dark"
              />
              <RadioItem
                id="theme-auto"
                name="theme"
                value="auto"
                checked={formData.theme === "auto"}
                onChange={(e) => handleInputChange("theme", e.target.value)}
                label="Auto"
              />
            </RadioGroup>
          </div>

          {/* Checkbox Groups */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Preferences</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pref-newsletter"
                  checked={formData.preferences.includes("newsletter")}
                  onChange={(e) => handleCheckboxChange("newsletter", e.target.checked)}
                />
                <Label htmlFor="pref-newsletter">Newsletter</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pref-updates"
                  checked={formData.preferences.includes("updates")}
                  onChange={(e) => handleCheckboxChange("updates", e.target.checked)}
                />
                <Label htmlFor="pref-updates">Product Updates</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pref-marketing"
                  checked={formData.preferences.includes("marketing")}
                  onChange={(e) => handleCheckboxChange("marketing", e.target.checked)}
                />
                <Label htmlFor="pref-marketing">Marketing Emails</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pref-sms"
                  checked={formData.preferences.includes("sms")}
                  onChange={(e) => handleCheckboxChange("sms", e.target.checked)}
                />
                <Label htmlFor="pref-sms">SMS Notifications</Label>
              </div>
            </div>
          </div>

          <Button type="submit">Submit</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export { UnusualForm };

