"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import "./marquee-styles.css";

interface SuggestionPill {
  id: string;
  title: string;
  emoji?: string;
  category?: string;
}

interface SuggestionOffsetMarqueeProps {
  suggestions: SuggestionPill[];
  onSelect: (suggestion: SuggestionPill) => void;
  className?: string;
}

// Map of categories to emojis
const categoryEmojis: Record<string, string> = {
  trending: "🔥",
  popular: "⭐",
  suggested: "💡",
  tech: "💻",
  sports: "⚽",
  entertainment: "🎬",
  finance: "💰",
  health: "🏃",
  food: "🍔",
  travel: "✈️",
  news: "📰",
  music: "🎵",
  gaming: "🎮",
  shopping: "🛍️",
  weather: "🌤️",
  default: "🔍"
};

function getEmojiForSuggestion(suggestion: SuggestionPill): string {
  if (suggestion.emoji) return suggestion.emoji;

  const title = suggestion.title.toLowerCase();

  // Content-based emoji selection
  if (title.includes("ai") || title.includes("tech") || title.includes("coding")) return "🤖";
  if (title.includes("funding") || title.includes("price") || title.includes("$")) return "💰";
  if (title.includes("goal") || title.includes("bayern") || title.includes("sport")) return "⚽";
  if (title.includes("office") || title.includes("work") || title.includes("careers")) return "💼";
  if (title.includes("headphones") || title.includes("music") || title.includes("artist")) return "🎧";
  if (title.includes("release") || title.includes("new")) return "🆕";
  if (title.includes("availability") || title.includes("bardeen")) return "📅";
  if (title.includes("anthropic") || title.includes("gemini") || title.includes("xai")) return "🧠";

  // Category-based fallback
  if (suggestion.category) {
    return categoryEmojis[suggestion.category] || categoryEmojis.default;
  }

  return categoryEmojis.default;
}

export function SuggestionOffsetMarquee({
  suggestions,
  onSelect,
  className
}: SuggestionOffsetMarqueeProps) {
  // Create two rows with offset
  const halfLength = Math.ceil(suggestions.length / 2);
  const row1 = suggestions.slice(0, halfLength);
  const row2 = suggestions.slice(halfLength);

  // Duplicate for seamless loop
  const row1Duplicated = [...row1, ...row1];
  const row2Duplicated = [...row2, ...row2];

  const renderPill = (suggestion: SuggestionPill, index: number) => (
    <motion.button
      key={`${suggestion.id}-${index}`}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(suggestion)}
      className={cn(
        "group flex items-stretch overflow-hidden flex-shrink-0",
        "h-12 rounded-xl border border-border",
        "bg-background hover:bg-accent/50",
        "transition-all duration-300",
        "hover:shadow-sm hover:border-foreground/20",
        "mx-2"
      )}
    >
      {/* Emoji section */}
      <div className={cn(
        "flex items-center justify-center px-3",
        "bg-muted/50 border-r border-border",
        "group-hover:bg-muted transition-colors"
      )}>
        <span className="text-lg">
          {getEmojiForSuggestion(suggestion)}
        </span>
      </div>

      {/* Text section */}
      <div className="flex items-center px-4">
        <span className="text-sm font-medium text-foreground/90 whitespace-nowrap">
          {suggestion.title}
        </span>
      </div>
    </motion.button>
  );

  return (
    <div className={cn("relative overflow-hidden max-h-32", className)}>
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Marquee content */}
      <div className="space-y-3 py-2">
        {/* Row 1 */}
        <div className="marquee-container">
          <div className="marquee-content marquee-scroll-1">
            {row1Duplicated.map((suggestion, index) => renderPill(suggestion, index))}
          </div>
        </div>

        {/* Row 2 with offset */}
        <div className="marquee-container">
          <div className="marquee-content marquee-scroll-2 ml-16">
            {row2Duplicated.map((suggestion, index) => renderPill(suggestion, index))}
          </div>
        </div>
      </div>
    </div>
  );
}
