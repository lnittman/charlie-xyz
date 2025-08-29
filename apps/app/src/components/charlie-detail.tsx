'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatedDotIcon } from './animated-dot-icon'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Workflow, Event } from '@/types/workflow'
import { 
  ArrowLeft, GitBranch, CheckCircle, AlertCircle, Clock, 
  Info, Play, Pause, RefreshCw, ExternalLink 
} from 'lucide-react'

interface CharlieDetailProps {
  id: string
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
    return (
      <div className="min-h-screen bg-[#010101] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <AnimatedDotIcon pattern="processing" size={24} />
          <span className="text-gray-400">Loading Charlie instance...</span>
        </div>
      </div>
    )
  }

  const workflow = data?.workflows.find(w => w.id === id)
  const events = data?.events.filter(e => e.workflowId === id) || []
  
  if (!workflow) {
    return (
      <div className="min-h-screen bg-[#010101] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Charlie instance not found</p>
          <Link href="/" className="text-[#ABF716] hover:underline">
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
          color: 'text-green-400'
        }
      case 'blocked':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-500" />,
          label: 'Blocked',
          color: 'text-red-400'
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

  return (
    <div className="min-h-screen bg-[#010101] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#010101]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              
              <div className="flex items-center gap-3">
                <img 
                  src="https://www.charlielabs.ai/images/logo.svg" 
                  alt="Charlie" 
                  className="h-8 w-auto"
                />
                <div className="h-6 w-px bg-gray-700" />
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-lg font-medium text-white">
                      {workflow.linearIssueKey}
                    </h1>
                    <p className="text-sm text-gray-400">
                      {workflow.name}
                    </p>
                  </div>
                  <div className="scale-150">
                    {statusInfo.icon}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              {workflow.github && (
                <a
                  href={`https://github.com/${workflow.github.owner}/${workflow.github.repo}/pull/${workflow.github.prNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors text-white"
                >
                  <GitBranch className="w-4 h-4" />
                  PR #{workflow.github.prNumber}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              
              <button className="p-2 hover:bg-gray-900 rounded-lg transition-colors">
                <RefreshCw className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-8">
            {/* Status Card */}
            <div className="bg-black border border-gray-800 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-white">Status</h2>
                <span className={cn('text-sm font-medium', statusInfo.color)}>
                  {statusInfo.label}
                </span>
              </div>
              
              {analysis?.narrative && (
                <p className="text-gray-300 mb-4">
                  {analysis.narrative}
                </p>
              )}
              
              {analysis?.insights && analysis.insights.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-400">
                    Key Insights
                  </h3>
                  {analysis.insights.map((insight: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-gray-900/50 rounded-lg"
                    >
                      <div className="w-1 h-1 rounded-full bg-[#ABF716] mt-2" />
                      <p className="text-sm text-gray-300">{insight}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Tiles */}
            {analysis?.nextSteps && analysis.nextSteps.length > 0 && (
              <div className="bg-black border border-gray-800 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium text-white mb-4">
                  Next Steps
                </h2>
                
                <div className="space-y-3">
                  {analysis.nextSteps.map((step: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group"
                    >
                      <div className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-[#ABF716]/50 transition-all">
                        <button className="p-2 bg-[#ABF716]/20 rounded-lg hover:bg-[#ABF716]/30 transition-colors">
                          <Play className="w-4 h-4 text-[#ABF716]" />
                        </button>
                        
                        <div className="flex-1">
                          <p className="font-medium text-white mb-1">
                            {step.action}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[#ABF716] rounded-full"
                                  style={{ width: `${step.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-gray-500">
                                {Math.round(step.confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-400 mt-2">
                            {step.reasoning}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            <div className="bg-black border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-medium text-white mb-4">
                Events
              </h2>
              
              <div className="relative">
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => setSelectedEventId(event.id === selectedEventId ? null : event.id)}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      selectedEventId === event.id
                        ? 'border-[#ABF716]/50 bg-[#ABF716]/10'
                        : 'border-gray-700 hover:bg-gray-900/50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-1.5',
                          event.provider === 'github' ? 'bg-[#ABF716]' : 'bg-purple-500'
                        )} />
                        
                        <div>
                          <p className="text-sm font-medium text-white">
                            {event.type.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {event.actor.displayName} • {event.provider}
                          </p>
                        </div>
                      </div>
                      
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(event.ts), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <AnimatePresence>
                      {selectedEventId === event.id && event.payload && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 pt-3 border-t border-gray-700"
                        >
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
                </div>
                {/* Fade gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-6">
            {/* Metadata */}
            <div className="bg-black border border-gray-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-4">
                Metadata
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Linear Issue</p>
                  <p className="text-sm font-medium text-white">
                    {workflow.linearIssueKey}
                  </p>
                </div>
                
                {workflow.github && (
                  <div>
                    <p className="text-xs text-gray-500">GitHub PR</p>
                    <p className="text-sm font-medium text-white">
                      {workflow.github.owner}/{workflow.github.repo}#{workflow.github.prNumber}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-xs text-gray-500">Total Events</p>
                  <p className="text-sm font-medium text-white">
                    {events.length}
                  </p>
                </div>
                
                {analysis?.estimatedCompletion && (
                  <div>
                    <p className="text-xs text-gray-500">Est. Completion</p>
                    <p className="text-sm font-medium text-white">
                      {analysis.estimatedCompletion}
                    </p>
                  </div>
                )}
                
                {analysis?.importance && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Importance</p>
                    <div className="flex gap-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'w-3 h-3 rounded-sm',
                            i < analysis.importance
                              ? 'bg-[#ABF716]'
                              : 'bg-gray-700'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-black border border-gray-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-4">
                Actions
              </h3>
              
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                  <Play className="w-4 h-4" />
                  Resume Charlie
                </button>
                
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                  <Pause className="w-4 h-4" />
                  Pause Charlie
                </button>
                
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Refresh Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}