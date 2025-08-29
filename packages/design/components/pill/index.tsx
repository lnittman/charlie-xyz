import * as React from "react";
import { Badge, type BadgeProps } from "../badge";
import { cn } from "../../lib/utils";
import { TrendingDown, TrendingUp, X } from "lucide-react";

interface PillProps extends BadgeProps {
  themed?: boolean;
}

export function Pill({ variant = "secondary", themed = false, className, ...props }: PillProps) {
  return (
    <Badge
      className={cn("gap-2 rounded-full px-3 py-1.5 font-normal", className)}
      variant={variant}
      {...props}
    />
  );
}

interface PillIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: "green" | "red" | "yellow" | "blue" | "gray";
  pulse?: boolean;
}

export function PillIndicator({ color = "gray", pulse = false, className, ...props }: PillIndicatorProps) {
  const colorClasses = {
    green: "bg-emerald-500",
    red: "bg-red-500",
    yellow: "bg-amber-500",
    blue: "bg-blue-500",
    gray: "bg-gray-500",
  };

  return (
    <span className="relative flex h-2 w-2" {...props}>
      {pulse && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            colorClasses[color],
            className
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          colorClasses[color],
          className
        )}
      />
    </span>
  );
}

interface PillDeltaProps {
  value: "up" | "down" | "neutral";
  className?: string;
}

export function PillDelta({ value, className }: PillDeltaProps) {
  const Icon = value === "up" ? TrendingUp : value === "down" ? TrendingDown : null;
  const colorClass =
    value === "up" ? "text-emerald-600 dark:text-emerald-400" :
    value === "down" ? "text-red-600 dark:text-red-400" :
    "text-gray-500";

  if (!Icon) {
    return <span className={cn("text-xs", colorClass, className)}>—</span>;
  }

  return <Icon className={cn("h-3 w-3", colorClass, className)} />;
}

interface PillIconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
}

export function PillIcon({ icon, className, ...props }: PillIconProps) {
  return (
    <div className={cn("flex items-center", className)} {...props}>
      {icon}
    </div>
  );
}

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function PillButton({ className, children, ...props }: PillButtonProps) {
  return (
    <button
      className={cn(
        "ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
        className
      )}
      type="button"
      {...props}
    >
      {children || <X className="h-3 w-3" />}
    </button>
  );
}

interface PillStatusProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PillStatus({ className, children, ...props }: PillStatusProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-l border-current/20 pl-2 ml-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}