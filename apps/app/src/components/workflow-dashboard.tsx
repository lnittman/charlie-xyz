'use client'

import { useState, useEffect } from 'react'
import { WorkflowTimeline } from './workflow-timeline'
import { EventDetails } from './event-details'
import { WorkflowFilters } from './workflow-filters'
import type { Workflow, Event } from '@/types/workflow'

export function WorkflowDashboard() {
  const [data, setData] = useState<{ workflows: Workflow[], events: Event[] } | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [filters, setFilters] = useState({
    provider: 'all',
    type: 'all',
    actor: 'all'
  })

  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-500">Loading workflow data...</div>
      </div>
    )
  }

  const filteredEvents = data.events.filter(event => {
    if (selectedWorkflow && event.workflowId !== selectedWorkflow) return false
    if (filters.provider !== 'all' && event.provider !== filters.provider) return false
    if (filters.type !== 'all' && !event.type.includes(filters.type)) return false
    if (filters.actor !== 'all' && event.actor.type !== filters.actor) return false
    return true
  })

  const workflowsWithCounts = data.workflows.map(workflow => ({
    ...workflow,
    eventCount: data.events.filter(e => e.workflowId === workflow.id).length,
    lastEvent: data.events
      .filter(e => e.workflowId === workflow.id)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())[0]
  }))

  return (
    <div className="container mx-auto p-6 max-w-[1400px]">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Charlie Workflow Monitor
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tracking {data.workflows.length} workflows with {data.events.length} events
        </p>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Workflow List */}
        <div className="col-span-3 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Workflows</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {workflowsWithCounts.map(workflow => (
                <button
                  key={workflow.id}
                  onClick={() => setSelectedWorkflow(workflow.id === selectedWorkflow ? null : workflow.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    selectedWorkflow === workflow.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {workflow.linearIssueKey}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {workflow.name}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {workflow.eventCount} events
                    </span>
                    {workflow.github && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                        PR #{workflow.github.prNumber}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Timeline */}
        <div className="col-span-6">
          <WorkflowFilters filters={filters} onFiltersChange={setFilters} data={data} />
          <WorkflowTimeline
            events={filteredEvents}
            onEventSelect={setSelectedEvent}
            selectedEvent={selectedEvent}
          />
        </div>

        {/* Right Panel - Event Details */}
        <div className="col-span-3">
          {selectedEvent && (
            <EventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
          )}
        </div>
      </div>
    </div>
  )
}