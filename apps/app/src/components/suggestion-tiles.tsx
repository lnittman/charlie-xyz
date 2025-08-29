"use client";

import { motion } from "framer-motion";
import { TrendingUp, Zap, Eye, Hash, Sparkles, Globe, Brain, Shield } from "lucide-react";
import { ScrollFadeContainer } from "@repo/design/components/scroll-fade-container";
import { cn } from "@repo/design/lib/utils";

export interface SuggestionTile {
  id: string;
  title: string;
  category?: string;
  icon?: React.ReactNode;
  trending?: boolean;
  trendingChange?: number;
}

export interface SuggestionTilesProps {
  suggestions: SuggestionTile[];
  onSelect: (suggestion: SuggestionTile) => void;
  className?: string;
}

// Default icons for different categories
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  technology: <Brain className="w-4 h-4" />,
  trending: <TrendingUp className="w-4 h-4" />,
  science: <Zap className="w-4 h-4" />,
  global: <Globe className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  popular: <Eye className="w-4 h-4" />,
  default: <Sparkles className="w-4 h-4" />,
};

export function SuggestionTiles({ suggestions, onSelect, className }: SuggestionTilesProps) {
  if (!suggestions.length) return null;

  return (
    <div className={cn("w-full", className)}>
      <ScrollFadeContainer 
        direction="horizontal" 
        fadeSize="lg"
        className="relative"
      >
        <div className="flex gap-3 px-1 py-2">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: index * 0.05,
                duration: 0.3,
                ease: "easeOut"
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(suggestion)}
              className={cn(
                "group relative flex-none",
                "min-w-[200px] px-4 py-3",
                "bg-stone-50 dark:bg-stone-900",
                "border border-stone-200 dark:border-stone-800",
                "rounded-xl overflow-hidden",
                "hover:border-stone-300 dark:hover:border-stone-700",
                "hover:shadow-md dark:hover:shadow-stone-900/50",
                "transition-all duration-300"
              )}
              style={{
                // Create offset grid effect
                marginTop: index % 2 === 1 ? "20px" : "0",
              }}
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-stone-100/50 to-transparent dark:from-stone-800/50" />
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-start gap-2">
                {/* Header with icon and category */}
                <div className="flex items-center gap-2 w-full">
                  <div className="text-stone-400 dark:text-stone-600">
                    {suggestion.icon || CATEGORY_ICONS[suggestion.category || "default"]}
                  </div>
                  {suggestion.category && (
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-500 uppercase tracking-wide">
                      {suggestion.category}
                    </span>
                  )}
                  {suggestion.trending && (
                    <div className="ml-auto flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-500" />
                      {suggestion.trendingChange && (
                        <span className="text-xs font-medium text-green-600 dark:text-green-500">
                          +{suggestion.trendingChange}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-sm font-medium text-stone-900 dark:text-stone-50 text-left line-clamp-2">
                  {suggestion.title}
                </h3>

                {/* Hover indicator */}
                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
                    <Hash className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </ScrollFadeContainer>
    </div>
  );
}