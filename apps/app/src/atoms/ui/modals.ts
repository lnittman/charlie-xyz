import { atom } from "jotai";

// Modal state atoms
export const createRadarModalOpenAtom = atom(false);
export const deleteRadarModalOpenAtom = atom(false);
export const shareRadarModalOpenAtom = atom(false);
export const searchModalOpenAtom = atom(false);

// Modal data atoms
export const deleteRadarModalDataAtom = atom<{ id: string; query: string } | null>(null);
export const shareRadarModalDataAtom = atom<{ id: string; query: string; shareUrl?: string } | null>(null);

// Callback atoms
export const createRadarModalCallbackAtom = atom<((radar: any) => void) | null>(null);
export const deleteRadarModalCallbackAtom = atom<(() => void) | null>(null);