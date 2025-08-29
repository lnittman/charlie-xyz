'use client'

import { AnimatedDotIcon } from './animated-dot-icon'

export function ReadyTile() {
  return (
    <div className="fixed bottom-6 right-6 z-40 pointer-events-none">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ABF716]/10 border border-[#ABF716]/30 rounded-lg backdrop-blur-sm">
        <AnimatedDotIcon 
          pattern="idle" 
          size={12} 
          active={true}
        />
        <span className="text-xs font-mono text-[#ABF716]">ready</span>
      </div>
    </div>
  )
}