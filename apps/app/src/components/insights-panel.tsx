'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TrendingUp, AlertTriangle, Zap, Target } from 'lucide-react'

interface InsightsPanelProps {
  analysis: {
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
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low'
      action: string
      reasoning: string
      affectedWorkflows: string[]
    }>
  }
  className?: string
}

export function InsightsPanel({ analysis, className }: InsightsPanelProps) {
  const priorityConfig = {
    high: {
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-900/20',
      border: 'border-red-800'
    },
    medium: {
      icon: Zap,
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-800'
    },
    low: {
      icon: Target,
      color: 'text-[#ABF716]',
      bg: 'bg-[#ABF716]/10',
      border: 'border-[#ABF716]/30'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-black rounded-lg border border-gray-800',
        className
      )}
    >
      <div className="p-6">
        {/* Summary */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            System Overview
          </h3>
          <p className="text-white">
            {analysis.insights.summary}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-2xl font-semibold text-white">
              {analysis.insights.metrics.totalWorkflows}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Total Workflows
            </div>
          </div>
          
          <div className="bg-[#ABF716]/10 rounded-lg p-4">
            <div className="text-2xl font-semibold text-[#ABF716]">
              {analysis.insights.metrics.activeWorkflows}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Active
            </div>
          </div>
          
          <div className="bg-green-900/20 rounded-lg p-4">
            <div className="text-2xl font-semibold text-green-400">
              {analysis.insights.metrics.completedWorkflows}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Completed
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-lg font-semibold text-white">
              {analysis.insights.metrics.averageCompletionTime}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Avg. Time
            </div>
          </div>
        </div>

        {/* Bottlenecks */}
        {analysis.insights.metrics.bottlenecks.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              Identified Bottlenecks
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.insights.metrics.bottlenecks.map((bottleneck, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-xs font-medium bg-orange-900/30 text-orange-400 rounded-full"
                >
                  {bottleneck}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">
            Recommended Actions
          </h4>
          <div className="space-y-2">
            {analysis.recommendations.slice(0, 3).map((rec, index) => {
              const config = priorityConfig[rec.priority]
              const Icon = config.icon
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'p-3 rounded-lg border transition-all duration-200',
                    config.bg,
                    config.border,
                    'hover:shadow-sm'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn('w-4 h-4 mt-0.5', config.color)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {rec.action}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {rec.reasoning}
                      </p>
                      {rec.affectedWorkflows.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-xs text-gray-500">
                            Affects:
                          </span>
                          {rec.affectedWorkflows.slice(0, 3).map((wf, i) => (
                            <span
                              key={i}
                              className="text-xs px-1.5 py-0.5 bg-gray-800 rounded"
                            >
                              {wf.split('-').pop()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}