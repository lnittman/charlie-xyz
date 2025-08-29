'use client'

import { Event } from '@/types/workflow'
import { format } from 'date-fns'

interface EventDetailsProps {
  event: Event
  onClose: () => void
}

export function EventDetails({ event, onClose }: EventDetailsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 sticky top-6">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Event Details</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Event ID & Sequence */}
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Event ID</div>
          <div className="font-mono text-sm text-gray-900 dark:text-white">{event.id}</div>
        </div>

        {/* Timestamp */}
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Timestamp</div>
          <div className="text-sm text-gray-900 dark:text-white">
            {format(new Date(event.ts), 'PPpp')}
          </div>
        </div>

        {/* Type & Provider */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {event.type.replace(/[._]/g, ' ')}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Provider</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {event.provider}
            </div>
          </div>
        </div>

        {/* Actor */}
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Actor</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {event.actor.displayName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              @{event.actor.handle}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              event.actor.type === 'charlie' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : event.actor.type === 'bot'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            }`}>
              {event.actor.type}
            </span>
          </div>
        </div>

        {/* Entity */}
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Entity</div>
          <div className="space-y-1">
            <div className="text-sm text-gray-900 dark:text-white">
              {event.entity.title || event.entity.key || 'Untitled'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Kind: {event.entity.kind}
            </div>
            {event.entity.url && (
              <a
                href={event.entity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline block truncate"
              >
                {event.entity.url}
              </a>
            )}
          </div>
        </div>

        {/* Payload */}
        {event.payload && (
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payload</div>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded p-2 max-h-64 overflow-y-auto">
              <pre className="text-xs text-gray-900 dark:text-gray-300 whitespace-pre-wrap break-words">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Workflow Context */}
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Workflow</div>
          <div className="text-sm text-gray-900 dark:text-white">{event.workflowId}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Sequence #{event.sequence}
          </div>
        </div>
      </div>
    </div>
  )
}