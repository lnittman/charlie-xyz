"use client";

import { useState } from "react";
import { CheckCircle, Archive } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

import { RadarsList } from "./radars-list";
import type { Radar } from "@/hooks/use-radar";

interface RadarsListWrapperProps {
  initialRadars: Radar[];
  userId: string;
  fontClassName: string;
}

export function RadarsListWrapper({ initialRadars, userId, fontClassName }: RadarsListWrapperProps) {
  const [filter, setFilter] = useState<"active" | "archived">("active");

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className={`${fontClassName} text-2xl tracking-tight text-foreground mb-1`}>my radars</h1>
            </div>
            <div className="flex items-center bg-background border border-border rounded-xl">
              <div className="relative p-1">
                <button
                  onClick={() => setFilter("active")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-1.5 m-px transition-all duration-300 rounded-lg text-sm font-medium",
                    filter === "active"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <CheckCircle className="w-3.5 h-3.5" weight="duotone" />
                  <span>active</span>
                </button>
              </div>
              <div className="relative pr-1">
                <button
                  onClick={() => setFilter("archived")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-1.5 m-px transition-all duration-300 rounded-lg text-sm font-medium",
                    filter === "archived"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Archive className="w-3.5 h-3.5" weight="duotone" />
                  <span>archived</span>
                </button>
              </div>
            </div>
          </div>

          {/* Radars List */}
          <RadarsList initialRadars={initialRadars} userId={userId} filter={filter} />
        </div>
      </div>
    </div>
  );
}