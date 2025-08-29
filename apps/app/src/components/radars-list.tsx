"use client";

import { useState } from "react";
import { Archive, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@repo/design/components/badge";
import { Button } from "@repo/design/components/button";
import { Status } from "@repo/design/components/status";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Trash2, Pause, Play, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design/components/dropdown-menu";
import { useRadarList, type Radar } from "@/hooks/use-radar";

interface RadarsListProps {
  initialRadars: Radar[];
  userId: string;
  filter?: "active" | "archived";
}

export function RadarsList({ initialRadars, userId, filter = "active" }: RadarsListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  // Use Convex hook - convert filter to status
  const status = filter === "active" ? "ACTIVE" : filter === "archived" ? "ARCHIVED" : undefined;
  const { radars: convexRadars, isLoading } = useRadarList(status);
  const radars = !isLoading && convexRadars.length > 0 ? convexRadars : initialRadars;

  const filteredRadars = radars;

  const getPollIntervalLabel = (interval: string) => {
    const labels: Record<string, string> = {
      HOURLY: "every hour",
      DAILY: "daily",
      TWICE_DAILY: "twice daily",
      WEEKLY: "weekly",
      MONTHLY: "monthly",
    };
    return labels[interval] || interval;
  };

  const getTrendDirection = (trends?: Array<{ direction: string }>) => {
    if (!trends || trends.length === 0) return null;
    const latest = trends[0];
    return latest.direction;
  };

  if (filteredRadars.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 16rem)' }}>
        <div className="text-center">
          {filter === "active" ? (
            <svg className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 11.25h3M3.75 7.5h16.5" />
            </svg>
          ) : (
            <Archive weight="duotone" className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          )}
          <p className="text-muted-foreground">
            {filter === "active" ? "no active radars" : "no archived radars"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {filteredRadars.map((radar, index) => (
        <Link 
          key={radar._id} 
          href={`/radars/${radar._id}`}
          onMouseEnter={() => setHoveredId(radar._id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <div 
            className={cn(
              "py-6 transition-all duration-300 cursor-pointer group",
              "border-b border-slate-200 dark:border-slate-700",
              index === filteredRadars.length - 1 && "border-b-0",
              hoveredId && hoveredId !== radar._id && "opacity-50"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium group-hover:text-primary transition-all duration-300">
                    {radar.query}
                  </h3>
                  <Status
                    variant={radar.status === "ACTIVE" ? "success" : "secondary"}
                  />
                  {radar.isPublic && (
                    <Badge variant="secondary" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      public
                    </Badge>
                  )}
                </div>
                
                {radar.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {radar.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">0</span>
                    pings
                  </span>
                  <span>•</span>
                  <span>{getPollIntervalLabel(radar.pollInterval)}</span>
                  {radar.lastPolledAt && (
                    <>
                      <span>•</span>
                      {formatDistanceToNow(new Date(radar.lastPolledAt), { addSuffix: true })}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}