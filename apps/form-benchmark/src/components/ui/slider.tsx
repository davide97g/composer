import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, id, ...props }, ref) => {
    const sliderId = id || `slider-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <div className="flex flex-col space-y-2">
        {label && (
          <label
            htmlFor={sliderId}
            className="text-sm font-medium leading-none"
          >
            {label}
          </label>
        )}
        <input
          type="range"
          id={sliderId}
          className={cn(
            "h-2 w-full appearance-none rounded-lg bg-input accent-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };

