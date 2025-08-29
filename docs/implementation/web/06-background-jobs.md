# Agent 6: Background Jobs with Inngest

## Objective
Implement background job processing using Inngest for event processing, analytics aggregation, AI analysis, data cleanup, and scheduled tasks.

## Dependencies
- Agent 3: Event system complete
- Agent 4: AI foundation ready
- Agent 5: Analytics engine available
- @repo/jobs package created
- Inngest account and keys

## Scope of Work

### 1. Inngest Configuration

Create `packages/jobs/src/client.ts`:
```typescript
import { Inngest, EventSchemas } from 'inngest';
import { z } from 'zod';

// Define event schemas
export const eventSchemas = {
  // Event processing
  'radar/event.received': {
    data: z.object({
      projectId: z.string(),
      event: z.any(), // RadarEvent schema
      timestamp: z.string().datetime(),
    }),
  },
  
  'radar/event.batch': {
    data: z.object({
      projectId: z.string(),
      events: z.array(z.any()), // Array of RadarEvents
      batchId: z.string(),
    }),
  },
  
  // Analytics aggregation
  'radar/analytics.aggregate': {
    data: z.object({
      projectId: z.string(),
      date: z.string().datetime(),
      type: z.enum(['daily', 'hourly', 'realtime']),
    }),
  },
  
  // AI analysis
  'radar/ai.analyze': {
    data: z.object({
      projectId: z.string(),
      analysisType: z.enum(['insights', 'anomalies', 'predictions']),
      timeframe: z.enum(['hour', 'day', 'week', 'month']),
    }),
  },
  
  // Alerts
  'radar/alert.triggered': {
    data: z.object({
      projectId: z.string(),
      alertId: z.string(),
      type: z.enum(['threshold', 'anomaly', 'error']),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      data: z.any(),
    }),
  },
  
  // Data management
  'radar/data.cleanup': {
    data: z.object({
      projectId: z.string().optional(),
      type: z.enum(['events', 'sessions', 'analytics']),
      olderThan: z.string().datetime(),
    }),
  },
  
  // Reports
  'radar/report.generate': {
    data: z.object({
      projectId: z.string(),
      reportType: z.enum(['daily', 'weekly', 'monthly', 'custom']),
      recipients: z.array(z.string().email()),
      dateRange: z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
      }),
    }),
  },
} satisfies EventSchemas;

// Create Inngest client
export const inngest = new Inngest({
  id: 'radar',
  schemas: {
    events: eventSchemas,
  },
  env: process.env.NODE_ENV,
});

// Export event types
export type RadarEvents = typeof eventSchemas;
export type EventName = keyof RadarEvents;
export type EventData<T extends EventName> = z.infer<RadarEvents[T]['data']>;
```

### 2. Event Processing Functions

Create `packages/jobs/src/functions/events.ts`:
```typescript
import { inngest } from '../client';
import { db } from '@repo/database';
import { events, sessions } from '@repo/database/schema';
import { EventProcessor } from '@repo/events';
import { analytics } from '@repo/analytics';

/**
 * Process individual events
 */
export const processEvent = inngest.createFunction(
  {
    id: 'process-event',
    name: 'Process Event',
    concurrency: {
      limit: 100,
      key: 'event.data.projectId',
    },
  },
  { event: 'radar/event.received' },
  async ({ event, step }) => {
    // Validate event
    const validatedEvent = await step.run('validate', async () => {
      return EventProcessor.validate(event.data.event);
    });

    // Check rate limits
    await step.run('check-rate-limit', async () => {
      const { success } = await checkRateLimit(event.data.projectId);
      if (!success) {
        throw new Error('Rate limit exceeded');
      }
    });

    // Store event
    const storedEvent = await step.run('store-event', async () => {
      return db.insert(events).values({
        projectId: event.data.projectId,
        name: validatedEvent.event,
        category: validatedEvent.category,
        properties: validatedEvent.properties,
        userId: validatedEvent.userId,
        anonymousId: validatedEvent.anonymousId,
        sessionId: validatedEvent.sessionId,
        timestamp: new Date(validatedEvent.timestamp),
        // ... other fields
      }).returning();
    });

    // Update session
    if (validatedEvent.sessionId) {
      await step.run('update-session', async () => {
        await updateSession(validatedEvent.sessionId, validatedEvent);
      });
    }

    // Add to real-time processor
    await step.run('update-realtime', async () => {
      analytics.realtime.addEvent(validatedEvent);
    });

    // Trigger analytics aggregation
    await step.sendEvent('trigger-aggregation', {
      name: 'radar/analytics.aggregate',
      data: {
        projectId: event.data.projectId,
        date: validatedEvent.timestamp,
        type: 'realtime',
      },
    });

    return { eventId: storedEvent[0].id };
  }
);

/**
 * Process event batches
 */
export const processBatch = inngest.createFunction(
  {
    id: 'process-batch',
    name: 'Process Event Batch',
    concurrency: {
      limit: 20,
      key: 'event.data.projectId',
    },
  },
  { event: 'radar/event.batch' },
  async ({ event, step }) => {
    const { projectId, events: batchEvents, batchId } = event.data;

    // Validate all events
    const validatedEvents = await step.run('validate-batch', async () => {
      return Promise.all(
        batchEvents.map(e => EventProcessor.validate(e))
      );
    });

    // Store events in bulk
    const storedEvents = await step.run('store-batch', async () => {
      const values = validatedEvents.map(e => ({
        projectId,
        name: e.event,
        properties: e.properties,
        userId: e.userId,
        anonymousId: e.anonymousId,
        sessionId: e.sessionId,
        timestamp: new Date(e.timestamp),
        // ... other fields
      }));

      return db.insert(events).values(values).returning();
    });

    // Update sessions in parallel
    await step.run('update-sessions', async () => {
      const sessionUpdates = new Map<string, any[]>();
      
      for (const event of validatedEvents) {
        if (event.sessionId) {
          if (!sessionUpdates.has(event.sessionId)) {
            sessionUpdates.set(event.sessionId, []);
          }
          sessionUpdates.get(event.sessionId)!.push(event);
        }
      }

      await Promise.all(
        Array.from(sessionUpdates.entries()).map(([sessionId, events]) =>
          updateSession(sessionId, events)
        )
      );
    });

    // Update real-time metrics
    await step.run('update-realtime-batch', async () => {
      for (const event of validatedEvents) {
        analytics.realtime.addEvent(event);
      }
    });

    // Trigger analytics
    await step.sendEvent('trigger-analytics', {
      name: 'radar/analytics.aggregate',
      data: {
        projectId,
        date: new Date().toISOString(),
        type: 'realtime',
      },
    });

    return {
      batchId,
      processed: storedEvents.length,
    };
  }
);

// Helper functions
async function checkRateLimit(projectId: string): Promise<{ success: boolean }> {
  // Implementation using Upstash rate limiting
  return { success: true };
}

async function updateSession(sessionId: string, eventOrEvents: any) {
  // Update session metrics
  const events = Array.isArray(eventOrEvents) ? eventOrEvents : [eventOrEvents];
  
  // Calculate session updates
  const pageViews = events.filter(e => e.event === 'page_view').length;
  const lastEventTime = new Date(
    Math.max(...events.map(e => new Date(e.timestamp).getTime()))
  );

  // Update session
  await db.update(sessions)
    .set({
      pageViews: sql`${sessions.pageViews} + ${pageViews}`,
      events: sql`${sessions.events} + ${events.length}`,
      endedAt: lastEventTime,
      updatedAt: new Date(),
    })
    .where(sql`${sessions.id} = ${sessionId}`);
}
```

### 3. Analytics Aggregation Functions

Create `packages/jobs/src/functions/analytics.ts`:
```typescript
import { inngest } from '../client';
import { analytics } from '@repo/analytics';
import { ai } from '@repo/ai';

/**
 * Aggregate analytics data
 */
export const aggregateAnalytics = inngest.createFunction(
  {
    id: 'aggregate-analytics',
    name: 'Aggregate Analytics',
    concurrency: {
      limit: 10,
      key: 'event.data.projectId',
    },
    retries: 3,
  },
  { event: 'radar/analytics.aggregate' },
  async ({ event, step }) => {
    const { projectId, date, type } = event.data;
    const targetDate = new Date(date);

    // Perform aggregation based on type
    const result = await step.run(`aggregate-${type}`, async () => {
      switch (type) {
        case 'realtime':
          // Real-time aggregation (last 5 minutes)
          return analytics.aggregator.aggregateRealtime(projectId, targetDate);
        
        case 'hourly':
          // Hourly aggregation
          return analytics.aggregator.aggregateHourly(projectId, targetDate);
        
        case 'daily':
          // Daily aggregation
          return analytics.aggregator.aggregateDaily(projectId, targetDate);
        
        default:
          throw new Error(`Unknown aggregation type: ${type}`);
      }
    });

    // Trigger AI analysis for daily aggregations
    if (type === 'daily') {
      await step.sendEvent('trigger-ai-analysis', {
        name: 'radar/ai.analyze',
        data: {
          projectId,
          analysisType: 'insights',
          timeframe: 'day',
        },
      });
    }

    return {
      projectId,
      date: targetDate,
      type,
      metrics: result.metrics,
    };
  }
);

/**
 * Scheduled daily aggregation
 */
export const scheduledDailyAggregation = inngest.createFunction(
  {
    id: 'scheduled-daily-aggregation',
    name: 'Scheduled Daily Aggregation',
  },
  {
    cron: '0 1 * * *', // Run at 1 AM daily
  },
  async ({ step }) => {
    // Get all active projects
    const projects = await step.run('get-projects', async () => {
      return getActiveProjects();
    });

    // Trigger aggregation for each project
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await step.run('trigger-aggregations', async () => {
      const events = projects.map(project => ({
        name: 'radar/analytics.aggregate' as const,
        data: {
          projectId: project.id,
          date: yesterday.toISOString(),
          type: 'daily' as const,
        },
      }));

      await inngest.send(events);
    });

    return {
      projects: projects.length,
      date: yesterday,
    };
  }
);

async function getActiveProjects() {
  // Fetch active projects from database
  return [];
}
```

### 4. AI Analysis Functions

Create `packages/jobs/src/functions/ai.ts`:
```typescript
import { inngest } from '../client';
import { ai } from '@repo/ai';
import { db } from '@repo/database';
import { insights, predictions } from '@repo/database/schema';

/**
 * Run AI analysis
 */
export const runAIAnalysis = inngest.createFunction(
  {
    id: 'run-ai-analysis',
    name: 'Run AI Analysis',
    concurrency: {
      limit: 5, // Limit concurrent AI operations
    },
    retries: 2,
  },
  { event: 'radar/ai.analyze' },
  async ({ event, step }) => {
    const { projectId, analysisType, timeframe } = event.data;

    // Run analysis based on type
    const results = await step.run(`ai-${analysisType}`, async () => {
      switch (analysisType) {
        case 'insights':
          return ai.insights.generateInsights(projectId);
        
        case 'anomalies':
          return ai.anomaly.detectAnomalies(projectId);
        
        case 'predictions':
          return ai.prediction.generatePredictions(projectId);
        
        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }
    });

    // Store results
    await step.run('store-results', async () => {
      if (analysisType === 'insights') {
        await db.insert(insights).values(
          results.map(insight => ({
            projectId,
            type: insight.type,
            category: insight.category,
            title: insight.title,
            description: insight.description,
            confidence: insight.confidence,
            impact: insight.impact,
            data: insight.data,
            detectedAt: insight.detectedAt,
          }))
        );
      } else if (analysisType === 'predictions') {
        await db.insert(predictions).values(
          results.map(prediction => ({
            projectId,
            metric: prediction.metric,
            timeframe: prediction.timeframe,
            predictedValue: prediction.predictedValue,
            confidence: prediction.confidence,
            factors: prediction.factors,
            explanation: prediction.explanation,
            targetDate: prediction.targetDate,
          }))
        );
      }
    });

    // Check for critical insights
    const criticalInsights = results.filter(r => 
      r.impact === 'high' && r.confidence > 0.8
    );

    if (criticalInsights.length > 0) {
      await step.sendEvent('send-alerts', {
        name: 'radar/alert.triggered',
        data: {
          projectId,
          alertId: `ai-${analysisType}-${Date.now()}`,
          type: 'anomaly',
          severity: 'high',
          data: criticalInsights,
        },
      });
    }

    return {
      projectId,
      analysisType,
      resultsCount: results.length,
      criticalCount: criticalInsights.length,
    };
  }
);

/**
 * Scheduled AI analysis
 */
export const scheduledAIAnalysis = inngest.createFunction(
  {
    id: 'scheduled-ai-analysis',
    name: 'Scheduled AI Analysis',
  },
  {
    cron: '0 */6 * * *', // Run every 6 hours
  },
  async ({ step }) => {
    const projects = await step.run('get-active-projects', async () => {
      return getProjectsForAnalysis();
    });

    // Trigger analysis for each project
    await step.run('trigger-analyses', async () => {
      const events = [];
      
      for (const project of projects) {
        events.push(
          {
            name: 'radar/ai.analyze' as const,
            data: {
              projectId: project.id,
              analysisType: 'insights' as const,
              timeframe: 'day' as const,
            },
          },
          {
            name: 'radar/ai.analyze' as const,
            data: {
              projectId: project.id,
              analysisType: 'anomalies' as const,
              timeframe: 'day' as const,
            },
          }
        );
      }

      await inngest.send(events);
    });

    return {
      projects: projects.length,
      analyses: projects.length * 2,
    };
  }
);

async function getProjectsForAnalysis() {
  // Get projects that need AI analysis
  return [];
}
```

### 5. Alert Functions

Create `packages/jobs/src/functions/alerts.ts`:
```typescript
import { inngest } from '../client';
import { sendEmail } from '@repo/email'; // Assuming email package exists

/**
 * Process triggered alerts
 */
export const processAlert = inngest.createFunction(
  {
    id: 'process-alert',
    name: 'Process Alert',
    concurrency: {
      limit: 50,
    },
  },
  { event: 'radar/alert.triggered' },
  async ({ event, step }) => {
    const { projectId, alertId, type, severity, data } = event.data;

    // Get alert configuration
    const config = await step.run('get-alert-config', async () => {
      return getAlertConfig(projectId, type);
    });

    if (!config.enabled) {
      return { skipped: true, reason: 'Alerts disabled' };
    }

    // Check if alert should be throttled
    const shouldThrottle = await step.run('check-throttle', async () => {
      return checkAlertThrottle(projectId, type, severity);
    });

    if (shouldThrottle) {
      return { skipped: true, reason: 'Alert throttled' };
    }

    // Send notifications based on severity
    const notifications = await step.run('send-notifications', async () => {
      const sent = [];

      // Email notifications
      if (config.email && severity !== 'low') {
        await sendEmail({
          to: config.emailRecipients,
          subject: `[${severity.toUpperCase()}] ${type} alert for ${config.projectName}`,
          template: 'alert',
          data: {
            projectName: config.projectName,
            alertType: type,
            severity,
            data,
            dashboardUrl: `${process.env.APP_URL}/projects/${projectId}/alerts/${alertId}`,
          },
        });
        sent.push('email');
      }

      // Webhook notifications
      if (config.webhook) {
        await fetch(config.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Radar-Signature': generateWebhookSignature(data),
          },
          body: JSON.stringify({
            alertId,
            projectId,
            type,
            severity,
            data,
            timestamp: new Date().toISOString(),
          }),
        });
        sent.push('webhook');
      }

      return sent;
    });

    // Store alert history
    await step.run('store-alert', async () => {
      await storeAlertHistory({
        alertId,
        projectId,
        type,
        severity,
        data,
        notifications,
      });
    });

    return {
      alertId,
      notifications,
    };
  }
);

/**
 * Monitor metric thresholds
 */
export const monitorThresholds = inngest.createFunction(
  {
    id: 'monitor-thresholds',
    name: 'Monitor Metric Thresholds',
  },
  {
    cron: '*/5 * * * *', // Every 5 minutes
  },
  async ({ step }) => {
    // Get all threshold rules
    const rules = await step.run('get-threshold-rules', async () => {
      return getActiveThresholdRules();
    });

    // Check each rule
    const triggered = await step.run('check-thresholds', async () => {
      const alerts = [];

      for (const rule of rules) {
        const value = await getCurrentMetricValue(rule.projectId, rule.metric);
        
        if (checkThreshold(value, rule.operator, rule.threshold)) {
          alerts.push({
            projectId: rule.projectId,
            rule,
            value,
          });
        }
      }

      return alerts;
    });

    // Send alerts
    if (triggered.length > 0) {
      await step.run('send-threshold-alerts', async () => {
        const events = triggered.map(alert => ({
          name: 'radar/alert.triggered' as const,
          data: {
            projectId: alert.projectId,
            alertId: `threshold-${alert.rule.id}-${Date.now()}`,
            type: 'threshold' as const,
            severity: alert.rule.severity,
            data: {
              metric: alert.rule.metric,
              threshold: alert.rule.threshold,
              value: alert.value,
              rule: alert.rule,
            },
          },
        }));

        await inngest.send(events);
      });
    }

    return {
      rulesChecked: rules.length,
      alertsTriggered: triggered.length,
    };
  }
);

// Helper functions
async function getAlertConfig(projectId: string, type: string) {
  // Fetch alert configuration
  return {
    enabled: true,
    email: true,
    emailRecipients: [],
    webhook: false,
    webhookUrl: '',
    projectName: 'Project',
  };
}

async function checkAlertThrottle(
  projectId: string,
  type: string,
  severity: string
): Promise<boolean> {
  // Check if similar alert was recently sent
  return false;
}

function generateWebhookSignature(data: any): string {
  // Generate HMAC signature
  return '';
}

async function storeAlertHistory(alert: any) {
  // Store in database
}

async function getActiveThresholdRules() {
  // Fetch threshold rules
  return [];
}

async function getCurrentMetricValue(projectId: string, metric: string) {
  // Get current metric value
  return 0;
}

function checkThreshold(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case 'gt': return value > threshold;
    case 'gte': return value >= threshold;
    case 'lt': return value < threshold;
    case 'lte': return value <= threshold;
    case 'eq': return value === threshold;
    default: return false;
  }
}
```

### 6. Data Management Functions

Create `packages/jobs/src/functions/data.ts`:
```typescript
import { inngest } from '../client';
import { db } from '@repo/database';
import { events, sessions, dailyAnalytics } from '@repo/database/schema';
import { sql, and, lt } from 'drizzle-orm';

/**
 * Clean up old data
 */
export const cleanupData = inngest.createFunction(
  {
    id: 'cleanup-data',
    name: 'Data Cleanup',
    concurrency: {
      limit: 1, // Run one at a time
    },
  },
  { event: 'radar/data.cleanup' },
  async ({ event, step }) => {
    const { projectId, type, olderThan } = event.data;
    const cutoffDate = new Date(olderThan);

    const deleted = await step.run(`cleanup-${type}`, async () => {
      switch (type) {
        case 'events':
          // Delete old events
          const deletedEvents = await db.delete(events)
            .where(and(
              projectId ? sql`${events.projectId} = ${projectId}` : sql`1=1`,
              lt(events.createdAt, cutoffDate)
            ))
            .returning({ id: events.id });
          
          return { type: 'events', count: deletedEvents.length };

        case 'sessions':
          // Delete old sessions
          const deletedSessions = await db.delete(sessions)
            .where(and(
              projectId ? sql`${sessions.projectId} = ${projectId}` : sql`1=1`,
              lt(sessions.createdAt, cutoffDate)
            ))
            .returning({ id: sessions.id });
          
          return { type: 'sessions', count: deletedSessions.length };

        case 'analytics':
          // Archive old analytics data
          const archivedAnalytics = await archiveAnalytics(projectId, cutoffDate);
          
          return { type: 'analytics', count: archivedAnalytics };

        default:
          throw new Error(`Unknown cleanup type: ${type}`);
      }
    });

    // Log cleanup
    await step.run('log-cleanup', async () => {
      console.log(`Cleaned up ${deleted.count} ${deleted.type} older than ${cutoffDate}`);
    });

    return deleted;
  }
);

/**
 * Scheduled data retention
 */
export const scheduledDataRetention = inngest.createFunction(
  {
    id: 'scheduled-data-retention',
    name: 'Scheduled Data Retention',
  },
  {
    cron: '0 3 * * *', // Run at 3 AM daily
  },
  async ({ step }) => {
    // Get retention policies
    const policies = await step.run('get-retention-policies', async () => {
      return getRetentionPolicies();
    });

    // Trigger cleanup for each policy
    await step.run('trigger-cleanups', async () => {
      const events = [];

      for (const policy of policies) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

        events.push({
          name: 'radar/data.cleanup' as const,
          data: {
            projectId: policy.projectId,
            type: policy.dataType,
            olderThan: cutoffDate.toISOString(),
          },
        });
      }

      await inngest.send(events);
    });

    return {
      policies: policies.length,
    };
  }
);

// Helper functions
async function archiveAnalytics(projectId: string | undefined, cutoffDate: Date) {
  // Move old analytics to archive table or cold storage
  return 0;
}

async function getRetentionPolicies() {
  // Default retention policies
  return [
    { projectId: undefined, dataType: 'events' as const, retentionDays: 90 },
    { projectId: undefined, dataType: 'sessions' as const, retentionDays: 180 },
    { projectId: undefined, dataType: 'analytics' as const, retentionDays: 365 },
  ];
}
```

### 7. Report Generation Functions

Create `packages/jobs/src/functions/reports.ts`:
```typescript
import { inngest } from '../client';
import { analytics } from '@repo/analytics';
import { generatePDF } from '@repo/pdf'; // Assuming PDF generation package

/**
 * Generate analytics reports
 */
export const generateReport = inngest.createFunction(
  {
    id: 'generate-report',
    name: 'Generate Report',
    concurrency: {
      limit: 5,
    },
  },
  { event: 'radar/report.generate' },
  async ({ event, step }) => {
    const { projectId, reportType, recipients, dateRange } = event.data;

    // Fetch analytics data
    const data = await step.run('fetch-analytics', async () => {
      return analytics.aggregator.getAnalyticsSummary(
        projectId,
        new Date(dateRange.start),
        new Date(dateRange.end)
      );
    });

    // Fetch AI insights
    const insights = await step.run('fetch-insights', async () => {
      return getRecentInsights(projectId, dateRange);
    });

    // Generate report
    const report = await step.run('generate-pdf', async () => {
      return generatePDF({
        type: reportType,
        projectId,
        dateRange,
        data: {
          summary: data,
          insights,
          charts: generateCharts(data),
        },
      });
    });

    // Send report
    await step.run('send-report', async () => {
      await sendEmail({
        to: recipients,
        subject: `${reportType} Analytics Report`,
        attachments: [{
          filename: `report-${reportType}-${Date.now()}.pdf`,
          content: report.buffer,
        }],
        template: 'report',
        data: {
          reportType,
          dateRange,
          summary: data.totals,
        },
      });
    });

    return {
      reportId: report.id,
      recipients: recipients.length,
    };
  }
);

/**
 * Scheduled weekly reports
 */
export const scheduledWeeklyReports = inngest.createFunction(
  {
    id: 'scheduled-weekly-reports',
    name: 'Scheduled Weekly Reports',
  },
  {
    cron: '0 9 * * 1', // Mondays at 9 AM
  },
  async ({ step }) => {
    // Get projects with weekly reports enabled
    const projects = await step.run('get-report-subscriptions', async () => {
      return getWeeklyReportSubscriptions();
    });

    // Generate reports
    await step.run('generate-reports', async () => {
      const events = projects.map(project => ({
        name: 'radar/report.generate' as const,
        data: {
          projectId: project.id,
          reportType: 'weekly' as const,
          recipients: project.recipients,
          dateRange: {
            start: getLastMonday().toISOString(),
            end: new Date().toISOString(),
          },
        },
      }));

      await inngest.send(events);
    });

    return {
      reports: projects.length,
    };
  }
);

// Helper functions
async function getRecentInsights(projectId: string, dateRange: any) {
  // Fetch recent AI insights
  return [];
}

function generateCharts(data: any) {
  // Generate chart data
  return {};
}

async function sendEmail(options: any) {
  // Send email implementation
}

async function getWeeklyReportSubscriptions() {
  // Get subscriptions
  return [];
}

function getLastMonday(): Date {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}
```

### 8. Export All Functions

Update `packages/jobs/src/index.ts`:
```typescript
// Client
export { inngest, eventSchemas } from './client';
export type { RadarEvents, EventName, EventData } from './client';

// Event Processing
export { processEvent, processBatch } from './functions/events';

// Analytics
export { aggregateAnalytics, scheduledDailyAggregation } from './functions/analytics';

// AI Analysis
export { runAIAnalysis, scheduledAIAnalysis } from './functions/ai';

// Alerts
export { processAlert, monitorThresholds } from './functions/alerts';

// Data Management
export { cleanupData, scheduledDataRetention } from './functions/data';

// Reports
export { generateReport, scheduledWeeklyReports } from './functions/reports';

// Export all functions as array for registration
export const functions = [
  // Events
  processEvent,
  processBatch,
  
  // Analytics
  aggregateAnalytics,
  scheduledDailyAggregation,
  
  // AI
  runAIAnalysis,
  scheduledAIAnalysis,
  
  // Alerts
  processAlert,
  monitorThresholds,
  
  // Data
  cleanupData,
  scheduledDataRetention,
  
  // Reports
  generateReport,
  scheduledWeeklyReports,
];
```

### 9. Inngest Route Handler

Create route handler for Next.js apps:
```typescript
// apps/api/src/app/api/inngest/route.ts
import { serve } from 'inngest/next';
import { inngest, functions } from '@repo/jobs';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
```

## Testing Requirements

1. Test each function individually with sample events
2. Test concurrency limits
3. Test retry logic for failures
4. Test scheduled functions
5. Test event validation
6. Test step isolation and recovery
7. Load test with high event volumes

## Success Criteria

- ✅ All background jobs implemented
- ✅ Event processing < 1s per event
- ✅ Scheduled jobs running reliably
- ✅ Proper error handling and retries
- ✅ Concurrency limits working
- ✅ Alert system functional
- ✅ Data retention automated

## Handoff to Next Agent

Agent 7 will need:
- Understanding of job triggering
- Event schemas for API integration
- Background processing capabilities
- Scheduled job configurations

## Notes

- Use Inngest's step functions for reliability
- Implement proper concurrency controls
- Design for idempotency
- Monitor job performance
- Set up proper alerting for failures