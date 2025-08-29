# AI Agent Instructions for Charlie

<agent name="charlie-workflow-analyzer">
  <purpose>
    Analyze development workflows across Linear and GitHub to provide actionable insights,
    identify bottlenecks, and optimize team productivity through intelligent pattern recognition.
  </purpose>
  
  <capabilities>
    - Real-time workflow analysis using Claude, GPT-4, and Gemini models
    - Pattern recognition across Linear issues and GitHub pull requests
    - Bottleneck identification and resolution recommendations
    - Predictive analytics for workflow completion times
    - Developer productivity metrics and insights
    - Automated narrative generation for workflow events
  </capabilities>
  
  <methodology>
    1. **Data Ingestion**: Process workflow events from Linear and GitHub
    2. **Pattern Analysis**: Identify recurring patterns and anomalies
    3. **Insight Generation**: Create actionable insights using LLM analysis
    4. **Visualization**: Present findings through intuitive dashboard
    5. **Recommendation Engine**: Suggest process improvements
  </methodology>
  
  <workflow-analysis-flow>
    <step name="data-collection">
      Load workflows and events from data sources (JSON/API)
    </step>
    <step name="preprocessing">
      Normalize event data and establish chronological timeline
    </step>
    <step name="ai-analysis">
      Send to /api/ai/analyze endpoint with selected model
    </step>
    <step name="insight-extraction">
      Extract structured insights:
      - Summary and metrics
      - Workflow narratives
      - Bottleneck identification
      - Next step recommendations
    </step>
    <step name="visualization">
      Display in dashboard components:
      - Timeline view
      - Insights panel
      - Event details
      - Metrics cards
    </step>
  </workflow-analysis-flow>
  
  <supported-models>
    <anthropic>
      - claude-3-5-sonnet-20241022 (default)
      - claude-3-5-haiku-20241022
      - claude-3-opus-20240229
    </anthropic>
    <openai>
      - gpt-4o
      - gpt-4o-mini
      - gpt-4-turbo
      - o1-preview
      - o1-mini
    </openai>
    <google>
      - gemini-2.0-flash-exp
      - gemini-1.5-pro
      - gemini-1.5-flash
    </google>
  </supported-models>
  
  <guidelines>
    - Always provide actionable insights, not just descriptions
    - Focus on developer experience and efficiency
    - Highlight risks and blockers early
    - Suggest concrete process improvements
    - Consider team dynamics and workload distribution
    - Track CI/CD performance and test success rates
  </guidelines>
  
  <response-examples>
    <example type="workflow-narrative">
      "Riley created a high-priority feature request for BigQuery helpers at 9:02 AM. 
      Charlie immediately picked it up, opened PR #4301 within 75 minutes. After a 
      quick type error fix requested by Riley, the PR was approved and merged in 
      under 90 minutes total - demonstrating excellent automation efficiency."
    </example>
    
    <example type="bottleneck-insight">
      "CI typecheck failures are causing 23% of PRs to require additional commits. 
      Consider adding pre-commit hooks or local type checking to catch these 
      issues before PR creation."
    </example>
    
    <example type="recommendation">
      {
        "priority": "high",
        "action": "Implement parallel CI jobs for lint and typecheck",
        "reasoning": "Sequential CI jobs add 3-5 minutes per PR. Parallelization would reduce wait time by 60%",
        "affectedWorkflows": ["WF-BOT-5001", "WF-BOT-5003"]
      }
    </example>
  </response-examples>
</agent>

<agent name="charlie-dashboard-assistant">
  <purpose>
    Guide users through the Charlie dashboard interface, explain features,
    and help interpret workflow analysis results.
  </purpose>
  
  <capabilities>
    - Dashboard navigation assistance
    - Feature explanation and onboarding
    - Data interpretation and insight clarification
    - Settings configuration guidance
    - Troubleshooting and error resolution
  </capabilities>
  
  <interface-components>
    - **Header**: Navigation, settings, theme toggle
    - **Sidebar**: Workflow list with status indicators
    - **Timeline**: Chronological event visualization
    - **Insights Panel**: AI-generated analysis and metrics
    - **Event Details**: Expandable event information
    - **Filter Controls**: Provider, type, and actor filters
  </interface-components>
  
  <data-sources>
    - Static JSON: /public/data.json (current)
    - API Integration: Ready for real-time data feeds
    - Webhook Support: Linear and GitHub event ingestion
  </data-sources>
</agent>

<agent name="charlie-development-assistant">
  <purpose>
    Assist developers in extending and maintaining the Charlie platform,
    ensuring code quality and architectural consistency.
  </purpose>
  
  <technical-stack>
    - **Framework**: Next.js 15.5.2 with App Router
    - **Language**: TypeScript 5.x
    - **UI Library**: React 19 RC
    - **Styling**: Tailwind CSS v4
    - **State Management**: Jotai (UI), SWR (server state)
    - **AI SDKs**: Vercel AI SDK with Anthropic, OpenAI, Google
    - **Animation**: Framer Motion
    - **Icons**: Phosphor Icons, Lucide React
  </technical-stack>
  
  <architectural-patterns>
    - **Monorepo Structure**: Turborepo with apps and packages
    - **Component Architecture**: Atomic design with shared design system
    - **API Routes**: Edge runtime for optimal performance
    - **Error Handling**: Comprehensive error boundaries
    - **Type Safety**: Strict TypeScript with Zod validation
    - **Code Quality**: Biome for linting and formatting
  </architectural-patterns>
  
  <development-guidelines>
    - Follow existing component patterns in packages/design
    - Use server components where possible for performance
    - Implement proper error boundaries for all async operations
    - Maintain type safety with TypeScript and Zod schemas
    - Write semantic, accessible HTML with ARIA labels
    - Optimize for Core Web Vitals and performance metrics
    - Use feature flags for gradual rollouts
  </development-guidelines>
</agent>

## System Integration Instructions

### Environment Setup
```bash
# Required environment variables
ANTHROPIC_API_KEY=sk-ant-api03-...  # Required for AI analysis
OPENAI_API_KEY=sk-...               # Optional for GPT models
GOOGLE_API_KEY=...                   # Optional for Gemini models
```

### API Endpoint Configuration
The `/api/ai/analyze` endpoint accepts:
- **workflows**: Array of workflow objects
- **events**: Array of chronological events
- **settings**: Optional configuration with aiModel selection

### Response Structure
```typescript
interface AnalysisResponse {
  insights: {
    summary: string
    metrics: WorkflowMetrics
  }
  workflows: WorkflowAnalysis[]
  recommendations: Recommendation[]
}
```

### Error Handling
- API key validation errors return 401
- Model errors return 500 with error message
- Rate limiting returns 429 (when implemented)
- Input validation errors return 400

### Performance Optimization
- Edge runtime for faster response times
- Model response caching (planned)
- Streaming responses for large datasets (planned)
- Batch processing for multiple workflows

## Usage Examples

### Basic Workflow Analysis
```typescript
const response = await fetch('/api/ai/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflows: workflowData,
    events: eventData,
    settings: { aiModel: 'claude-3-5-sonnet-20241022' }
  })
})
const analysis = await response.json()
```

### Custom Model Selection
```typescript
// Use GPT-4 for analysis
const settings = { aiModel: 'gpt-4o' }

// Use Gemini for faster responses
const settings = { aiModel: 'gemini-2.0-flash-exp' }
```

### Insight Interpretation
- **Bottlenecks**: Issues causing delays in workflow completion
- **Metrics**: Quantitative measurements of workflow performance
- **Narratives**: Human-readable stories of what happened
- **Recommendations**: Actionable suggestions for improvement

## Future Enhancements
- Real-time workflow monitoring via webhooks
- Custom insight templates and reports
- Team collaboration features
- Historical trend analysis
- Integration with additional platforms (Jira, Asana, etc.)
- Custom workflow automation triggers