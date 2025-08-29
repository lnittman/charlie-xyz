"use client";

import { useAtom, useSetAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bug, 
  Lightbulb, 
  ArrowsClockwise, 
  DotsThree,
  X,
  CaretRight
} from "@phosphor-icons/react";
import { 
  feedbackSheetOpenAtom,
  feedbackTypeSheetOpenAtom,
  selectedFeedbackTypeAtom,
  feedbackMessageAtom,
  feedbackEmailAtom,
  resetFeedbackAtom,
  type FeedbackType
} from "@/atoms";
import { MobileSheet } from "./mobile-sheet";
import { cn } from "@/lib/utils";

const feedbackTypes = [
  { value: "bug" as FeedbackType, label: "Report a bug", icon: Bug },
  { value: "feature" as FeedbackType, label: "Request a feature", icon: Lightbulb },
  { value: "improvement" as FeedbackType, label: "Suggest an improvement", icon: ArrowsClockwise },
  { value: "other" as FeedbackType, label: "Other feedback", icon: DotsThree },
];

export function FeedbackSheet() {
  const [isOpen, setIsOpen] = useAtom(feedbackSheetOpenAtom);
  const [isTypeSheetOpen, setIsTypeSheetOpen] = useAtom(feedbackTypeSheetOpenAtom);
  const [selectedType, setSelectedType] = useAtom(selectedFeedbackTypeAtom);
  const [message, setMessage] = useAtom(feedbackMessageAtom);
  const [email, setEmail] = useAtom(feedbackEmailAtom);
  const resetFeedback = useSetAtom(resetFeedbackAtom);

  const handleClose = () => {
    // Delay reset to allow animation to complete
    setIsOpen(false);
    setTimeout(() => {
      resetFeedback();
    }, 300);
  };

  const handleTypeSelect = (type: FeedbackType) => {
    setSelectedType(type);
    setIsTypeSheetOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement feedback submission
    console.log("Submitting feedback:", { type: selectedType, message, email });
    handleClose();
  };

  const selectedTypeData = feedbackTypes.find(t => t.value === selectedType);

  return (
    <>
      {/* Main Feedback Sheet */}
      <MobileSheet
        open={isOpen && !isTypeSheetOpen}
        onClose={handleClose}
        position="bottom"
        height="auto"
        className="pb-safe"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold">Send Feedback</h2>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" weight="duotone" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1 px-4 py-4 space-y-4">
              {/* Feedback Type Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Feedback Type
                </label>
                <button
                  type="button"
                  onClick={() => setIsTypeSheetOpen(true)}
                  className={cn(
                    "w-full flex items-center justify-between",
                    "px-3 py-2.5 rounded-lg border border-border",
                    "bg-background hover:bg-muted transition-colors",
                    "text-left"
                  )}
                >
                  {selectedTypeData ? (
                    <div className="flex items-center gap-2">
                      <selectedTypeData.icon className="w-4 h-4" weight="duotone" />
                      <span className="text-sm">{selectedTypeData.label}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Select feedback type
                    </span>
                  )}
                  <CaretRight className="w-4 h-4 text-muted-foreground" weight="duotone" />
                </button>
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  className={cn(
                    "w-full min-h-[120px] px-3 py-2.5",
                    "rounded-lg border border-border",
                    "bg-background placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                    "resize-none"
                  )}
                  required
                />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email (optional)
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={cn(
                    "w-full px-3 py-2.5",
                    "rounded-lg border border-border",
                    "bg-background placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring"
                  )}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border">
              <button
                type="submit"
                disabled={!selectedType || !message.trim()}
                className={cn(
                  "w-full py-2.5 rounded-lg font-medium",
                  "bg-foreground text-background",
                  "hover:bg-foreground/90 transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Send Feedback
              </button>
            </div>
          </form>
        </div>
      </MobileSheet>

      {/* Feedback Type Selection Sheet */}
      <MobileSheet
        open={isTypeSheetOpen}
        onClose={() => setIsTypeSheetOpen(false)}
        position="bottom"
        height="auto"
        className="pb-safe"
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold">Select Feedback Type</h2>
            <button
              onClick={() => setIsTypeSheetOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" weight="duotone" />
            </button>
          </div>

          {/* Type Options */}
          <div className="py-2">
            {feedbackTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeSelect(type.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3",
                  "hover:bg-muted transition-colors",
                  selectedType === type.value && "bg-muted"
                )}
              >
                <type.icon className="w-5 h-5" weight="duotone" />
                <span className="flex-1 text-left">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </MobileSheet>
    </>
  );
}