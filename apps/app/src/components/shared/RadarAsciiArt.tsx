'use client';

import { cn } from '@/lib/utils';

interface RadarAsciiArtProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function RadarAsciiArt({ className, variant = 'default' }: RadarAsciiArtProps) {
  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          "select-none font-mono text-xs leading-none opacity-20 dark:opacity-10",
          "hover:opacity-30 dark:hover:opacity-20 transition-opacity duration-300",
          className
        )}
        aria-hidden="true"
      >
        <pre className="whitespace-pre">
{`     ◐ ◑ ◒ ◓
  ○ · · · · ○
 · · ◉ ◉ · ·
· · ◉ ● ◉ · ·
 · · ◉ ◉ · ·
  ○ · · · · ○
     ◓ ◒ ◑ ◐`}
        </pre>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "select-none font-mono text-sm leading-none opacity-20 dark:opacity-10",
        "hover:opacity-30 dark:hover:opacity-20 transition-opacity duration-300",
        className
      )}
      aria-hidden="true"
    >
      <pre className="whitespace-pre radar-sweep">
{`         ◐ ◑ ◒ ◓ ◔ ◕
      ○ · · · · · · ○
    ○ · · · · · · · · ○
   · · · ◉ · · ◉ · · ·
  · · · · · ◉ · · · · ·
 · · · · ◉ ● ◉ · · · ·
  · · · · · ◉ · · · · ·
   · · · ◉ · · ◉ · · ·
    ○ · · · · · · · · ○
      ○ · · · · · · ○
         ◕ ◔ ◓ ◒ ◑ ◐`}
      </pre>
    </div>
  );
}