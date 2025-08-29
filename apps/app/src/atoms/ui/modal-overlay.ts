import { atom } from "jotai";
import {
  isMobileMenuOpenAtom,
  mobileUserMenuOpenAtom,
  mobileNotificationsOpenAtom,
  mobileRadarsOpenAtom,
  mobileSettingsOpenAtom
} from "./menus";
import {
  createRadarModalOpenAtom,
  deleteRadarModalOpenAtom,
  shareRadarModalOpenAtom,
  searchModalOpenAtom
} from "./modals";
import { showOnboardingModalAtom } from "./onboarding";
import { feedbackSheetOpenAtom, feedbackTypeSheetOpenAtom } from "./feedback";

// Derived atom that combines all modal and menu states
export const shouldShowBlurOverlayAtom = atom((get) => {
  // Check nested mobile menu states (not the main mobile user menu)
  const nestedMobileMenus = [
    get(mobileNotificationsOpenAtom),
    get(mobileRadarsOpenAtom),
    get(mobileSettingsOpenAtom)
  ];

  // Check all modal states
  const modals = [
    get(createRadarModalOpenAtom),
    get(deleteRadarModalOpenAtom),
    get(shareRadarModalOpenAtom),
    get(searchModalOpenAtom),
    get(showOnboardingModalAtom),
    get(feedbackSheetOpenAtom),
    get(feedbackTypeSheetOpenAtom)
  ];

  // Return true if any nested menu or modal is open
  // Exclude mobileUserMenuOpenAtom as it shouldn't trigger the blur overlay
  return nestedMobileMenus.some(Boolean) || modals.some(Boolean);
});

// Track if any modal is in transition
export const isModalTransitionAtom = atom(false);
