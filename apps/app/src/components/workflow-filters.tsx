'use client'

import { useMemo } from 'react'
import type { Workflow, Event } from '@/types/workflow'

interface WorkflowFiltersProps {
  filters: {
    provider: string
    type: string
    actor: string
  }
  onFiltersChange: (filters: any) => void
  data: { workflows: Workflow[], events: Event[] }
}

export function WorkflowFilters({ filters, onFiltersChange, data }: WorkflowFiltersProps) {
  const options = useMemo(() => {
    const providers = Array.from(new Set(data.events.map(e => e.provider)))
    const types = Array.from(new Set(data.events.map(e => e.type.split('.')[0])))
    const actorTypes = Array.from(new Set(data.events.map(e => e.actor.type)))
    
    return { providers, types, actorTypes }
  }, [data])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Provider</label>
          <select
            value={filters.provider}
            onChange={(e) => onFiltersChange({ ...filters, provider: e.target.value })}
            className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Providers</option>
            {options.providers.map(provider => (
              <option key={provider} value={provider}>{provider}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Event Type</label>
          <select
            value={filters.type}
            onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
            className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {options.types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Actor Type</label>
          <select
            value={filters.actor}
            onChange={(e) => onFiltersChange({ ...filters, actor: e.target.value })}
            className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Actors</option>
            {options.actorTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onFiltersChange({ provider: 'all', type: 'all', actor: 'all' })}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )
}