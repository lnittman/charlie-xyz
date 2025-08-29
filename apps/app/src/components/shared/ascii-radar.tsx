"use client";

import { useEffect, useState } from 'react';

export function AsciiRadar() {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % 4);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const frames = [
    `     ╭───────────╮
    ╱             ╲
   ╱       ●       ╲
  │                 │
  │        │        │
  │   ─────●─────   │
  │        │        │
  │                 │
   ╲       ●       ╱
    ╲             ╱
     ╰───────────╯`,
    `     ╭───────────╮
    ╱             ╲
   ╱   ●       ●   ╲
  │     ╲     ╱     │
  │      ╲   ╱      │
  │   ────●────     │
  │      ╱   ╲      │
  │     ╱     ╲     │
   ╲   ●       ●   ╱
    ╲             ╱
     ╰───────────╯`,
    `     ╭───────────╮
    ╱             ╲
   ╱ ●     ●     ● ╲
  │   ╲    │    ╱   │
  │    ╲   │   ╱    │
  │   ───●───●───   │
  │    ╱   │   ╲    │
  │   ╱    │    ╲   │
   ╲ ●     ●     ● ╱
    ╲             ╱
     ╰───────────╯`,
    `     ╭───────────╮
    ╱             ╲
   ╱●      ●      ●╲
  │ ╲      │      ╱ │
  │  ╲     │     ╱  │
  │ ───●───●───●─── │
  │  ╱     │     ╲  │
  │ ╱      │      ╲ │
   ╲●      ●      ●╱
    ╲             ╱
     ╰───────────╯`
  ];

  return (
    <div className="relative">
      <pre className="text-xs md:text-sm font-mono text-muted-foreground/60 select-none transition-opacity duration-500">
        {frames[frame]}
      </pre>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-foreground/80 rounded-full animate-pulse" />
      </div>
    </div>
  );
}