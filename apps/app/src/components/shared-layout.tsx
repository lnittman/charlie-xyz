'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Settings, MessageCircle, FileText, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TextScramble } from './text-scramble'
import { DocsMenu } from './docs-menu'
import { FeedbackMenu } from './feedback-menu'

export function SharedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [scrambleTrigger, setScrambleTrigger] = useState(0)
  
  // Determine page title for breadcrumb
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    if (pathname === '/settings') return 'Settings'
    if (pathname.startsWith('/c/')) {
      const id = pathname.split('/')[2]
      return `Charlie ${id}`
    }
    return 'Dashboard'
  }
  
  // Trigger scramble on route change
  useEffect(() => {
    setScrambleTrigger(prev => prev + 1)
  }, [pathname])
  
  return (
    <div className="min-h-screen bg-[#010101] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#010101]/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left side - Logo and Breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-[#ABF716] rounded flex items-center justify-center">
                <span className="text-black font-bold text-lg">C</span>
              </div>
              <span className="text-lg font-semibold hidden sm:block">Charlie</span>
            </Link>
            
            {/* Separator */}
            <ChevronRight className="w-4 h-4 text-gray-500" />
            
            {/* Page Title with Text Scramble */}
            <TextScramble
              key={scrambleTrigger}
              className="text-lg font-mono text-[#ABF716]"
              duration={0.6}
              speed={0.03}
              characterSet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
            >
              {getPageTitle()}
            </TextScramble>
          </div>
          
          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2">
            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <FeedbackMenu />
              <DocsMenu />
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
              <DocsMenu variant="circular" />
              <Link
                href="/settings"
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border transition-all",
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
      
      {/* Main content */}
      <main className="relative">
        {children}
      </main>
      
      {/* Ready tile - bottom right */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="px-3 py-1.5 bg-[#ABF716]/10 border border-[#ABF716]/30 rounded-lg backdrop-blur-sm">
          <span className="text-xs font-mono text-[#ABF716]">ready</span>
        </div>
      </div>
    </div>
  )
}