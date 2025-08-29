'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatedDotIcon } from './animated-dot-icon'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { Workflow, Event } from '@/types/workflow'
import { Info, ArrowRight, GitBranch, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface CharlieCardProps {
  workflow: Workflow & {
    eventCount: number
    lastEvent?: Event
    status: 'active' | 'completed' | 'blocked' | 'idle'
  }
  events: Event[]
  analysis?: {
    narrative: string
    importance: number
    nextSteps: Array<{
      action: string
      reasoning: string
      confidence: number
    }>
    insights: string[]
    estimatedCompletion: string | null
  }
}

export function CharlieCard({ workflow, events, analysis }: CharlieCardProps) {
  const [showReasoning, setShowReasoning] = useState<number | null>(null)
  
  const getStatusIcon = () => {
    switch (workflow.status) {
      case 'active':
        return <AnimatedDotIcon pattern="processing" size={20} active />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'blocked':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <AnimatedDotIcon pattern="idle" size={20} />
    }
  }

  const getStatusColor = () => {
    switch (workflow.status) {
      case 'active':
        return 'border-[#ABF716]/30 bg-[#ABF716]/5'
      case 'completed':
        return 'border-green-800 bg-green-900/10'
      case 'blocked':
        return 'border-red-800 bg-red-900/10'
      default:
        return 'border-gray-800'
    }
  }

  const importanceColors = [
    'bg-gray-700',
    'bg-[#ABF716]/30',
    'bg-[#ABF716]/50',
    'bg-[#ABF716]/70',
    'bg-[#ABF716]'
  ]

  return (
    <div 
      className={cn(
        'group relative bg-black rounded-lg border transition-all duration-200',
        getStatusColor(),
        'hover:shadow-lg hover:shadow-[#ABF716]/10'
      )}
    >
      <Link href={`/c/${workflow.id}`} className="block p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white">
                  {workflow.linearIssueKey}
                </h3>
                {analysis && (
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, Math.ceil(analysis.importance / 2)) }).map((_, i) => (
                      <div 
                        key={i}
                        className={cn('w-1.5 h-4 rounded-sm', importanceColors[i])}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-400">
                {workflow.name}
              </p>
            </div>
          </div>
          
          {workflow.lastEvent && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(workflow.lastEvent.ts), { addSuffix: true })}</span>
            </div>
          )}
        </div>

        {/* Narrative */}
        {analysis?.narrative && (
          <p className="text-sm text-gray-300 mb-4 line-clamp-2">
            {analysis.narrative}
          </p>
        )}


        {/* Next Steps - Action Tiles */}
        {analysis?.nextSteps && analysis.nextSteps.length > 0 && (
          <div 
            className="space-y-2"
            onClick={(e) => e.preventDefault()}
          >
            {analysis.nextSteps.slice(0, 2).map((step, index) => (
              <div
                key={index}
                className={cn(
                  'relative p-3 rounded-md border transition-all duration-200',
                  'bg-gray-900/50 border-gray-700',
                  'hover:bg-gray-900 hover:border-[#ABF716]/30'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <p className="text-sm font-medium text-white">
                      {step.action}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#ABF716] rounded-full"
                            style={{ width: `${step.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(step.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowReasoning(showReasoning === index ? null : index)
                    }}
                    className={cn(
                      'p-1 rounded-md transition-all duration-200',
                      'hover:bg-gray-800',
                      showReasoning === index && 'bg-gray-800'
                    )}
                  >
                    <Info className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                
                {/* Reasoning Tooltip */}
                {showReasoning === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-2 bg-gray-900 rounded border border-gray-700"
                  >
                    <p className="text-xs text-gray-400">
                      {step.reasoning}
                    </p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Bottom row with PR and event count */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            {workflow.github && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <GitBranch className="w-3 h-3" />
                <span>PR #{workflow.github.prNumber}</span>
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500">{workflow.eventCount} events</span>
        </div>
      </Link>

    </div>
  )
}