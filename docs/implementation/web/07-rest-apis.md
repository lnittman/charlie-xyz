# Agent 7: Core REST APIs

## Objective
Implement comprehensive REST APIs for the Radar platform, including event ingestion, analytics queries, project management, and admin endpoints with proper authentication and rate limiting.

## Dependencies
- Agent 1-6: All foundation and core services complete
- @repo/api package (existing)
- Clerk authentication configured
- Upstash rate limiting ready
- Database and analytics engine available

## Scope of Work

### 1. API Structure & Middleware

Update `apps/api/src/middleware.ts`:
```typescript
import { authMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createRouteMatcher } from '@clerk/nextjs/server';
import { withRateLimit } from '@repo/rate-limit';
import { logger } from '@repo/logger';

const isPublicRoute = createRouteMatcher([
  '/api/health',
  '/api/docs',
  '/api/v1/events/collect', // Public ingestion with API key
]);

export default authMiddleware(async (auth, request) => {
  const { userId, orgId } = await auth();
  const isPublic = isPublicRoute(request);

  // Log all API requests
  logger.info('API Request', {
    method: request.method,
    path: request.nextUrl.pathname,
    userId,
    orgId,
  });

  // Public routes
  if (isPublic) {
    // For event collection, validate API key
    if (request.nextUrl.pathname === '/api/v1/events/collect') {
      const apiKey = request.headers.get('x-api-key') || 
                     request.nextUrl.searchParams.get('apiKey');
      
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key required' },
          { status: 401 }
        );
      }

      // Validate and get project from API key
      const project = await validateApiKey(apiKey);
      if (!project) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }

      // Add project to headers for downstream use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-project-id', project.id);
      requestHeaders.set('x-project-key', project.publicKey);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    return NextResponse.next();
  }

  // Authenticated routes
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Add user context to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', userId);
  requestHeaders.set('x-org-id', orgId || '');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
```

### 2. Event Collection API

Create `apps/api/src/app/api/v1/events/collect/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eventSchema, EventProcessor } from '@repo/events';
import { inngest } from '@repo/jobs';
import { withRateLimit } from '@repo/rate-limit';
import { logger } from '@repo/logger';

const collectSchema = z.object({
  events: z.array(eventSchema).min(1).max(100),
});

export async function POST(request: NextRequest) {
  const projectId = request.headers.get('x-project-id')!;
  const projectKey = request.headers.get('x-project-key')!;

  try {
    // Rate limit by project
    const rateLimitResult = await withRateLimit(projectId, {
      requests: 1000,
      window: '1m',
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.reset,
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { events } = collectSchema.parse(body);

    // Validate and enrich events
    const enrichedEvents = await Promise.all(
      events.map(event => EventProcessor.enrich(event, request))
    );

    // Send to background processing
    if (events.length === 1) {
      await inngest.send({
        name: 'radar/event.received',
        data: {
          projectId,
          event: enrichedEvents[0],
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      await inngest.send({
        name: 'radar/event.batch',
        data: {
          projectId,
          events: enrichedEvents,
          batchId: `batch_${Date.now()}`,
        },
      });
    }

    logger.info('Events collected', {
      projectId,
      count: events.length,
    });

    return NextResponse.json({
      success: true,
      received: events.length,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Event collection error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for pixel tracking
export async function GET(request: NextRequest) {
  const projectId = request.headers.get('x-project-id')!;
  const url = new URL(request.url);

  try {
    // Build event from query params
    const event = {
      projectKey: request.headers.get('x-project-key')!,
      event: url.searchParams.get('event') || 'page_view',
      timestamp: new Date().toISOString(),
      anonymousId: url.searchParams.get('aid'),
      userId: url.searchParams.get('uid'),
      sessionId: url.searchParams.get('sid'),
      context: {
        page: {
          url: url.searchParams.get('url') || request.headers.get('referer'),
          title: url.searchParams.get('title'),
          referrer: url.searchParams.get('ref'),
          path: url.searchParams.get('path'),
        },
      },
      properties: Object.fromEntries(
        Array.from(url.searchParams.entries())
          .filter(([key]) => key.startsWith('p_'))
          .map(([key, value]) => [key.substring(2), value])
      ),
    };

    // Validate and process
    const validatedEvent = await EventProcessor.validate(event);
    const enrichedEvent = await EventProcessor.enrich(validatedEvent, request);

    // Send to processing
    await inngest.send({
      name: 'radar/event.received',
      data: {
        projectId,
        event: enrichedEvent,
        timestamp: new Date().toISOString(),
      },
    });

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    logger.error('Pixel tracking error', error);
    // Still return pixel even on error
    return new NextResponse(null, { status: 204 });
  }
}
```

### 3. Analytics Query API

Create `apps/api/src/app/api/v1/analytics/query/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { analytics, querySchema } from '@repo/analytics';
import { withAuthenticatedUser } from '@repo/api';
import { checkProjectAccess } from '../../utils/permissions';

export const POST = withAuthenticatedUser(async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const query = querySchema.parse(body);

    // Check project access
    const hasAccess = await checkProjectAccess(
      context.userId,
      query.projectId,
      'read'
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Execute query
    const result = await analytics.query.execute(query);

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Query execution failed' },
      { status: 500 }
    );
  }
});

// Simplified GET endpoint for common queries
export const GET = withAuthenticatedUser(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const metric = searchParams.get('metric') || 'pageViews';
  const period = searchParams.get('period') || '7d';

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID required' },
      { status: 400 }
    );
  }

  // Check access
  const hasAccess = await checkProjectAccess(context.userId, projectId, 'read');
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '24h':
      startDate.setHours(startDate.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
  }

  // Get summary
  const summary = await analytics.aggregator.getAnalyticsSummary(
    projectId,
    startDate,
    endDate
  );

  return NextResponse.json({
    success: true,
    data: summary,
  });
});
```

### 4. Real-time Analytics API

Create `apps/api/src/app/api/v1/analytics/realtime/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuthenticatedUser } from '@repo/api';
import { analytics } from '@repo/analytics';
import { checkProjectAccess } from '../../utils/permissions';

export const GET = withAuthenticatedUser(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID required' },
      { status: 400 }
    );
  }

  // Check access
  const hasAccess = await checkProjectAccess(context.userId, projectId, 'read');
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // Get real-time metrics
  const metrics = analytics.realtime.getMetrics(projectId);

  return NextResponse.json({
    success: true,
    data: metrics,
    timestamp: new Date().toISOString(),
  });
});

// Server-Sent Events endpoint for real-time updates
export async function CONNECT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const userId = request.headers.get('x-user-id');

  if (!projectId || !userId) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }

  // Check access
  const hasAccess = await checkProjectAccess(userId, projectId, 'read');
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial data
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({
          type: 'connected',
          projectId,
        })}\n\n`)
      );

      // Subscribe to real-time updates
      const unsubscribe = analytics.realtime.on('metrics', (data) => {
        if (data.projectKey === projectId) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'metrics',
              data: data.metrics,
              timestamp: data.timestamp,
            })}\n\n`)
          );
        }
      });

      // Keep-alive
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(':keep-alive\n\n'));
      }, 30000);

      // Cleanup
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(keepAlive);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 5. AI Analytics API

Create `apps/api/src/app/api/v1/ai/insights/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuthenticatedUser } from '@repo/api';
import { ai } from '@repo/ai';
import { db } from '@repo/database';
import { insights } from '@repo/database/schema';
import { desc } from 'drizzle-orm';

export const GET = withAuthenticatedUser(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID required' },
      { status: 400 }
    );
  }

  // Check access
  const hasAccess = await checkProjectAccess(context.userId, projectId, 'read');
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // Fetch insights
  const query = db.select()
    .from(insights)
    .where(sql`${insights.projectId} = ${projectId}`);

  if (category) {
    query.where(sql`${insights.category} = ${category}`);
  }

  const results = await query
    .orderBy(desc(insights.detectedAt))
    .limit(limit);

  return NextResponse.json({
    success: true,
    data: results,
    count: results.length,
  });
});

// Natural language query endpoint
export const POST = withAuthenticatedUser(async (request: NextRequest, context) => {
  const body = await request.json();
  const { projectId, question } = body;

  if (!projectId || !question) {
    return NextResponse.json(
      { error: 'Project ID and question required' },
      { status: 400 }
    );
  }

  // Check access
  const hasAccess = await checkProjectAccess(context.userId, projectId, 'read');
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  try {
    // Process natural language query
    const response = await ai.answerQuestion(question, projectId);

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
});
```

### 6. Project Management API

Create `apps/api/src/app/api/v1/projects/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuthenticatedUser } from '@repo/api';
import { db } from '@repo/database';
import { projects, organizations } from '@repo/database/schema';
import { z } from 'zod';
import { generateApiKeys } from '../../utils/keys';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().url().optional(),
  organizationId: z.string().optional(),
});

export const GET = withAuthenticatedUser(async (request: NextRequest, context) => {
  // Get user's organizations from Clerk
  const userOrgs = await getUserOrganizations(context.userId);
  
  // Fetch projects
  const userProjects = await db.select({
    project: projects,
    organization: organizations,
  })
  .from(projects)
  .leftJoin(organizations, sql`${projects.organizationId} = ${organizations.id}`)
  .where(sql`${organizations.clerkOrganizationId} IN (${sql.join(userOrgs.map(o => o.id), sql`, `)})`);

  return NextResponse.json({
    success: true,
    data: userProjects.map(({ project, organization }) => ({
      ...project,
      organization,
      // Don't expose secret key
      secretKey: undefined,
    })),
  });
});

export const POST = withAuthenticatedUser(async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const { name, domain, organizationId } = createProjectSchema.parse(body);

    // Verify organization access
    const org = await db.select()
      .from(organizations)
      .where(sql`${organizations.id} = ${organizationId}`)
      .limit(1);

    if (!org[0]) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user has access to org
    const hasAccess = await checkOrganizationAccess(
      context.userId,
      org[0].clerkOrganizationId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Generate API keys
    const { publicKey, secretKey } = generateApiKeys();

    // Create project
    const [project] = await db.insert(projects)
      .values({
        organizationId,
        name,
        slug: slugify(name),
        domain,
        publicKey,
        secretKey,
      })
      .returning();

    // Send welcome event
    await inngest.send({
      name: 'radar/project.created',
      data: {
        projectId: project.id,
        userId: context.userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        secretKey: undefined, // Don't expose in response
      },
      keys: {
        publicKey,
        secretKey, // Only show once on creation
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
});
```

### 7. API Documentation

Create `apps/api/src/app/api/docs/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateOpenAPIDocument } from '@repo/api/openapi';

const openAPIDocument = generateOpenAPIDocument({
  title: 'Radar Analytics API',
  version: '1.0.0',
  description: 'AI-powered analytics platform API',
  servers: [
    {
      url: process.env.API_URL || 'https://api.radar.ai',
      description: 'Production API',
    },
  ],
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';

  if (format === 'yaml') {
    return new NextResponse(
      convertToYAML(openAPIDocument),
      {
        headers: {
          'Content-Type': 'application/x-yaml',
        },
      }
    );
  }

  return NextResponse.json(openAPIDocument);
}
```

### 8. Health Check & Status

Create `apps/api/src/app/api/health/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@repo/database';
import { redis } from '@repo/cache';

export async function GET(request: NextRequest) {
  const checks = {
    api: 'healthy',
    database: 'unknown',
    cache: 'unknown',
    jobs: 'unknown',
  };

  // Check database
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = 'healthy';
  } catch (error) {
    checks.database = 'unhealthy';
  }

  // Check cache
  try {
    await redis.ping();
    checks.cache = 'healthy';
  } catch (error) {
    checks.cache = 'unhealthy';
  }

  // Check job queue
  try {
    const queueHealth = await inngest.health();
    checks.jobs = queueHealth.healthy ? 'healthy' : 'unhealthy';
  } catch (error) {
    checks.jobs = 'unhealthy';
  }

  const allHealthy = Object.values(checks).every(status => status === 'healthy');

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  }, {
    status: allHealthy ? 200 : 503,
  });
}
```

### 9. Error Handling

Create `apps/api/src/app/api/error.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@repo/logger';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown, request: NextRequest) {
  logger.error('API Error', {
    error,
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
  });

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation error',
        details: error.errors,
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' 
        ? (error as Error).message 
        : undefined,
    },
    { status: 500 }
  );
}
```

### 10. Utility Functions

Create `apps/api/src/utils/permissions.ts`:
```typescript
import { db } from '@repo/database';
import { projects, organizations } from '@repo/database/schema';
import { clerkClient } from '@clerk/nextjs/server';

export async function checkProjectAccess(
  userId: string,
  projectId: string,
  permission: 'read' | 'write' | 'admin'
): Promise<boolean> {
  // Get project and its organization
  const [project] = await db.select({
    project: projects,
    organization: organizations,
  })
  .from(projects)
  .leftJoin(organizations, sql`${projects.organizationId} = ${organizations.id}`)
  .where(sql`${projects.id} = ${projectId}`)
  .limit(1);

  if (!project) return false;

  // Check if user belongs to organization
  const userOrgs = await clerkClient.users.getOrganizationMembershipList({
    userId,
  });

  return userOrgs.data.some(
    membership => membership.organization.id === project.organization?.clerkOrganizationId
  );
}

export async function validateApiKey(apiKey: string) {
  const [project] = await db.select()
    .from(projects)
    .where(sql`${projects.publicKey} = ${apiKey} OR ${projects.secretKey} = ${apiKey}`)
    .limit(1);

  return project;
}
```

## Testing Requirements

1. Test all API endpoints with various payloads
2. Test authentication and authorization
3. Test rate limiting behavior
4. Test error handling scenarios
5. Test real-time SSE connections
6. Load test event ingestion endpoint
7. Test API documentation generation

## Success Criteria

- ✅ All REST endpoints implemented
- ✅ Authentication via Clerk working
- ✅ Rate limiting via Upstash functional
- ✅ Event ingestion < 50ms response time
- ✅ Analytics queries < 500ms response time
- ✅ Real-time updates working
- ✅ API documentation auto-generated
- ✅ Comprehensive error handling

## Handoff to Next Agent

Agent 8 will need:
- API endpoints documentation
- Authentication patterns
- Event schemas
- TypeScript types for SDK generation

## Notes

- Follow RESTful conventions
- Use proper HTTP status codes
- Implement pagination for list endpoints
- Version APIs from the start (/v1/)
- Log all API requests for debugging