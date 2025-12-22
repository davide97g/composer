import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <div className="flex items-center space-x-2">
        <div className="relative inline-block h-5 w-9">
          <input
            type="checkbox"
            role="switch"
            id={switchId}
            className={cn(
              "peer h-5 w-9 appearance-none rounded-full bg-input transition-colors checked:bg-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              "before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-background before:shadow-sm before:transition-transform peer-checked:before:translate-x-4",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {label && (
          <label
            htmlFor={switchId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };

