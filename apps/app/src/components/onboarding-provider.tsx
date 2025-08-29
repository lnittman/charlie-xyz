"use client";

import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { OnboardingModal } from "./onboarding-modal";
import { showOnboardingModalAtom, hasCompletedOnboardingAtom } from "@/atoms";

interface OnboardingProviderProps {
  children: React.ReactNode;
  hasCompletedOnboarding: boolean;
  isNewUser: boolean;
}

export function OnboardingProvider({ children, hasCompletedOnboarding, isNewUser }: OnboardingProviderProps) {
  const setShowOnboarding = useSetAtom(showOnboardingModalAtom);
  const setHasCompleted = useSetAtom(hasCompletedOnboardingAtom);

  useEffect(() => {
    // Update the atom with server state
    setHasCompleted(hasCompletedOnboarding);
    
    // Only show onboarding for new users who haven't completed it
    if (isNewUser && !hasCompletedOnboarding) {
      // Show after a short delay to let the page load
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding, isNewUser, setShowOnboarding, setHasCompleted]);

  return (
    <>
      {children}
      <OnboardingModal />
    </>
  );
}