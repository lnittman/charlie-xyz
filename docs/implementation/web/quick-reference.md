# Vibes Radar - Agent Quick Reference

## Overview
Quick lookup guide for all 10 implementation agents. Each agent has a specific scope and can be developed independently while following the defined interfaces.

## Phase 1: Core Data Layer (Days 1-3)

### Agent 1: Database Schema ✅
**File:** `agent-01-database-schema.md`
- **Scope:** Prisma schema for radars, opinions, trends
- **Key Models:** User, Radar, Opinion, Trend, Vote, Usage
- **Packages:** `packages/database/`
- **Dependencies:** None (foundational)
- **Success Metric:** Schema supports all features, migrations work

### Agent 2: AI Opinion Engine ✅
**File:** `agent-02-ai-opinion-engine.md`
- **Scope:** Mastra agents for opinion generation
- **Key Components:** Interpretation, Opinion, Consensus agents
- **Packages:** `apps/ai/`
- **Dependencies:** Agent 1 (database)
- **Success Metric:** Multi-model opinions with proper schemas

### Agent 3: Background Jobs ✅
**File:** `agent-03-background-jobs.md`
- **Scope:** Inngest functions for polling and maintenance
- **Key Jobs:** Poll opinions, calculate trends, sync subscriptions
- **Packages:** `packages/inngest/`
- **Dependencies:** Agents 1-2
- **Success Metric:** Reliable scheduled processing

## Phase 2: Service Architecture (Days 4-5)

### Agent 4: Service Layer
**File:** `agent-04-service-layer.md`
- **Scope:** Business logic services (RadarService, OpinionService)
- **Key Services:** Radars, Opinions, Trends, Users, Subscriptions
- **Packages:** `packages/api/`
- **Dependencies:** Agent 1 (database)
- **Success Metric:** Clean API with proper error handling

### Agent 5: Edge Functions
**File:** `agent-05-edge-functions.md`
- **Scope:** Real-time interpretation and rate limiting
- **Key Routes:** `/api/interpret`, `/api/radars/*`
- **Packages:** `apps/app/app/api/`, `packages/rate-limit/`
- **Dependencies:** Agents 2, 4
- **Success Metric:** < 5s interpretation latency

## Phase 3: Frontend Experience (Days 6-8)

### Agent 6: Dashboard UI
**File:** `agent-06-dashboard-ui.md`
- **Scope:** Main app pages (RSC + SWR)
- **Key Pages:** Dashboard, radar list, radar detail
- **Packages:** `apps/app/`
- **Dependencies:** Agents 4-5
- **Success Metric:** Smooth UX with real-time updates

### Agent 7: Opinion Visualization
**File:** `agent-07-opinion-visualization.md`
- **Scope:** Charts, opinion cards, trend displays
- **Key Components:** TrendChart, OpinionCard, ConsensusView
- **Packages:** `apps/app/components/`
- **Dependencies:** Agent 6
- **Success Metric:** Beautiful, insightful visualizations

### Agent 8: Design System
**File:** `agent-08-design-system.md`
- **Scope:** Tailwind v4 with Yutori aesthetic
- **Key Elements:** Colors, typography, components
- **Packages:** `packages/design/`
- **Dependencies:** None (but coordinates with Agent 7)
- **Success Metric:** Consistent, elegant UI

## Phase 4: Platform Features (Days 9-10)

### Agent 9: Subscription & Billing
**File:** `agent-09-subscriptions.md`
- **Scope:** Stripe integration, feature gates
- **Key Features:** Plans, limits, upgrade flow
- **Packages:** `apps/app/`, various
- **Dependencies:** Agents 3-4
- **Success Metric:** Smooth payment flow

### Agent 10: Testing & Deployment
**File:** `agent-10-testing-deployment.md`
- **Scope:** E2E tests, CI/CD, monitoring
- **Key Areas:** Unit tests, integration tests, deployment
- **Packages:** All packages
- **Dependencies:** All agents
- **Success Metric:** 80%+ coverage, zero-downtime deploy

## Key Integration Points

### Database → Services
```typescript
// Agent 1 provides types
import { Radar, Opinion } from '@repo/database';

// Agent 4 uses them
class RadarService {
  async create(data: RadarCreate): Promise<Radar> { }
}
```

### AI → Background Jobs
```typescript
// Agent 2 provides workflows
import { workflows } from '@repo/ai';

// Agent 3 uses them
const result = await workflows.pollOpinions.execute({
  radarId: 'xxx',
});
```

### Services → Frontend
```typescript
// Agent 4 provides services
import { RadarService } from '@repo/api/services';

// Agent 6 uses in RSC
export default async function Page() {
  const radars = await RadarService.list();
}
```

### Rate Limiting → Edge Functions
```typescript
// Agent 5 uses rate limiter
import { rateLimiter } from '@repo/rate-limit';

const { success } = await rateLimiter.check(userId, 'interpretation');
```

## Common Patterns

### Error Handling
```typescript
// Consistent across all agents
class ServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400
  ) {
    super(message);
  }
}
```

### Schema Validation
```typescript
// Zod everywhere
const schema = z.object({
  field: z.string(),
});

const validated = schema.parse(input);
```

### Type Safety
```typescript
// Infer types from schemas
type RadarCreate = z.infer<typeof radarCreateSchema>;
```

## Environment Variables

### Required for All Agents
```env
DATABASE_URL=postgresql://...
OPENROUTER_API_KEY=sk-or-...
```

### Agent-Specific
- **Agent 3:** `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
- **Agent 5:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **Agent 6:** `NEXT_PUBLIC_CLERK_*`
- **Agent 9:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## Quick Commands

```bash
# Database (Agent 1)
pnpm db:push
pnpm db:studio

# AI Testing (Agent 2)
pnpm --filter=ai test

# Inngest Dev (Agent 3)
pnpm inngest:dev

# Run Everything
pnpm dev

# Type Check
pnpm typecheck

# Format Code
pnpm format
```

## Coordination Tips

1. **Start with Agent 1** - Everything depends on the database
2. **Agents 2-3 can be parallel** - After database is ready
3. **Agent 4 unlocks frontend** - Services are the API
4. **Agents 6-8 can be parallel** - Frontend work
5. **Agent 10 comes last** - Tests need everything working

## Support Resources

- Mastra Docs: https://mastra.ai/docs
- Inngest Docs: https://www.inngest.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Next.js RSC: https://nextjs.org/docs/app
- OpenRouter: https://openrouter.ai/docs