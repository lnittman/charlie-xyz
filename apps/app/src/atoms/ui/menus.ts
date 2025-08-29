import { atom } from "jotai";

// Mobile menu state atoms
export const mobileUserMenuOpenAtom = atom(false);

// Global mobile menu session state - used for blur overlay
export const isMobileMenuOpenAtom = atom(false);

// Other mobile menu states that will be needed
export const mobileNotificationsOpenAtom = atom(false);
export const mobileRadarsOpenAtom = atom(false);
export const mobileSettingsOpenAtom = atom(false);

// Data atoms for mobile menus
export const mobileRadarActionRadarAtom = atom<{ id: string; query: string } | null>(null);

// Callback atoms
export const mobileRadarActionCallbackAtom = atom<((action: string) => void) | null>(null);

// Hook for smooth transitions between mobile menus
export const useMobileMenuTransition = () => {
  // Implementation will handle smooth transitions between menus
  return {
    transition: async (fromAtom: any, toAtom: any, callback?: () => void) => {
      // Close current menu, wait for animation, open new menu
      // This ensures smooth transitions without jarring overlaps
    }
  };
};