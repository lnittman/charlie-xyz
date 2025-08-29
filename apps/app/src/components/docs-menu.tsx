'use client'

import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocsMenuProps {
  className?: string
  variant?: 'default' | 'circular'
}

export function DocsMenu({ className, variant = 'default' }: DocsMenuProps) {
  const handleClick = () => {
    // Open docs in new tab
    window.open('https://docs.charlie.app', '_blank')
  }
  
  if (variant === 'circular') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "h-8 w-8 bg-transparent text-gray-400 flex items-center justify-center rounded-full border border-gray-800 transition-all duration-200",
          "hover:bg-gray-900 hover:text-white hover:border-gray-700",
          className
        )}
        aria-label="Documentation"
      >
        <FileText className="w-4 h-4" />
      </button>
    )
  }
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 px-3 h-9 text-sm font-mono bg-black border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 rounded-lg transition-all",
        className
      )}
    >
      <FileText className="w-4 h-4" />
      <span>Docs</span>
    </button>
  )
}