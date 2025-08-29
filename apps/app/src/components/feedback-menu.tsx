"use client"

import { useState } from 'react'
import { MessageSquare, X, Send, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DropdownMenu } from './dropdown-menu'

export function FeedbackMenu({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) return

    // Mock submission for now
    console.log('Feedback submitted:', feedback)
    setIsSubmitted(true)
    
    setTimeout(() => {
      setIsOpen(false)
      setFeedback('')
      setIsSubmitted(false)
    }, 2000)
  }

  return (
    <DropdownMenu
      trigger={
        <button
          className={cn(
            "flex h-8 items-center gap-2 px-3 py-1.5 text-sm font-mono",
            "text-gray-400 hover:text-white transition-all duration-200",
            "rounded-md border border-gray-800 hover:border-gray-700",
            isOpen && "bg-gray-900 border-gray-700 text-white",
            className
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Feedback</span>
        </button>
      }
      align="right"
      className="w-80 p-0 bg-[#010101] border-gray-800"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      {isSubmitted ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-[#ABF716]/10 border border-[#ABF716]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-[#ABF716]" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1 font-mono">Thank you!</h3>
          <p className="text-xs text-gray-400 font-mono">Your feedback has been submitted.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 font-mono mb-2 block">
                What's on your mind?
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts, report bugs, or suggest features..."
                className="w-full h-32 px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] focus:border-transparent font-mono text-sm resize-none"
                autoFocus
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-sm font-mono text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!feedback.trim()}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-mono transition-all",
                  feedback.trim()
                    ? "bg-[#ABF716] text-black hover:bg-[#9ae614] border border-[#7eb410] hover:border-[#6d9f0f]"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </form>
      )}
    </DropdownMenu>
  )
}