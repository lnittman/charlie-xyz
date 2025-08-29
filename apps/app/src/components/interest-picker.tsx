"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Pill } from "@repo/design/components/pill";
import { Button } from "@repo/design/components/button";
import { Check } from "lucide-react";

export interface InterestCategory {
  id: string;
  label: string;
  emoji: string;
  interests: Interest[];
}

export interface Interest {
  id: string;
  label: string;
  emoji: string;
}

const interestCategories: InterestCategory[] = [
  {
    id: "tech",
    label: "Technology",
    emoji: "💻",
    interests: [
      { id: "ai", label: "AI & Machine Learning", emoji: "🤖" },
      { id: "coding", label: "Programming", emoji: "👨‍💻" },
      { id: "startups", label: "Startups", emoji: "🚀" },
      { id: "gadgets", label: "Gadgets", emoji: "📱" },
      { id: "crypto", label: "Crypto & Web3", emoji: "₿" },
      { id: "cybersecurity", label: "Security", emoji: "🔐" }
    ]
  },
  {
    id: "entertainment",
    label: "Entertainment",
    emoji: "🎬",
    interests: [
      { id: "movies", label: "Movies & TV", emoji: "🎬" },
      { id: "music", label: "Music", emoji: "🎵" },
      { id: "gaming", label: "Gaming", emoji: "🎮" },
      { id: "books", label: "Books", emoji: "📚" },
      { id: "podcasts", label: "Podcasts", emoji: "🎙️" },
      { id: "art", label: "Art & Design", emoji: "🎨" }
    ]
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    emoji: "🌟",
    interests: [
      { id: "fitness", label: "Fitness", emoji: "💪" },
      { id: "food", label: "Food & Cooking", emoji: "🍳" },
      { id: "travel", label: "Travel", emoji: "✈️" },
      { id: "fashion", label: "Fashion", emoji: "👗" },
      { id: "wellness", label: "Health & Wellness", emoji: "🧘" },
      { id: "home", label: "Home & Garden", emoji: "🏡" }
    ]
  },
  {
    id: "business",
    label: "Business",
    emoji: "💼",
    interests: [
      { id: "finance", label: "Finance", emoji: "📈" },
      { id: "investing", label: "Investing", emoji: "💰" },
      { id: "real-estate", label: "Real Estate", emoji: "🏢" },
      { id: "entrepreneurship", label: "Entrepreneurship", emoji: "💡" },
      { id: "marketing", label: "Marketing", emoji: "📢" },
      { id: "careers", label: "Career Development", emoji: "📊" }
    ]
  },
  {
    id: "sports",
    label: "Sports",
    emoji: "⚽",
    interests: [
      { id: "football", label: "Football", emoji: "⚽" },
      { id: "basketball", label: "Basketball", emoji: "🏀" },
      { id: "baseball", label: "Baseball", emoji: "⚾" },
      { id: "tennis", label: "Tennis", emoji: "🎾" },
      { id: "f1", label: "Formula 1", emoji: "🏎️" },
      { id: "olympics", label: "Olympics", emoji: "🏅" }
    ]
  },
  {
    id: "news",
    label: "News & Current Events",
    emoji: "📰",
    interests: [
      { id: "politics", label: "Politics", emoji: "🏛️" },
      { id: "science", label: "Science", emoji: "🔬" },
      { id: "environment", label: "Environment", emoji: "🌍" },
      { id: "social", label: "Social Issues", emoji: "🤝" },
      { id: "local", label: "Local News", emoji: "📍" },
      { id: "world", label: "World News", emoji: "🌏" }
    ]
  }
];

interface InterestPickerProps {
  selectedInterests?: string[];
  onInterestsChange: (interests: string[]) => void;
  className?: string;
  minimal?: boolean;
}

export function InterestPicker({ 
  selectedInterests = [], 
  onInterestsChange,
  className,
  minimal = false
}: InterestPickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedInterests));
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleInterest = (interestId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(interestId)) {
      newSelected.delete(interestId);
    } else {
      newSelected.add(interestId);
    }
    setSelected(newSelected);
    onInterestsChange(Array.from(newSelected));
  };

  const toggleCategory = (categoryId: string) => {
    setActiveCategory(activeCategory === categoryId ? null : categoryId);
  };

  if (minimal) {
    // Minimal version for settings page
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex flex-wrap gap-2">
          {interestCategories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => toggleCategory(category.id)}
              className="h-8"
            >
              <span className="mr-1.5">{category.emoji}</span>
              {category.label}
            </Button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeCategory && (
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-2">
                {interestCategories
                  .find(c => c.id === activeCategory)
                  ?.interests.map((interest) => (
                    <Pill
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      variant={selected.has(interest.id) ? "default" : "secondary"}
                      className={cn(
                        "cursor-pointer transition-all",
                        selected.has(interest.id) && "shadow-sm"
                      )}
                    >
                      <span className="mr-1.5">{interest.emoji}</span>
                      {interest.label}
                      {selected.has(interest.id) && (
                        <Check className="w-3 h-3 ml-1" />
                      )}
                    </Pill>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full version for onboarding
  return (
    <div className={cn("space-y-6", className)}>
      {interestCategories.map((category, categoryIndex) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: categoryIndex * 0.05 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span>{category.emoji}</span>
            {category.label}
          </h3>
          
          <div 
            className={cn(
              "flex flex-wrap gap-2",
              categoryIndex % 2 === 1 && "ml-4" // Offset every other category
            )}
          >
            {category.interests.map((interest) => (
              <motion.div
                key={interest.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Pill
                  onClick={() => toggleInterest(interest.id)}
                  variant={selected.has(interest.id) ? "default" : "secondary"}
                  className={cn(
                    "cursor-pointer transition-all",
                    "hover:shadow-sm hover:border-foreground/20",
                    selected.has(interest.id) && "shadow-sm"
                  )}
                >
                  <span className="mr-1.5">{interest.emoji}</span>
                  {interest.label}
                  {selected.has(interest.id) && (
                    <Check className="w-3 h-3 ml-1" />
                  )}
                </Pill>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}