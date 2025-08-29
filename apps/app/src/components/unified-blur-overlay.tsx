"use client";

import { useAtom, useSetAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { 
  shouldShowBlurOverlayAtom,
  mobileNotificationsOpenAtom,
  mobileRadarsOpenAtom,
  mobileSettingsOpenAtom,
  createRadarModalOpenAtom,
  deleteRadarModalOpenAtom,
  shareRadarModalOpenAtom,
  searchModalOpenAtom,
  showOnboardingModalAtom,
  feedbackSheetOpenAtom,
  feedbackTypeSheetOpenAtom
} from "@/atoms";

export function UnifiedBlurOverlay() {
  const [shouldShow] = useAtom(shouldShowBlurOverlayAtom);
  
  // Setters for all modals and menus
  const setMobileNotifications = useSetAtom(mobileNotificationsOpenAtom);
  const setMobileRadars = useSetAtom(mobileRadarsOpenAtom);
  const setMobileSettings = useSetAtom(mobileSettingsOpenAtom);
  const setCreateRadarModal = useSetAtom(createRadarModalOpenAtom);
  const setDeleteRadarModal = useSetAtom(deleteRadarModalOpenAtom);
  const setShareRadarModal = useSetAtom(shareRadarModalOpenAtom);
  const setSearchModal = useSetAtom(searchModalOpenAtom);
  const setOnboardingModal = useSetAtom(showOnboardingModalAtom);
  const setFeedbackSheet = useSetAtom(feedbackSheetOpenAtom);
  const setFeedbackTypeSheet = useSetAtom(feedbackTypeSheetOpenAtom);

  const handleClose = () => {
    // Close nested mobile menus
    setMobileNotifications(false);
    setMobileRadars(false);
    setMobileSettings(false);
    
    // Close all modals
    setCreateRadarModal(false);
    setDeleteRadarModal(false);
    setShareRadarModal(false);
    setSearchModal(false);
    setOnboardingModal(false);
    setFeedbackSheet(false);
    setFeedbackTypeSheet(false);
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          onClick={handleClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}