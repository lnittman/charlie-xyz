"use client";

import React, { useState, useEffect } from "react";
import { Moon, Sun, Desktop } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Tabs, TabsList, TabsTrigger } from "@repo/design";
import { cn } from "@repo/design";

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before showing theme to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use system as default if theme is not yet loaded
  const currentTheme = mounted ? (theme || 'system') : 'system';

  if (!mounted) {
    return (
      <div className="w-[116px] h-9 bg-muted/30 rounded-md" />
    );
  }

  return (
    <Tabs
      value={currentTheme}
      onValueChange={setTheme}
      className="flex flex-col"
    >
      <TabsList className="bg-muted/30 w-[116px] h-9 p-1 grid grid-cols-3 gap-1 rounded-md">
        <TabsTrigger
          value="light"
          className="h-full w-full transition-all duration-300 hover:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm"
        >
          <Sun
            weight="duotone"
            className={cn(
              "h-4 w-4 transition-colors",
              currentTheme === 'light' ? "text-foreground" : "text-muted-foreground"
            )}
          />
        </TabsTrigger>
        <TabsTrigger
          value="dark"
          className="h-full w-full transition-all duration-300 hover:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm"
        >
          <Moon
            weight="duotone"
            className={cn(
              "h-4 w-4 transition-colors",
              currentTheme === 'dark' ? "text-foreground" : "text-muted-foreground"
            )}
          />
        </TabsTrigger>
        <TabsTrigger
          value="system"
          className="h-full w-full transition-all duration-300 hover:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm"
        >
          <Desktop
            weight="duotone"
            className={cn(
              "h-4 w-4 transition-colors",
              currentTheme === 'system' ? "text-foreground" : "text-muted-foreground"
            )}
          />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}