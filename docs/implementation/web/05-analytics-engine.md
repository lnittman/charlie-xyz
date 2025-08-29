# Agent 5: Analytics Engine

## Objective
Build the core analytics engine that processes events, calculates metrics, aggregates data, and provides real-time analytics capabilities for the Radar platform.

## Dependencies
- Agent 2: Database schema complete
- Agent 3: Event system ready
- Agent 4: AI foundation available
- @repo/analytics package created

## Scope of Work

### 1. Core Metrics Calculator

Create `packages/analytics/src/metrics/calculator.ts`:
```typescript
import { z } from 'zod';
import type { RadarEvent } from '@repo/events';
import { Decimal } from 'decimal.js';

export class MetricsCalculator {
  /**
   * Calculate page view metrics
   */
  static calculatePageMetrics(events: RadarEvent[]): PageMetrics {
    const pageViews = events.filter(e => e.event === 'page_view');
    const uniquePages = new Set(pageViews.map(e => e.context?.page?.url));
    const uniqueUsers = new Set(pageViews.map(e => e.userId || e.anonymousId));
    
    // Calculate time on page
    const timeOnPage = this.calculateTimeOnPage(pageViews);
    
    // Calculate bounce rate
    const bounceRate = this.calculateBounceRate(pageViews);
    
    // Calculate exit rate per page
    const exitRates = this.calculateExitRates(pageViews);
    
    return {
      totalViews: pageViews.length,
      uniquePageCount: uniquePages.size,
      uniqueViewers: uniqueUsers.size,
      avgTimeOnPage: timeOnPage.average,
      bounceRate,
      exitRates,
      topPages: this.getTopPages(pageViews, 10),
    };
  }

  /**
   * Calculate session metrics
   */
  static calculateSessionMetrics(events: RadarEvent[]): SessionMetrics {
    const sessions = this.groupEventsBySession(events);
    const sessionMetrics: SessionData[] = [];
    
    for (const [sessionId, sessionEvents] of sessions) {
      const sorted = sessionEvents.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const startTime = new Date(sorted[0].timestamp);
      const endTime = new Date(sorted[sorted.length - 1].timestamp);
      const duration = endTime.getTime() - startTime.getTime();
      
      const pageViews = sorted.filter(e => e.event === 'page_view').length;
      const events = sorted.length;
      const bounced = pageViews === 1;
      
      sessionMetrics.push({
        sessionId,
        startTime,
        endTime,
        duration,
        pageViews,
        events,
        bounced,
        entryPage: sorted.find(e => e.event === 'page_view')?.context?.page?.url,
        exitPage: sorted.filter(e => e.event === 'page_view').pop()?.context?.page?.url,
      });
    }
    
    const totalSessions = sessionMetrics.length;
    const avgDuration = sessionMetrics.reduce((sum, s) => sum + s.duration, 0) / totalSessions;
    const avgPageViews = sessionMetrics.reduce((sum, s) => sum + s.pageViews, 0) / totalSessions;
    const bounceRate = sessionMetrics.filter(s => s.bounced).length / totalSessions;
    
    return {
      totalSessions,
      avgSessionDuration: avgDuration,
      avgPageViewsPerSession: avgPageViews,
      bounceRate,
      sessions: sessionMetrics,
    };
  }

  /**
   * Calculate user engagement metrics
   */
  static calculateEngagementMetrics(events: RadarEvent[]): EngagementMetrics {
    const users = this.groupEventsByUser(events);
    const engagementScores: Map<string, number> = new Map();
    
    for (const [userId, userEvents] of users) {
      const score = this.calculateUserEngagementScore(userEvents);
      engagementScores.set(userId, score);
    }
    
    const scores = Array.from(engagementScores.values());
    const avgEngagement = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    
    // Segment users by engagement level
    const highlyEngaged = scores.filter(s => s > 0.7).length;
    const moderatelyEngaged = scores.filter(s => s >= 0.3 && s <= 0.7).length;
    const lowEngaged = scores.filter(s => s < 0.3).length;
    
    return {
      avgEngagementScore: avgEngagement,
      userSegments: {
        high: highlyEngaged,
        moderate: moderatelyEngaged,
        low: lowEngaged,
      },
      topEngagedUsers: this.getTopEngagedUsers(engagementScores, 10),
      engagementTrend: this.calculateEngagementTrend(events),
    };
  }

  /**
   * Calculate conversion metrics
   */
  static calculateConversionMetrics(
    events: RadarEvent[],
    goals: Goal[]
  ): ConversionMetrics {
    const conversions: Map<string, Conversion[]> = new Map();
    
    for (const goal of goals) {
      const goalConversions = this.findGoalCompletions(events, goal);
      conversions.set(goal.id, goalConversions);
    }
    
    const totalConversions = Array.from(conversions.values())
      .reduce((sum, c) => sum + c.length, 0);
    
    const uniqueUsers = new Set(events.map(e => e.userId || e.anonymousId));
    const conversionRate = totalConversions / uniqueUsers.size;
    
    // Calculate funnel metrics
    const funnelMetrics = this.calculateFunnelMetrics(events, goals);
    
    return {
      totalConversions,
      conversionRate,
      goalConversions: conversions,
      funnelMetrics,
      topConvertingPages: this.getTopConvertingPages(events, conversions),
    };
  }

  /**
   * Calculate performance metrics
   */
  static calculatePerformanceMetrics(events: RadarEvent[]): PerformanceMetrics {
    const perfEvents = events.filter(e => e.event === 'performance');
    
    if (perfEvents.length === 0) {
      return {
        avgLoadTime: 0,
        avgTTFB: 0,
        avgFCP: 0,
        avgLCP: 0,
        avgFID: 0,
        avgCLS: 0,
        p75LoadTime: 0,
        p95LoadTime: 0,
      };
    }
    
    const metrics = {
      loadTimes: [] as number[],
      ttfb: [] as number[],
      fcp: [] as number[],
      lcp: [] as number[],
      fid: [] as number[],
      cls: [] as number[],
    };
    
    for (const event of perfEvents) {
      const props = event.properties as any;
      
      if (props.loadComplete && props.navigationStart) {
        metrics.loadTimes.push(props.loadComplete - props.navigationStart);
      }
      if (props.ttfb) metrics.ttfb.push(props.ttfb);
      if (props.fcp) metrics.fcp.push(props.fcp);
      if (props.lcp) metrics.lcp.push(props.lcp);
      if (props.fid) metrics.fid.push(props.fid);
      if (props.cls) metrics.cls.push(props.cls);
    }
    
    return {
      avgLoadTime: this.average(metrics.loadTimes),
      avgTTFB: this.average(metrics.ttfb),
      avgFCP: this.average(metrics.fcp),
      avgLCP: this.average(metrics.lcp),
      avgFID: this.average(metrics.fid),
      avgCLS: this.average(metrics.cls),
      p75LoadTime: this.percentile(metrics.loadTimes, 75),
      p95LoadTime: this.percentile(metrics.loadTimes, 95),
    };
  }

  // Helper methods
  private static calculateTimeOnPage(events: RadarEvent[]): { average: number; median: number } {
    const times: number[] = [];
    const pageGroups = this.groupByPage(events);
    
    for (const pageEvents of pageGroups.values()) {
      const sorted = pageEvents.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = new Date(sorted[i].timestamp).getTime();
        const next = new Date(sorted[i + 1].timestamp).getTime();
        const duration = next - current;
        
        // Only count reasonable durations (< 30 minutes)
        if (duration > 0 && duration < 30 * 60 * 1000) {
          times.push(duration);
        }
      }
    }
    
    return {
      average: this.average(times),
      median: this.median(times),
    };
  }

  private static calculateBounceRate(events: RadarEvent[]): number {
    const sessions = this.groupEventsBySession(events);
    let bounced = 0;
    
    for (const sessionEvents of sessions.values()) {
      const pageViews = sessionEvents.filter(e => e.event === 'page_view');
      if (pageViews.length === 1) bounced++;
    }
    
    return sessions.size > 0 ? bounced / sessions.size : 0;
  }

  private static calculateExitRates(events: RadarEvent[]): Map<string, number> {
    const exitRates = new Map<string, number>();
    const pageStats = new Map<string, { views: number; exits: number }>();
    
    const sessions = this.groupEventsBySession(events);
    
    for (const sessionEvents of sessions.values()) {
      const pageViews = sessionEvents
        .filter(e => e.event === 'page_view')
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      for (let i = 0; i < pageViews.length; i++) {
        const pageUrl = pageViews[i].context?.page?.url || 'unknown';
        const stats = pageStats.get(pageUrl) || { views: 0, exits: 0 };
        stats.views++;
        
        // Last page in session is an exit
        if (i === pageViews.length - 1) {
          stats.exits++;
        }
        
        pageStats.set(pageUrl, stats);
      }
    }
    
    for (const [page, stats] of pageStats) {
      exitRates.set(page, stats.exits / stats.views);
    }
    
    return exitRates;
  }

  private static calculateUserEngagementScore(events: RadarEvent[]): number {
    // Engagement score based on multiple factors
    const factors = {
      eventCount: Math.min(events.length / 100, 1) * 0.2,
      eventDiversity: this.getEventDiversity(events) * 0.2,
      sessionDepth: this.getSessionDepth(events) * 0.3,
      timeSpent: this.getTimeSpentScore(events) * 0.3,
    };
    
    return Object.values(factors).reduce((sum, score) => sum + score, 0);
  }

  private static getEventDiversity(events: RadarEvent[]): number {
    const uniqueEvents = new Set(events.map(e => e.event));
    return Math.min(uniqueEvents.size / 10, 1);
  }

  private static getSessionDepth(events: RadarEvent[]): number {
    const pageViews = events.filter(e => e.event === 'page_view').length;
    return Math.min(pageViews / 20, 1);
  }

  private static getTimeSpentScore(events: RadarEvent[]): number {
    if (events.length < 2) return 0;
    
    const sorted = events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const first = new Date(sorted[0].timestamp).getTime();
    const last = new Date(sorted[sorted.length - 1].timestamp).getTime();
    const duration = (last - first) / 1000 / 60; // minutes
    
    return Math.min(duration / 30, 1); // 30 minutes = perfect score
  }

  private static findGoalCompletions(events: RadarEvent[], goal: Goal): Conversion[] {
    const conversions: Conversion[] = [];
    
    for (const event of events) {
      if (this.matchesGoalConditions(event, goal)) {
        conversions.push({
          goalId: goal.id,
          userId: event.userId || event.anonymousId || 'anonymous',
          timestamp: new Date(event.timestamp),
          value: goal.value || 1,
          eventId: event.id,
        });
      }
    }
    
    return conversions;
  }

  private static matchesGoalConditions(event: RadarEvent, goal: Goal): boolean {
    switch (goal.type) {
      case 'event':
        return event.event === goal.conditions.eventName;
      
      case 'pageview':
        return event.event === 'page_view' && 
               event.context?.page?.url?.includes(goal.conditions.urlPattern);
      
      case 'custom':
        // Custom goal matching logic
        return this.evaluateCustomConditions(event, goal.conditions);
      
      default:
        return false;
    }
  }

  private static evaluateCustomConditions(event: RadarEvent, conditions: any): boolean {
    // Implement custom condition evaluation
    return false;
  }

  // Utility methods
  private static groupEventsBySession(events: RadarEvent[]): Map<string, RadarEvent[]> {
    const groups = new Map<string, RadarEvent[]>();
    
    for (const event of events) {
      const sessionId = event.sessionId || 'no-session';
      if (!groups.has(sessionId)) {
        groups.set(sessionId, []);
      }
      groups.get(sessionId)!.push(event);
    }
    
    return groups;
  }

  private static groupEventsByUser(events: RadarEvent[]): Map<string, RadarEvent[]> {
    const groups = new Map<string, RadarEvent[]>();
    
    for (const event of events) {
      const userId = event.userId || event.anonymousId || 'anonymous';
      if (!groups.has(userId)) {
        groups.set(userId, []);
      }
      groups.get(userId)!.push(event);
    }
    
    return groups;
  }

  private static groupByPage(events: RadarEvent[]): Map<string, RadarEvent[]> {
    const groups = new Map<string, RadarEvent[]>();
    
    for (const event of events) {
      if (event.event === 'page_view') {
        const page = event.context?.page?.url || 'unknown';
        if (!groups.has(page)) {
          groups.set(page, []);
        }
        groups.get(page)!.push(event);
      }
    }
    
    return groups;
  }

  private static getTopPages(events: RadarEvent[], limit: number): TopPage[] {
    const pageCounts = new Map<string, number>();
    
    for (const event of events) {
      if (event.event === 'page_view') {
        const page = event.context?.page?.url || 'unknown';
        pageCounts.set(page, (pageCounts.get(page) || 0) + 1);
      }
    }
    
    return Array.from(pageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([url, views]) => ({ url, views }));
  }

  private static getTopEngagedUsers(
    scores: Map<string, number>,
    limit: number
  ): Array<{ userId: string; score: number }> {
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId, score]) => ({ userId, score }));
  }

  private static getTopConvertingPages(
    events: RadarEvent[],
    conversions: Map<string, Conversion[]>
  ): TopConvertingPage[] {
    // Implementation for finding pages that lead to conversions
    return [];
  }

  private static calculateFunnelMetrics(
    events: RadarEvent[],
    goals: Goal[]
  ): FunnelMetrics {
    // Implementation for funnel analysis
    return {
      steps: [],
      overallConversion: 0,
      dropOffRates: [],
    };
  }

  private static calculateEngagementTrend(events: RadarEvent[]): number {
    // Calculate trend over time periods
    return 0;
  }

  private static average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private static median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private static percentile(numbers: number[], p: number): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

// Type definitions
export interface PageMetrics {
  totalViews: number;
  uniquePageCount: number;
  uniqueViewers: number;
  avgTimeOnPage: number;
  bounceRate: number;
  exitRates: Map<string, number>;
  topPages: TopPage[];
}

export interface SessionMetrics {
  totalSessions: number;
  avgSessionDuration: number;
  avgPageViewsPerSession: number;
  bounceRate: number;
  sessions: SessionData[];
}

export interface SessionData {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  pageViews: number;
  events: number;
  bounced: boolean;
  entryPage?: string;
  exitPage?: string;
}

export interface EngagementMetrics {
  avgEngagementScore: number;
  userSegments: {
    high: number;
    moderate: number;
    low: number;
  };
  topEngagedUsers: Array<{ userId: string; score: number }>;
  engagementTrend: number;
}

export interface ConversionMetrics {
  totalConversions: number;
  conversionRate: number;
  goalConversions: Map<string, Conversion[]>;
  funnelMetrics: FunnelMetrics;
  topConvertingPages: TopConvertingPage[];
}

export interface PerformanceMetrics {
  avgLoadTime: number;
  avgTTFB: number;
  avgFCP: number;
  avgLCP: number;
  avgFID: number;
  avgCLS: number;
  p75LoadTime: number;
  p95LoadTime: number;
}

export interface Goal {
  id: string;
  name: string;
  type: 'event' | 'pageview' | 'duration' | 'custom';
  conditions: any;
  value?: number;
}

export interface Conversion {
  goalId: string;
  userId: string;
  timestamp: Date;
  value: number;
  eventId?: string;
}

export interface TopPage {
  url: string;
  views: number;
}

export interface TopConvertingPage {
  url: string;
  conversions: number;
  conversionRate: number;
}

export interface FunnelMetrics {
  steps: FunnelStep[];
  overallConversion: number;
  dropOffRates: number[];
}

export interface FunnelStep {
  name: string;
  users: number;
  conversionRate: number;
}
```

### 2. Real-time Analytics Processor

Create `packages/analytics/src/realtime/processor.ts`:
```typescript
import { EventEmitter } from 'events';
import type { RadarEvent } from '@repo/events';
import { MetricsCalculator } from '../metrics/calculator';

export class RealtimeProcessor extends EventEmitter {
  private buffer: Map<string, RadarEvent[]> = new Map();
  private metrics: Map<string, any> = new Map();
  private windowSize: number = 5 * 60 * 1000; // 5 minutes
  private updateInterval: number = 1000; // 1 second
  private intervalId?: NodeJS.Timeout;

  constructor(options?: {
    windowSize?: number;
    updateInterval?: number;
  }) {
    super();
    
    if (options?.windowSize) this.windowSize = options.windowSize;
    if (options?.updateInterval) this.updateInterval = options.updateInterval;
  }

  /**
   * Start processing events
   */
  start() {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      this.processBuffer();
    }, this.updateInterval);
  }

  /**
   * Stop processing
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * Add event to processing buffer
   */
  addEvent(event: RadarEvent) {
    const projectKey = event.projectKey;
    
    if (!this.buffer.has(projectKey)) {
      this.buffer.set(projectKey, []);
    }
    
    this.buffer.get(projectKey)!.push(event);
    
    // Emit immediate event
    this.emit('event', {
      projectKey,
      event,
      timestamp: new Date(),
    });
  }

  /**
   * Get current metrics for a project
   */
  getMetrics(projectKey: string): RealtimeMetrics {
    return this.metrics.get(projectKey) || this.getEmptyMetrics();
  }

  /**
   * Process buffered events
   */
  private processBuffer() {
    const now = Date.now();
    const cutoff = now - this.windowSize;
    
    for (const [projectKey, events] of this.buffer) {
      // Filter events within window
      const recentEvents = events.filter(e => 
        new Date(e.timestamp).getTime() > cutoff
      );
      
      // Update buffer with only recent events
      this.buffer.set(projectKey, recentEvents);
      
      // Calculate metrics
      const metrics = this.calculateRealtimeMetrics(recentEvents);
      this.metrics.set(projectKey, metrics);
      
      // Emit update
      this.emit('metrics', {
        projectKey,
        metrics,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Calculate real-time metrics
   */
  private calculateRealtimeMetrics(events: RadarEvent[]): RealtimeMetrics {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    // Current active users
    const activeUsers = new Set(
      events
        .filter(e => new Date(e.timestamp).getTime() > oneMinuteAgo)
        .map(e => e.userId || e.anonymousId)
    );
    
    // Active sessions
    const activeSessions = new Set(
      events
        .filter(e => new Date(e.timestamp).getTime() > fiveMinutesAgo)
        .map(e => e.sessionId)
    );
    
    // Events per minute
    const recentEvents = events.filter(e => 
      new Date(e.timestamp).getTime() > oneMinuteAgo
    );
    const eventsPerMinute = recentEvents.length;
    
    // Page views
    const pageViews = recentEvents.filter(e => e.event === 'page_view');
    const pageViewsPerMinute = pageViews.length;
    
    // Current pages being viewed
    const currentPages = new Map<string, number>();
    for (const pv of pageViews) {
      const url = pv.context?.page?.url || 'unknown';
      currentPages.set(url, (currentPages.get(url) || 0) + 1);
    }
    
    // Error rate
    const errors = recentEvents.filter(e => e.event === 'error');
    const errorRate = recentEvents.length > 0 
      ? errors.length / recentEvents.length 
      : 0;
    
    // Performance
    const perfEvents = events.filter(e => e.event === 'performance');
    const avgLoadTime = this.calculateAvgLoadTime(perfEvents);
    
    return {
      activeUsers: activeUsers.size,
      activeSessions: activeSessions.size,
      eventsPerMinute,
      pageViewsPerMinute,
      currentPages: Array.from(currentPages.entries())
        .map(([url, count]) => ({ url, count }))
        .sort((a, b) => b.count - a.count),
      errorRate,
      avgLoadTime,
      lastUpdated: new Date(),
    };
  }

  private calculateAvgLoadTime(events: RadarEvent[]): number {
    const loadTimes = events
      .map(e => {
        const props = e.properties as any;
        return props?.loadComplete - props?.navigationStart;
      })
      .filter(time => time && time > 0);
    
    if (loadTimes.length === 0) return 0;
    
    return loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
  }

  private getEmptyMetrics(): RealtimeMetrics {
    return {
      activeUsers: 0,
      activeSessions: 0,
      eventsPerMinute: 0,
      pageViewsPerMinute: 0,
      currentPages: [],
      errorRate: 0,
      avgLoadTime: 0,
      lastUpdated: new Date(),
    };
  }
}

export interface RealtimeMetrics {
  activeUsers: number;
  activeSessions: number;
  eventsPerMinute: number;
  pageViewsPerMinute: number;
  currentPages: Array<{ url: string; count: number }>;
  errorRate: number;
  avgLoadTime: number;
  lastUpdated: Date;
}
```

### 3. Analytics Aggregator

Create `packages/analytics/src/aggregator/index.ts`:
```typescript
import { db } from '@repo/database';
import { 
  dailyAnalytics, 
  pageAnalytics,
  events,
  sessions,
} from '@repo/database/schema';
import { sql, and, gte, lte } from 'drizzle-orm';
import { MetricsCalculator } from '../metrics/calculator';
import type { RadarEvent } from '@repo/events';

export class AnalyticsAggregator {
  /**
   * Aggregate daily analytics
   */
  async aggregateDaily(projectId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Fetch all events for the day
    const dayEvents = await db.select()
      .from(events)
      .where(and(
        sql`${events.projectId} = ${projectId}`,
        gte(events.timestamp, startOfDay),
        lte(events.timestamp, endOfDay)
      ));
    
    // Convert to RadarEvent format
    const radarEvents = dayEvents.map(e => ({
      projectKey: projectId,
      event: e.name,
      timestamp: e.timestamp.toISOString(),
      userId: e.userId,
      anonymousId: e.anonymousId,
      sessionId: e.sessionId,
      context: {
        page: {
          url: e.pageUrl,
          title: e.pageTitle,
        },
      },
      properties: e.properties,
    } as RadarEvent));
    
    // Calculate metrics
    const pageMetrics = MetricsCalculator.calculatePageMetrics(radarEvents);
    const sessionMetrics = MetricsCalculator.calculateSessionMetrics(radarEvents);
    const performanceMetrics = MetricsCalculator.calculatePerformanceMetrics(radarEvents);
    
    // Upsert daily analytics
    await db.insert(dailyAnalytics)
      .values({
        projectId,
        date: date.toISOString().split('T')[0],
        pageViews: pageMetrics.totalViews,
        uniqueVisitors: pageMetrics.uniqueViewers,
        sessions: sessionMetrics.totalSessions,
        bounceRate: sessionMetrics.bounceRate,
        avgSessionDuration: Math.round(sessionMetrics.avgSessionDuration / 1000), // seconds
        eventsCount: radarEvents.length,
      })
      .onConflictDoUpdate({
        target: [dailyAnalytics.projectId, dailyAnalytics.date],
        set: {
          pageViews: pageMetrics.totalViews,
          uniqueVisitors: pageMetrics.uniqueViewers,
          sessions: sessionMetrics.totalSessions,
          bounceRate: sessionMetrics.bounceRate,
          avgSessionDuration: Math.round(sessionMetrics.avgSessionDuration / 1000),
          eventsCount: radarEvents.length,
          updatedAt: new Date(),
        },
      });
    
    // Aggregate page-level analytics
    await this.aggregatePageAnalytics(projectId, date, pageMetrics, radarEvents);
    
    return {
      date,
      metrics: {
        page: pageMetrics,
        session: sessionMetrics,
        performance: performanceMetrics,
      },
    };
  }

  /**
   * Aggregate page-level analytics
   */
  private async aggregatePageAnalytics(
    projectId: string,
    date: Date,
    metrics: any,
    events: RadarEvent[]
  ) {
    const pageGroups = new Map<string, RadarEvent[]>();
    
    // Group events by page
    for (const event of events) {
      if (event.event === 'page_view' && event.context?.page?.url) {
        const url = event.context.page.url;
        if (!pageGroups.has(url)) {
          pageGroups.set(url, []);
        }
        pageGroups.get(url)!.push(event);
      }
    }
    
    // Calculate metrics for each page
    for (const [pageUrl, pageEvents] of pageGroups) {
      const uniqueVisitors = new Set(
        pageEvents.map(e => e.userId || e.anonymousId)
      );
      
      const exitRate = metrics.exitRates.get(pageUrl) || 0;
      const bounceRate = this.calculatePageBounceRate(pageUrl, events);
      
      await db.insert(pageAnalytics)
        .values({
          projectId,
          date: date.toISOString().split('T')[0],
          pageUrl,
          views: pageEvents.length,
          uniqueVisitors: uniqueVisitors.size,
          bounceRate,
          exitRate,
        })
        .onConflictDoUpdate({
          target: [pageAnalytics.projectId, pageAnalytics.date, pageAnalytics.pageUrl],
          set: {
            views: pageEvents.length,
            uniqueVisitors: uniqueVisitors.size,
            bounceRate,
            exitRate,
            createdAt: new Date(),
          },
        });
    }
  }

  /**
   * Calculate page-specific bounce rate
   */
  private calculatePageBounceRate(pageUrl: string, events: RadarEvent[]): number {
    const sessions = new Map<string, RadarEvent[]>();
    
    // Group by session
    for (const event of events) {
      if (event.sessionId) {
        if (!sessions.has(event.sessionId)) {
          sessions.set(event.sessionId, []);
        }
        sessions.get(event.sessionId)!.push(event);
      }
    }
    
    let bounced = 0;
    let total = 0;
    
    // Check each session
    for (const sessionEvents of sessions.values()) {
      const pageViews = sessionEvents.filter(e => e.event === 'page_view');
      const landedOnPage = pageViews[0]?.context?.page?.url === pageUrl;
      
      if (landedOnPage) {
        total++;
        if (pageViews.length === 1) {
          bounced++;
        }
      }
    }
    
    return total > 0 ? bounced / total : 0;
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsSummary> {
    // Fetch aggregated data
    const dailyData = await db.select()
      .from(dailyAnalytics)
      .where(and(
        sql`${dailyAnalytics.projectId} = ${projectId}`,
        gte(dailyAnalytics.date, startDate.toISOString().split('T')[0]),
        lte(dailyAnalytics.date, endDate.toISOString().split('T')[0])
      ))
      .orderBy(dailyAnalytics.date);
    
    // Calculate summary metrics
    const totalPageViews = dailyData.reduce((sum, d) => sum + d.pageViews, 0);
    const totalVisitors = new Set(dailyData.map(d => d.uniqueVisitors)).size;
    const totalSessions = dailyData.reduce((sum, d) => sum + d.sessions, 0);
    const avgBounceRate = dailyData.reduce((sum, d) => sum + (d.bounceRate || 0), 0) / dailyData.length;
    
    // Calculate trends
    const trends = this.calculateTrends(dailyData);
    
    return {
      period: {
        start: startDate,
        end: endDate,
      },
      totals: {
        pageViews: totalPageViews,
        uniqueVisitors: totalVisitors,
        sessions: totalSessions,
        events: dailyData.reduce((sum, d) => sum + d.eventsCount, 0),
      },
      averages: {
        pageViewsPerDay: totalPageViews / dailyData.length,
        sessionsPerDay: totalSessions / dailyData.length,
        bounceRate: avgBounceRate,
        sessionDuration: dailyData.reduce((sum, d) => 
          sum + (d.avgSessionDuration || 0), 0) / dailyData.length,
      },
      trends,
      dailyData,
    };
  }

  /**
   * Calculate metric trends
   */
  private calculateTrends(data: any[]): Trends {
    if (data.length < 2) {
      return {
        pageViews: 0,
        visitors: 0,
        sessions: 0,
        bounceRate: 0,
      };
    }
    
    const recent = data.slice(-7); // Last 7 days
    const previous = data.slice(-14, -7); // Previous 7 days
    
    if (previous.length === 0) {
      return {
        pageViews: 100, // 100% growth if no previous data
        visitors: 100,
        sessions: 100,
        bounceRate: 0,
      };
    }
    
    const recentAvg = {
      pageViews: recent.reduce((sum, d) => sum + d.pageViews, 0) / recent.length,
      visitors: recent.reduce((sum, d) => sum + d.uniqueVisitors, 0) / recent.length,
      sessions: recent.reduce((sum, d) => sum + d.sessions, 0) / recent.length,
      bounceRate: recent.reduce((sum, d) => sum + (d.bounceRate || 0), 0) / recent.length,
    };
    
    const previousAvg = {
      pageViews: previous.reduce((sum, d) => sum + d.pageViews, 0) / previous.length,
      visitors: previous.reduce((sum, d) => sum + d.uniqueVisitors, 0) / previous.length,
      sessions: previous.reduce((sum, d) => sum + d.sessions, 0) / previous.length,
      bounceRate: previous.reduce((sum, d) => sum + (d.bounceRate || 0), 0) / previous.length,
    };
    
    return {
      pageViews: ((recentAvg.pageViews - previousAvg.pageViews) / previousAvg.pageViews) * 100,
      visitors: ((recentAvg.visitors - previousAvg.visitors) / previousAvg.visitors) * 100,
      sessions: ((recentAvg.sessions - previousAvg.sessions) / previousAvg.sessions) * 100,
      bounceRate: ((recentAvg.bounceRate - previousAvg.bounceRate) / previousAvg.bounceRate) * 100,
    };
  }
}

export interface AnalyticsSummary {
  period: {
    start: Date;
    end: Date;
  };
  totals: {
    pageViews: number;
    uniqueVisitors: number;
    sessions: number;
    events: number;
  };
  averages: {
    pageViewsPerDay: number;
    sessionsPerDay: number;
    bounceRate: number;
    sessionDuration: number;
  };
  trends: Trends;
  dailyData: any[];
}

export interface Trends {
  pageViews: number; // Percentage change
  visitors: number;
  sessions: number;
  bounceRate: number;
}
```

### 4. Query Engine

Create `packages/analytics/src/query/engine.ts`:
```typescript
import { db } from '@repo/database';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

export const querySchema = z.object({
  projectId: z.string(),
  metrics: z.array(z.enum([
    'pageViews',
    'uniqueVisitors',
    'sessions',
    'bounceRate',
    'avgSessionDuration',
    'conversionRate',
  ])),
  dimensions: z.array(z.enum([
    'date',
    'page',
    'referrer',
    'device',
    'browser',
    'country',
    'city',
  ])).optional(),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'like']),
    value: z.any(),
  })).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  groupBy: z.array(z.string()).optional(),
  orderBy: z.array(z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  })).optional(),
  limit: z.number().default(100),
  offset: z.number().default(0),
});

export type AnalyticsQuery = z.infer<typeof querySchema>;

export class QueryEngine {
  /**
   * Execute analytics query
   */
  async execute(query: AnalyticsQuery): Promise<QueryResult> {
    const startTime = Date.now();
    
    // Build SQL query based on parameters
    const sqlQuery = this.buildQuery(query);
    
    // Execute query
    const results = await db.execute(sqlQuery);
    
    // Process results
    const processed = this.processResults(results, query);
    
    return {
      data: processed.data,
      meta: {
        query,
        executionTime: Date.now() - startTime,
        rowCount: processed.rowCount,
        hasMore: processed.hasMore,
      },
    };
  }

  /**
   * Build SQL query from analytics query
   */
  private buildQuery(query: AnalyticsQuery): string {
    const { metrics, dimensions, filters, dateRange, groupBy, orderBy, limit, offset } = query;
    
    // Select clause
    const selectClauses = [
      ...this.buildMetricSelects(metrics),
      ...this.buildDimensionSelects(dimensions || []),
    ];
    
    // From clause
    const fromClause = this.determineTable(metrics, dimensions);
    
    // Where clause
    const whereClauses = [
      `project_id = '${query.projectId}'`,
      `date >= '${dateRange.start}'`,
      `date <= '${dateRange.end}'`,
      ...this.buildFilterClauses(filters || []),
    ];
    
    // Group by clause
    const groupByClauses = groupBy || dimensions || [];
    
    // Order by clause
    const orderByClauses = this.buildOrderByClauses(orderBy || []);
    
    // Build final query
    let sql = `
      SELECT ${selectClauses.join(', ')}
      FROM ${fromClause}
      WHERE ${whereClauses.join(' AND ')}
    `;
    
    if (groupByClauses.length > 0) {
      sql += ` GROUP BY ${groupByClauses.join(', ')}`;
    }
    
    if (orderByClauses.length > 0) {
      sql += ` ORDER BY ${orderByClauses.join(', ')}`;
    }
    
    sql += ` LIMIT ${limit} OFFSET ${offset}`;
    
    return sql;
  }

  /**
   * Build metric select clauses
   */
  private buildMetricSelects(metrics: string[]): string[] {
    const metricMap: Record<string, string> = {
      pageViews: 'SUM(page_views) as page_views',
      uniqueVisitors: 'COUNT(DISTINCT user_id) as unique_visitors',
      sessions: 'COUNT(DISTINCT session_id) as sessions',
      bounceRate: 'AVG(bounce_rate) as bounce_rate',
      avgSessionDuration: 'AVG(avg_session_duration) as avg_session_duration',
      conversionRate: 'SUM(conversions) / COUNT(DISTINCT user_id) as conversion_rate',
    };
    
    return metrics.map(m => metricMap[m] || m);
  }

  /**
   * Build dimension select clauses
   */
  private buildDimensionSelects(dimensions: string[]): string[] {
    return dimensions.map(d => {
      switch (d) {
        case 'date':
          return 'date';
        case 'page':
          return 'page_url';
        case 'referrer':
          return 'referrer';
        case 'device':
          return 'device_type';
        case 'browser':
          return 'browser';
        case 'country':
          return 'country';
        case 'city':
          return 'city';
        default:
          return d;
      }
    });
  }

  /**
   * Determine which table to query
   */
  private determineTable(metrics: string[], dimensions?: string[]): string {
    if (dimensions?.includes('page')) {
      return 'page_analytics';
    }
    
    if (metrics.some(m => ['conversionRate', 'conversions'].includes(m))) {
      return 'goal_completions';
    }
    
    return 'daily_analytics';
  }

  /**
   * Build filter clauses
   */
  private buildFilterClauses(filters: any[]): string[] {
    return filters.map(filter => {
      const { field, operator, value } = filter;
      
      switch (operator) {
        case 'eq':
          return `${field} = '${value}'`;
        case 'ne':
          return `${field} != '${value}'`;
        case 'gt':
          return `${field} > ${value}`;
        case 'lt':
          return `${field} < ${value}`;
        case 'gte':
          return `${field} >= ${value}`;
        case 'lte':
          return `${field} <= ${value}`;
        case 'in':
          return `${field} IN (${value.map(v => `'${v}'`).join(', ')})`;
        case 'like':
          return `${field} LIKE '%${value}%'`;
        default:
          return '';
      }
    }).filter(Boolean);
  }

  /**
   * Build order by clauses
   */
  private buildOrderByClauses(orderBy: any[]): string[] {
    return orderBy.map(o => `${o.field} ${o.direction.toUpperCase()}`);
  }

  /**
   * Process query results
   */
  private processResults(
    results: any[],
    query: AnalyticsQuery
  ): { data: any[]; rowCount: number; hasMore: boolean } {
    const data = results.slice(0, query.limit);
    const hasMore = results.length > query.limit;
    
    return {
      data: data.map(row => this.formatRow(row, query)),
      rowCount: data.length,
      hasMore,
    };
  }

  /**
   * Format result row
   */
  private formatRow(row: any, query: AnalyticsQuery): any {
    const formatted: any = {};
    
    // Format metrics
    for (const metric of query.metrics) {
      if (row[metric] !== undefined) {
        formatted[metric] = this.formatMetricValue(metric, row[metric]);
      }
    }
    
    // Format dimensions
    for (const dimension of query.dimensions || []) {
      if (row[dimension] !== undefined) {
        formatted[dimension] = row[dimension];
      }
    }
    
    return formatted;
  }

  /**
   * Format metric values
   */
  private formatMetricValue(metric: string, value: any): any {
    switch (metric) {
      case 'bounceRate':
      case 'conversionRate':
        return Math.round(value * 10000) / 100; // Convert to percentage
      case 'avgSessionDuration':
        return Math.round(value); // Round to seconds
      default:
        return value;
    }
  }
}

export interface QueryResult {
  data: any[];
  meta: {
    query: AnalyticsQuery;
    executionTime: number;
    rowCount: number;
    hasMore: boolean;
  };
}
```

### 5. Export Analytics Engine

Update `packages/analytics/src/index.ts`:
```typescript
// Metrics
export { MetricsCalculator } from './metrics/calculator';
export type {
  PageMetrics,
  SessionMetrics,
  EngagementMetrics,
  ConversionMetrics,
  PerformanceMetrics,
  Goal,
  Conversion,
} from './metrics/calculator';

// Real-time
export { RealtimeProcessor } from './realtime/processor';
export type { RealtimeMetrics } from './realtime/processor';

// Aggregation
export { AnalyticsAggregator } from './aggregator';
export type { AnalyticsSummary, Trends } from './aggregator';

// Query Engine
export { QueryEngine, querySchema } from './query/engine';
export type { AnalyticsQuery, QueryResult } from './query/engine';

// Analytics Service
export class AnalyticsService {
  calculator = MetricsCalculator;
  realtime = new RealtimeProcessor();
  aggregator = new AnalyticsAggregator();
  query = new QueryEngine();

  constructor() {
    // Start real-time processing
    this.realtime.start();
  }

  async shutdown() {
    this.realtime.stop();
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();
```

## Testing Requirements

1. Test metric calculations with sample data
2. Test real-time processing with event streams
3. Test aggregation for different time periods
4. Test query engine with various queries
5. Test performance with large datasets
6. Verify accuracy of calculations
7. Test edge cases (empty data, null values)

## Success Criteria

- ✅ Accurate metric calculations
- ✅ Real-time processing < 100ms latency
- ✅ Efficient aggregation for large datasets
- ✅ Flexible query engine
- ✅ All calculations use precise math
- ✅ Proper error handling
- ✅ TypeScript types for all interfaces

## Handoff to Next Agent

Agent 6 will need:
- Analytics service interface
- Understanding of metrics and calculations
- Real-time processing capabilities
- Query engine for background jobs

## Notes

- Use Decimal.js for precise calculations
- Design for horizontal scaling
- Optimize queries for performance
- Cache frequently accessed data
- Consider time zone handling