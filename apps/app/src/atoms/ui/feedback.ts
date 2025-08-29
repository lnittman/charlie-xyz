import { atom } from "jotai";

// Main feedback sheet open state
export const feedbackSheetOpenAtom = atom(false);

// Sub-sheet for feedback type selection
export const feedbackTypeSheetOpenAtom = atom(false);

// Selected feedback type
export type FeedbackType = "bug" | "feature" | "improvement" | "other";
export const selectedFeedbackTypeAtom = atom<FeedbackType | null>(null);

// Feedback form data
export const feedbackMessageAtom = atom("");
export const feedbackEmailAtom = atom("");

// Reset feedback state
export const resetFeedbackAtom = atom(
  null,
  (get, set) => {
    set(feedbackSheetOpenAtom, false);
    set(feedbackTypeSheetOpenAtom, false);
    set(selectedFeedbackTypeAtom, null);
    set(feedbackMessageAtom, "");
    set(feedbackEmailAtom, "");
  }
);