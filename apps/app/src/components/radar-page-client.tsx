"use client";

import { useState } from "react";
import localFont from 'next/font/local';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/design/components/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { RadarsList } from "./radars-list";
import { cn } from "@/lib/utils";

const brett = localFont({
  src: '../../../../public/fonts/brett/BrettTrial-Regular.otf',
  display: 'swap',
  variable: '--font-brett',
  weight: '400'
});

interface RadarPageClientProps {
  userId: string;
}

export function RadarPageClient({ userId }: RadarPageClientProps) {
  const [filter, setFilter] = useState<"active" | "archived">("active");

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={cn(brett.className, "text-2xl tracking-tight text-foreground mb-1")}>my radars</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-background text-foreground border border-border rounded-md hover:bg-accent">
              {filter === "active" ? "Active" : "Archived"}
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-black text-white">
            <DropdownMenuItem onSelect={() => setFilter("active")}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setFilter("archived")}>
              Archived
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <RadarsList initialRadars={[]} userId={userId} filter={filter} />
    </>
  );
}