# Charlie Command Center Data Flow

## Overview

The Charlie Command Center orchestrates data flow between multiple Charlie automation instances, Linear, GitHub, and the visualization layer. This document details how data flows through the system, from event ingestion to user interaction.

## Data Architecture

### Primary Data Sources

```typescript
interface DataSources {
  charlie: {
    instances: CharlieInstance[]     // Multiple Charlie bots
    webhooks: WebhookEndpoint[]      // Real-time updates
    polling: PollingConfig           // Fallback data sync
  }
  linear: {
    api: LinearAPIClient
    webhooks: LinearWebhook
    sync: SyncConfiguration
  }
  github: {
    api: GitHubAPIClient
    webhooks: GitHubWebhook
    apps: GitHubApp[]
  }
}
```

## Event Processing Pipeline

### 1. Event Ingestion

```typescript
// Event ingestion from multiple sources
class EventIngestionService {
  private eventQueue: Queue<RawEvent>
  private processors: Map<string, EventProcessor>
  
  async ingestLinearEvent(event: LinearWebhookPayload): Promise<void> {
    const normalized = this.normalizeLinearEvent(event)
    await this.eventQueue.push({
      source: 'linear',
      timestamp: new Date(),
      data: normalized
    })
  }
  
  async ingestGitHubEvent(event: GitHubWebhookPayload): Promise<void> {
    const normalized = this.normalizeGitHubEvent(event)
    await this.eventQueue.push({
      source: 'github',
      timestamp: new Date(),
      data: normalized
    })
  }
  
  async ingestCharlieEvent(event: CharlieActivityEvent): Promise<void> {
    await this.eventQueue.push({
      source: 'charlie',
      timestamp: new Date(),
      data: event
    })
  }
}
```

### 2. Event Normalization

```typescript
// Normalize events to common format
interface NormalizedEvent {
  id: string
  timestamp: string
  source: 'linear' | 'github' | 'charlie'
  type: EventType
  actor: {
    id: string
    name: string
    type: 'charlie' | 'human' | 'bot'
    instance?: string // Which Charlie instance
  }
  target: {
    type: 'issue' | 'pr' | 'commit' | 'review' | 'comment'
    id: string
    title: string
    url: string
  }
  workflow?: {
    id: string
    name: string
    stage: string
  }
  payload: any
  metadata: {
    correlationId?: string
    parentEventId?: string
    tags: string[]
  }
}

function normalizeLinearEvent(event: LinearEvent): NormalizedEvent {
  return {
    id: generateEventId('linear', event),
    timestamp: event.createdAt,
    source: 'linear',
    type: mapLinearEventType(event.type),
    actor: extractLinearActor(event),
    target: {
      type: 'issue',
      id: event.data.id,
      title: event.data.title,
      url: event.data.url
    },
    workflow: detectWorkflow(event),
    payload: event.data,
    metadata: {
      correlationId: event.webhookId,
      tags: extractTags(event)
    }
  }
}
```

### 3. Workflow Correlation

```typescript
// Correlate events into workflows
class WorkflowCorrelator {
  private workflows: Map<string, Workflow> = new Map()
  
  async correlateEvent(event: NormalizedEvent): Promise<Workflow> {
    // Try to find existing workflow
    let workflow = this.findWorkflowForEvent(event)
    
    if (!workflow) {
      // Create new workflow if needed
      workflow = this.createWorkflow(event)
    }
    
    // Add event to workflow
    workflow.events.push(event)
    workflow.lastUpdated = new Date()
    workflow.status = this.calculateStatus(workflow)
    
    // Update workflow state
    this.workflows.set(workflow.id, workflow)
    
    // Emit update for real-time sync
    this.emitWorkflowUpdate(workflow)
    
    return workflow
  }
  
  private findWorkflowForEvent(event: NormalizedEvent): Workflow | null {
    // Check for explicit workflow ID
    if (event.workflow?.id) {
      return this.workflows.get(event.workflow.id)
    }
    
    // Try to match by Linear issue or GitHub PR
    for (const workflow of this.workflows.values()) {
      if (this.eventBelongsToWorkflow(event, workflow)) {
        return workflow
      }
    }
    
    return null
  }
  
  private eventBelongsToWorkflow(event: NormalizedEvent, workflow: Workflow): boolean {
    // Match by Linear issue key
    if (event.source === 'linear' && workflow.linearIssueKey === event.target.id) {
      return true
    }
    
    // Match by GitHub PR number
    if (event.source === 'github' && workflow.github?.prNumber === parseInt(event.target.id)) {
      return true
    }
    
    // Match by correlation ID
    if (event.metadata.correlationId && workflow.correlationIds.includes(event.metadata.correlationId)) {
      return true
    }
    
    return false
  }
}
```

## State Management

### Client-Side State (Jotai)

```typescript
// Atoms for UI state management
import { atom } from 'jotai'

// Core data atoms
export const workflowsAtom = atom<Workflow[]>([])
export const eventsAtom = atom<NormalizedEvent[]>([])
export const charlieInstancesAtom = atom<CharlieInstance[]>([])

// Derived atoms
export const activeWorkflowsAtom = atom(
  get => get(workflowsAtom).filter(w => w.status === 'active')
)

export const charlieWorkloadsAtom = atom(
  get => {
    const workflows = get(workflowsAtom)
    const instances = get(charlieInstancesAtom)
    
    return instances.map(instance => ({
      instance,
      activeWorkflows: workflows.filter(w => 
        w.assignee === instance.id && w.status === 'active'
      ),
      completedToday: workflows.filter(w =>
        w.assignee === instance.id && 
        w.status === 'completed' &&
        isToday(w.completedAt)
      ).length
    }))
  }
)

// Filter state
export const filtersAtom = atom<FilterState>({
  providers: ['linear', 'github'],
  eventTypes: [],
  actorTypes: ['charlie', 'human', 'bot'],
  dateRange: { start: null, end: null }
})

// Filtered events
export const filteredEventsAtom = atom(
  get => {
    const events = get(eventsAtom)
    const filters = get(filtersAtom)
    
    return events.filter(event => 
      matchesFilters(event, filters)
    )
  }
)
```

### Server State (SWR)

```typescript
// SWR hooks for server state
import useSWR from 'swr'

export function useWorkflows() {
  const { data, error, mutate } = useSWR(
    '/api/workflows',
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      dedupingInterval: 2000
    }
  )
  
  return {
    workflows: data?.workflows || [],
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  }
}

export function useCharlieInstances() {
  const { data, error } = useSWR(
    '/api/charlie/instances',
    fetcher,
    {
      refreshInterval: 30000, // Less frequent updates
      revalidateOnFocus: false
    }
  )
  
  return {
    instances: data?.instances || [],
    isLoading: !error && !data,
    isError: error
  }
}

export function useEventStream(workflowId?: string) {
  const key = workflowId 
    ? `/api/events?workflow=${workflowId}`
    : '/api/events'
    
  const { data, error, mutate } = useSWR(
    key,
    fetcher,
    {
      refreshInterval: 3000,
      revalidateOnFocus: true
    }
  )
  
  // WebSocket augmentation for real-time updates
  useEffect(() => {
    if (!data) return
    
    const ws = new WebSocket(`${WS_URL}/events`)
    
    ws.onmessage = (message) => {
      const event = JSON.parse(message.data)
      
      // Optimistically update local data
      mutate(current => ({
        ...current,
        events: [...current.events, event]
      }), false)
    }
    
    return () => ws.close()
  }, [data, mutate])
  
  return {
    events: data?.events || [],
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  }
}
```

## API Layer

### RESTful Endpoints

```typescript
// GET /api/workflows
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const assignee = searchParams.get('assignee')
  const provider = searchParams.get('provider')
  
  const workflows = await getWorkflows({
    status,
    assignee,
    provider
  })
  
  return Response.json({ workflows })
}

// GET /api/events
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const workflowId = searchParams.get('workflow')
  const since = searchParams.get('since')
  const limit = parseInt(searchParams.get('limit') || '100')
  
  const events = await getEvents({
    workflowId,
    since: since ? new Date(since) : undefined,
    limit
  })
  
  return Response.json({ events })
}

// POST /api/charlie/command
export async function POST(request: NextRequest) {
  const command = await request.json()
  
  // Validate command
  const validated = validateCommand(command)
  if (!validated.success) {
    return Response.json(
      { error: validated.error },
      { status: 400 }
    )
  }
  
  // Execute command
  const result = await executeCharlieCommand(validated.data)
  
  // Log command execution
  await logCommandExecution(command, result)
  
  return Response.json({ result })
}
```

### WebSocket Connections

```typescript
// WebSocket server for real-time updates
class WebSocketServer {
  private connections: Map<string, WebSocket> = new Map()
  
  handleConnection(ws: WebSocket, request: Request) {
    const clientId = generateClientId()
    this.connections.set(clientId, ws)
    
    // Send initial state
    ws.send(JSON.stringify({
      type: 'connection',
      clientId,
      timestamp: new Date()
    }))
    
    // Handle messages
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString())
      this.handleMessage(clientId, message)
    })
    
    // Handle disconnect
    ws.on('close', () => {
      this.connections.delete(clientId)
    })
  }
  
  broadcast(event: any) {
    const message = JSON.stringify(event)
    
    for (const ws of this.connections.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message)
      }
    }
  }
  
  sendToClient(clientId: string, event: any) {
    const ws = this.connections.get(clientId)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event))
    }
  }
}
```

## Data Storage

### Database Schema

```sql
-- Charlie instances
CREATE TABLE charlie_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'production', 'staging', 'development'
  status VARCHAR(50) NOT NULL, -- 'active', 'idle', 'offline'
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflows
CREATE TABLE workflows (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL,
  assignee VARCHAR(255),
  priority VARCHAR(20),
  linear_issue_key VARCHAR(50),
  github_pr_number INTEGER,
  github_repo VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Events
CREATE TABLE events (
  id VARCHAR(255) PRIMARY KEY,
  workflow_id VARCHAR(255) REFERENCES workflows(id),
  timestamp TIMESTAMPTZ NOT NULL,
  source VARCHAR(50) NOT NULL,
  type VARCHAR(100) NOT NULL,
  actor_id VARCHAR(255),
  actor_name VARCHAR(255),
  actor_type VARCHAR(50),
  target_type VARCHAR(50),
  target_id VARCHAR(255),
  target_title TEXT,
  payload JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_events_workflow_id ON events(workflow_id);
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_events_source ON events(source);
CREATE INDEX idx_events_actor_id ON events(actor_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_assignee ON workflows(assignee);
```

### Caching Strategy

```typescript
// Redis caching for frequently accessed data
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN
})

class CacheService {
  private readonly TTL = {
    workflows: 60,        // 1 minute
    events: 30,          // 30 seconds
    instances: 300,      // 5 minutes
    analysis: 600        // 10 minutes
  }
  
  async getWorkflows(key: string): Promise<Workflow[] | null> {
    const cached = await redis.get(`workflows:${key}`)
    return cached ? JSON.parse(cached) : null
  }
  
  async setWorkflows(key: string, workflows: Workflow[]): Promise<void> {
    await redis.setex(
      `workflows:${key}`,
      this.TTL.workflows,
      JSON.stringify(workflows)
    )
  }
  
  async invalidateWorkflow(workflowId: string): Promise<void> {
    const keys = await redis.keys(`workflows:*`)
    
    // Invalidate all cache entries containing this workflow
    for (const key of keys) {
      const workflows = await this.getWorkflows(key)
      if (workflows?.some(w => w.id === workflowId)) {
        await redis.del(key)
      }
    }
  }
}
```

## Data Synchronization

### Multi-Source Sync

```typescript
class DataSyncService {
  private syncState: Map<string, SyncState> = new Map()
  
  async syncLinearData(): Promise<void> {
    const lastSync = this.syncState.get('linear')?.lastSync || new Date(0)
    
    // Fetch updates since last sync
    const updates = await this.linear.getUpdatesSince(lastSync)
    
    // Process updates
    for (const update of updates) {
      await this.processLinearUpdate(update)
    }
    
    // Update sync state
    this.syncState.set('linear', {
      lastSync: new Date(),
      itemsSynced: updates.length
    })
  }
  
  async syncGitHubData(): Promise<void> {
    const lastSync = this.syncState.get('github')?.lastSync || new Date(0)
    
    // Fetch updates since last sync
    const updates = await this.github.getUpdatesSince(lastSync)
    
    // Process updates
    for (const update of updates) {
      await this.processGitHubUpdate(update)
    }
    
    // Update sync state
    this.syncState.set('github', {
      lastSync: new Date(),
      itemsSynced: updates.length
    })
  }
  
  async syncCharlieInstances(): Promise<void> {
    const instances = await this.getCharlieInstances()
    
    for (const instance of instances) {
      const health = await this.checkInstanceHealth(instance)
      const workload = await this.getInstanceWorkload(instance)
      
      await this.updateInstanceState(instance.id, {
        health,
        workload,
        lastSeen: new Date()
      })
    }
  }
}
```

### Conflict Resolution

```typescript
interface ConflictResolution {
  strategy: 'latest-wins' | 'merge' | 'manual'
  resolver?: (a: any, b: any) => any
}

class ConflictResolver {
  resolve<T>(local: T, remote: T, resolution: ConflictResolution): T {
    switch (resolution.strategy) {
      case 'latest-wins':
        return this.latestWins(local, remote)
      
      case 'merge':
        return this.merge(local, remote)
      
      case 'manual':
        if (!resolution.resolver) {
          throw new Error('Manual resolution requires resolver function')
        }
        return resolution.resolver(local, remote)
      
      default:
        return remote // Default to remote
    }
  }
  
  private latestWins<T>(local: T, remote: T): T {
    const localTime = (local as any).updatedAt || 0
    const remoteTime = (remote as any).updatedAt || 0
    
    return localTime > remoteTime ? local : remote
  }
  
  private merge<T>(local: T, remote: T): T {
    // Deep merge objects
    if (typeof local === 'object' && typeof remote === 'object') {
      return { ...local, ...remote }
    }
    
    // Arrays: concatenate and dedupe
    if (Array.isArray(local) && Array.isArray(remote)) {
      return [...new Set([...local, ...remote])] as T
    }
    
    // Primitives: prefer remote
    return remote
  }
}
```

## Performance Optimization

### Query Optimization

```typescript
// Optimized queries with pagination and filtering
class QueryOptimizer {
  async getWorkflowsOptimized(params: WorkflowQuery): Promise<PaginatedResult<Workflow>> {
    const query = this.db
      .select()
      .from(workflows)
      .where(this.buildWhereClause(params))
      .orderBy(desc(workflows.updatedAt))
      .limit(params.limit || 50)
      .offset(params.offset || 0)
    
    // Include event count without N+1
    const withEventCounts = await this.db.raw(`
      SELECT w.*, COUNT(e.id) as event_count
      FROM workflows w
      LEFT JOIN events e ON w.id = e.workflow_id
      WHERE ${this.buildWhereClause(params)}
      GROUP BY w.id
      ORDER BY w.updated_at DESC
      LIMIT ${params.limit || 50}
      OFFSET ${params.offset || 0}
    `)
    
    const total = await this.db
      .select(count())
      .from(workflows)
      .where(this.buildWhereClause(params))
    
    return {
      items: withEventCounts,
      total: total[0].count,
      hasMore: (params.offset || 0) + withEventCounts.length < total[0].count
    }
  }
}
```

### Batch Processing

```typescript
// Batch event processing for efficiency
class BatchProcessor {
  private batch: Event[] = []
  private batchSize = 100
  private flushInterval = 1000 // 1 second
  private timer: NodeJS.Timeout | null = null
  
  async addEvent(event: Event): Promise<void> {
    this.batch.push(event)
    
    if (this.batch.length >= this.batchSize) {
      await this.flush()
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval)
    }
  }
  
  private async flush(): Promise<void> {
    if (this.batch.length === 0) return
    
    const events = [...this.batch]
    this.batch = []
    
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    
    // Process batch
    await this.processBatch(events)
  }
  
  private async processBatch(events: Event[]): Promise<void> {
    // Bulk insert to database
    await this.db.insert(eventsTable).values(events)
    
    // Update affected workflows in parallel
    const workflowIds = [...new Set(events.map(e => e.workflowId))]
    await Promise.all(
      workflowIds.map(id => this.updateWorkflow(id))
    )
    
    // Broadcast updates
    this.broadcastEvents(events)
  }
}
```

## Error Handling

### Retry Logic

```typescript
class RetryService {
  async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number
      backoff?: 'linear' | 'exponential'
      initialDelay?: number
    } = {}
  ): Promise<T> {
    const maxAttempts = options.maxAttempts || 3
    const backoff = options.backoff || 'exponential'
    const initialDelay = options.initialDelay || 1000
    
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxAttempts) {
          throw lastError
        }
        
        const delay = backoff === 'exponential'
          ? initialDelay * Math.pow(2, attempt - 1)
          : initialDelay * attempt
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError!
  }
}
```

### Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0
  private lastFailureTime: Date | null = null
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime!.getTime() > this.timeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }
    
    try {
      const result = await fn()
      
      if (this.state === 'half-open') {
        this.state = 'closed'
        this.failures = 0
      }
      
      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = new Date()
      
      if (this.failures >= this.threshold) {
        this.state = 'open'
      }
      
      throw error
    }
  }
}
```