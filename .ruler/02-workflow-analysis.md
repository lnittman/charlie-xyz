# Workflow Analysis Patterns & AI Implementation

## AI/LLM Insight & Action Extraction Flow

### Overview
The Charlie platform implements a sophisticated AI-driven workflow analysis system that extracts actionable insights from development workflows across Linear and GitHub. This document details the complete flow from data ingestion to insight presentation.

## Complete Analysis Flow

### 1. Data Collection Phase

```typescript
// Data flows from static JSON or real-time API
interface DataSource {
  workflows: Workflow[]  // Linear issues with GitHub PR links
  events: Event[]       // Chronological event stream
}

// Workflow structure
interface Workflow {
  id: string           // WF-BOT-XXXX format
  name: string         // Human-readable title
  linearIssueKey: string
  github?: {
    owner: string
    repo: string
    prNumber: number
  }
}

// Event structure  
interface Event {
  id: string
  ts: string          // ISO timestamp
  provider: 'linear' | 'github'
  type: string        // Event type identifier
  workflowId: string
  sequence: number
  actor: Actor
  entity: Entity
  payload?: any
}
```

### 2. Pre-processing Phase

```typescript
// Located in: apps/app/src/components/dashboard.tsx
function processWorkflowData(data: RawData): ProcessedData {
  // Sort events chronologically
  const sortedEvents = events.sort((a, b) => 
    new Date(a.ts).getTime() - new Date(b.ts).getTime()
  )
  
  // Group events by workflow
  const workflowGroups = groupEventsByWorkflow(sortedEvents)
  
  // Calculate workflow metrics
  const metrics = calculateMetrics(workflowGroups)
  
  return { workflows, events: sortedEvents, metrics }
}
```

### 3. AI Analysis Request

```typescript
// Located in: apps/app/src/app/api/ai/analyze/route.ts
async function analyzeWorkflows(data: ProcessedData) {
  const response = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflows: data.workflows,
      events: data.events,
      settings: {
        aiModel: selectedModel // User-configurable
      }
    })
  })
  
  return response.json()
}
```

### 4. LLM Processing

```typescript
// AI endpoint implementation
export async function POST(request: NextRequest) {
  const { workflows, events, settings } = await request.json()
  
  // Initialize AI client with API key
  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })
  
  // Generate analysis using structured prompt
  const result = await generateText({
    model: anthropic.languageModel(settings.aiModel),
    system: WORKFLOW_ANALYSIS_PROMPT,
    prompt: formatWorkflowData(workflows, events),
    temperature: 0.3 // Lower temperature for consistency
  })
  
  // Parse and validate response
  const analysis = JSON.parse(result.text)
  return Response.json(analysis)
}
```

### 5. Insight Extraction

The LLM generates structured insights in this format:

```json
{
  "insights": {
    "summary": "High-level state assessment",
    "metrics": {
      "totalWorkflows": 5,
      "activeWorkflows": 2,
      "completedWorkflows": 3,
      "averageCompletionTime": "2.5 hours",
      "bottlenecks": [
        "CI/CD failures causing delays",
        "Review response time averaging 45 minutes"
      ]
    }
  },
  "workflows": [
    {
      "id": "WF-BOT-5001",
      "narrative": "Feature development completed efficiently with minor type errors",
      "status": "completed",
      "importance": 8,
      "nextSteps": [
        {
          "action": "Deploy to staging environment",
          "reasoning": "All tests passing, ready for QA",
          "confidence": 0.95
        }
      ],
      "insights": [
        "Quick turnaround from assignment to completion",
        "Type errors caught by CI prevented initial merge"
      ],
      "estimatedCompletion": null
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "action": "Implement pre-commit type checking",
      "reasoning": "Would prevent 60% of CI failures",
      "affectedWorkflows": ["WF-BOT-5001", "WF-BOT-5003"]
    }
  ]
}
```

### 6. Visualization & Presentation

```typescript
// Dashboard component rendering
function InsightsPanel({ analysis }: { analysis: Analysis }) {
  return (
    <div className="insights-panel">
      {/* Summary Section */}
      <SummaryCard summary={analysis.insights.summary} />
      
      {/* Metrics Dashboard */}
      <MetricsGrid metrics={analysis.insights.metrics} />
      
      {/* Workflow Narratives */}
      {analysis.workflows.map(workflow => (
        <WorkflowCard 
          key={workflow.id}
          workflow={workflow}
          onActionClick={handleAction}
        />
      ))}
      
      {/* Recommendations */}
      <RecommendationsList 
        recommendations={analysis.recommendations}
      />
    </div>
  )
}
```

## Pattern Recognition Algorithms

### 1. Bottleneck Detection

```typescript
interface BottleneckPattern {
  type: 'ci_failure' | 'review_delay' | 'assignment_gap' | 'merge_conflict'
  frequency: number
  avgDelay: number // minutes
  affectedWorkflows: string[]
}

function detectBottlenecks(events: Event[]): BottleneckPattern[] {
  const patterns: BottleneckPattern[] = []
  
  // CI Failure Detection
  const ciFailures = events.filter(e => 
    e.type === 'ci.check_run' && 
    e.payload?.check?.conclusion === 'failure'
  )
  
  // Review Delay Detection
  const reviewDelays = calculateReviewResponseTimes(events)
  
  // Assignment Gap Detection
  const assignmentGaps = findUnassignedPeriods(events)
  
  return aggregatePatterns([ciFailures, reviewDelays, assignmentGaps])
}
```

### 2. Workflow Classification

```typescript
enum WorkflowType {
  FEATURE = 'feature',
  BUG_FIX = 'bug_fix',
  REFACTOR = 'refactor',
  DOCUMENTATION = 'documentation',
  INFRASTRUCTURE = 'infrastructure'
}

function classifyWorkflow(workflow: Workflow): WorkflowType {
  const name = workflow.name.toLowerCase()
  
  if (name.includes('feature')) return WorkflowType.FEATURE
  if (name.includes('bug') || name.includes('fix')) return WorkflowType.BUG_FIX
  if (name.includes('refactor')) return WorkflowType.REFACTOR
  if (name.includes('docs')) return WorkflowType.DOCUMENTATION
  if (name.includes('infra') || name.includes('ci')) return WorkflowType.INFRASTRUCTURE
  
  return WorkflowType.FEATURE // default
}
```

### 3. Performance Metrics Calculation

```typescript
interface WorkflowMetrics {
  leadTime: number        // Issue creation to close
  cycleTime: number       // First commit to merge
  reviewTime: number      // PR open to approval
  deployTime: number      // Merge to production
  iterationCount: number  // Number of review cycles
}

function calculateMetrics(workflow: Workflow, events: Event[]): WorkflowMetrics {
  const workflowEvents = events.filter(e => e.workflowId === workflow.id)
  
  // Lead Time: Issue created to closed
  const issueCreated = findEvent(workflowEvents, 'issue.created')
  const issueClosed = findEvent(workflowEvents, 'issue.closed')
  const leadTime = timeDiff(issueCreated, issueClosed)
  
  // Cycle Time: First commit to merge
  const firstCommit = findEvent(workflowEvents, 'pr.commit_pushed')
  const prMerged = findEvent(workflowEvents, 'pr.merged')
  const cycleTime = timeDiff(firstCommit, prMerged)
  
  // Review Time: PR opened to approval
  const prOpened = findEvent(workflowEvents, 'pr.opened')
  const prApproved = findEvent(workflowEvents, 'pr.review_submitted', 
    e => e.payload?.review?.state === 'approved'
  )
  const reviewTime = timeDiff(prOpened, prApproved)
  
  return { leadTime, cycleTime, reviewTime, deployTime: 0, iterationCount: 0 }
}
```

## AI Model Optimization

### Prompt Engineering

```typescript
const WORKFLOW_ANALYSIS_PROMPT = `
<role>
You are an intelligent workflow analyzer for Charlie, specializing in 
development process optimization and bottleneck detection.
</role>

<context>
Charlie automates development workflows across Linear and GitHub, helping teams:
- Track issue lifecycle from creation to deployment
- Monitor PR review and merge processes
- Identify and resolve bottlenecks
- Optimize team productivity
</context>

<analysis_framework>
1. Temporal Analysis: Identify time-based patterns and delays
2. Actor Analysis: Evaluate individual and team performance
3. Process Analysis: Find inefficiencies in workflow steps
4. Dependency Analysis: Discover blocking relationships
5. Predictive Analysis: Estimate completion times and risks
</analysis_framework>

<output_requirements>
- Provide narratives that tell the story of each workflow
- Identify specific, actionable bottlenecks
- Rank workflows by importance and urgency
- Generate concrete next steps with confidence scores
- Suggest process improvements with expected impact
</output_requirements>
`
```

### Model Selection Strategy

```typescript
interface ModelSelectionCriteria {
  speed: 'fast' | 'balanced' | 'thorough'
  depth: 'surface' | 'standard' | 'deep'
  cost: 'economy' | 'standard' | 'premium'
}

function selectOptimalModel(criteria: ModelSelectionCriteria): string {
  // Fast, surface analysis - use Haiku or Gemini Flash
  if (criteria.speed === 'fast' && criteria.depth === 'surface') {
    return 'claude-3-5-haiku-20241022'
  }
  
  // Balanced performance - use Sonnet or GPT-4
  if (criteria.speed === 'balanced' && criteria.depth === 'standard') {
    return 'claude-3-5-sonnet-20241022' // default
  }
  
  // Deep analysis - use Opus or GPT-4 Turbo
  if (criteria.depth === 'deep') {
    return 'claude-3-opus-20240229'
  }
  
  return 'claude-3-5-sonnet-20241022' // fallback
}
```

## Real-time Processing

### Event Stream Processing

```typescript
class WorkflowEventProcessor {
  private eventQueue: Event[] = []
  private analysisCache: Map<string, Analysis> = new Map()
  
  async processEvent(event: Event): Promise<void> {
    // Add to queue
    this.eventQueue.push(event)
    
    // Batch processing every 10 events or 30 seconds
    if (this.shouldProcessBatch()) {
      await this.processBatch()
    }
  }
  
  private async processBatch(): Promise<void> {
    const events = this.eventQueue.splice(0, this.eventQueue.length)
    
    // Group by workflow for efficient analysis
    const workflowGroups = this.groupByWorkflow(events)
    
    // Analyze each affected workflow
    for (const [workflowId, workflowEvents] of workflowGroups) {
      const analysis = await this.analyzeWorkflow(workflowId, workflowEvents)
      this.analysisCache.set(workflowId, analysis)
      
      // Emit update for UI
      this.emitUpdate(workflowId, analysis)
    }
  }
}
```

### Incremental Analysis

```typescript
interface IncrementalAnalysis {
  baseAnalysis: Analysis
  newEvents: Event[]
  updatedInsights: Partial<Analysis>
}

async function performIncrementalAnalysis(
  previous: Analysis,
  newEvents: Event[]
): Promise<Analysis> {
  // Only analyze what changed
  const affectedWorkflows = getAffectedWorkflows(newEvents)
  
  // Request focused update from AI
  const incrementalUpdate = await generateText({
    model: anthropic.languageModel('claude-3-5-haiku-20241022'), // Fast model
    prompt: `
      Previous analysis: ${JSON.stringify(previous)}
      New events: ${JSON.stringify(newEvents)}
      
      Update only the affected portions of the analysis.
    `,
    temperature: 0.2 // Even lower for consistency
  })
  
  // Merge with previous analysis
  return mergeAnalysis(previous, incrementalUpdate)
}
```

## Performance Optimization

### Caching Strategy

```typescript
class AnalysisCache {
  private cache: Map<string, CachedAnalysis> = new Map()
  private maxAge = 5 * 60 * 1000 // 5 minutes
  
  get(key: string): Analysis | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }
    
    return cached.analysis
  }
  
  set(key: string, analysis: Analysis): void {
    this.cache.set(key, {
      analysis,
      timestamp: Date.now()
    })
  }
}
```

### Response Streaming

```typescript
// Future implementation for large datasets
async function* streamAnalysis(
  workflows: Workflow[],
  events: Event[]
): AsyncGenerator<PartialAnalysis> {
  // Process workflows in chunks
  const chunkSize = 5
  
  for (let i = 0; i < workflows.length; i += chunkSize) {
    const chunk = workflows.slice(i, i + chunkSize)
    const chunkEvents = events.filter(e => 
      chunk.some(w => w.id === e.workflowId)
    )
    
    const partialAnalysis = await analyzeChunk(chunk, chunkEvents)
    yield partialAnalysis
  }
}
```

## Error Handling & Recovery

### Graceful Degradation

```typescript
async function analyzeWithFallback(
  data: WorkflowData,
  primaryModel: string
): Promise<Analysis> {
  try {
    // Try primary model
    return await analyzeWithModel(data, primaryModel)
  } catch (error) {
    console.error(`Primary model failed: ${error}`)
    
    // Fallback to simpler model
    try {
      return await analyzeWithModel(data, 'claude-3-5-haiku-20241022')
    } catch (fallbackError) {
      console.error(`Fallback model failed: ${fallbackError}`)
      
      // Return basic analysis without AI
      return generateBasicAnalysis(data)
    }
  }
}
```

### Input Validation

```typescript
import { z } from 'zod'

const WorkflowSchema = z.object({
  id: z.string().regex(/^WF-[A-Z]+-\d+$/),
  name: z.string().min(1).max(200),
  linearIssueKey: z.string(),
  github: z.object({
    owner: z.string(),
    repo: z.string(),
    prNumber: z.number()
  }).optional()
})

const EventSchema = z.object({
  id: z.string(),
  ts: z.string().datetime(),
  provider: z.enum(['linear', 'github']),
  type: z.string(),
  workflowId: z.string(),
  sequence: z.number(),
  actor: z.object({
    id: z.string(),
    displayName: z.string(),
    handle: z.string(),
    type: z.enum(['human', 'charlie', 'bot'])
  }),
  entity: z.object({
    kind: z.string(),
    provider: z.string()
  }),
  payload: z.any().optional()
})

function validateInput(data: unknown): ValidatedData {
  const schema = z.object({
    workflows: z.array(WorkflowSchema),
    events: z.array(EventSchema)
  })
  
  return schema.parse(data)
}
```

## Integration Points

### Linear Webhook Handler

```typescript
// Future implementation
export async function POST(request: NextRequest) {
  const signature = request.headers.get('linear-signature')
  const body = await request.text()
  
  // Verify webhook signature
  if (!verifyLinearSignature(body, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const event = JSON.parse(body)
  
  // Transform Linear event to internal format
  const internalEvent = transformLinearEvent(event)
  
  // Queue for processing
  await queueEvent(internalEvent)
  
  return Response.json({ success: true })
}
```

### GitHub Webhook Handler

```typescript
// Future implementation
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-hub-signature-256')
  const body = await request.text()
  
  // Verify webhook signature
  if (!verifyGitHubSignature(body, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const event = JSON.parse(body)
  
  // Transform GitHub event to internal format
  const internalEvent = transformGitHubEvent(event)
  
  // Queue for processing
  await queueEvent(internalEvent)
  
  return Response.json({ success: true })
}
```

## Configuration & Deployment

### Environment Variables

```bash
# Required for AI Analysis
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional AI Providers
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Webhook Secrets (Future)
LINEAR_WEBHOOK_SECRET=...
GITHUB_WEBHOOK_SECRET=...

# Feature Flags
ENABLE_AI_INSIGHTS=true
ENABLE_REAL_TIME_ANALYSIS=false
ENABLE_WEBHOOK_INTEGRATION=false
```

### Deployment Configuration

```typescript
// vercel.json
{
  "functions": {
    "app/api/ai/analyze/route.ts": {
      "maxDuration": 30,
      "runtime": "edge"
    }
  },
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key",
    "OPENAI_API_KEY": "@openai-api-key"
  }
}
```