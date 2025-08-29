'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RadarCreate from '@/components/generative-radar-create';
import { HeroText } from '@/components/hero-text';
import type { SuggestionTile } from '@/components/radar-create-flow';

interface HomeContentProps {
  suggestions: SuggestionTile[];
  heroFontClass: string;
}

export function HomeContent({ suggestions, heroFontClass }: HomeContentProps) {
  const [hasInput, setHasInput] = useState(false);

  const handleInputChange = (value: string) => {
    setHasInput(value.trim().length > 0);
  };

  return (
    <>
      {/* Hero text with fade animation */}
      <AnimatePresence mode="wait">
        {!hasInput && (
          <motion.div
            key="hero-text"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ 
              duration: 0.3,
              ease: 'easeInOut'
            }}
            className="text-center mb-12"
          >
            <HeroText className={`${heroFontClass} text-2xl tracking-tight`} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt interface */}
      <RadarCreate 
        trendingTopics={suggestions} 
        heroFontClass={heroFontClass}
        onInputChange={handleInputChange}
      />
    </>
  );
}