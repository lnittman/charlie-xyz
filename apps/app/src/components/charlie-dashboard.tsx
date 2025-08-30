'use client'

import { useState, useEffect, useMemo } from 'react'
import { AnimatedDotIcon } from './animated-dot-icon'
import { CharlieCard } from './charlie-card'
import { InsightsPanel } from './insights-panel'
import { CharlieToolbar } from './charlie-toolbar'
import { SearchModal } from './search-modal'
import { MassiveDotLoader } from './dot-matrix-loader'
import { motion, AnimatePresence } from 'framer-motion'
import type { Workflow, Event } from '@/types/workflow'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { FeedbackMenu } from './feedback-menu'
import { useAtom } from 'jotai'
import { viewModeAtom, searchQueryAtom, sortByAtom, statusFilterAtom } from '@/atoms/dashboard'

interface Analysis {
  insights: {
    summary: string
    metrics: {
      totalWorkflows: number
      activeWorkflows: number
      completedWorkflows: number
      averageCompletionTime: string
      bottlenecks: string[]
    }
  }
  workflows: Array<{
    id: string
    narrative: string
    status: 'active' | 'completed' | 'blocked' | 'idle'
    importance: number
    nextSteps: Array<{
      action: string
      reasoning: string
      confidence: number
    }>
    insights: string[]
    estimatedCompletion: string | null
  }>
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    reasoning: string
    affectedWorkflows: string[]
  }>
}

export function CharlieDashboard() {
  const [data, setData] = useState<{ workflows: Workflow[], events: Event[] } | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [viewMode] = useAtom(viewModeAtom)
  const [searchQuery] = useAtom(searchQueryAtom)
  const [sortBy] = useAtom(sortByAtom)
  const [statusFilter] = useAtom(statusFilterAtom)

  useEffect(() => {
    // Load initial data
    fetch('/data.json')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
        // Trigger AI analysis
        analyzeWorkflows(data)
      })
      .catch(console.error)
  }, [])

  const analyzeWorkflows = async (data: { workflows: Workflow[], events: Event[] }) => {
    setAnalyzing(true)
    try {
      // Get settings from localStorage
      const savedSettings = localStorage.getItem('charlie-settings')
      const settings = savedSettings ? JSON.parse(savedSettings) : null
      
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, settings })
      })
      
      if (response.ok) {
        const result = await response.json()
        setAnalysis(result)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const enrichedWorkflows = useMemo(() => {
    if (!data) return []
    
    return data.workflows.map(workflow => {
      const workflowAnalysis = analysis?.workflows.find(w => w.id === workflow.id)
      const workflowEvents = data.events.filter(e => e.workflowId === workflow.id)
      const lastEvent = workflowEvents.sort((a, b) => 
        new Date(b.ts).getTime() - new Date(a.ts).getTime()
      )[0]
      
      return {
        ...workflow,
        analysis: workflowAnalysis,
        eventCount: workflowEvents.length,
        lastEvent,
        status: workflowAnalysis?.status || 'idle' as 'active' | 'completed' | 'blocked' | 'idle'
      }
    })
  }, [data, analysis])

  const filteredWorkflows = useMemo(() => {
    let filtered = enrichedWorkflows
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(w => w.status === statusFilter)
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(w => 
        w.linearIssueKey.toLowerCase().includes(query) ||
        w.name.toLowerCase().includes(query) ||
        w.analysis?.narrative?.toLowerCase().includes(query)
      )
    }
    
    // Apply sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return a.name.localeCompare(b.name)
        case 'status':
          const statusOrder = { active: 0, blocked: 1, idle: 2, completed: 3 }
          return statusOrder[a.status] - statusOrder[b.status]
        case 'recent':
        default:
          const aTime = a.lastEvent ? new Date(a.lastEvent.ts).getTime() : 0
          const bTime = b.lastEvent ? new Date(b.lastEvent.ts).getTime() : 0
          return bTime - aTime
      }
    })
    
    return filtered
  }, [enrichedWorkflows, statusFilter, searchQuery, sortBy])

  return (
    <>
      {/* Search Modal */}
      <SearchModal />
      
      {/* Epic loading animation */}
      <MassiveDotLoader loading={loading} />
      
      {/* Main content with fade-in animation */}
      <motion.div 
        className="min-h-screen bg-[#010101] text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.6, delay: loading ? 0 : 0.3 }}
      >

      {/* Main Container */}
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Toolbar */}
        <CharlieToolbar 
          totalCount={enrichedWorkflows.length}
          filteredCount={filteredWorkflows.length}
        />
        
        {/* Content Area with spacing */}
        <div className="mt-6 pb-32">
        {/* Insights Panel */}
        {analysis && (
          <InsightsPanel analysis={analysis} className="mb-6" />
        )}

        {/* Charlie List */}
        <div className="space-y-4 relative">
          <AnimatePresence mode="wait">
            <motion.div 
              key={viewMode}
              className={cn(
                "gap-4",
                viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col'
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {filteredWorkflows.map((workflow) => (
                <CharlieCard 
                  key={workflow.id}
                  workflow={workflow}
                  events={data?.events.filter(e => e.workflowId === workflow.id) || []}
                  analysis={workflow.analysis}
                />
              ))}
            </motion.div>
          </AnimatePresence>
          
        </div>
        </div>
      </div>
      
      {/* Fade gradient at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#010101] via-[#010101]/80 to-transparent pointer-events-none z-10" />
    </motion.div>
    </>
  )
}