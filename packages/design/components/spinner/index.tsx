import * as React from "react";
import { Loader2, CircleDashed, LoaderPinwheel } from "lucide-react";
import { cn } from "../../lib/utils";

type SpinnerVariant = 
  | "default" 
  | "circle" 
  | "pinwheel" 
  | "dots" 
  | "ring" 
  | "bars" 
  | "pulse";

interface SpinnerProps {
  variant?: SpinnerVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function Spinner({ variant = "default", size = "md", className }: SpinnerProps) {
  const sizeClass = sizeClasses[size];

  switch (variant) {
    case "circle":
      return (
        <CircleDashed
          className={cn("animate-spin", sizeClass, className)}
        />
      );
    
    case "pinwheel":
      return (
        <LoaderPinwheel
          className={cn("animate-spin", sizeClass, className)}
        />
      );
    
    case "dots":
      return (
        <div className={cn("flex items-center gap-1", className)}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-full bg-current",
                size === "sm" ? "w-1 h-1" : size === "md" ? "w-1.5 h-1.5" : "w-2 h-2",
                "animate-bounce"
              )}
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      );
    
    case "ring":
      return (
        <div className={cn("relative", sizeClass, className)}>
          <div className="absolute inset-0 rounded-full border-2 border-current opacity-25" />
          <div className="absolute inset-0 rounded-full border-2 border-current border-t-transparent animate-spin" />
        </div>
      );
    
    case "bars":
      return (
        <div className={cn("flex items-center gap-1", className)}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "bg-current rounded-sm",
                size === "sm" ? "w-0.5 h-3" : size === "md" ? "w-1 h-4" : "w-1.5 h-6",
                "animate-pulse"
              )}
              style={{ 
                animationDelay: `${i * 100}ms`,
                animationDuration: "0.8s"
              }}
            />
          ))}
        </div>
      );
    
    case "pulse":
      return (
        <div className={cn("relative", sizeClass, className)}>
          <div className="absolute inset-0 rounded-full bg-current animate-ping opacity-75" />
          <div className="relative rounded-full bg-current" />
        </div>
      );
    
    default:
      return (
        <Loader2
          className={cn("animate-spin", sizeClass, className)}
        />
      );
  }
}