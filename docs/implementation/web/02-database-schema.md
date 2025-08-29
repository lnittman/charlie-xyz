# Agent 2: Database Schema & Models

## Objective
Design and implement the complete database schema for Radar using Drizzle ORM and Neon PostgreSQL, including all tables, indexes, and relationships needed for the analytics platform.

## Dependencies
- Agent 1: Infrastructure setup complete
- @repo/database package with Drizzle configured
- Neon PostgreSQL connection

## Scope of Work

### 1. Configure Drizzle

Create `packages/database/drizzle.config.ts`:
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/*',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

### 2. Core Schema Design

#### Organizations & Projects
`packages/database/src/schema/organizations.ts`:
```typescript
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkOrganizationId: text('clerk_organization_id').unique().notNull(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  domain: text('domain'),
  publicKey: text('public_key').unique().notNull(),
  secretKey: text('secret_key').unique().notNull(),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Events & Sessions
`packages/database/src/schema/events.ts`:
```typescript
import { pgTable, uuid, text, timestamp, jsonb, index, integer, real } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  sessionId: uuid('session_id').references(() => sessions.id),
  userId: text('user_id'),
  anonymousId: text('anonymous_id'),
  
  // Event data
  name: text('name').notNull(),
  category: text('category'),
  properties: jsonb('properties').default({}),
  
  // Page data
  pageUrl: text('page_url'),
  pageTitle: text('page_title'),
  referrer: text('referrer'),
  
  // Device & location
  deviceType: text('device_type'),
  browser: text('browser'),
  os: text('os'),
  country: text('country'),
  city: text('city'),
  
  // Performance metrics
  loadTime: integer('load_time'),
  renderTime: integer('render_time'),
  
  // Timestamps
  timestamp: timestamp('timestamp').notNull(),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index('events_project_id_idx').on(table.projectId),
  timestampIdx: index('events_timestamp_idx').on(table.timestamp),
  nameIdx: index('events_name_idx').on(table.name),
  userIdIdx: index('events_user_id_idx').on(table.userId),
  sessionIdIdx: index('events_session_id_idx').on(table.sessionId),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  userId: text('user_id'),
  anonymousId: text('anonymous_id').notNull(),
  
  // Session data
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'),
  pageViews: integer('page_views').default(0),
  events: integer('events').default(0),
  
  // Entry data
  entryPage: text('entry_page'),
  exitPage: text('exit_page'),
  referrer: text('referrer'),
  referrerDomain: text('referrer_domain'),
  
  // Device & location
  deviceType: text('device_type'),
  browser: text('browser'),
  os: text('os'),
  country: text('country'),
  city: text('city'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index('sessions_project_id_idx').on(table.projectId),
  startedAtIdx: index('sessions_started_at_idx').on(table.startedAt),
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
}));
```

#### Analytics Aggregates
`packages/database/src/schema/analytics.ts`:
```typescript
import { pgTable, uuid, text, timestamp, integer, real, date, index } from 'drizzle-orm/pg-core';

export const dailyAnalytics = pgTable('daily_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  date: date('date').notNull(),
  
  // Core metrics
  pageViews: integer('page_views').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  sessions: integer('sessions').default(0),
  bounceRate: real('bounce_rate'),
  avgSessionDuration: integer('avg_session_duration'),
  
  // Engagement metrics
  eventsCount: integer('events_count').default(0),
  goalsCompleted: integer('goals_completed').default(0),
  conversionRate: real('conversion_rate'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  projectDateIdx: index('daily_analytics_project_date_idx').on(table.projectId, table.date).unique(),
}));

export const pageAnalytics = pgTable('page_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  date: date('date').notNull(),
  pageUrl: text('page_url').notNull(),
  
  // Metrics
  views: integer('views').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  avgTimeOnPage: integer('avg_time_on_page'),
  bounceRate: real('bounce_rate'),
  exitRate: real('exit_rate'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  projectDatePageIdx: index('page_analytics_project_date_page_idx').on(
    table.projectId, 
    table.date, 
    table.pageUrl
  ).unique(),
}));
```

#### AI & Insights
`packages/database/src/schema/insights.ts`:
```typescript
import { pgTable, uuid, text, timestamp, jsonb, real, boolean } from 'drizzle-orm/pg-core';

export const insights = pgTable('insights', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  
  // Insight data
  type: text('type').notNull(), // 'trend', 'anomaly', 'prediction', 'recommendation'
  category: text('category').notNull(), // 'traffic', 'engagement', 'conversion', 'performance'
  title: text('title').notNull(),
  description: text('description').notNull(),
  
  // AI analysis
  confidence: real('confidence'), // 0-1 score
  impact: text('impact'), // 'high', 'medium', 'low'
  data: jsonb('data').default({}),
  
  // Status
  isRead: boolean('is_read').default(false),
  isActionable: boolean('is_actionable').default(true),
  
  // Temporal
  detectedAt: timestamp('detected_at').notNull(),
  validUntil: timestamp('valid_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const predictions = pgTable('predictions', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  
  // Prediction data
  metric: text('metric').notNull(), // 'traffic', 'conversion', 'revenue'
  timeframe: text('timeframe').notNull(), // 'day', 'week', 'month'
  predictedValue: real('predicted_value').notNull(),
  confidence: real('confidence').notNull(),
  
  // Context
  factors: jsonb('factors').default([]),
  explanation: text('explanation'),
  
  // Validation
  actualValue: real('actual_value'),
  accuracy: real('accuracy'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  targetDate: timestamp('target_date').notNull(),
});
```

#### User Tracking & Goals
`packages/database/src/schema/users.ts`:
```typescript
import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const trackedUsers = pgTable('tracked_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  userId: text('user_id').notNull(),
  
  // User properties
  email: text('email'),
  name: text('name'),
  properties: jsonb('properties').default({}),
  
  // Tracking
  firstSeen: timestamp('first_seen').notNull(),
  lastSeen: timestamp('last_seen').notNull(),
  totalSessions: integer('total_sessions').default(0),
  totalEvents: integer('total_events').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  projectUserIdx: index('tracked_users_project_user_idx').on(table.projectId, table.userId).unique(),
}));

export const goals = pgTable('goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  
  name: text('name').notNull(),
  type: text('type').notNull(), // 'event', 'pageview', 'duration', 'custom'
  conditions: jsonb('conditions').notNull(),
  value: real('value'),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const goalCompletions = pgTable('goal_completions', {
  id: uuid('id').defaultRandom().primaryKey(),
  goalId: uuid('goal_id').references(() => goals.id).notNull(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  userId: text('user_id'),
  
  value: real('value'),
  completedAt: timestamp('completed_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 3. Database Client Setup

Create `packages/database/src/client.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

export type Database = typeof db;
```

### 4. Index Exports

Update `packages/database/src/index.ts`:
```typescript
export * from './client';
export * from './schema/organizations';
export * from './schema/events';
export * from './schema/analytics';
export * from './schema/insights';
export * from './schema/users';
```

### 5. Migration Scripts

Create initial migration:
```bash
cd packages/database
bun run db:generate
```

### 6. Seed Data

Create `packages/database/src/seed.ts`:
```typescript
import { db } from './client';
import { organizations, projects } from './schema/organizations';

async function seed() {
  // Create demo organization
  const [org] = await db.insert(organizations).values({
    clerkOrganizationId: 'org_demo',
    name: 'Demo Organization',
    slug: 'demo-org',
  }).returning();

  // Create demo project
  const [project] = await db.insert(projects).values({
    organizationId: org.id,
    name: 'Demo Website',
    slug: 'demo-website',
    domain: 'https://demo.example.com',
    publicKey: 'pk_demo_' + crypto.randomUUID(),
    secretKey: 'sk_demo_' + crypto.randomUUID(),
  }).returning();

  console.log('Seed completed:', { org, project });
}

seed().catch(console.error);
```

## Testing Requirements

1. Generate migrations: `bun run db:generate`
2. Push schema to database: `bun run db:push`
3. Verify all tables created correctly
4. Test relationships with sample inserts
5. Verify indexes are created
6. Run seed script successfully

## Success Criteria

- ✅ All schema files created
- ✅ Drizzle client configured
- ✅ Migrations generated successfully
- ✅ Database schema deployed to Neon
- ✅ All indexes created
- ✅ Seed data inserted
- ✅ TypeScript types generated

## Performance Considerations

- Indexes on all foreign keys
- Composite indexes for common queries
- Partitioning for events table (future)
- JSONB for flexible properties
- Efficient aggregation queries

## Handoff to Next Agent

Agent 3 will need:
- Complete database schema
- Working database client
- Type-safe query interface
- Understanding of data model

## Notes

- Use UUID for all IDs for better distribution
- Store timestamps in UTC
- Use JSONB for flexible properties
- Design for horizontal scaling
- Consider data retention policies