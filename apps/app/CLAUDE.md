# CLAUDE.md - Radar Web Application Guide

Welcome! This guide helps you understand and work with the main Radar web application.

## Application Overview

This is the primary user-facing web application built with Next.js 15.3 using the App Router. It provides:
- User authentication and onboarding
- Radar creation and management
- AI opinion visualization
- Real-time updates via Server-Sent Events
- Subscription management with Stripe

## Directory Structure

```
apps/app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (authenticated)/    # Protected routes
│   │   ├── (unauthenticated)/  # Public routes
│   │   ├── api/                # API routes
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities
│   └── styles/                 # Global styles
├── public/                     # Static assets
├── next.config.ts              # Next.js configuration
└── package.json                # Dependencies
```

## Key Features & Implementation

### Authentication Flow
All authentication is handled by Clerk with custom UI components:

```typescript
// Middleware protection (already configured)
// See src/middleware.ts

// Client-side auth check
import { useAuth } from '@clerk/nextjs'
const { userId, isLoaded } = useAuth()

// Server-side auth check
import { auth } from '@clerk/nextjs/server'
const { userId } = await auth()
```

### Route Organization

**Public Routes** (`/src/app/(unauthenticated)/`):
- `/` - Landing page
- `/sign-in` - Custom sign-in page
- `/sign-up` - Custom sign-up page
- `/waitlist` - Waitlist signup

**Protected Routes** (`/src/app/(authenticated)/`):
- `/dashboard` - Main dashboard
- `/radars` - Radar listing
- `/radars/[id]` - Individual radar view
- `/settings` - User settings
- `/billing` - Subscription management

### API Routes

All API routes use Edge Runtime for optimal performance:

```typescript
// src/app/api/example/route.ts
export const runtime = 'edge'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Your logic here
}
```

**Key API Endpoints**:
- `/api/radars` - CRUD operations for radars
- `/api/ai/interpret` - Real-time AI interpretation
- `/api/opinions` - Opinion management
- `/api/inngest` - Background job handler
- `/api/webhooks/*` - External service webhooks

### Component Architecture

**Design System Components** (`@repo/design`):
```typescript
import { Button, Card, Input } from '@repo/design'
```

**Feature Components**:
- `RadarCard` - Display individual radar
- `OpinionCard` - Show AI opinions
- `TrendChart` - Visualize opinion trends
- `OnboardingModal` - User onboarding flow

### State Management

**Client State (Jotai)**:
```typescript
// atoms/ui.ts
export const modalOpenAtom = atom(false)

// In component
const [isOpen, setIsOpen] = useAtom(modalOpenAtom)
```

**Server State (SWR)**:
```typescript
// hooks/use-radars.ts
export function useRadars() {
  return useSWR('/api/radars', fetcher, {
    refreshInterval: 30000
  })
}
```

### Real-time Features

**Server-Sent Events for AI Streaming**:
```typescript
// In API route
export async function POST(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      // Stream AI responses
      for await (const chunk of aiResponse) {
        controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`)
      }
      controller.close()
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
  })
}
```

## Common Development Tasks

### Adding a New Page

1. Create route directory: `src/app/(authenticated)/new-feature/page.tsx`
2. Add to navigation if needed
3. Implement page component with proper loading/error states
4. Add prefetch in parent layout if needed

### Creating an API Endpoint

1. Create route file: `src/app/api/new-endpoint/route.ts`
2. Export named functions (GET, POST, etc.)
3. Add edge runtime: `export const runtime = 'edge'`
4. Implement auth check and business logic
5. Use service layer from `@repo/api`

### Working with Components

1. Check `@repo/design` for existing components
2. Create feature components in `src/components`
3. Use TypeScript for all components
4. Follow naming convention: `ComponentName.tsx`

### Handling Forms

```typescript
// Use React Hook Form + Zod
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createRadarSchema } from '@repo/shared/schemas'

const form = useForm({
  resolver: zodResolver(createRadarSchema)
})
```

### Adding Animations

```typescript
// Use Framer Motion
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  Content
</motion.div>
```

## Environment Variables

Required for local development:
```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# API URLs  
NEXT_PUBLIC_API_URL=http://localhost:7101
NEXT_PUBLIC_AI_URL=http://localhost:7099

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

## Performance Considerations

1. **Use Server Components by default** - Only use client components when needed
2. **Implement proper loading states** - Use Suspense boundaries
3. **Optimize images** - Use next/image with proper sizing
4. **Lazy load heavy components** - Use dynamic imports
5. **Cache API responses** - Use SWR's caching strategy

## Common Patterns

### Error Handling
```typescript
// In components
if (error) return <ErrorState error={error} />

// In API routes
try {
  // logic
} catch (error) {
  console.error('Error:', error)
  return Response.json(
    { error: 'Something went wrong' },
    { status: 500 }
  )
}
```

### Loading States
```typescript
// Use Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AsyncComponent />
</Suspense>

// Or SWR
const { data, isLoading } = useSWR(...)
if (isLoading) return <Skeleton />
```

### Protected Actions
```typescript
// Server actions with auth
async function createRadar(data: FormData) {
  'use server'
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  
  // Create radar
}
```

## Debugging Tips

1. **Check Network tab** for API calls
2. **Use React DevTools** for component state
3. **Enable debug mode** in Clerk dashboard
4. **Check server logs** in terminal
5. **Use `console.log` in API routes** (appears in terminal)

## Testing Approach

Currently no tests, but when implementing:
1. Use Vitest for unit tests
2. Use Testing Library for component tests
3. Test critical paths: auth, payments, data integrity
4. Mock external services (Clerk, Stripe, etc.)

## Build & Deployment

```bash
# Local development
pnpm dev

# Type checking
pnpm typecheck

# Production build
pnpm build

# Analyze bundle
pnpm analyze
```

## Common Issues

1. **Hydration Errors**: Ensure consistent rendering between server/client
2. **Auth State**: Wait for `isLoaded` before rendering auth-dependent UI
3. **Type Errors**: Run `pnpm typecheck` regularly
4. **Tailwind v4**: Some utilities may differ from v3
5. **Edge Runtime Limits**: Some Node.js APIs not available

## Quick Reference

```typescript
// Import common utilities
import { auth } from '@clerk/nextjs/server'
import { radarService } from '@repo/api/services'
import { Button, Card } from '@repo/design'
import { CreateRadarInput } from '@repo/shared/types'

// Common hooks
import { useRadars } from '@/hooks/use-radars'
import { useUser } from '@clerk/nextjs'

// Utils
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
```

Remember: This is the main user interface. Focus on performance, accessibility, and user experience!