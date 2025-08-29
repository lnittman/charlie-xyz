"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useSetAtom } from "jotai";
import { isMobileMenuOpenAtom } from "@/atoms";

interface MobileSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: "top" | "bottom";
  spacing?: "sm" | "md" | "lg";
  height?: "auto" | "fill" | "full";
  showHandle?: boolean;
  title?: string;
  showHeader?: boolean;
}

const spacingMap = {
  sm: "16px",
  md: "20px", 
  lg: "24px"
};

const heightMap = {
  auto: "auto",
  fill: "65vh",
  full: "calc(100vh - var(--spacing) * 2)"
};

export function MobileSheet({
  open,
  onClose,
  children,
  className,
  position = "bottom",
  spacing = "md",
  height = "auto",
  showHandle = true,
  title,
  showHeader = false
}: MobileSheetProps) {
  const setIsMobileMenuOpen = useSetAtom(isMobileMenuOpenAtom);

  // Update global mobile menu state
  useEffect(() => {
    setIsMobileMenuOpen(open);
  }, [open, setIsMobileMenuOpen]);

  // Close on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        onClose();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const spacingValue = spacingMap[spacing];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/20 z-[68]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{
              [position]: `-100%`,
              opacity: 0
            }}
            animate={{
              [position]: spacingValue,
              opacity: 1
            }}
            exit={{
              [position]: `-100%`,
              opacity: 0
            }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300
            }}
            style={{
              ["--spacing" as any]: spacingValue,
              height: heightMap[height],
              maxHeight: "85vh"
            }}
            className={cn(
              "fixed left-4 right-4 bg-background z-[69]",
              "rounded-2xl shadow-xl border",
              "overflow-hidden",
              position === "bottom" ? "bottom-0" : "top-0",
              className
            )}
          >
            {/* Handle bar for bottom sheets */}
            {showHandle && position === "bottom" && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 rounded-full bg-muted-foreground/20" />
              </div>
            )}

            {/* Header */}
            {showHeader && (
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="text-lg font-medium">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" weight="duotone" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto h-full">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}