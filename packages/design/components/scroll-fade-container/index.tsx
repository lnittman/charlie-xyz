"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@repo/design/lib/utils";

export interface ScrollFadeContainerProps {
  children: React.ReactNode;
  direction?: "horizontal" | "vertical";
  fadeSize?: "sm" | "md" | "lg";
  className?: string;
  showIndicators?: boolean;
  fadeColor?: string; // For custom fade colors
}

const FADE_SIZES = {
  sm: "40px",
  md: "80px", 
  lg: "120px",
} as const;

export function ScrollFadeContainer({
  children,
  direction = "horizontal",
  fadeSize = "md",
  className,
  showIndicators = false,
  fadeColor,
}: ScrollFadeContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showStartFade, setShowStartFade] = useState(false);
  const [showEndFade, setShowEndFade] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = scrollRef.current;
    
    if (direction === "horizontal") {
      setShowStartFade(scrollLeft > 0);
      setShowEndFade(scrollLeft < scrollWidth - clientWidth - 1);
    } else {
      setShowStartFade(scrollTop > 0);
      setShowEndFade(scrollTop < scrollHeight - clientHeight - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    const scrollElement = scrollRef.current;
    
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      
      // Check on mount after a small delay to ensure proper layout
      setTimeout(checkScroll, 100);
      
      return () => {
        scrollElement.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [direction]);

  const fadeWidth = FADE_SIZES[fadeSize];
  const isHorizontal = direction === "horizontal";

  return (
    <div className={cn("relative", className)}>
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className={cn(
          "w-full h-full",
          isHorizontal ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto overflow-x-hidden",
          "scrollbar-hide" // Hide scrollbar by default
        )}
      >
        {children}
      </div>

      {/* Start fade */}
      <div
        className={cn(
          "absolute pointer-events-none transition-opacity duration-300",
          isHorizontal ? "top-0 left-0 h-full" : "top-0 left-0 w-full",
          showStartFade ? "opacity-100" : "opacity-0"
        )}
        style={{
          [isHorizontal ? "width" : "height"]: fadeWidth,
          background: isHorizontal
            ? `linear-gradient(to right, ${fadeColor || "rgb(var(--background))"}, transparent)`
            : `linear-gradient(to bottom, ${fadeColor || "rgb(var(--background))"}, transparent)`,
        }}
      />

      {/* End fade */}
      <div
        className={cn(
          "absolute pointer-events-none transition-opacity duration-300",
          isHorizontal ? "top-0 right-0 h-full" : "bottom-0 left-0 w-full",
          showEndFade ? "opacity-100" : "opacity-0"
        )}
        style={{
          [isHorizontal ? "width" : "height"]: fadeWidth,
          background: isHorizontal
            ? `linear-gradient(to left, ${fadeColor || "rgb(var(--background))"}, transparent)`
            : `linear-gradient(to top, ${fadeColor || "rgb(var(--background))"}, transparent)`,
        }}
      />

      {/* Optional scroll indicators */}
      {showIndicators && (
        <>
          {showStartFade && (
            <div
              className={cn(
                "absolute",
                isHorizontal ? "left-2 top-1/2 -translate-y-1/2" : "top-2 left-1/2 -translate-x-1/2"
              )}
            >
              <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
            </div>
          )}
          {showEndFade && (
            <div
              className={cn(
                "absolute",
                isHorizontal ? "right-2 top-1/2 -translate-y-1/2" : "bottom-2 left-1/2 -translate-x-1/2"
              )}
            >
              <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Add CSS for hiding scrollbar
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = scrollbarHideStyles;
  document.head.appendChild(styleElement);
}

ScrollFadeContainer.displayName = "ScrollFadeContainer";