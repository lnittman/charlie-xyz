import { cache } from "react";

export type SuggestionTile = {
  id: string;
  title: string;
  emoji?: string;
  category?: string;
  trending?: boolean;
  trendingChange?: number;
};

// Default suggestions that don't require DB queries
const DEFAULT_SUGGESTIONS: SuggestionTile[] = [
  { id: "1", title: "AI and Technology", emoji: "🤖", category: "technology" },
  { id: "2", title: "Climate Change", emoji: "🌍", category: "environment" },
  { id: "3", title: "Politics and Elections", emoji: "🗳️", category: "politics" },
  { id: "4", title: "Stock Market", emoji: "📈", category: "finance" },
  { id: "5", title: "Health and Wellness", emoji: "💪", category: "health" },
  { id: "6", title: "Entertainment News", emoji: "🎬", category: "entertainment" },
];

export const getSuggestions = cache(async (userId?: string) => {
  // For now, return default suggestions
  // Later we can implement personalization without heavy queries
  return DEFAULT_SUGGESTIONS;
});