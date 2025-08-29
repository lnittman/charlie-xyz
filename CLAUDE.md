# Charlie Command Center - Claude Code Configuration

This configuration provides Claude Code with comprehensive understanding of the Charlie Command Center project, its architecture, and development standards.

## Project Context

**Charlie-xyz** is the central command center for visualizing and managing Charlie automation instances. It provides a unified dashboard to monitor, track, and interact with Charlie's activities across Linear and GitHub, with optional AI-powered insights.

### Core Purpose
- **Primary**: Real-time visualization and control of Charlie automation workflows
- **Secondary**: AI-enhanced insights for workflow optimization
- **Focus**: Command center functionality, not just analysis

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment (REQUIRED for AI features)
echo "ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE" >> apps/app/.env.local

# Start development server
pnpm dev

# Access dashboard
open http://localhost:3000
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript 5.x
- **UI**: React 19 RC + Tailwind CSS v4
- **State**: Jotai (UI) + SWR (server state)
- **AI**: Vercel AI SDK (Anthropic, OpenAI, Google)
- **Animation**: Framer Motion
- **Database**: PostgreSQL (Neon)
- **Deployment**: Vercel

### Project Structure
```
charlie-xyz/
├── apps/app/                # Main Next.js application
│   ├── src/
│   │   ├── app/            # Routes and API endpoints
│   │   ├── components/     # React components
│   │   ├── lib/           # Utilities
│   │   ├── atoms/         # Jotai state atoms
│   │   └── types/         # TypeScript types
│   └── public/            # Static assets
├── packages/              # Shared packages
│   ├── design/           # UI component library
│   ├── next-config/      # Next.js configuration
│   ├── seo/             # SEO utilities
│   └── typescript-config/ # TypeScript config
└── .ruler/              # AI tool configuration
```

## Key Features

### 1. Workflow Visualization
- **Timeline View**: Chronological event stream from Linear and GitHub
- **Status Tracking**: Real-time workflow status updates
- **Event Details**: Expandable event information with full payloads
- **Provider Integration**: Unified view of Linear issues and GitHub PRs

### 2. Charlie Management
- **Instance Monitoring**: Track multiple Charlie bot instances
- **Workload Distribution**: View Charlie's current assignments
- **Command Execution**: Direct Charlie actions from the dashboard
- **Health Monitoring**: Real-time Charlie instance status

### 3. AI Analysis (Optional)
- **Workflow Insights**: AI-powered pattern recognition
- **Bottleneck Detection**: Identify workflow impediments
- **Recommendations**: Process improvement suggestions
- **Model Selection**: Choose between Claude, GPT-4, or Gemini

### 4. Filtering & Search
- **Provider Filters**: Linear vs GitHub events
- **Actor Filters**: Charlie vs human vs bot actions
- **Event Type Filters**: Issues, PRs, commits, reviews
- **Full-text Search**: Search across workflow titles and descriptions

## Development Guidelines

### Component Patterns
```typescript
// Standard component structure
interface ComponentProps {
  data: DataType
  onAction?: (data: DataType) => void
  className?: string
}

export function Component({ data, onAction, className }: ComponentProps) {
  // Hooks first
  const [state, setState] = useState()
  
  // Derived state
  const computed = useMemo(() => {}, [deps])
  
  // Handlers
  const handleClick = useCallback(() => {}, [deps])
  
  // Render
  return <div className={cn('base-class', className)} />
}
```

### State Management
```typescript
// UI State: Use Jotai
import { atom, useAtom } from 'jotai'
const selectedWorkflowAtom = atom<string | null>(null)

// Server State: Use SWR
import useSWR from 'swr'
const { data, error, mutate } = useSWR('/api/workflows', fetcher)
```

### API Patterns
```typescript
// RESTful endpoints
GET    /api/workflows           // List workflows
GET    /api/workflows/:id       // Get specific workflow
POST   /api/charlie/command     // Execute Charlie command
POST   /api/ai/analyze         // AI analysis (optional)
```

## AI Integration Details

### AI Analysis Flow
1. **Data Collection**: Workflows and events from JSON/API
2. **Preprocessing**: Normalize and correlate events
3. **AI Request**: Send to `/api/ai/analyze` with selected model
4. **Insight Extraction**: Parse structured AI response
5. **Visualization**: Display in insights panel

### Supported Models
- **Anthropic**: Claude 3.5 Sonnet (default), Haiku, Opus
- **OpenAI**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, O1 Preview
- **Google**: Gemini 2.0 Flash, Gemini 1.5 Pro/Flash

### Configuration
```bash
# Required for AI features
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional AI providers
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
```

## Common Tasks

### Adding a New Component
```bash
# Create component file
touch apps/app/src/components/new-component.tsx

# Follow component pattern
# Add to appropriate page/layout
# Test with different data states
```

### Modifying AI Analysis
```typescript
// Update system prompt in route.ts
const SYSTEM_PROMPT = `...`

// Adjust response structure
interface AnalysisResponse {
  // Modify as needed
}
```

### Adding Event Types
```typescript
// Update event type enum
type EventType = 'existing' | 'new-type'

// Add normalization logic
function normalizeNewEvent(event: RawEvent): NormalizedEvent {
  // Implementation
}

// Update UI components
// Add filtering support
```

## Testing

```bash
# Run type checking
pnpm typecheck

# Run linting
pnpm check

# Run tests (when implemented)
pnpm test
```

## Performance Considerations

### Optimization Strategies
- **Virtual Scrolling**: For large event lists
- **Memoization**: For expensive computations
- **Code Splitting**: Lazy load heavy components
- **Image Optimization**: Use Next.js Image component
- **Caching**: SWR for API responses, Redis for server-side

### Key Metrics
- **Initial Load**: < 3s target
- **Event Update**: < 100ms target
- **AI Analysis**: < 5s target
- **Memory Usage**: < 200MB target

## Security

### Required Measures
- **API Key Validation**: All AI endpoints require authentication
- **Input Sanitization**: Validate all user inputs with Zod
- **Rate Limiting**: Implement for API endpoints
- **Error Masking**: Hide sensitive errors in production
- **CORS Configuration**: Restrict to allowed origins

## Troubleshooting

### Common Issues

#### AI Analysis Not Working
```bash
# Check API key is set
cat apps/app/.env.local | grep ANTHROPIC_API_KEY

# Verify route configuration
cat apps/app/src/app/api/ai/analyze/route.ts

# Check console for errors
# Look for 401 (auth) or 500 (server) errors
```

#### Workflows Not Loading
```bash
# Check data file exists
ls apps/app/public/data.json

# Verify API endpoint
curl http://localhost:3000/api/workflows

# Check SWR configuration
# Look for network errors in console
```

## Deployment

### Vercel Deployment
```bash
# Set environment variables in Vercel
# ANTHROPIC_API_KEY, DATABASE_URL, etc.

# Deploy
vercel deploy --prod

# Monitor
vercel logs
```

## Future Enhancements

### Planned Features
- **Real-time Webhooks**: Direct Linear/GitHub integration
- **Custom Commands**: User-defined Charlie actions
- **Team Collaboration**: Multi-user support
- **Historical Analytics**: Trend analysis over time
- **Mobile App**: Native iOS/Android apps

## Additional Resources

### Documentation
- [Ruler Configuration](.ruler/README.md)
- [API Documentation](docs/api.md)
- [Component Library](packages/design/README.md)

### External Links
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Anthropic API](https://docs.anthropic.com)

## Support

For issues or questions:
1. Check this documentation
2. Review `.ruler/` directory for detailed patterns
3. Check console for error messages
4. Review environment configuration

---

*This configuration ensures Claude Code understands the Charlie Command Center's architecture, purpose, and development patterns for effective assistance.*