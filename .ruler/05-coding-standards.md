# Charlie Command Center Coding Standards

## Overview

This document defines the coding standards and best practices for the Charlie Command Center project. All code must adhere to these standards to ensure consistency, maintainability, and quality.

## Project Philosophy

- **Command Center First**: Charlie-xyz is primarily a visualization and control center for Charlie automation instances
- **AI as Enhancement**: AI features enhance but don't define the core functionality
- **Real-time Focus**: Prioritize real-time data visualization and interaction
- **Developer Experience**: Optimize for clarity and ease of development
- **Performance Matters**: Every millisecond counts in a real-time dashboard

## TypeScript Standards

### Type Safety

```typescript
// ✅ GOOD: Explicit types with clear interfaces
interface CharlieInstance {
  id: string
  name: string
  status: 'active' | 'idle' | 'offline'
  workload: number
  lastSeen: Date
}

function updateInstance(instance: CharlieInstance): Promise<void> {
  // Implementation
}

// ❌ BAD: Using 'any' or implicit types
function updateInstance(instance: any) {
  // Avoid this
}
```

### Null Safety

```typescript
// ✅ GOOD: Handle null/undefined explicitly
function getWorkflowTitle(workflow: Workflow | null): string {
  return workflow?.title ?? 'Untitled Workflow'
}

// ❌ BAD: Assuming values exist
function getWorkflowTitle(workflow: Workflow): string {
  return workflow.title // Could crash if workflow is null
}
```

### Enums vs String Literals

```typescript
// ✅ GOOD: Use string literal unions for simple cases
type EventProvider = 'linear' | 'github'
type WorkflowStatus = 'active' | 'completed' | 'blocked' | 'idle'

// ✅ GOOD: Use enums for complex cases with behavior
enum Priority {
  Urgent = 1,
  High = 2,
  Medium = 3,
  Low = 4
}

// ❌ BAD: Using magic strings
if (status === 'ACTIVE') { } // Use typed literals instead
```

## React Patterns

### Component Structure

```typescript
// ✅ GOOD: Functional components with clear props
interface WorkflowCardProps {
  workflow: Workflow
  onSelect?: (workflow: Workflow) => void
  className?: string
}

export function WorkflowCard({ 
  workflow, 
  onSelect,
  className 
}: WorkflowCardProps) {
  // Hooks at the top
  const [isExpanded, setIsExpanded] = useState(false)
  const { user } = useAuth()
  
  // Derived state
  const isOwner = useMemo(
    () => workflow.assignee === user?.id,
    [workflow.assignee, user?.id]
  )
  
  // Event handlers
  const handleClick = useCallback(() => {
    onSelect?.(workflow)
  }, [workflow, onSelect])
  
  // Render
  return (
    <div className={cn('workflow-card', className)}>
      {/* Component JSX */}
    </div>
  )
}
```

### State Management

```typescript
// ✅ GOOD: Use Jotai for UI state
import { atom, useAtom } from 'jotai'

const selectedWorkflowAtom = atom<string | null>(null)

function WorkflowList() {
  const [selectedId, setSelectedId] = useAtom(selectedWorkflowAtom)
  // Use the atom
}

// ✅ GOOD: Use SWR for server state
import useSWR from 'swr'

function useWorkflows() {
  const { data, error, mutate } = useSWR('/api/workflows', fetcher)
  return {
    workflows: data?.workflows || [],
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  }
}
```

### Performance Optimization

```typescript
// ✅ GOOD: Memoize expensive computations
const sortedWorkflows = useMemo(
  () => workflows.sort((a, b) => b.priority - a.priority),
  [workflows]
)

// ✅ GOOD: Use React.memo for pure components
export const EventCard = memo(({ event }: { event: Event }) => {
  return <div>{/* Render event */}</div>
}, (prevProps, nextProps) => {
  return prevProps.event.id === nextProps.event.id
})

// ✅ GOOD: Use useCallback for stable references
const handleSubmit = useCallback((data: FormData) => {
  // Handle submission
}, [dependencies])
```

## API Design

### RESTful Endpoints

```typescript
// ✅ GOOD: Clear, RESTful API design
GET    /api/workflows              // List workflows
GET    /api/workflows/:id          // Get specific workflow
POST   /api/workflows              // Create workflow
PATCH  /api/workflows/:id          // Update workflow
DELETE /api/workflows/:id          // Delete workflow

GET    /api/charlie/instances      // List Charlie instances
POST   /api/charlie/command        // Execute Charlie command

// ❌ BAD: Non-RESTful patterns
GET    /api/getWorkflows           // Use /api/workflows
POST   /api/workflow/update/:id    // Use PATCH /api/workflows/:id
```

### Response Format

```typescript
// ✅ GOOD: Consistent response structure
interface ApiResponse<T> {
  data: T
  error?: string
  metadata?: {
    page?: number
    limit?: number
    total?: number
  }
}

// Success response
return Response.json({
  data: workflows,
  metadata: { total: 100, page: 1, limit: 20 }
})

// Error response
return Response.json(
  { error: 'Workflow not found' },
  { status: 404 }
)
```

## Error Handling

### Try-Catch Patterns

```typescript
// ✅ GOOD: Comprehensive error handling
async function fetchWorkflow(id: string): Promise<Workflow> {
  try {
    const response = await fetch(`/api/workflows/${id}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch workflow: ${response.status}`)
    }
    
    const data = await response.json()
    return data.workflow
  } catch (error) {
    console.error('Error fetching workflow:', error)
    
    // Re-throw with context
    throw new Error(
      `Unable to load workflow ${id}: ${error.message}`
    )
  }
}
```

### Error Boundaries

```typescript
// ✅ GOOD: Use error boundaries for component trees
export class WorkflowErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Workflow error:', error, errorInfo)
    // Log to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    
    return this.props.children
  }
}
```

## File Organization

### Directory Structure

```
apps/app/src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── (dashboard)/       # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Generic UI components
│   ├── charlie/          # Charlie-specific components
│   └── workflow/         # Workflow components
├── lib/                   # Utilities and helpers
│   ├── api.ts           # API client
│   ├── utils.ts         # General utilities
│   └── constants.ts     # App constants
├── hooks/                # Custom React hooks
├── atoms/                # Jotai atoms
├── types/                # TypeScript types
└── styles/               # Global styles
```

### File Naming

```typescript
// ✅ GOOD: Consistent naming conventions
workflow-card.tsx         // Component files (kebab-case)
WorkflowCard             // Component names (PascalCase)
useWorkflows.ts          // Hook files (camelCase with 'use' prefix)
workflow.types.ts        // Type definition files
workflow.test.ts         // Test files
CONSTANTS.ts             // Constants files (UPPERCASE)

// ❌ BAD: Inconsistent naming
WorkflowCard.tsx         // Don't use PascalCase for files
workflow_card.tsx        // Don't use snake_case
workflowcard.tsx         // Don't omit separators
```

## Testing Standards

### Unit Tests

```typescript
// ✅ GOOD: Comprehensive unit tests
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkflowCard } from './workflow-card'

describe('WorkflowCard', () => {
  const mockWorkflow = {
    id: 'WF-001',
    title: 'Test Workflow',
    status: 'active'
  }
  
  it('renders workflow title', () => {
    render(<WorkflowCard workflow={mockWorkflow} />)
    expect(screen.getByText('Test Workflow')).toBeInTheDocument()
  })
  
  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn()
    render(
      <WorkflowCard 
        workflow={mockWorkflow} 
        onSelect={onSelect} 
      />
    )
    
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(mockWorkflow)
  })
})
```

### Integration Tests

```typescript
// ✅ GOOD: Test API endpoints
import { testApiHandler } from 'next-test-api-route-handler'
import * as handler from '@/app/api/workflows/route'

describe('/api/workflows', () => {
  it('returns workflows list', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: 'GET' })
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data.workflows).toBeInstanceOf(Array)
      }
    })
  })
})
```

## Performance Guidelines

### Image Optimization

```typescript
// ✅ GOOD: Use Next.js Image component
import Image from 'next/image'

<Image
  src="/charlie-logo.svg"
  alt="Charlie"
  width={40}
  height={40}
  priority
/>

// ❌ BAD: Using plain img tags
<img src="/charlie-logo.svg" alt="Charlie" />
```

### Code Splitting

```typescript
// ✅ GOOD: Lazy load heavy components
import dynamic from 'next/dynamic'

const InsightsPanel = dynamic(
  () => import('./insights-panel'),
  { 
    loading: () => <InsightsSkeleton />,
    ssr: false 
  }
)
```

### Data Fetching

```typescript
// ✅ GOOD: Use proper caching strategies
const { data } = useSWR(
  '/api/workflows',
  fetcher,
  {
    refreshInterval: 5000,        // Refresh every 5s
    revalidateOnFocus: false,     // Don't refetch on focus
    dedupingInterval: 2000,       // Dedupe requests within 2s
    fallbackData: initialData     // Use initial data
  }
)
```

## Security Standards

### Input Validation

```typescript
// ✅ GOOD: Validate all inputs
import { z } from 'zod'

const WorkflowSchema = z.object({
  title: z.string().min(1).max(200),
  status: z.enum(['active', 'completed', 'blocked', 'idle']),
  assignee: z.string().uuid().optional()
})

function validateWorkflow(data: unknown): Workflow {
  return WorkflowSchema.parse(data)
}
```

### Authentication

```typescript
// ✅ GOOD: Check authentication on protected routes
import { auth } from '@clerk/nextjs'

export async function GET(request: NextRequest) {
  const { userId } = auth()
  
  if (!userId) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Continue with authenticated request
}
```

### Sanitization

```typescript
// ✅ GOOD: Sanitize user input
import DOMPurify from 'isomorphic-dompurify'

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  })
}
```

## Documentation Standards

### Component Documentation

```typescript
/**
 * WorkflowCard displays a workflow summary with status and actions.
 * 
 * @component
 * @example
 * ```tsx
 * <WorkflowCard 
 *   workflow={workflow}
 *   onSelect={handleSelect}
 *   className="custom-class"
 * />
 * ```
 */
export function WorkflowCard({ workflow, onSelect, className }: WorkflowCardProps) {
  // Implementation
}
```

### Function Documentation

```typescript
/**
 * Fetches workflows from the API with optional filters.
 * 
 * @param filters - Optional filters to apply
 * @returns Promise resolving to array of workflows
 * @throws {Error} If the API request fails
 * 
 * @example
 * ```ts
 * const workflows = await fetchWorkflows({ status: 'active' })
 * ```
 */
async function fetchWorkflows(filters?: WorkflowFilters): Promise<Workflow[]> {
  // Implementation
}
```

## Git Commit Standards

### Commit Message Format

```bash
# ✅ GOOD: Clear, conventional commits
feat: add workflow timeline visualization
fix: resolve Charlie instance connection timeout
refactor: extract workflow correlation logic
docs: update command center architecture
test: add workflow card unit tests
perf: optimize event batch processing
style: update dashboard color scheme
chore: upgrade dependencies

# ❌ BAD: Vague or unclear commits
update files
fix bug
WIP
changes
```

### Branch Naming

```bash
# ✅ GOOD: Descriptive branch names
feature/workflow-timeline
fix/charlie-connection-timeout
refactor/event-processing
docs/api-documentation
test/workflow-components

# ❌ BAD: Unclear branch names
new-feature
fix-123
update
temp
```

## Code Review Checklist

Before submitting code for review, ensure:

- [ ] TypeScript compiles without errors
- [ ] Biome check passes (linting and formatting)
- [ ] All tests pass
- [ ] New features have tests
- [ ] Complex logic has comments
- [ ] API changes are documented
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Accessibility standards met
- [ ] Mobile responsiveness verified

## Accessibility Standards

### ARIA Labels

```tsx
// ✅ GOOD: Proper ARIA labels
<button
  aria-label="Select workflow"
  aria-pressed={isSelected}
  aria-describedby="workflow-help"
>
  {workflow.title}
</button>

<div role="status" aria-live="polite">
  {loading && 'Loading workflows...'}
</div>
```

### Keyboard Navigation

```tsx
// ✅ GOOD: Support keyboard navigation
function WorkflowList() {
  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowDown':
        focusWorkflow(index + 1)
        break
      case 'ArrowUp':
        focusWorkflow(index - 1)
        break
      case 'Enter':
        selectWorkflow(index)
        break
    }
  }
  
  return (
    <ul role="list">
      {workflows.map((workflow, index) => (
        <li
          key={workflow.id}
          tabIndex={0}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          {workflow.title}
        </li>
      ))}
    </ul>
  )
}
```

## Environment Configuration

### Environment Variables

```bash
# ✅ GOOD: Clear, documented environment variables
# Required
ANTHROPIC_API_KEY=sk-ant-api03-...  # Anthropic API key for AI analysis
DATABASE_URL=postgresql://...        # PostgreSQL connection string

# Optional
ENABLE_AI_INSIGHTS=true             # Enable AI analysis features
ENABLE_REAL_TIME=false              # Enable WebSocket connections

# ❌ BAD: Unclear or undocumented variables
API_KEY=...                         # Which API?
URL=...                            # URL to what?
FLAG_1=true                        # What does this control?
```

## Monitoring and Logging

### Structured Logging

```typescript
// ✅ GOOD: Structured, contextual logging
import { logger } from '@/lib/logger'

logger.info('Workflow created', {
  workflowId: workflow.id,
  userId: user.id,
  timestamp: new Date().toISOString()
})

logger.error('Failed to fetch workflows', {
  error: error.message,
  stack: error.stack,
  userId: user.id
})

// ❌ BAD: Unstructured console logs
console.log('workflow created')
console.error(error)
```

### Performance Monitoring

```typescript
// ✅ GOOD: Track performance metrics
import { performance } from '@/lib/monitoring'

async function analyzeWorkflow(workflow: Workflow) {
  const startTime = performance.now()
  
  try {
    const result = await performAnalysis(workflow)
    
    performance.track('workflow.analysis.success', {
      duration: performance.now() - startTime,
      workflowId: workflow.id
    })
    
    return result
  } catch (error) {
    performance.track('workflow.analysis.error', {
      duration: performance.now() - startTime,
      workflowId: workflow.id,
      error: error.message
    })
    
    throw error
  }
}
```