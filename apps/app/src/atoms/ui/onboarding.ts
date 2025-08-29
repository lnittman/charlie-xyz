import { atom } from "jotai";

// Onboarding modal visibility
export const showOnboardingModalAtom = atom(false);

// Onboarding step
export const onboardingStepAtom = atom(1);

// Selected interests during onboarding
export const selectedInterestsAtom = atom<string[]>([]);

// Loading state for onboarding actions
export const onboardingLoadingAtom = atom(false);

// Has completed onboarding (derived from server state)
export const hasCompletedOnboardingAtom = atom(false);