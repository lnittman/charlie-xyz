'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatedDotIcon } from './animated-dot-icon'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'
import type { Workflow, Event } from '@/types/workflow'
import { 
  ArrowLeft, GitBranch, CheckCircle, AlertCircle, Clock, 
  Info, Play, Pause, RefreshCw, ExternalLink, Settings 
} from 'lucide-react'

interface CharlieDetailProps {
  id: string
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#010101] text-white">
      {/* Header Skeleton */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#010101] border-b border-gray-800">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="w-8 h-8 rounded" />
            <span className="text-gray-500 text-sm flex-shrink-0">/</span>
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl pt-[93px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card Skeleton */}
            <div className="bg-black rounded-lg border border-gray-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-20 w-full mb-4" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            {/* Events Timeline Skeleton */}
            <div className="bg-black rounded-lg border border-gray-800 p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-2 h-2 rounded-full mt-2" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            <div className="bg-black rounded-lg border border-gray-800 p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
            <div className="bg-black rounded-lg border border-gray-800 p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CharlieDetail({ id }: CharlieDetailProps) {
  const router = useRouter()
  const [data, setData] = useState<{ workflows: Workflow[], events: Event[] } | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  useEffect(() => {
    // Load data
    fetch('/data.json')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
        // Analyze this specific workflow
        const workflow = data.workflows.find((w: Workflow) => w.id === id)
        if (workflow) {
          analyzeWorkflow(workflow, data.events.filter((e: Event) => e.workflowId === id))
        }
      })
      .catch(console.error)
  }, [id])

  const analyzeWorkflow = async (workflow: Workflow, events: Event[]) => {
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workflows: [workflow], 
          events 
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setAnalysis(result.workflows[0])
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    }
  }

  if (loading) {
    return <DetailSkeleton />
  }

  const workflow = data?.workflows.find(w => w.id === id)
  const events = data?.events.filter(e => e.workflowId === id) || []
  
  if (!workflow) {
    return (
      <div className="min-h-screen bg-[#010101] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Charlie instance not found</p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#ABF716] text-black rounded-lg font-medium hover:bg-[#9ae614] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const getStatusInfo = () => {
    const status = analysis?.status || 'idle'
    switch (status) {
      case 'active':
        return {
          icon: <AnimatedDotIcon pattern="processing" size={24} active />,
          label: 'Active',
          color: 'text-[#ABF716]'
        }
      case 'completed':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          label: 'Completed',
          color: 'text-green-500'
        }
      case 'blocked':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-500" />,
          label: 'Blocked',
          color: 'text-red-500'
        }
      default:
        return {
          icon: <AnimatedDotIcon pattern="idle" size={24} />,
          label: 'Idle',
          color: 'text-gray-400'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.ts).getTime() - new Date(a.ts).getTime()
  )

  return (
    <div className="min-h-screen bg-[#010101] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#010101] border-b border-gray-800">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/"
              className="p-2 hover:opacity-80 transition-opacity rounded-md"
            >
              <img 
                src="/charlie-logo.svg" 
                alt="Charlie" 
                className="h-6 w-auto"
                style={{ filter: 'invert(1)' }}
              />
            </Link>
            <span className="text-gray-500 text-sm flex-shrink-0">/</span>
            <h1 className="text-sm font-mono text-white truncate">
              {workflow.linearIssueKey}
            </h1>
          </div>
          
          <Link 
            href="/settings"
            className="p-2 hover:opacity-80 transition-opacity rounded-md"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl pt-[93px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black rounded-lg border border-gray-800 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {statusInfo.icon}
                  <div>
                    <h2 className={cn('text-xl font-semibold', statusInfo.color)}>
                      {statusInfo.label}
                    </h2>
                    <p className="text-sm text-gray-400">{workflow.name}</p>
                  </div>
                </div>
                {workflow.lastEvent && (
                  <span className="text-xs text-gray-500 font-mono">
                    {formatDistanceToNow(new Date(workflow.lastEvent.ts), { addSuffix: true })}
                  </span>
                )}
              </div>

              {/* Narrative */}
              {analysis?.narrative && (
                <p className="text-gray-300 mb-4">
                  {analysis.narrative}
                </p>
              )}

              {/* Metadata */}
              <div className="flex gap-4 text-sm">
                {workflow.github && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <GitBranch className="w-4 h-4" />
                    <span className="font-mono">PR #{workflow.github.prNumber}</span>
                  </div>
                )}
                <span className="text-gray-500 font-mono">{events.length} events</span>
              </div>
            </motion.div>

            {/* Next Steps */}
            {analysis?.nextSteps && analysis.nextSteps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-black rounded-lg border border-gray-800 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Next Steps</h3>
                <div className="space-y-3">
                  {analysis.nextSteps.map((step: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-[#ABF716]/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white font-medium mb-2">{step.action}</p>
                          <p className="text-xs text-gray-400">{step.reasoning}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#ABF716] rounded-full"
                              style={{ width: `${step.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-mono">
                            {Math.round(step.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Events Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black rounded-lg border border-gray-800 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Events</h3>
              </div>
              <div className="p-6 space-y-4 relative">
                {sortedEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    className={cn(
                      'flex gap-3 p-3 rounded-lg cursor-pointer border transition-colors duration-150',
                      selectedEventId === event.id 
                        ? 'bg-gray-900/80 border-gray-700' 
                        : 'border-transparent hover:bg-gray-900/30'
                    )}
                    onClick={() => setSelectedEventId(event.id === selectedEventId ? null : event.id)}
                  >
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-2 h-2 rounded-full mt-2',
                        event.actor.type === 'charlie' ? 'bg-[#ABF716]' : 'bg-gray-600'
                      )} />
                      {index < sortedEvents.length - 1 && (
                        <div className="w-px h-full bg-gray-800 mt-2" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-medium">
                            {event.type.replace(/[._]/g, ' ')}
                          </p>
                          <p className="text-sm text-gray-400">
                            {event.entity.title || event.entity.key}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {event.actor.displayName}
                            </span>
                            <span className="text-xs text-gray-600">•</span>
                            <span className="text-xs text-gray-500 font-mono">
                              {formatDistanceToNow(new Date(event.ts), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Event Details (Expandable) */}
                      <AnimatePresence>
                        {selectedEventId === event.id && event.payload && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 overflow-hidden"
                          >
                            <div className="bg-gray-900/50 rounded p-3">
                              <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                                {JSON.stringify(event.payload, null, 2)}
                              </pre>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black rounded-lg border border-gray-800 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-[#ABF716] text-black rounded-lg font-medium hover:bg-[#9ae614] transition-colors flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" />
                  Resume Charlie
                </button>
                <button className="w-full px-4 py-2 bg-black border border-gray-700 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Retry Task
                </button>
              </div>
            </motion.div>

            {/* Insights */}
            {analysis?.insights && analysis.insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-black rounded-lg border border-gray-800 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Insights</h3>
                <ul className="space-y-2">
                  {analysis.insights.map((insight: string, index: number) => (
                    <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#ABF716] mt-1.5 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Completion Estimate */}
            {analysis?.estimatedCompletion && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-black rounded-lg border border-gray-800 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Estimated Completion</h3>
                <p className="text-sm text-gray-400 font-mono">{analysis.estimatedCompletion}</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}