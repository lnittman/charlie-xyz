"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Hash, Zap, Globe, Heart, Brain } from "lucide-react";
import { AISuggestions, AISuggestion } from "@repo/design/components/ai-suggestion";

interface DynamicSuggestionsProps {
  input: string;
  onSelect: (suggestion: string) => void;
}

// Suggestion database with categories and related terms
const suggestionDatabase = [
  { text: "AI sentiment about cryptocurrency", icon: Hash, category: "finance" },
  { text: "Taylor Swift's latest album reviews", icon: Heart, category: "entertainment" },
  { text: "Climate change policy debates", icon: Globe, category: "politics" },
  { text: "Remote work productivity trends", icon: Brain, category: "work" },
  { text: "Electric vehicle market sentiment", icon: Zap, category: "tech" },
  { text: "Mental health awareness campaigns", icon: Heart, category: "health" },
  { text: "Startup funding landscape", icon: TrendingUp, category: "business" },
  { text: "Social media platform migrations", icon: Globe, category: "tech" },
  { text: "Sustainable fashion movements", icon: Heart, category: "lifestyle" },
  { text: "Web3 gaming adoption", icon: Zap, category: "tech" },
];

export function DynamicSuggestions({ input, onSelect }: DynamicSuggestionsProps) {
  const [visibleSuggestions, setVisibleSuggestions] = useState<typeof suggestionDatabase>([]);
  
  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!input || input.length < 2) return [];
    
    const lowerInput = input.toLowerCase();
    return suggestionDatabase
      .filter(s => 
        s.text.toLowerCase().includes(lowerInput) ||
        s.category.toLowerCase().includes(lowerInput)
      )
      .slice(0, 4); // Show max 4 suggestions
  }, [input]);

  // Animate suggestions in with stagger
  useEffect(() => {
    setVisibleSuggestions([]);
    if (filteredSuggestions.length > 0) {
      filteredSuggestions.forEach((suggestion, index) => {
        setTimeout(() => {
          setVisibleSuggestions(prev => [...prev, suggestion]);
        }, index * 50);
      });
    }
  }, [filteredSuggestions]);

  if (!input || input.length < 2) return null;

  return (
    <AnimatePresence>
      {visibleSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mt-3"
        >
          <p className="text-xs font-medium text-muted mb-2">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {visibleSuggestions.map((suggestion, index) => {
              const Icon = suggestion.icon;
              return (
                <motion.div
                  key={suggestion.text}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AISuggestion
                    suggestion={suggestion.text}
                    onClick={() => onSelect(suggestion.text)}
                    className="group"
                    variant="secondary"
                  >
                    <Icon className="w-3 h-3 mr-1.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    {suggestion.text}
                  </AISuggestion>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}