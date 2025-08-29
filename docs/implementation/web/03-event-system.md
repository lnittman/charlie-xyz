# Agent 3: Event System & Types

## Objective
Design and implement the complete event system for Radar, including event schemas, validation, type definitions, and the core event processing pipeline.

## Dependencies
- Agent 1: Infrastructure setup complete
- Agent 2: Database schema defined
- @repo/events package created

## Scope of Work

### 1. Core Event Types

Create `packages/events/src/types.ts`:
```typescript
import { z } from 'zod';

// Base event properties
export const baseEventSchema = z.object({
  // Identification
  projectKey: z.string(),
  userId: z.string().optional(),
  anonymousId: z.string().optional(),
  sessionId: z.string().optional(),
  
  // Timestamps
  timestamp: z.string().datetime(),
  
  // Context
  context: z.object({
    // Page
    page: z.object({
      url: z.string().url(),
      title: z.string(),
      referrer: z.string().optional(),
      path: z.string(),
      search: z.string().optional(),
      hash: z.string().optional(),
    }).optional(),
    
    // Device
    device: z.object({
      type: z.enum(['desktop', 'mobile', 'tablet']),
      vendor: z.string().optional(),
      model: z.string().optional(),
      screenWidth: z.number().optional(),
      screenHeight: z.number().optional(),
    }).optional(),
    
    // Browser
    browser: z.object({
      name: z.string(),
      version: z.string(),
      userAgent: z.string(),
    }).optional(),
    
    // OS
    os: z.object({
      name: z.string(),
      version: z.string(),
    }).optional(),
    
    // Location
    location: z.object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional(),
      timezone: z.string().optional(),
    }).optional(),
    
    // Network
    network: z.object({
      ip: z.string().optional(),
      connectionType: z.string().optional(),
    }).optional(),
  }).optional(),
});

// Page view event
export const pageViewEventSchema = baseEventSchema.extend({
  event: z.literal('page_view'),
  properties: z.object({
    duration: z.number().optional(),
    scrollDepth: z.number().optional(),
    exitIntent: z.boolean().optional(),
  }).optional(),
});

// Custom event
export const customEventSchema = baseEventSchema.extend({
  event: z.string(),
  category: z.string().optional(),
  properties: z.record(z.any()).optional(),
});

// Performance event
export const performanceEventSchema = baseEventSchema.extend({
  event: z.literal('performance'),
  properties: z.object({
    // Navigation timing
    navigationStart: z.number(),
    domContentLoaded: z.number(),
    loadComplete: z.number(),
    
    // Resource timing
    resources: z.array(z.object({
      name: z.string(),
      type: z.string(),
      duration: z.number(),
      size: z.number().optional(),
    })).optional(),
    
    // Core Web Vitals
    lcp: z.number().optional(), // Largest Contentful Paint
    fid: z.number().optional(), // First Input Delay
    cls: z.number().optional(), // Cumulative Layout Shift
    fcp: z.number().optional(), // First Contentful Paint
    ttfb: z.number().optional(), // Time to First Byte
  }),
});

// Error event
export const errorEventSchema = baseEventSchema.extend({
  event: z.literal('error'),
  properties: z.object({
    message: z.string(),
    stack: z.string().optional(),
    type: z.enum(['error', 'unhandledrejection', 'console.error']),
    filename: z.string().optional(),
    lineno: z.number().optional(),
    colno: z.number().optional(),
  }),
});

// User identification event
export const identifyEventSchema = baseEventSchema.extend({
  event: z.literal('identify'),
  userId: z.string(),
  properties: z.object({
    email: z.string().email().optional(),
    name: z.string().optional(),
    // Custom user properties
    traits: z.record(z.any()).optional(),
  }),
});

// Session event
export const sessionEventSchema = baseEventSchema.extend({
  event: z.literal('session'),
  properties: z.object({
    action: z.enum(['start', 'end', 'resume']),
    duration: z.number().optional(),
    pageViews: z.number().optional(),
    events: z.number().optional(),
  }),
});

// Union type for all events
export const eventSchema = z.discriminatedUnion('event', [
  pageViewEventSchema,
  customEventSchema,
  performanceEventSchema,
  errorEventSchema,
  identifyEventSchema,
  sessionEventSchema,
]);

// Types
export type BaseEvent = z.infer<typeof baseEventSchema>;
export type PageViewEvent = z.infer<typeof pageViewEventSchema>;
export type CustomEvent = z.infer<typeof customEventSchema>;
export type PerformanceEvent = z.infer<typeof performanceEventSchema>;
export type ErrorEvent = z.infer<typeof errorEventSchema>;
export type IdentifyEvent = z.infer<typeof identifyEventSchema>;
export type SessionEvent = z.infer<typeof sessionEventSchema>;
export type RadarEvent = z.infer<typeof eventSchema>;
```

### 2. Event Processing Pipeline

Create `packages/events/src/processor.ts`:
```typescript
import { z } from 'zod';
import superjson from 'superjson';
import { eventSchema, type RadarEvent } from './types';

export class EventProcessor {
  /**
   * Validate and parse incoming event
   */
  static async validate(data: unknown): Promise<RadarEvent> {
    try {
      return eventSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new EventValidationError('Invalid event data', error.errors);
      }
      throw error;
    }
  }

  /**
   * Enrich event with server-side data
   */
  static async enrich(
    event: RadarEvent,
    request?: Request
  ): Promise<RadarEvent> {
    const enriched = { ...event };

    // Add server timestamp if not provided
    if (!enriched.timestamp) {
      enriched.timestamp = new Date().toISOString();
    }

    // Extract IP and location from request
    if (request) {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip');
      
      if (ip && enriched.context) {
        enriched.context.network = {
          ...enriched.context.network,
          ip: ip.split(',')[0].trim(),
        };
      }

      // Parse user agent if not provided
      if (!enriched.context?.browser?.userAgent) {
        const userAgent = request.headers.get('user-agent');
        if (userAgent) {
          enriched.context = {
            ...enriched.context,
            browser: {
              ...enriched.context?.browser,
              userAgent,
              name: parseUserAgent(userAgent).browser,
              version: parseUserAgent(userAgent).version,
            },
          };
        }
      }
    }

    return enriched;
  }

  /**
   * Serialize event for storage/transmission
   */
  static serialize(event: RadarEvent): string {
    return superjson.stringify(event);
  }

  /**
   * Deserialize event from storage/transmission
   */
  static deserialize(data: string): RadarEvent {
    return superjson.parse(data);
  }

  /**
   * Batch events for efficient processing
   */
  static batch(events: RadarEvent[]): BatchedEvents {
    const batches: Map<string, RadarEvent[]> = new Map();

    // Group by project key
    for (const event of events) {
      const key = event.projectKey;
      if (!batches.has(key)) {
        batches.set(key, []);
      }
      batches.get(key)!.push(event);
    }

    return {
      count: events.length,
      batches: Array.from(batches.entries()).map(([projectKey, events]) => ({
        projectKey,
        events,
      })),
    };
  }
}

// Helper types
export interface BatchedEvents {
  count: number;
  batches: Array<{
    projectKey: string;
    events: RadarEvent[];
  }>;
}

export class EventValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError['errors']
  ) {
    super(message);
    this.name = 'EventValidationError';
  }
}

// User agent parser (simplified)
function parseUserAgent(ua: string): { browser: string; version: string } {
  // Simplified browser detection
  if (ua.includes('Chrome')) {
    const match = ua.match(/Chrome\/(\d+\.\d+)/);
    return { browser: 'Chrome', version: match?.[1] || 'unknown' };
  }
  if (ua.includes('Firefox')) {
    const match = ua.match(/Firefox\/(\d+\.\d+)/);
    return { browser: 'Firefox', version: match?.[1] || 'unknown' };
  }
  if (ua.includes('Safari')) {
    const match = ua.match(/Version\/(\d+\.\d+)/);
    return { browser: 'Safari', version: match?.[1] || 'unknown' };
  }
  return { browser: 'unknown', version: 'unknown' };
}
```

### 3. Event Queue Interface

Create `packages/events/src/queue.ts`:
```typescript
import type { RadarEvent } from './types';

export interface EventQueue {
  /**
   * Push events to the queue
   */
  push(events: RadarEvent | RadarEvent[]): Promise<void>;

  /**
   * Pull events from the queue
   */
  pull(limit?: number): Promise<RadarEvent[]>;

  /**
   * Get queue size
   */
  size(): Promise<number>;

  /**
   * Clear the queue
   */
  clear(): Promise<void>;
}

/**
 * In-memory queue for development
 */
export class MemoryEventQueue implements EventQueue {
  private queue: RadarEvent[] = [];

  async push(events: RadarEvent | RadarEvent[]): Promise<void> {
    const items = Array.isArray(events) ? events : [events];
    this.queue.push(...items);
  }

  async pull(limit = 100): Promise<RadarEvent[]> {
    return this.queue.splice(0, limit);
  }

  async size(): Promise<number> {
    return this.queue.length;
  }

  async clear(): Promise<void> {
    this.queue = [];
  }
}

/**
 * Redis queue for production
 */
export class RedisEventQueue implements EventQueue {
  constructor(
    private redis: any, // Will be properly typed with Upstash
    private key = 'radar:events'
  ) {}

  async push(events: RadarEvent | RadarEvent[]): Promise<void> {
    const items = Array.isArray(events) ? events : [events];
    const serialized = items.map(e => EventProcessor.serialize(e));
    await this.redis.rpush(this.key, ...serialized);
  }

  async pull(limit = 100): Promise<RadarEvent[]> {
    const items = await this.redis.lpop(this.key, limit);
    if (!items || items.length === 0) return [];
    
    return items.map(item => EventProcessor.deserialize(item));
  }

  async size(): Promise<number> {
    return this.redis.llen(this.key);
  }

  async clear(): Promise<void> {
    await this.redis.del(this.key);
  }
}
```

### 4. Event Builders

Create `packages/events/src/builders.ts`:
```typescript
import type {
  PageViewEvent,
  CustomEvent,
  PerformanceEvent,
  ErrorEvent,
  IdentifyEvent,
  SessionEvent,
} from './types';

export class EventBuilder {
  private baseProperties: Partial<PageViewEvent> = {};

  constructor(projectKey: string) {
    this.baseProperties.projectKey = projectKey;
    this.baseProperties.timestamp = new Date().toISOString();
  }

  withUser(userId?: string, anonymousId?: string): this {
    if (userId) this.baseProperties.userId = userId;
    if (anonymousId) this.baseProperties.anonymousId = anonymousId;
    return this;
  }

  withSession(sessionId: string): this {
    this.baseProperties.sessionId = sessionId;
    return this;
  }

  withContext(context: PageViewEvent['context']): this {
    this.baseProperties.context = context;
    return this;
  }

  pageView(properties?: PageViewEvent['properties']): PageViewEvent {
    return {
      ...this.baseProperties,
      event: 'page_view',
      properties,
    } as PageViewEvent;
  }

  custom(
    eventName: string,
    properties?: Record<string, any>,
    category?: string
  ): CustomEvent {
    return {
      ...this.baseProperties,
      event: eventName,
      category,
      properties,
    } as CustomEvent;
  }

  performance(properties: PerformanceEvent['properties']): PerformanceEvent {
    return {
      ...this.baseProperties,
      event: 'performance',
      properties,
    } as PerformanceEvent;
  }

  error(properties: ErrorEvent['properties']): ErrorEvent {
    return {
      ...this.baseProperties,
      event: 'error',
      properties,
    } as ErrorEvent;
  }

  identify(
    userId: string,
    properties: IdentifyEvent['properties']
  ): IdentifyEvent {
    return {
      ...this.baseProperties,
      event: 'identify',
      userId,
      properties,
    } as IdentifyEvent;
  }

  session(properties: SessionEvent['properties']): SessionEvent {
    return {
      ...this.baseProperties,
      event: 'session',
      properties,
    } as SessionEvent;
  }
}
```

### 5. Event Utilities

Create `packages/events/src/utils.ts`:
```typescript
import { createHash } from 'crypto';
import type { RadarEvent } from './types';

/**
 * Generate anonymous ID from fingerprint data
 */
export function generateAnonymousId(
  fingerprint: string | Record<string, any>
): string {
  const data = typeof fingerprint === 'string' 
    ? fingerprint 
    : JSON.stringify(fingerprint);
  
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if event is within retention period
 */
export function isWithinRetention(
  event: RadarEvent,
  retentionDays: number
): boolean {
  const eventDate = new Date(event.timestamp);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  return eventDate > cutoffDate;
}

/**
 * Group events by time window
 */
export function groupEventsByWindow(
  events: RadarEvent[],
  windowMinutes: number
): Map<string, RadarEvent[]> {
  const groups = new Map<string, RadarEvent[]>();
  
  for (const event of events) {
    const date = new Date(event.timestamp);
    const window = Math.floor(date.getTime() / (windowMinutes * 60 * 1000));
    const key = `${window}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(event);
  }
  
  return groups;
}

/**
 * Calculate event statistics
 */
export function calculateEventStats(events: RadarEvent[]): EventStats {
  const stats: EventStats = {
    total: events.length,
    byType: {},
    byHour: {},
    uniqueUsers: new Set(),
    uniqueSessions: new Set(),
  };

  for (const event of events) {
    // Count by type
    stats.byType[event.event] = (stats.byType[event.event] || 0) + 1;
    
    // Count by hour
    const hour = new Date(event.timestamp).getHours();
    stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    
    // Track unique users/sessions
    if (event.userId) stats.uniqueUsers.add(event.userId);
    if (event.sessionId) stats.uniqueSessions.add(event.sessionId);
  }

  return {
    ...stats,
    uniqueUsersCount: stats.uniqueUsers.size,
    uniqueSessionsCount: stats.uniqueSessions.size,
  };
}

export interface EventStats {
  total: number;
  byType: Record<string, number>;
  byHour: Record<number, number>;
  uniqueUsers: Set<string>;
  uniqueSessions: Set<string>;
  uniqueUsersCount?: number;
  uniqueSessionsCount?: number;
}
```

### 6. Package Exports

Update `packages/events/src/index.ts`:
```typescript
// Types
export * from './types';

// Processing
export { EventProcessor, EventValidationError } from './processor';
export type { BatchedEvents } from './processor';

// Queue
export { MemoryEventQueue, RedisEventQueue } from './queue';
export type { EventQueue } from './queue';

// Builders
export { EventBuilder } from './builders';

// Utilities
export {
  generateAnonymousId,
  generateSessionId,
  isWithinRetention,
  groupEventsByWindow,
  calculateEventStats,
} from './utils';
export type { EventStats } from './utils';
```

## Testing Requirements

1. Test event validation with valid and invalid data
2. Test event enrichment with various request headers
3. Test serialization/deserialization
4. Test event batching
5. Test queue operations (push, pull, size)
6. Test event builders
7. Test utility functions

## Success Criteria

- ✅ Complete event type system
- ✅ Validation working correctly
- ✅ Event processing pipeline ready
- ✅ Queue abstraction implemented
- ✅ Builder pattern for easy event creation
- ✅ Utility functions tested
- ✅ Full TypeScript support

## Handoff to Next Agent

Agent 4 will need:
- Event type definitions
- Event processing capabilities
- Understanding of event flow
- Queue interface for background processing

## Notes

- Use Zod for runtime validation
- Design for high throughput
- Keep events immutable
- Support both memory and Redis queues
- Consider event versioning in future