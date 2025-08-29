"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Ping {
  id: string;
  content: string;
  sentiment: string;
  confidence?: number;
  createdAt: string;
  model?: string;
  topics?: string[];
}

interface PingsListProps {
  pings: Ping[];
}

export function PingsList({ pings }: PingsListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {pings.map((ping) => (
        <motion.div
          key={ping.id}
          onMouseEnter={() => setHoveredId(ping.id)}
          onMouseLeave={() => setHoveredId(null)}
          initial={false}
          animate={{
            opacity: hoveredId === null || hoveredId === ping.id ? 1 : 0.4,
            scale: hoveredId === ping.id ? 1.01 : 1,
          }}
          transition={{
            opacity: { duration: 0.3 },
            scale: { duration: 0.3 },
          }}
          className={cn(
            "relative group cursor-pointer",
            "transition-all duration-300"
          )}
        >
          <div className={cn(
            "p-4 rounded-lg",
            "border border-border/50",
            "hover:border-border hover:shadow-sm",
            "bg-background"
          )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider",
                  ping.sentiment === 'VERY_POSITIVE' || ping.sentiment === 'POSITIVE' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : ping.sentiment === 'VERY_NEGATIVE' || ping.sentiment === 'NEGATIVE' 
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                )}>
                  {ping.sentiment.toLowerCase().replace('_', ' ')}
                </span>
                {ping.confidence && (
                  <span className="text-xs text-muted-foreground/70">
                    {Math.round(ping.confidence * 100)}% confident
                  </span>
                )}
              </div>
              <time className="text-xs text-muted-foreground/70">
                {formatDistanceToNow(new Date(ping.createdAt), { addSuffix: true })}
              </time>
            </div>

            {/* Content */}
            <p className="text-sm leading-relaxed text-foreground/90 mb-3">
              {ping.content}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground/60">
                {ping.model || 'ai agent'}
              </p>
              {ping.topics && ping.topics.length > 0 && (
                <div className="flex gap-1">
                  {ping.topics.slice(0, 3).map((topic, i) => (
                    <span 
                      key={i}
                      className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-[10px]"
                    >
                      {topic.toLowerCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}