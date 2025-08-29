"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkle } from "@phosphor-icons/react";
import { cn } from "@repo/design/lib/utils";
import { Kbd, KbdKey } from "@repo/design/components/kbd";

interface CreateRadarButtonProps {
  className?: string;
  variant?: "default" | "compact";
}

export function CreateRadarButton({ className, variant = "default" }: CreateRadarButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push("/");
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          "border border-border hover:border-foreground/20 hover:bg-accent",
          "text-muted-foreground hover:text-foreground transition-all duration-300",
          "focus:outline-none select-none",
          className
        )}
        title="Create new radar"
      >
        <Plus size={16} weight="bold" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex h-8 items-center gap-2 px-3 py-1.5 text-sm font-medium",
        "text-muted-foreground hover:text-foreground transition-all duration-300",
        "rounded-md border border-border hover:border-foreground/20 hover:bg-accent",
        "focus:outline-none select-none",
        "group",
        className
      )}
    >
      <Sparkle 
        size={16} 
        weight="duotone" 
        className="transition-transform duration-300 group-hover:rotate-12" 
      />
      <span className="hidden sm:inline">Create Radar</span>
      <span className="sm:hidden">New</span>
      <Kbd className="hidden lg:inline-flex ml-1">
        <KbdKey>⌘</KbdKey>
        <KbdKey>K</KbdKey>
      </Kbd>
    </button>
  );
}