import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useState } from "react";
import {
  AILoadingEffect,
  ShimmerColor,
  ShimmerIntensity,
  ShimmerSpeed,
} from "./AILoadingEffects";

const AIEffectsShowcase = () => {
  const [color, setColor] = useState<ShimmerColor>("purple");
  const [speed, setSpeed] = useState<ShimmerSpeed>("slow");
  const [intensity, setIntensity] = useState<ShimmerIntensity>("low");
  const [isActive, setIsActive] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const showEffect = isActive || isFocused;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shimmer Skeleton Effect Configuration</CardTitle>
        <CardDescription>
          Configure and preview the shimmer effect with customizable color,
          speed, and intensity parameters. Default: purple color, slow speed,
          low intensity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Configuration Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color-select">Color</Label>
                  <Select
                    id="color-select"
                    value={color}
                    onChange={(e) => setColor(e.target.value as ShimmerColor)}
                  >
                    <option value="primary">Primary</option>
                    <option value="blue">Blue</option>
                    <option value="purple">Purple</option>
                    <option value="green">Green</option>
                    <option value="orange">Orange</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="speed-select">Speed</Label>
                  <Select
                    id="speed-select"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value as ShimmerSpeed)}
                  >
                    <option value="slow">Slow</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intensity-select">Intensity</Label>
                  <Select
                    id="intensity-select"
                    value={intensity}
                    onChange={(e) =>
                      setIntensity(e.target.value as ShimmerIntensity)
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Preview</CardTitle>
                <Button
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsActive(!isActive)}
                >
                  {isActive ? "Active" : "Inactive"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="preview-input">Sample Input Field</Label>
                <div className="relative">
                  <Input
                    id="preview-input"
                    type="text"
                    placeholder="Focus me or toggle the button to see the effect..."
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="relative z-10"
                  />
                  <AILoadingEffect
                    type="shimmer"
                    isActive={showEffect}
                    shimmerColor={color}
                    shimmerSpeed={speed}
                    shimmerIntensity={intensity}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      showEffect ? "bg-primary animate-pulse" : "bg-muted"
                    }`}
                  />
                  <span>
                    {showEffect
                      ? "Effect Active"
                      : "Effect Inactive - Toggle or focus to activate"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Info */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">Usage</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                The{" "}
                <code className="px-1 py-0.5 bg-muted rounded">
                  AILoadingEffect
                </code>{" "}
                component accepts the following props:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <code className="px-1 py-0.5 bg-muted rounded">type</code>:
                  "shimmer" (required)
                </li>
                <li>
                  <code className="px-1 py-0.5 bg-muted rounded">isActive</code>
                  : boolean (required)
                </li>
                  <li>
                    <code className="px-1 py-0.5 bg-muted rounded">
                      shimmerColor
                    </code>
                    : "primary" | "blue" | "purple" | "green" | "orange" (default:
                    "purple")
                  </li>
                <li>
                  <code className="px-1 py-0.5 bg-muted rounded">
                    shimmerSpeed
                  </code>
                  : "slow" | "normal" | "fast" (default: "slow")
                </li>
                <li>
                  <code className="px-1 py-0.5 bg-muted rounded">
                    shimmerIntensity
                  </code>
                  : "low" | "medium" | "high" (default: "low")
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { AIEffectsShowcase };
