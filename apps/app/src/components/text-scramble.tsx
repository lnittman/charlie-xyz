'use client';

import React, { useEffect, useRef, useState } from 'react';

interface TextScrambleProps {
  children: string;
  as?: React.ElementType;
  duration?: number;
  speed?: number;
  characterSet?: string;
  className?: string;
  trigger?: boolean;
  onScrambleComplete?: () => void;
}

const DEFAULT_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

export function TextScramble({
  children,
  as: Component = 'span',
  duration = 0.8,
  speed = 0.04,
  characterSet = DEFAULT_CHARACTERS,
  className = '',
  trigger = true,
  onScrambleComplete,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(children);
  const [isScrambling, setIsScrambling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!trigger || isScrambling) return;

    setIsScrambling(true);
    const targetText = children;
    const textLength = targetText.length;
    let currentIndex = 0;
    
    // Clear any existing intervals/timeouts
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Start scrambling effect
    intervalRef.current = setInterval(() => {
      if (currentIndex >= textLength) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(targetText);
        setIsScrambling(false);
        onScrambleComplete?.();
        return;
      }

      // Generate scrambled text
      const scrambled = targetText
        .split('')
        .map((char, index) => {
          if (index < currentIndex) {
            return targetText[index];
          }
          if (char === ' ') return ' ';
          return characterSet[Math.floor(Math.random() * characterSet.length)];
        })
        .join('');

      setDisplayText(scrambled);
      
      // Increment the index based on duration
      if (Math.random() < (speed * 1000) / (duration * 1000 / textLength)) {
        currentIndex++;
      }
    }, speed * 1000);

    // Fallback timeout to ensure completion
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayText(targetText);
      setIsScrambling(false);
      onScrambleComplete?.();
    }, duration * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [children, trigger, duration, speed, characterSet, onScrambleComplete, isScrambling]);

  return React.createElement(Component, { className }, displayText);
}

// Text Scramble with rotating words
interface TextScrambleRotateProps {
  words: string[];
  as?: React.ElementType;
  duration?: number;
  speed?: number;
  characterSet?: string;
  className?: string;
  interval?: number;
}

export function TextScrambleRotate({
  words,
  as: Component = 'span',
  duration = 0.8,
  speed = 0.04,
  characterSet = DEFAULT_CHARACTERS,
  className = '',
  interval = 3000,
}: TextScrambleRotateProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trigger, setTrigger] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
      setTrigger(false);
      setTimeout(() => setTrigger(true), 50);
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    <TextScramble
      as={Component}
      duration={duration}
      speed={speed}
      characterSet={characterSet}
      className={className}
      trigger={trigger}
    >
      {words[currentIndex]}
    </TextScramble>
  );
}