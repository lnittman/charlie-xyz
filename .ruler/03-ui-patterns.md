# Charlie Command Center UI Patterns

## Overview

The Charlie Command Center provides a sophisticated visualization and control interface for managing Charlie automation instances. The UI emphasizes real-time monitoring, clear visual hierarchy, and intuitive interaction patterns.

## Core UI Components

### 1. Command Center Dashboard

```typescript
interface DashboardLayout {
  header: NavigationHeader       // Global controls and settings
  sidebar: WorkflowList          // Active Charlie workflows
  mainView: TimelineVisualization // Real-time event stream
  detailsPanel: EventInspector   // Deep dive into specific events
  insightsPanel?: AIInsights     // Optional AI analysis
}
```

### 2. Timeline Visualization

The timeline is the heart of the command center, showing Charlie's activities in real-time:

```typescript
interface TimelineEvent {
  id: string
  timestamp: Date
  provider: 'linear' | 'github'
  type: EventType
  actor: {
    type: 'charlie' | 'human' | 'bot'
    name: string
    avatar?: string
  }
  content: {
    title: string
    description?: string
    metadata: Record<string, any>
  }
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}
```

**Visual Design Patterns:**
- **Color Coding**: Provider-specific colors (Linear: purple, GitHub: blue)
- **Actor Indicators**: Icons showing Charlie vs human vs bot actions
- **Status Badges**: Visual status indicators for quick scanning
- **Time Grouping**: Events grouped by time intervals (minutes, hours, days)
- **Expandable Details**: Click to expand full event information

### 3. Workflow List Sidebar

```typescript
interface WorkflowListItem {
  id: string
  title: string
  status: WorkflowStatus
  assignee: 'Charlie' | string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  provider: {
    type: 'linear' | 'github'
    key: string // BOT-5001 or PR #4301
    url: string
  }
  progress: {
    current: number
    total: number
    percentage: number
  }
}
```

**Interaction Patterns:**
- **Quick Filters**: Filter by status, assignee, provider
- **Search**: Fuzzy search across workflow titles
- **Sorting**: By priority, date, status
- **Bulk Actions**: Select multiple workflows for batch operations

### 4. Event Details Panel

```typescript
interface EventDetailsView {
  header: {
    title: string
    timestamp: string
    duration?: string
  }
  actor: ActorInfo
  payload: {
    before?: any
    after?: any
    changes: Change[]
  }
  relatedEvents: Event[]
  actions: Action[]
}
```

**Display Patterns:**
- **JSON Viewer**: Syntax-highlighted payload inspection
- **Diff View**: Before/after comparisons for changes
- **Related Events**: Timeline of connected events
- **Action Buttons**: Quick actions like retry, cancel, approve

### 5. Filter Controls

```typescript
interface FilterState {
  providers: ('linear' | 'github')[]
  eventTypes: string[]
  actorTypes: ('charlie' | 'human' | 'bot')[]
  dateRange: {
    start: Date
    end: Date
  }
  searchQuery: string
}
```

**UI Components:**
- **Multi-select Dropdowns**: For providers and event types
- **Toggle Groups**: For actor type filtering
- **Date Range Picker**: For temporal filtering
- **Search Bar**: Global text search with autocomplete

## Visual Design System

### Color Palette

```scss
// Provider Colors
$linear-primary: #5E6AD2;
$linear-secondary: #F7F8F9;
$github-primary: #0969DA;
$github-secondary: #F6F8FA;

// Status Colors
$status-success: #2EA043;
$status-warning: #FB8500;
$status-error: #CF222E;
$status-pending: #6E7781;

// Actor Colors
$actor-charlie: #8B5CF6;
$actor-human: #3B82F6;
$actor-bot: #6B7280;

// UI Colors
$background: #FFFFFF;
$surface: #F9FAFB;
$border: #E5E7EB;
$text-primary: #111827;
$text-secondary: #6B7280;
```

### Typography

```scss
// Font Stack
$font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
$font-mono: 'JetBrains Mono', 'SF Mono', monospace;

// Type Scale
$text-xs: 0.75rem;    // 12px
$text-sm: 0.875rem;   // 14px
$text-base: 1rem;     // 16px
$text-lg: 1.125rem;   // 18px
$text-xl: 1.25rem;    // 20px
$text-2xl: 1.5rem;    // 24px
```

### Spacing System

```scss
// Spacing Scale (Tailwind-compatible)
$space-0: 0;
$space-1: 0.25rem;   // 4px
$space-2: 0.5rem;    // 8px
$space-3: 0.75rem;   // 12px
$space-4: 1rem;      // 16px
$space-5: 1.25rem;   // 20px
$space-6: 1.5rem;    // 24px
$space-8: 2rem;      // 32px
$space-10: 2.5rem;   // 40px
$space-12: 3rem;     // 48px
```

## Component Patterns

### Timeline Event Component

```tsx
function TimelineEvent({ event }: { event: Event }) {
  return (
    <div className="timeline-event group">
      {/* Time Indicator */}
      <div className="time-indicator">
        <time>{formatTime(event.ts)}</time>
      </div>
      
      {/* Event Card */}
      <div className="event-card">
        {/* Provider Badge */}
        <Badge provider={event.provider} />
        
        {/* Actor Avatar */}
        <Avatar actor={event.actor} />
        
        {/* Event Content */}
        <div className="event-content">
          <h4>{event.title}</h4>
          <p>{event.description}</p>
        </div>
        
        {/* Expand Button */}
        <button className="expand-btn opacity-0 group-hover:opacity-100">
          <ChevronDownIcon />
        </button>
      </div>
      
      {/* Expanded Details (Collapsible) */}
      <Collapsible>
        <EventDetails event={event} />
      </Collapsible>
    </div>
  )
}
```

### Workflow Card Component

```tsx
function WorkflowCard({ workflow }: { workflow: Workflow }) {
  const statusColor = getStatusColor(workflow.status)
  const priorityIcon = getPriorityIcon(workflow.priority)
  
  return (
    <div className="workflow-card">
      {/* Status Indicator */}
      <div className={`status-indicator bg-${statusColor}`} />
      
      {/* Workflow Header */}
      <div className="workflow-header">
        <h3>{workflow.title}</h3>
        {priorityIcon}
      </div>
      
      {/* Assignee */}
      <div className="assignee">
        {workflow.assignee === 'Charlie' ? (
          <CharlieAvatar />
        ) : (
          <UserAvatar user={workflow.assignee} />
        )}
      </div>
      
      {/* Progress Bar */}
      <ProgressBar 
        current={workflow.progress.current}
        total={workflow.progress.total}
      />
      
      {/* Provider Link */}
      <a href={workflow.provider.url} className="provider-link">
        {workflow.provider.key}
        <ExternalLinkIcon />
      </a>
    </div>
  )
}
```

### Filter Panel Component

```tsx
function FilterPanel({ filters, onChange }: FilterPanelProps) {
  return (
    <div className="filter-panel">
      {/* Provider Filter */}
      <MultiSelect
        label="Providers"
        options={['linear', 'github']}
        selected={filters.providers}
        onChange={(providers) => onChange({ ...filters, providers })}
      />
      
      {/* Event Type Filter */}
      <MultiSelect
        label="Event Types"
        options={EVENT_TYPES}
        selected={filters.eventTypes}
        onChange={(eventTypes) => onChange({ ...filters, eventTypes })}
      />
      
      {/* Actor Type Filter */}
      <ToggleGroup
        label="Actors"
        options={[
          { value: 'charlie', label: 'Charlie', icon: <CharlieIcon /> },
          { value: 'human', label: 'Human', icon: <UserIcon /> },
          { value: 'bot', label: 'Bot', icon: <BotIcon /> }
        ]}
        selected={filters.actorTypes}
        onChange={(actorTypes) => onChange({ ...filters, actorTypes })}
      />
      
      {/* Date Range */}
      <DateRangePicker
        start={filters.dateRange.start}
        end={filters.dateRange.end}
        onChange={(dateRange) => onChange({ ...filters, dateRange })}
      />
      
      {/* Clear Filters */}
      <button onClick={() => onChange(defaultFilters)}>
        Clear All
      </button>
    </div>
  )
}
```

## Interaction Patterns

### Real-time Updates

```typescript
// Using SWR for real-time data synchronization
function useRealtimeWorkflows() {
  const { data, error, mutate } = useSWR('/api/workflows', fetcher, {
    refreshInterval: 5000, // Poll every 5 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })
  
  // WebSocket integration (future)
  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL)
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data)
      mutate(current => applyUpdate(current, update), false)
    }
    
    return () => ws.close()
  }, [])
  
  return { workflows: data, error, refresh: mutate }
}
```

### Command Execution

```typescript
interface CharlieCommand {
  type: 'retry' | 'cancel' | 'approve' | 'reassign' | 'prioritize'
  target: string // Workflow or event ID
  parameters?: Record<string, any>
}

async function executeCommand(command: CharlieCommand) {
  try {
    const response = await fetch('/api/charlie/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    })
    
    if (!response.ok) throw new Error('Command failed')
    
    // Show success feedback
    toast.success(`Command executed: ${command.type}`)
    
    // Refresh affected data
    mutate('/api/workflows')
  } catch (error) {
    toast.error(`Command failed: ${error.message}`)
  }
}
```

### Keyboard Shortcuts

```typescript
const KEYBOARD_SHORTCUTS = {
  'cmd+k': 'openCommandPalette',
  'cmd+/': 'toggleSearch',
  'cmd+f': 'focusFilter',
  'cmd+r': 'refreshData',
  'cmd+i': 'toggleInsights',
  'j': 'nextEvent',
  'k': 'previousEvent',
  'enter': 'expandEvent',
  'esc': 'closeDetails'
}

function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = getKeyCombo(e)
      const action = KEYBOARD_SHORTCUTS[key]
      
      if (action) {
        e.preventDefault()
        executeAction(action)
      }
    }
    
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
```

## Responsive Design

### Breakpoints

```scss
// Mobile-first breakpoints
$screen-sm: 640px;   // Small devices
$screen-md: 768px;   // Tablets
$screen-lg: 1024px;  // Desktops
$screen-xl: 1280px;  // Large screens
$screen-2xl: 1536px; // Extra large screens
```

### Mobile Layout

```tsx
function MobileLayout() {
  const [activeView, setActiveView] = useState<'timeline' | 'workflows' | 'insights'>('timeline')
  
  return (
    <div className="mobile-layout">
      {/* Tab Navigation */}
      <TabBar 
        tabs={['timeline', 'workflows', 'insights']}
        active={activeView}
        onChange={setActiveView}
      />
      
      {/* Content Area */}
      <div className="mobile-content">
        {activeView === 'timeline' && <TimelineView />}
        {activeView === 'workflows' && <WorkflowList />}
        {activeView === 'insights' && <InsightsPanel />}
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
```

## Accessibility

### ARIA Labels

```tsx
<button 
  aria-label="Expand event details"
  aria-expanded={isExpanded}
  aria-controls={`event-details-${event.id}`}
>
  <ChevronDownIcon aria-hidden="true" />
</button>

<div 
  id={`event-details-${event.id}`}
  role="region"
  aria-labelledby={`event-title-${event.id}`}
>
  {/* Event details content */}
</div>
```

### Focus Management

```typescript
function useFocusTrap(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
    
    element.addEventListener('keydown', handleTab)
    return () => element.removeEventListener('keydown', handleTab)
  }, [ref])
}
```

## Animation Patterns

### Timeline Animations

```scss
// Smooth timeline scrolling
.timeline-container {
  scroll-behavior: smooth;
  
  // New event animation
  .timeline-event {
    animation: slideIn 0.3s ease-out;
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  }
}

// Status transitions
.status-indicator {
  transition: background-color 0.2s ease;
  
  &.pending { background: $status-pending; }
  &.in-progress { 
    background: $status-warning;
    animation: pulse 2s infinite;
  }
  &.completed { background: $status-success; }
  &.failed { background: $status-error; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### Framer Motion Patterns

```tsx
import { motion, AnimatePresence } from 'framer-motion'

function EventCard({ event }: { event: Event }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
      className="event-card"
    >
      {/* Event content */}
    </motion.div>
  )
}

function CollapsibleDetails({ isOpen, children }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

## Performance Optimization

### Virtual Scrolling

```tsx
import { FixedSizeList } from 'react-window'

function VirtualTimeline({ events }: { events: Event[] }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TimelineEvent event={events[index]} />
    </div>
  )
  
  return (
    <FixedSizeList
      height={600}
      itemCount={events.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

### Lazy Loading

```tsx
import dynamic from 'next/dynamic'

// Lazy load heavy components
const InsightsPanel = dynamic(() => import('./insights-panel'), {
  loading: () => <InsightsSkeleton />,
  ssr: false
})

const EventDetailsModal = dynamic(() => import('./event-details-modal'), {
  loading: () => <ModalSkeleton />
})
```

### Memoization

```tsx
import { memo, useMemo } from 'react'

const TimelineEvent = memo(({ event }: { event: Event }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for re-render optimization
  return prevProps.event.id === nextProps.event.id &&
         prevProps.event.status === nextProps.event.status
})

function WorkflowList({ workflows }: { workflows: Workflow[] }) {
  const sortedWorkflows = useMemo(
    () => workflows.sort((a, b) => b.priority - a.priority),
    [workflows]
  )
  
  return (
    <div>
      {sortedWorkflows.map(workflow => (
        <WorkflowCard key={workflow.id} workflow={workflow} />
      ))}
    </div>
  )
}
```