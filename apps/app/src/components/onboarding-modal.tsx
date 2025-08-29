"use client";

import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design/components/dialog";
import { Button } from "@repo/design/components/button";
import { InterestPicker } from "./interest-picker";
import { updateUserInterests, completeOnboarding, skipOnboarding } from "@/actions/user-preferences";
import { Sparkle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import {
  showOnboardingModalAtom,
  onboardingStepAtom,
  selectedInterestsAtom,
  onboardingLoadingAtom
} from "@/atoms";

export function OnboardingModal() {
  const router = useRouter();
  const [open, setOpen] = useAtom(showOnboardingModalAtom);
  const [step, setStep] = useAtom(onboardingStepAtom);
  const [selectedInterests, setSelectedInterests] = useAtom(selectedInterestsAtom);
  const [isLoading, setIsLoading] = useAtom(onboardingLoadingAtom);

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      if (selectedInterests.length > 0) {
        await updateUserInterests(selectedInterests);
      }
      await completeOnboarding();
      router.refresh();
      setOpen(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      await skipOnboarding();
      router.refresh();
      setOpen(false);
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Don't allow closing the modal without completing or skipping
    // This prevents closing with Escape or clicking outside
    return;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkle className="w-5 h-5" weight="duotone" />
            Personalize Your Radar Experience
          </DialogTitle>
          <DialogDescription>
            Select topics you're interested in to get better suggestions
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="interests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <InterestPicker
                  selectedInterests={selectedInterests}
                  onInterestsChange={setSelectedInterests}
                />

                <div className="mt-8 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedInterests.length} interests selected
                  </p>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      disabled={isLoading}
                    >
                      Skip for now
                    </Button>
                    <Button
                      onClick={handleComplete}
                      disabled={isLoading || selectedInterests.length === 0}
                    >
                      {isLoading ? "Saving..." : "Get Started"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}