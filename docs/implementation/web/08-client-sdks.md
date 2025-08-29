# Agent 8: Client SDKs

## Overview

The Radar Client SDKs provide a comprehensive suite of tools for integrating analytics into JavaScript applications. Built with TypeScript, the SDKs offer type-safe event tracking, automatic performance monitoring, and seamless integration with React and Next.js applications.

## Architecture

```
packages/sdk/
├── src/
│   ├── core/           # Core JavaScript SDK
│   ├── react/          # React-specific components and hooks
│   ├── nextjs/         # Next.js integrations
│   ├── types/          # TypeScript definitions
│   ├── utils/          # Shared utilities
│   └── index.ts        # Main entry point
├── tests/
├── examples/
└── package.json
```

## 1. Core JavaScript SDK

### RadarClient Class

```typescript
// packages/sdk/src/core/client.ts
import { EventQueue } from './queue';
import { SessionManager } from './session';
import { Storage } from './storage';
import { EventSchema, UserProperties } from '../types';

export interface RadarConfig {
  apiKey: string;
  endpoint?: string;
  debug?: boolean;
  batchSize?: number;
  flushInterval?: number;
  maxRetries?: number;
  sessionTimeout?: number;
  sampling?: {
    events?: number;
    sessions?: number;
    errors?: number;
  };
  privacy?: {
    anonymizeIp?: boolean;
    respectDoNotTrack?: boolean;
    cookieConsent?: boolean;
  };
}

export class RadarClient {
  private config: RadarConfig;
  private queue: EventQueue;
  private session: SessionManager;
  private storage: Storage;
  private userId?: string;
  private userProperties: UserProperties = {};

  constructor(config: RadarConfig) {
    this.config = {
      endpoint: 'https://api.radar.dev/v1',
      batchSize: 50,
      flushInterval: 30000,
      maxRetries: 3,
      sessionTimeout: 1800000, // 30 minutes
      ...config
    };

    this.storage = new Storage();
    this.session = new SessionManager(this.config, this.storage);
    this.queue = new EventQueue(this.config, this.storage);

    this.initialize();
  }

  private async initialize() {
    // Check privacy settings
    if (this.config.privacy?.respectDoNotTrack && navigator.doNotTrack === '1') {
      this.disable();
      return;
    }

    // Restore session
    await this.session.start();

    // Start queue processing
    this.queue.start();

    // Track page view on initialization
    this.pageView();

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    // Set up error tracking
    this.setupErrorTracking();
  }

  // User identification
  identify(userId: string, properties?: UserProperties) {
    this.userId = userId;
    this.userProperties = { ...this.userProperties, ...properties };
    
    this.track('user_identified', {
      userId,
      properties
    });
  }

  // Event tracking
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.shouldTrack()) return;

    const event = {
      name: eventName,
      properties: {
        ...this.getDefaultProperties(),
        ...properties
      },
      timestamp: new Date().toISOString(),
      sessionId: this.session.getId(),
      userId: this.userId
    };

    this.queue.add(event);
  }

  // Page view tracking
  pageView(properties?: Record<string, any>) {
    const pageProperties = {
      url: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      title: document.title,
      referrer: document.referrer,
      ...properties
    };

    this.track('page_view', pageProperties);
  }

  // Custom timing
  time(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.track('timing', {
        label,
        duration
      });
    };
  }

  // Manual flush
  async flush() {
    return this.queue.flush();
  }

  // Disable tracking
  disable() {
    this.queue.stop();
    this.session.end();
  }

  private shouldTrack(): boolean {
    // Check sampling
    if (this.config.sampling?.events) {
      return Math.random() < this.config.sampling.events;
    }
    return true;
  }

  private getDefaultProperties() {
    return {
      ...this.getBrowserContext(),
      ...this.getDeviceContext(),
      timestamp: new Date().toISOString()
    };
  }

  private getBrowserContext() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: {
        width: screen.width,
        height: screen.height,
        density: window.devicePixelRatio
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private getDeviceContext() {
    const ua = navigator.userAgent;
    return {
      os: this.detectOS(ua),
      browser: this.detectBrowser(ua),
      device: this.detectDevice(ua)
    };
  }

  private setupPerformanceMonitoring() {
    // Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.track('web_vitals', {
          metric: 'LCP',
          value: lastEntry.startTime
        });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.track('web_vitals', {
            metric: 'FID',
            value: entry.processingStart - entry.startTime
          });
        });
      }).observe({ entryTypes: ['first-input'] });

      // CLS
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });

      // Send CLS on page unload
      addEventListener('beforeunload', () => {
        this.track('web_vitals', {
          metric: 'CLS',
          value: clsValue
        });
      });
    }
  }

  private setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.track('error', {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.track('unhandled_rejection', {
        reason: event.reason?.toString(),
        promise: event.promise
      });
    });
  }

  private detectOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private detectBrowser(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectDevice(ua: string): string {
    if (ua.includes('Mobile')) return 'Mobile';
    if (ua.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }
}
```

### Event Queue with Batching and Retry

```typescript
// packages/sdk/src/core/queue.ts
import { Storage } from './storage';
import { RadarConfig } from './client';

interface QueuedEvent {
  id: string;
  data: any;
  timestamp: string;
  retries: number;
}

export class EventQueue {
  private config: RadarConfig;
  private storage: Storage;
  private queue: QueuedEvent[] = [];
  private timer?: NodeJS.Timeout;
  private isOnline: boolean = navigator.onLine;
  private isFlushing: boolean = false;

  constructor(config: RadarConfig, storage: Storage) {
    this.config = config;
    this.storage = storage;

    // Load queued events from storage
    this.loadQueue();

    // Monitor online status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flush();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush({ sync: true });
    });
  }

  start() {
    this.timer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  add(event: any) {
    const queuedEvent: QueuedEvent = {
      id: this.generateId(),
      data: event,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    this.queue.push(queuedEvent);
    this.saveQueue();

    // Flush if batch size reached
    if (this.queue.length >= this.config.batchSize!) {
      this.flush();
    }
  }

  async flush(options?: { sync?: boolean }) {
    if (!this.isOnline || this.isFlushing || this.queue.length === 0) {
      return;
    }

    this.isFlushing = true;

    // Get events to send
    const batch = this.queue.splice(0, this.config.batchSize!);

    try {
      if (options?.sync) {
        // Use sendBeacon for synchronous sending
        const data = JSON.stringify({
          events: batch.map(e => e.data),
          apiKey: this.config.apiKey
        });

        navigator.sendBeacon(
          `${this.config.endpoint}/events`,
          new Blob([data], { type: 'application/json' })
        );
      } else {
        // Regular async sending
        await this.sendBatch(batch);
      }

      // Save remaining queue
      this.saveQueue();
    } catch (error) {
      // Put failed events back in queue
      this.queue.unshift(...batch);
      this.handleRetry(batch);
    } finally {
      this.isFlushing = false;
    }
  }

  private async sendBatch(batch: QueuedEvent[]) {
    const response = await fetch(`${this.config.endpoint}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey
      },
      body: JSON.stringify({
        events: batch.map(e => e.data)
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send events: ${response.status}`);
    }
  }

  private handleRetry(batch: QueuedEvent[]) {
    batch.forEach(event => {
      event.retries++;
      
      if (event.retries >= this.config.maxRetries!) {
        // Drop event after max retries
        const index = this.queue.indexOf(event);
        if (index > -1) {
          this.queue.splice(index, 1);
        }

        if (this.config.debug) {
          console.error('Event dropped after max retries:', event);
        }
      }
    });

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, batch[0].retries), 60000);
    setTimeout(() => this.flush(), delay);
  }

  private loadQueue() {
    const saved = this.storage.get('radar_queue');
    if (saved) {
      this.queue = saved;
    }
  }

  private saveQueue() {
    this.storage.set('radar_queue', this.queue);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Session Management

```typescript
// packages/sdk/src/core/session.ts
import { Storage } from './storage';
import { RadarConfig } from './client';

export class SessionManager {
  private config: RadarConfig;
  private storage: Storage;
  private sessionId?: string;
  private lastActivity: number = Date.now();
  private activityTimer?: NodeJS.Timeout;

  constructor(config: RadarConfig, storage: Storage) {
    this.config = config;
    this.storage = storage;

    // Monitor user activity
    this.setupActivityMonitoring();
  }

  async start() {
    const existingSession = this.storage.get('radar_session');
    
    if (existingSession && this.isSessionValid(existingSession)) {
      this.sessionId = existingSession.id;
      this.lastActivity = existingSession.lastActivity;
    } else {
      this.sessionId = this.generateSessionId();
      this.saveSession();
    }

    // Start session timeout check
    this.startTimeoutCheck();
  }

  end() {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }
    this.storage.remove('radar_session');
  }

  getId(): string {
    return this.sessionId!;
  }

  private isSessionValid(session: any): boolean {
    const now = Date.now();
    return (now - session.lastActivity) < this.config.sessionTimeout!;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveSession() {
    this.storage.set('radar_session', {
      id: this.sessionId,
      lastActivity: this.lastActivity
    });
  }

  private setupActivityMonitoring() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.lastActivity = Date.now();
        this.saveSession();
      }, { passive: true, capture: true });
    });
  }

  private startTimeoutCheck() {
    this.activityTimer = setInterval(() => {
      if (!this.isSessionValid({ lastActivity: this.lastActivity })) {
        // Start new session
        this.sessionId = this.generateSessionId();
        this.lastActivity = Date.now();
        this.saveSession();
      }
    }, 60000); // Check every minute
  }
}
```

### Storage with IndexedDB

```typescript
// packages/sdk/src/core/storage.ts
export class Storage {
  private db?: IDBDatabase;
  private dbName = 'radar_analytics';
  private storeName = 'data';
  private memoryFallback: Map<string, any> = new Map();

  constructor() {
    this.initDB();
  }

  private async initDB() {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not available, using memory storage');
      return;
    }

    try {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onsuccess = () => {
        this.db = request.result;
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  async set(key: string, value: any): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } else {
      // Fallback to memory storage
      this.memoryFallback.set(key, value);
    }
  }

  async get(key: string): Promise<any> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else {
      return this.memoryFallback.get(key);
    }
  }

  async remove(key: string): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } else {
      this.memoryFallback.delete(key);
    }
  }
}
```

## 2. React SDK

### RadarProvider Component

```typescript
// packages/sdk/src/react/provider.tsx
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { RadarClient, RadarConfig } from '../core/client';

interface RadarContextValue {
  client: RadarClient;
}

const RadarContext = createContext<RadarContextValue | null>(null);

export interface RadarProviderProps extends RadarConfig {
  children: React.ReactNode;
}

export function RadarProvider({ children, ...config }: RadarProviderProps) {
  const clientRef = useRef<RadarClient>();

  if (!clientRef.current) {
    clientRef.current = new RadarClient(config);
  }

  useEffect(() => {
    return () => {
      clientRef.current?.flush();
    };
  }, []);

  return (
    <RadarContext.Provider value={{ client: clientRef.current }}>
      {children}
    </RadarContext.Provider>
  );
}

export function useRadarContext() {
  const context = useContext(RadarContext);
  if (!context) {
    throw new Error('useRadarContext must be used within RadarProvider');
  }
  return context;
}
```

### React Hooks

```typescript
// packages/sdk/src/react/hooks.ts
import { useEffect, useRef, useCallback } from 'react';
import { useRadarContext } from './provider';

// Main hook for accessing the client
export function useRadar() {
  const { client } = useRadarContext();
  return client;
}

// Page view tracking
export function usePageView(properties?: Record<string, any>) {
  const client = useRadar();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      client.pageView(properties);
      hasTracked.current = true;
    }
  }, [client, properties]);
}

// Event tracking hook
export function useEvent() {
  const client = useRadar();

  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    client.track(eventName, properties);
  }, [client]);

  return track;
}

// Performance tracking
export function usePerformance(label: string) {
  const client = useRadar();
  const timerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    timerRef.current = client.time(label);

    return () => {
      if (timerRef.current) {
        timerRef.current();
      }
    };
  }, [client, label]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      timerRef.current();
      timerRef.current = null;
    }
  }, []);

  return { stop };
}

// User identification
export function useIdentify() {
  const client = useRadar();

  const identify = useCallback((userId: string, properties?: Record<string, any>) => {
    client.identify(userId, properties);
  }, [client]);

  return identify;
}

// Feature flag tracking
export function useFeatureFlag(flagName: string, defaultValue: boolean = false) {
  const client = useRadar();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      client.track('feature_flag_evaluated', {
        flag: flagName,
        value: defaultValue
      });
      hasTracked.current = true;
    }
  }, [client, flagName, defaultValue]);

  return defaultValue;
}
```

### Error Boundary Integration

```typescript
// packages/sdk/src/react/error-boundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RadarClient } from '../core/client';

interface Props {
  children: ReactNode;
  client: RadarClient;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class RadarErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.client.track('react_error_boundary', {
      error: {
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      }
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}

// Hook version
export function withRadarErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    const client = useRadar();

    return (
      <RadarErrorBoundary client={client} fallback={fallback}>
        <Component {...props} />
      </RadarErrorBoundary>
    );
  };
}
```

## 3. Next.js SDK

### App Router Integration

```typescript
// packages/sdk/src/nextjs/app/provider.tsx
'use client';

import { RadarProvider as BaseProvider, RadarProviderProps } from '../../react/provider';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function RadarProvider({ children, ...props }: RadarProviderProps) {
  return (
    <BaseProvider {...props}>
      <PageTracker />
      {children}
    </BaseProvider>
  );
}

function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const client = useRadar();

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '');
    
    client.pageView({
      url,
      pathname,
      search: searchParams?.toString()
    });
  }, [pathname, searchParams, client]);

  return null;
}
```

### Server Components Tracking

```typescript
// packages/sdk/src/nextjs/app/server.ts
import { headers } from 'next/headers';
import { RadarClient } from '../../core/client';

interface ServerTrackingOptions {
  apiKey: string;
  endpoint?: string;
}

export async function trackServerEvent(
  eventName: string,
  properties: Record<string, any>,
  options: ServerTrackingOptions
) {
  const headersList = headers();
  
  const event = {
    name: eventName,
    properties: {
      ...properties,
      server: true,
      userAgent: headersList.get('user-agent'),
      ip: headersList.get('x-forwarded-for')?.split(',')[0],
      referer: headersList.get('referer')
    },
    timestamp: new Date().toISOString()
  };

  // Send directly to API
  await fetch(`${options.endpoint || 'https://api.radar.dev/v1'}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': options.apiKey
    },
    body: JSON.stringify({ events: [event] })
  });
}

// Server action for tracking
export async function track(formData: FormData) {
  'use server';
  
  const eventName = formData.get('eventName') as string;
  const properties = JSON.parse(formData.get('properties') as string);
  
  await trackServerEvent(eventName, properties, {
    apiKey: process.env.RADAR_API_KEY!
  });
}
```

### Pages Router Support

```typescript
// packages/sdk/src/nextjs/pages/provider.tsx
import { RadarProvider as BaseProvider, RadarProviderProps } from '../../react/provider';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export function RadarProvider({ children, ...props }: RadarProviderProps) {
  const router = useRouter();
  const client = useRadar();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      client.pageView({ url });
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, client]);

  return <BaseProvider {...props}>{children}</BaseProvider>;
}
```

### Middleware Integration

```typescript
// packages/sdk/src/nextjs/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export interface RadarMiddlewareConfig {
  apiKey: string;
  endpoint?: string;
  routes?: {
    include?: string[];
    exclude?: string[];
  };
}

export function createRadarMiddleware(config: RadarMiddlewareConfig) {
  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if route should be tracked
    if (config.routes?.exclude?.some(pattern => pathname.match(pattern))) {
      return NextResponse.next();
    }

    if (config.routes?.include && !config.routes.include.some(pattern => pathname.match(pattern))) {
      return NextResponse.next();
    }

    // Track server-side page view
    try {
      await fetch(`${config.endpoint || 'https://api.radar.dev/v1'}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey
        },
        body: JSON.stringify({
          events: [{
            name: 'server_page_view',
            properties: {
              url: request.url,
              pathname,
              method: request.method,
              userAgent: request.headers.get('user-agent'),
              ip: request.ip,
              geo: request.geo
            },
            timestamp: new Date().toISOString()
          }]
        })
      });
    } catch (error) {
      console.error('Failed to track middleware event:', error);
    }

    return NextResponse.next();
  };
}
```

## 4. TypeScript Types

### Auto-generated Types from Event Schemas

```typescript
// packages/sdk/src/types/generated.ts
// This file is auto-generated from event schemas

export interface PageViewEvent {
  name: 'page_view';
  properties: {
    url: string;
    path: string;
    search?: string;
    title: string;
    referrer?: string;
    duration?: number;
  };
}

export interface ClickEvent {
  name: 'click';
  properties: {
    element: string;
    text?: string;
    href?: string;
    x: number;
    y: number;
  };
}

export interface CustomEvent<T = Record<string, any>> {
  name: string;
  properties: T;
}

export type RadarEvent = PageViewEvent | ClickEvent | CustomEvent;

// User properties with strict typing
export interface UserProperties {
  email?: string;
  name?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  createdAt?: string;
  [key: string]: any;
}

// Type guards
export function isPageViewEvent(event: RadarEvent): event is PageViewEvent {
  return event.name === 'page_view';
}

export function isClickEvent(event: RadarEvent): event is ClickEvent {
  return event.name === 'click';
}
```

### Type Generation Script

```typescript
// packages/sdk/scripts/generate-types.ts
import { z } from 'zod';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Read event schemas from shared package
const schemasPath = join(__dirname, '../../shared/schemas/events.json');
const schemas = JSON.parse(readFileSync(schemasPath, 'utf-8'));

function generateTypeFromSchema(schema: any): string {
  // Convert JSON Schema to TypeScript types
  if (schema.type === 'object') {
    const properties = Object.entries(schema.properties || {})
      .map(([key, prop]: [string, any]) => {
        const required = schema.required?.includes(key);
        const type = generateTypeFromSchema(prop);
        return `  ${key}${required ? '' : '?'}: ${type};`;
      })
      .join('\n');

    return `{\n${properties}\n}`;
  }

  if (schema.type === 'string') {
    if (schema.enum) {
      return schema.enum.map((v: string) => `'${v}'`).join(' | ');
    }
    return 'string';
  }

  if (schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'array') return `${generateTypeFromSchema(schema.items)}[]`;

  return 'any';
}

// Generate TypeScript interfaces
let output = '// This file is auto-generated from event schemas\n\n';

Object.entries(schemas).forEach(([eventName, schema]: [string, any]) => {
  const interfaceName = eventName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Event';

  output += `export interface ${interfaceName} {\n`;
  output += `  name: '${eventName}';\n`;
  output += `  properties: ${generateTypeFromSchema(schema)};\n`;
  output += `}\n\n`;
});

// Write generated types
const outputPath = join(__dirname, '../src/types/generated.ts');
writeFileSync(outputPath, output);

console.log('✅ Types generated successfully');
```

## 5. SDK Configuration and Usage Examples

### Basic Setup

```typescript
// JavaScript
import { radar } from '@radar/sdk';

radar.init({
  apiKey: 'your-api-key',
  debug: true
});

// React
import { RadarProvider } from '@radar/sdk/react';

function App() {
  return (
    <RadarProvider apiKey="your-api-key">
      <YourApp />
    </RadarProvider>
  );
}

// Next.js
import { RadarProvider } from '@radar/sdk/nextjs';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <RadarProvider apiKey={process.env.NEXT_PUBLIC_RADAR_KEY}>
          {children}
        </RadarProvider>
      </body>
    </html>
  );
}
```

### Event Tracking Examples

```typescript
// Basic event tracking
radar.track('button_clicked', {
  button: 'signup',
  location: 'header'
});

// User identification
radar.identify('user-123', {
  email: 'user@example.com',
  plan: 'pro'
});

// Custom timing
const stopTimer = radar.time('api_call');
const response = await fetch('/api/data');
stopTimer();

// React hooks
function MyComponent() {
  const track = useEvent();
  const { stop } = usePerformance('component_render');

  usePageView({ section: 'dashboard' });

  const handleClick = () => {
    track('button_clicked', { button: 'save' });
  };

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return <button onClick={handleClick}>Save</button>;
}
```

### Advanced Configuration

```typescript
radar.init({
  apiKey: 'your-api-key',
  endpoint: 'https://analytics.yourdomain.com',
  debug: process.env.NODE_ENV === 'development',
  batchSize: 100,
  flushInterval: 10000,
  sampling: {
    events: 1.0,        // Track 100% of events
    sessions: 0.1,      // Sample 10% of sessions
    errors: 1.0         // Track all errors
  },
  privacy: {
    anonymizeIp: true,
    respectDoNotTrack: true,
    cookieConsent: true
  }
});
```

## 6. Testing Utilities

### Mock Client

```typescript
// packages/sdk/src/testing/mock.ts
export class MockRadarClient {
  events: any[] = [];

  track(eventName: string, properties?: any) {
    this.events.push({ name: eventName, properties });
  }

  identify(userId: string, properties?: any) {
    this.events.push({ name: 'identify', userId, properties });
  }

  pageView(properties?: any) {
    this.events.push({ name: 'page_view', properties });
  }

  clear() {
    this.events = [];
  }

  assertEventTracked(eventName: string, properties?: any) {
    const event = this.events.find(e => e.name === eventName);
    if (!event) {
      throw new Error(`Event '${eventName}' was not tracked`);
    }
    if (properties) {
      expect(event.properties).toMatchObject(properties);
    }
  }
}

// React Testing Library helpers
export function renderWithRadar(ui: React.ReactElement, client = new MockRadarClient()) {
  return render(
    <RadarProvider client={client as any}>
      {ui}
    </RadarProvider>
  );
}
```

### Testing Examples

```typescript
// Component test
import { renderWithRadar, MockRadarClient } from '@radar/sdk/testing';

test('tracks button click', async () => {
  const client = new MockRadarClient();
  const { getByText } = renderWithRadar(<MyComponent />, client);

  fireEvent.click(getByText('Click me'));

  client.assertEventTracked('button_clicked', {
    button: 'primary'
  });
});

// Hook test
import { renderHook } from '@testing-library/react-hooks';

test('usePageView tracks page view', () => {
  const client = new MockRadarClient();
  
  renderHook(() => usePageView({ page: 'home' }), {
    wrapper: ({ children }) => (
      <RadarProvider client={client as any}>{children}</RadarProvider>
    )
  });

  expect(client.events).toContainEqual({
    name: 'page_view',
    properties: { page: 'home' }
  });
});
```

## 7. Bundle Size Optimization

### Modular Imports

```typescript
// Import only what you need
import { track } from '@radar/sdk/core';
import { useEvent } from '@radar/sdk/react';

// Tree-shakeable exports
export { RadarClient } from './core/client';
export { RadarProvider, useRadar, useEvent, usePageView } from './react';
export { createRadarMiddleware } from './nextjs';
```

### Webpack Configuration

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    sideEffects: false,
    usedExports: true
  },
  resolve: {
    alias: {
      '@radar/sdk/react': '@radar/sdk/dist/react',
      '@radar/sdk/core': '@radar/sdk/dist/core'
    }
  }
};
```

### Package.json Exports

```json
{
  "name": "@radar/sdk",
  "version": "1.0.0",
  "sideEffects": false,
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./react": {
      "import": "./dist/react/index.js",
      "require": "./dist/react/index.cjs"
    },
    "./nextjs": {
      "import": "./dist/nextjs/index.js",
      "require": "./dist/nextjs/index.cjs"
    },
    "./core": {
      "import": "./dist/core/index.js",
      "require": "./dist/core/index.cjs"
    }
  },
  "typesVersions": {
    "*": {
      "react": ["./dist/react/index.d.ts"],
      "nextjs": ["./dist/nextjs/index.d.ts"],
      "core": ["./dist/core/index.d.ts"]
    }
  }
}
```

## 8. Browser Compatibility

### Supported Browsers

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- iOS Safari 11+
- Chrome for Android 60+

### Polyfills

```typescript
// packages/sdk/src/polyfills.ts
// Minimal polyfills for older browsers

// Object.assign
if (typeof Object.assign !== 'function') {
  Object.assign = function(target: any, ...sources: any[]) {
    sources.forEach(source => {
      Object.keys(source).forEach(key => {
        target[key] = source[key];
      });
    });
    return target;
  };
}

// Array.from
if (!Array.from) {
  Array.from = function(arrayLike: any) {
    return Array.prototype.slice.call(arrayLike);
  };
}

// Promise (requires external polyfill)
if (typeof Promise === 'undefined') {
  console.warn('Promise not available. Please include a Promise polyfill.');
}
```

## 9. Privacy and Compliance

### GDPR Compliance

```typescript
// packages/sdk/src/privacy/gdpr.ts
export class GDPRCompliance {
  private client: RadarClient;
  private hasConsent: boolean = false;

  constructor(client: RadarClient) {
    this.client = client;
    this.checkConsent();
  }

  private checkConsent() {
    // Check for consent cookie
    const consent = this.getCookie('radar_consent');
    this.hasConsent = consent === 'true';

    if (!this.hasConsent) {
      this.client.disable();
    }
  }

  requestConsent(): Promise<boolean> {
    return new Promise((resolve) => {
      // Show consent dialog
      const accepted = confirm('We use analytics to improve your experience. Do you consent?');
      
      if (accepted) {
        this.setConsent(true);
        this.client.enable();
      }

      resolve(accepted);
    });
  }

  setConsent(consent: boolean) {
    this.hasConsent = consent;
    this.setCookie('radar_consent', consent.toString(), 365);

    if (consent) {
      this.client.enable();
    } else {
      this.client.disable();
      this.deleteUserData();
    }
  }

  deleteUserData() {
    // Clear all stored data
    localStorage.removeItem('radar_user');
    localStorage.removeItem('radar_session');
    this.deleteCookie('radar_consent');
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  private setCookie(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  private deleteCookie(name: string) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
}
```

### Data Anonymization

```typescript
// packages/sdk/src/privacy/anonymize.ts
export class DataAnonymizer {
  static anonymizeIp(ip: string): string {
    // Remove last octet for IPv4
    if (ip.includes('.')) {
      const parts = ip.split('.');
      parts[3] = '0';
      return parts.join('.');
    }
    
    // Remove last 80 bits for IPv6
    if (ip.includes(':')) {
      const parts = ip.split(':');
      return parts.slice(0, 3).join(':') + '::';
    }

    return '';
  }

  static hashEmail(email: string): string {
    // Simple hash function for demonstration
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  static anonymizeUser(user: any): any {
    const anonymized = { ...user };

    if (anonymized.email) {
      anonymized.emailHash = this.hashEmail(anonymized.email);
      delete anonymized.email;
    }

    if (anonymized.ip) {
      anonymized.ip = this.anonymizeIp(anonymized.ip);
    }

    // Remove any PII fields
    const piiFields = ['ssn', 'creditCard', 'phone', 'address'];
    piiFields.forEach(field => delete anonymized[field]);

    return anonymized;
  }
}
```

## 10. Performance Considerations

### Lazy Loading

```typescript
// Lazy load heavy features
export async function enablePerformanceMonitoring() {
  const { PerformanceMonitor } = await import('./performance/monitor');
  return new PerformanceMonitor();
}

// React lazy loading
const RadarDashboard = React.lazy(() => import('./components/Dashboard'));
```

### Request Batching

```typescript
// Efficient batching with requestIdleCallback
class SmartBatcher {
  private batch: any[] = [];
  private scheduled = false;

  add(event: any) {
    this.batch.push(event);
    
    if (!this.scheduled) {
      this.scheduled = true;
      
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => this.flush(), { timeout: 1000 });
      } else {
        setTimeout(() => this.flush(), 100);
      }
    }
  }

  private flush() {
    if (this.batch.length > 0) {
      this.send(this.batch);
      this.batch = [];
    }
    this.scheduled = false;
  }

  private send(events: any[]) {
    // Send batch to server
  }
}
```

### Memory Management

```typescript
// Prevent memory leaks
class EventManager {
  private listeners: Map<string, Set<Function>> = new Map();
  private maxListeners = 100;

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const callbacks = this.listeners.get(event)!;
    
    if (callbacks.size >= this.maxListeners) {
      console.warn(`Max listeners (${this.maxListeners}) reached for event: ${event}`);
      return;
    }

    callbacks.add(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}
```

## Success Metrics

✅ **Core SDK Size**: < 5KB gzipped
- Minimal dependencies
- Tree-shakeable architecture
- Efficient compression

✅ **React SDK Size**: < 10KB gzipped
- Includes all hooks and components
- Optimized bundle splitting

✅ **Zero Runtime Errors**
- Comprehensive error handling
- Graceful fallbacks
- Defensive programming

✅ **100% TypeScript Coverage**
- Full type safety
- Auto-generated types
- Excellent IDE support

✅ **Browser Compatibility**
- Works in all modern browsers
- Progressive enhancement
- Polyfill support

✅ **Comprehensive Documentation**
- Clear examples
- API reference
- Migration guides

## Conclusion

The Radar Client SDKs provide a powerful, flexible, and performant solution for analytics tracking across JavaScript applications. With its modular architecture, type safety, and framework-specific integrations, it offers an excellent developer experience while maintaining a small bundle size and respecting user privacy.