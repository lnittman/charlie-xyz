"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface DotGridProps {
  rows?: number;
  cols?: number;
  dotSize?: number;
  gap?: number;
  className?: string;
  dotClassName?: string;
  activeDots?: number[];
  animation?: "pulse" | "wave" | "ripple" | "random" | "none";
  animationDelay?: number;
  animationDuration?: number;
  dotColor?: string;
  activeColor?: string;
  isActive?: boolean;
}

const dotVariants: Variants = {
  inactive: {
    scale: 1,
    opacity: 0.3,
  },
  active: {
    scale: 1.2,
    opacity: 1,
  },
  pulse: {
    scale: [1, 1.3, 1],
    opacity: [0.3, 1, 0.3],
  },
};

export function DotGrid({
  rows = 3,
  cols = 3,
  dotSize = 4,
  gap = 8,
  className,
  dotClassName,
  activeDots = [],
  animation = "none",
  animationDelay = 0.05,
  animationDuration = 0.3,
  dotColor = "currentColor",
  activeColor = "currentColor",
}: DotGridProps) {
  const totalDots = rows * cols;

  const getAnimationDelay = (index: number) => {
    if (animation === "none") return 0;
    
    const row = Math.floor(index / cols);
    const col = index % cols;

    switch (animation) {
      case "wave":
        return (row + col) * animationDelay;
      case "ripple":
        const centerRow = Math.floor(rows / 2);
        const centerCol = Math.floor(cols / 2);
        const distance = Math.sqrt(
          Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
        );
        return distance * animationDelay;
      case "random":
        return Math.random() * animationDelay * totalDots;
      case "pulse":
      default:
        return index * animationDelay;
    }
  };

  const isActive = (index: number) => activeDots.includes(index);

  return (
    <div
      className={cn("inline-flex", className)}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${dotSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${dotSize}px)`,
        gap: `${gap}px`,
      }}
    >
      {Array.from({ length: totalDots }).map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            "rounded-full",
            dotClassName
          )}
          style={{
            width: `${dotSize}px`,
            height: `${dotSize}px`,
            backgroundColor: isActive(index) ? activeColor : dotColor,
          }}
          initial="inactive"
          animate={animation !== "none" ? "pulse" : isActive(index) ? "active" : "inactive"}
          variants={dotVariants}
          transition={{
            duration: animationDuration,
            delay: getAnimationDelay(index),
            repeat: animation !== "none" ? Infinity : 0,
            repeatType: "reverse",
          }}
        />
      ))}
    </div>
  );
}

// Preset dot grid icons
export function CreateDotGrid({ className, ...props }: Omit<DotGridProps, "activeDots">) {
  // Pattern for a "plus" or "create" icon
  const activeDots = [1, 3, 4, 5, 7]; // Forms a plus sign in 3x3 grid
  
  return (
    <DotGrid
      rows={3}
      cols={3}
      dotSize={3}
      gap={2}
      activeDots={activeDots}
      animation="pulse"
      animationDelay={0.05}
      className={className}
      {...props}
    />
  );
}

export function ListDotGrid({ className, ...props }: Omit<DotGridProps, "activeDots">) {
  // Pattern for a "grid" or "list" icon
  const activeDots = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // All dots active
  
  return (
    <DotGrid
      rows={3}
      cols={3}
      dotSize={3}
      gap={2}
      activeDots={activeDots}
      animation="wave"
      animationDelay={0.03}
      className={className}
      {...props}
    />
  );
}

export function ActiveDotGrid({ className, ...props }: Omit<DotGridProps, "activeDots">) {
  // Pattern for "active" or "radar" icon - circular pattern
  const activeDots = [1, 3, 4, 5, 7]; // Forms a diamond/radar pattern
  
  return (
    <DotGrid
      rows={3}
      cols={3}
      dotSize={3}
      gap={2}
      activeDots={activeDots}
      animation="ripple"
      animationDelay={0.1}
      className={className}
      {...props}
    />
  );
}