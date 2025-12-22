import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-2", className)}
        {...props}
      />
    );
  }
);
RadioGroup.displayName = "RadioGroup";

export interface RadioItemProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const RadioItem = React.forwardRef<HTMLInputElement, RadioItemProps>(
  ({ className, label, id, checked, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          id={radioId}
          checked={checked}
          className={cn(
            "h-4 w-4 border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        {label && (
          <label
            htmlFor={radioId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
RadioItem.displayName = "RadioItem";

export { RadioGroup, RadioItem };

