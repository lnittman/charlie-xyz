'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Settings, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TextScramble } from './text-scramble'
import { FeedbackMenu } from './feedback-menu'

export function SharedHeader() {
  const pathname = usePathname()
  const [scrambleTrigger, setScrambleTrigger] = useState(0)
  
  // Determine page title for breadcrumb
  const getPageTitle = () => {
    if (pathname === '/') return 'Command Center'
    if (pathname === '/settings') return 'Settings'
    if (pathname.startsWith('/c/')) {
      const id = pathname.split('/')[2]
      return `Charlie ${id}`
    }
    return 'Command Center'
  }
  
  // Trigger scramble on route change
  useEffect(() => {
    setScrambleTrigger(prev => prev + 1)
  }, [pathname])
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#010101] border-b border-gray-800">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link href="/" className="p-2 hover:opacity-80 transition-opacity rounded-md">
            <img 
              src="/charlie-logo.svg" 
              alt="Charlie" 
              className="h-6 w-auto"
              style={{ filter: 'invert(1)' }}
            />
          </Link>
          <span className="text-gray-500 text-sm flex-shrink-0">/</span>
          <TextScramble
            key={scrambleTrigger}
            className="text-sm font-mono text-white"
            duration={0.6}
            speed={0.03}
            characterSet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
          >
            {getPageTitle()}
          </TextScramble>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Desktop buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <FeedbackMenu />
            <Link 
              href="https://docs.charlielabs.ai"
              target="_blank"
              className="flex h-9 items-center gap-2 px-3 text-sm font-mono bg-black border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 rounded-lg transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Docs</span>
            </Link>
            <Link 
              href="/settings"
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg border transition-all",
                pathname === '/settings'
                  ? "bg-[#ABF716]/10 border-[#ABF716]/30 text-[#ABF716]"
                  : "bg-black border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
              )}
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Mobile buttons - circular */}
          <div className="flex sm:hidden items-center gap-2">
            <FeedbackMenu variant="circular" />
            <button
              onClick={() => window.open('https://docs.charlielabs.ai', '_blank')}
              className="h-8 w-8 bg-black text-gray-400 flex items-center justify-center rounded-full border border-gray-800 hover:text-white hover:border-gray-700 transition-all"
              aria-label="Documentation"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <Link 
              href="/settings"
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-full border transition-all",
                pathname === '/settings'
                  ? "bg-[#ABF716]/10 border-[#ABF716]/30 text-[#ABF716]"
                  : "bg-black border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
              )}
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}