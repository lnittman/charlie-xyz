"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";

// Mock data - replace with actual API call
const trendingTopics = [
  { topic: "AI Ethics", growth: 24, direction: "up" as const },
  { topic: "Climate Tech", growth: 18, direction: "up" as const },
  { topic: "Remote Work", growth: -5, direction: "down" as const },
  { topic: "Crypto Regulation", growth: 12, direction: "up" as const },
  { topic: "Mental Health", growth: 9, direction: "up" as const },
];

export function TrendingTopics() {
  return (
    <div className="space-y-2">
      {trendingTopics.map((trend, index) => (
        <Link
          key={index}
          href={`/trends/${encodeURIComponent(trend.topic.toLowerCase().replace(' ', '-'))}`}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors group"
        >
          <span className="text-sm font-medium group-hover:text-stone-900 dark:group-hover:text-stone-50 transition-colors">
            {trend.topic}
          </span>
          <div className={`flex items-center gap-1 text-sm ${
            trend.direction === "up" 
              ? "text-green-600 dark:text-green-400" 
              : "text-red-600 dark:text-red-400"
          }`}>
            {trend.direction === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="font-medium">{Math.abs(trend.growth)}%</span>
          </div>
        </Link>
      ))}
    </div>
  );
}