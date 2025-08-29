"use client";

import { useState, useTransition } from "react";
import { InterestPicker } from "../interest-picker";
import { updateUserInterests } from "@/actions/user-preferences";
import { Button } from "@repo/design/components/button";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InterestsSectionProps {
  initialInterests: string[];
}

export function InterestsSection({ initialInterests }: InterestsSectionProps) {
  const router = useRouter();
  const [interests, setInterests] = useState(initialInterests);
  const [hasChanges, setHasChanges] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInterestsChange = (newInterests: string[]) => {
    setInterests(newInterests);
    setHasChanges(
      JSON.stringify(newInterests.sort()) !== JSON.stringify(initialInterests.sort())
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateUserInterests(interests);
      if (result.success) {
        setShowSuccess(true);
        setHasChanges(false);
        router.refresh();
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    });
  };

  const handleReset = () => {
    setInterests(initialInterests);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <InterestPicker
        selectedInterests={interests}
        onInterestsChange={handleInterestsChange}
        minimal
      />

      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
          >
            <p className="text-sm text-muted-foreground">
              You have unsaved changes
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isPending}
              >
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
          >
            <Check className="w-4 h-4" />
            Your interests have been updated successfully
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}