import { atom } from 'jotai'

// View mode for dashboard
export const viewModeAtom = atom<'grid' | 'list'>('grid')

// Search query
export const searchQueryAtom = atom('')

// Sort options
export const sortByAtom = atom<'recent' | 'alphabetical' | 'status'>('recent')

// Filter by status
export const statusFilterAtom = atom<'all' | 'active' | 'idle' | 'completed' | 'blocked'>('all')

// Search modal state
export const searchModalOpenAtom = atom(false)