"use client";

import { usePathname } from "next/navigation";
import { Plus, GridFour } from "@phosphor-icons/react";
import { Link } from "next-view-transitions";

import { cn } from "@/lib/utils";

interface ViewToggleProps {
  className?: string;
}

export function ViewToggle({ className }: ViewToggleProps) {
  const pathname = usePathname();
  const isCreateView = pathname === "/" || pathname === "";
  const isListView = pathname === "/radars";

  return (
    <div className={cn("flex items-center bg-background border border-border rounded-xl", className)}>
      <Link href="/" className="relative p-1">
        <button
          className={cn(
            "flex items-center justify-center gap-1.5 px-3 py-1.5 m-px transition-all duration-300 rounded-lg text-sm font-medium",
            isCreateView
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          aria-label="New radar"
        >
          <Plus className="w-3.5 h-3.5" weight="duotone" />
          <span className="hidden sm:inline">new radar</span>
        </button>
      </Link>
      <Link href="/radars" className="relative pr-1">
        <button
          className={cn(
            "flex items-center justify-center gap-1.5 px-3 py-1.5 m-px transition-all duration-300 rounded-sm text-sm font-medium",
            isListView
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          aria-label="My radars"
        >
          <GridFour className="w-3.5 h-3.5" weight="duotone" />
          <span className="hidden sm:inline">my radars</span>
        </button>
      </Link>
    </div>
  );
}
