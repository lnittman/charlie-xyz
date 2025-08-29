'use client';

import { TextScrambleRotate } from './text-scramble';

interface HeroTextProps {
  className?: string;
}

export function HeroText({ className }: HeroTextProps) {
  // Radar-like words
  const radarWords = [
    'radars',
    'monitors',
    'scanners',
    'watchers',
    'trackers',
    'sensors'
  ];

  // Nouns for what we generate
  const nouns = [
    'insights',
    'updates',
    'signals',
    'patterns',
    'discoveries',
    'pings',
    'alerts',
    'intelligence',
    'reports',
    'trends'
  ];

  // Verbs for actions
  const verbs = [
    'track',
    'monitor',
    'explore',
    'discover',
    'research',
    'analyze',
    'investigate',
    'observe',
    'follow',
    'watch'
  ];

  return (
    <div className={className}>
      <TextScrambleRotate 
        words={radarWords}
        className="text-gradient"
        duration={0.8}
        interval={4000}
      />
      <span> generate </span>
      <TextScrambleRotate 
        words={nouns}
        className="text-gradient"
        duration={0.8}
        interval={3000}
      />
      <span> for whatever you can </span>
      <TextScrambleRotate 
        words={verbs}
        className="text-gradient"
        duration={0.8}
        interval={3500}
      />
    </div>
  );
}