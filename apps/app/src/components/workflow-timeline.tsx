'use client'

import { Event, Actor } from '@/types/workflow'
import { formatDistanceToNow } from 'date-fns'

interface WorkflowTimelineProps {
  events: Event[]
  onEventSelect: (event: Event) => void
  selectedEvent: Event | null
}

export function WorkflowTimeline({ events, onEventSelect, selectedEvent }: WorkflowTimelineProps) {
  const getEventIcon = (event: Event) => {
    const typeMap: Record<string, string> = {
      'issue.created': '🎯',
      'issue.assigned': '👤',
      'issue.labeled': '🏷️',
      'issue.status_changed': '📊',
      'issue.commented': '💬',
      'issue.linked': '🔗',
      'issue.closed': '✅',
      'pr.opened': '🔀',
      'pr.draft': '📝',
      'pr.ready_for_review': '👀',
      'pr.labeled': '🏷️',
      'pr.review_requested': '🔍',
      'pr.commented': '💬',
      'pr.review_submitted': '✔️',
      'pr.commit_pushed': '📤',
      'pr.merged': '🎉',
      'ci.check_run': '🔄'
    }
    return typeMap[event.type] || '📌'
  }

  const getEventColor = (event: Event) => {
    if (event.provider === 'github') return 'border-green-500 bg-green-50 dark:bg-green-900/20'
    if (event.provider === 'linear') return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
    return 'border-gray-500 bg-gray-50 dark:bg-gray-800'
  }

  const getActorColor = (actor: Actor) => {
    if (actor.type === 'charlie') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
    if (actor.type === 'bot') return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Event Timeline</h2>
      
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No events to display. Select a workflow or adjust filters.
          </p>
        ) : (
          events.map((event, index) => (
            <div
              key={event.id}
              onClick={() => onEventSelect(event)}
              className={`relative flex gap-4 cursor-pointer transition-all hover:scale-[1.02] ${
                selectedEvent?.id === event.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Timeline line */}
              {index < events.length - 1 && (
                <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
              )}
              
              {/* Event icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg ${getEventColor(event)}`}>
                {getEventIcon(event)}
              </div>
              
              {/* Event content */}
              <div className="flex-1 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {event.type.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {event.entity.title || event.entity.key || 'No title'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(event.ts), { addSuffix: true })}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getActorColor(event.actor)}`}>
                    {event.actor.displayName}
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {event.provider}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    #{event.sequence}
                  </span>
                </div>

                {/* Payload preview */}
                {event.payload && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {event.payload.text && <p className="italic">"{event.payload.text}"</p>}
                    {event.payload.status && (
                      <p>Status: {event.payload.status.from} → {event.payload.status.to}</p>
                    )}
                    {event.payload.labelsAdded && (
                      <p>Labels added: {event.payload.labelsAdded.join(', ')}</p>
                    )}
                    {event.payload.reviewersAdded && (
                      <p>Reviewers: {event.payload.reviewersAdded.join(', ')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}