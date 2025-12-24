import { cn } from "@/lib/utils";
import React, { useRef } from "react";

export type AILoadingEffectType = "shimmer";

export type ShimmerColor = "primary" | "blue" | "purple" | "green" | "orange";
export type ShimmerSpeed = "slow" | "normal" | "fast";
export type ShimmerIntensity = "low" | "medium" | "high";

interface AILoadingEffectProps {
  type: AILoadingEffectType;
  isActive: boolean;
  className?: string;
  shimmerColor?: ShimmerColor;
  shimmerSpeed?: ShimmerSpeed;
  shimmerIntensity?: ShimmerIntensity;
}

export const AILoadingEffect = ({
  type,
  isActive,
  className,
  shimmerColor = "purple",
  shimmerSpeed = "slow",
  shimmerIntensity = "low",
}: AILoadingEffectProps) => {
  if (!isActive) return null;

  switch (type) {
    case "shimmer":
      return (
        <ShimmerEffect
          className={className}
          color={shimmerColor}
          speed={shimmerSpeed}
          intensity={shimmerIntensity}
        />
      );
    default:
      return null;
  }
};

// Shimmer Skeleton Effect
interface ShimmerEffectProps {
  className?: string;
  color?: ShimmerColor;
  speed?: ShimmerSpeed;
  intensity?: ShimmerIntensity;
}

const ShimmerEffect = ({
  className,
  color = "purple",
  speed = "slow",
  intensity = "low",
}: ShimmerEffectProps) => {
  // Intensity mapping (opacity values as decimals)
  const intensityMap = {
    low: { main: 0.1, secondary: 0.05 },
    medium: { main: 0.15, secondary: 0.08 },
    high: { main: 0.25, secondary: 0.12 },
  };

  // Speed mapping (animation class names)
  const speedClasses = {
    slow: {
      main: "animate-shimmer-slow",
      delayed: "animate-shimmer-delayed-slow",
    },
    normal: { main: "animate-shimmer", delayed: "animate-shimmer-delayed" },
    fast: {
      main: "animate-shimmer-fast",
      delayed: "animate-shimmer-delayed-fast",
    },
  };

  const intensityValues = intensityMap[intensity];
  const speedClass = speedClasses[speed];

  // Get color RGB values
  const getColorRGB = (colorName: ShimmerColor): string => {
    if (colorName === "primary") {
      // Use CSS variable for primary
      return "hsl(var(--primary))";
    }
    const colorMap: Record<string, string> = {
      blue: "rgb(59, 130, 246)",
      purple: "rgb(168, 85, 247)",
      green: "rgb(34, 197, 94)",
      orange: "rgb(249, 115, 22)",
    };
    return colorMap[colorName] || colorMap.blue;
  };

  const baseColor = getColorRGB(color);

  // Helper to create rgba color
  const createRGBA = (rgbString: string, opacity: number): string => {
    if (rgbString.includes("hsl")) {
      // For primary color using CSS variable
      return rgbString.replace(")", ` / ${opacity * 100}%)`);
    }
    // Extract RGB values and create rgba
    const matches = rgbString.match(/\d+/g);
    if (matches && matches.length >= 3) {
      return `rgba(${matches[0]}, ${matches[1]}, ${matches[2]}, ${opacity})`;
    }
    return rgbString;
  };

  const mainColor = createRGBA(baseColor, intensityValues.main);
  const secondaryColor = createRGBA(baseColor, intensityValues.secondary);

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none rounded-md overflow-hidden z-50",
        className
      )}
    >
      {/* Base greyish gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30" />
      {/* Animated shimmer layers */}
      <div
        className={cn("absolute inset-0", speedClass.main)}
        style={{
          background: `linear-gradient(to right, transparent, ${mainColor}, transparent)`,
        }}
      />
      <div
        className={cn("absolute inset-0", speedClass.delayed)}
        style={{
          background: `linear-gradient(to right, ${secondaryColor}, ${mainColor}, ${secondaryColor})`,
        }}
      />
    </div>
  );
};

// Wrapper component for inputs
interface InputWithAIEffectProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  effectType?: AILoadingEffectType;
  showEffect?: boolean;
}

export const InputWithAIEffect = React.forwardRef<
  HTMLInputElement,
  InputWithAIEffectProps
>(
  (
    { effectType = "shimmer", showEffect = false, className, ...props },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
      <div ref={containerRef} className="relative">
        <input
          ref={ref}
          className={cn("relative z-10", className)}
          {...props}
        />
        <AILoadingEffect type={effectType} isActive={showEffect} />
      </div>
    );
  }
);

InputWithAIEffect.displayName = "InputWithAIEffect";
