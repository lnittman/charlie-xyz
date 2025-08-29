
"use client";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { isMobileMenuOpenAtom } from "@/atoms";

// Mobile overlays
import { MobileUserMenuOverlay } from "./mobile-user-menu-overlay";
import { UnifiedBlurOverlay } from "./unified-blur-overlay";
import { FeedbackSheet } from "./feedback-sheet";

// Modals - we'll add these as we implement them
// import { DeleteRadarModal } from "./delete-radar-modal";
// import { ShareRadarModal } from "./share-radar-modal";
// import { SearchModal } from "./search-modal";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const [isMobileMenuOpen] = useAtom(isMobileMenuOpenAtom);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Will implement search modal
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {children}

      {/* Unified blur overlay - shows for all modals/menus */}
      <UnifiedBlurOverlay />

      {/* Mobile overlays */}
      <MobileUserMenuOverlay />

      {/* Desktop modals - hidden on mobile */}
      <div className="hidden md:block">
        {/* Desktop-only modals will go here */}
      </div>

      {/* Mobile sheets - hidden on desktop */}
      <div className="md:hidden">
        {/* Mobile-only sheets will go here */}
      </div>

      {/* Global modals that work on both */}
      <FeedbackSheet />
      {/* <CreateRadarModal /> */}
      {/* <DeleteRadarModal /> */}
      {/* <ShareRadarModal /> */}
      {/* <SearchModal /> */}
    </>
  );
}
