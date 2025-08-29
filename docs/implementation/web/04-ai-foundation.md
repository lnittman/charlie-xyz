# Agent 4: AI Foundation with Mastra

## Objective
Set up the AI foundation for Radar using Mastra framework, including agents for insight generation, anomaly detection, predictions, and natural language analytics queries.

## Dependencies
- Agent 1: Infrastructure setup complete
- Agent 2: Database schema defined
- Agent 3: Event system ready
- @repo/ai package created
- OpenRouter API key

## Scope of Work

### 1. Mastra Configuration

Create `packages/ai/src/config.ts`:
```typescript
import { Mastra } from '@mastra/core';
import { z } from 'zod';

// Environment validation
const envSchema = z.object({
  OPENROUTER_API_KEY: z.string(),
  MASTRA_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);

// Initialize Mastra
export const mastra = new Mastra({
  apiKey: env.MASTRA_API_KEY,
  llm: {
    provider: 'openrouter',
    apiKey: env.OPENROUTER_API_KEY,
    model: 'anthropic/claude-3-sonnet-20240229',
    temperature: 0.7,
  },
  tools: {
    database: true,
    web: true,
    code: true,
  },
});

// Model configurations for different tasks
export const models = {
  insights: {
    model: 'anthropic/claude-3-sonnet-20240229',
    temperature: 0.7,
    maxTokens: 2000,
  },
  anomalies: {
    model: 'openai/gpt-4-turbo-preview',
    temperature: 0.3,
    maxTokens: 1500,
  },
  predictions: {
    model: 'anthropic/claude-3-opus-20240229',
    temperature: 0.5,
    maxTokens: 3000,
  },
  queries: {
    model: 'anthropic/claude-3-haiku-20240307',
    temperature: 0.3,
    maxTokens: 1000,
  },
};
```

### 2. Analytics Insights Agent

Create `packages/ai/src/agents/insights.ts`:
```typescript
import { Agent, Tool } from '@mastra/core';
import { z } from 'zod';
import { db } from '@repo/database';
import { dailyAnalytics, events } from '@repo/database/schema';
import { sql, desc, asc } from 'drizzle-orm';

const insightSchema = z.object({
  type: z.enum(['trend', 'anomaly', 'recommendation', 'opportunity']),
  category: z.enum(['traffic', 'engagement', 'conversion', 'performance']),
  title: z.string(),
  description: z.string(),
  impact: z.enum(['high', 'medium', 'low']),
  confidence: z.number().min(0).max(1),
  data: z.record(z.any()),
  recommendations: z.array(z.string()).optional(),
});

export class InsightsAgent extends Agent {
  name = 'Analytics Insights Generator';
  description = 'Analyzes analytics data to generate actionable insights';

  tools = [
    new Tool({
      name: 'analyze_traffic_trends',
      description: 'Analyze traffic patterns and trends',
      parameters: z.object({
        projectId: z.string(),
        timeframe: z.enum(['day', 'week', 'month', 'quarter']),
      }),
      execute: async ({ projectId, timeframe }) => {
        const days = timeframe === 'day' ? 1 : 
                    timeframe === 'week' ? 7 : 
                    timeframe === 'month' ? 30 : 90;
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const analytics = await db.select()
          .from(dailyAnalytics)
          .where(sql`${dailyAnalytics.projectId} = ${projectId} 
                 AND ${dailyAnalytics.date} >= ${startDate}`)
          .orderBy(asc(dailyAnalytics.date));
        
        return { analytics, timeframe };
      },
    }),

    new Tool({
      name: 'identify_top_pages',
      description: 'Identify top performing pages',
      parameters: z.object({
        projectId: z.string(),
        limit: z.number().default(10),
      }),
      execute: async ({ projectId, limit }) => {
        const topPages = await db.select({
          pageUrl: events.pageUrl,
          views: sql<number>`COUNT(*)`,
          uniqueUsers: sql<number>`COUNT(DISTINCT ${events.userId})`,
        })
        .from(events)
        .where(sql`${events.projectId} = ${projectId} 
               AND ${events.name} = 'page_view'`)
        .groupBy(events.pageUrl)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(limit);
        
        return topPages;
      },
    }),

    new Tool({
      name: 'calculate_engagement_metrics',
      description: 'Calculate user engagement metrics',
      parameters: z.object({
        projectId: z.string(),
      }),
      execute: async ({ projectId }) => {
        // Calculate bounce rate, avg session duration, etc.
        const metrics = await db.select({
          avgSessionDuration: sql<number>`AVG(${sessions.duration})`,
          bounceRate: sql<number>`
            SUM(CASE WHEN ${sessions.pageViews} = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
          `,
          avgPageViews: sql<number>`AVG(${sessions.pageViews})`,
        })
        .from(sessions)
        .where(sql`${sessions.projectId} = ${projectId}`);
        
        return metrics[0];
      },
    }),
  ];

  async generateInsights(projectId: string): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Analyze traffic trends
    const trafficAnalysis = await this.execute('analyze_traffic_trends', {
      projectId,
      timeframe: 'week',
    });

    // Generate trend insights
    const trendPrompt = `
      Analyze the following traffic data and identify key trends:
      ${JSON.stringify(trafficAnalysis)}
      
      Generate insights about:
      1. Growth or decline patterns
      2. Day-of-week variations
      3. Unusual spikes or drops
      4. Seasonal patterns
      
      Format as JSON matching this schema:
      ${JSON.stringify(insightSchema.shape)}
    `;

    const trendInsights = await this.llm.generate(trendPrompt, {
      format: 'json',
      schema: insightSchema,
    });

    insights.push(...trendInsights);

    // Analyze top pages
    const topPages = await this.execute('identify_top_pages', { projectId });
    
    const pagePrompt = `
      Analyze top performing pages:
      ${JSON.stringify(topPages)}
      
      Generate insights about:
      1. Content performance patterns
      2. User preference indicators
      3. Optimization opportunities
      
      Format as JSON matching the insight schema.
    `;

    const pageInsights = await this.llm.generate(pagePrompt, {
      format: 'json',
      schema: insightSchema,
    });

    insights.push(...pageInsights);

    // Calculate confidence scores
    return insights.map(insight => ({
      ...insight,
      confidence: this.calculateConfidence(insight),
      projectId,
      detectedAt: new Date(),
    }));
  }

  private calculateConfidence(insight: any): number {
    // Simple confidence calculation based on data quality
    let confidence = 0.5;
    
    if (insight.data?.sampleSize > 1000) confidence += 0.2;
    if (insight.data?.trend?.r2 > 0.8) confidence += 0.2;
    if (insight.recommendations?.length > 0) confidence += 0.1;
    
    return Math.min(confidence, 1);
  }
}

type Insight = z.infer<typeof insightSchema> & {
  projectId: string;
  detectedAt: Date;
};
```

### 3. Anomaly Detection Agent

Create `packages/ai/src/agents/anomaly.ts`:
```typescript
import { Agent, Tool } from '@mastra/core';
import { z } from 'zod';
import { db } from '@repo/database';

export class AnomalyDetectionAgent extends Agent {
  name = 'Anomaly Detection';
  description = 'Detects unusual patterns in analytics data';

  tools = [
    new Tool({
      name: 'detect_traffic_anomalies',
      description: 'Detect anomalies in traffic patterns',
      parameters: z.object({
        projectId: z.string(),
        sensitivity: z.number().min(0).max(1).default(0.8),
      }),
      execute: async ({ projectId, sensitivity }) => {
        // Fetch historical data
        const historicalData = await this.getHistoricalData(projectId, 30);
        
        // Calculate statistical thresholds
        const stats = this.calculateStatistics(historicalData);
        
        // Identify anomalies
        const anomalies = historicalData.filter(day => {
          const zScore = Math.abs((day.pageViews - stats.mean) / stats.stdDev);
          return zScore > (3 - sensitivity * 2); // Dynamic threshold
        });
        
        return { anomalies, stats };
      },
    }),

    new Tool({
      name: 'detect_performance_degradation',
      description: 'Detect performance issues',
      parameters: z.object({
        projectId: z.string(),
        metric: z.enum(['loadTime', 'responseTime', 'errorRate']),
      }),
      execute: async ({ projectId, metric }) => {
        // Analyze performance metrics over time
        const performanceData = await this.getPerformanceMetrics(projectId, metric);
        
        // Detect degradation patterns
        const degradation = this.detectDegradation(performanceData);
        
        return degradation;
      },
    }),
  ];

  async detectAnomalies(projectId: string): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = [];

    // Traffic anomalies
    const trafficAnomalies = await this.execute('detect_traffic_anomalies', {
      projectId,
      sensitivity: 0.8,
    });

    if (trafficAnomalies.anomalies.length > 0) {
      const alert = await this.generateAnomalyAlert(
        'traffic',
        trafficAnomalies,
        projectId
      );
      alerts.push(alert);
    }

    // Performance anomalies
    const performanceIssues = await this.execute('detect_performance_degradation', {
      projectId,
      metric: 'loadTime',
    });

    if (performanceIssues.isDegrading) {
      const alert = await this.generateAnomalyAlert(
        'performance',
        performanceIssues,
        projectId
      );
      alerts.push(alert);
    }

    return alerts;
  }

  private async generateAnomalyAlert(
    type: string,
    data: any,
    projectId: string
  ): Promise<AnomalyAlert> {
    const prompt = `
      Analyze this ${type} anomaly and generate an alert:
      ${JSON.stringify(data)}
      
      Include:
      1. Clear description of the anomaly
      2. Potential causes
      3. Recommended actions
      4. Urgency level
    `;

    const analysis = await this.llm.generate(prompt);

    return {
      type: 'anomaly',
      category: type as any,
      title: `${type} Anomaly Detected`,
      description: analysis.description,
      impact: this.calculateImpact(data),
      confidence: data.confidence || 0.85,
      data,
      detectedAt: new Date(),
      projectId,
    };
  }

  private calculateStatistics(data: any[]) {
    const values = data.map(d => d.pageViews);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, stdDev, variance };
  }

  private detectDegradation(data: any[]) {
    // Simple linear regression to detect trends
    const n = data.length;
    const sumX = data.reduce((a, _, i) => a + i, 0);
    const sumY = data.reduce((a, b) => a + b.value, 0);
    const sumXY = data.reduce((a, b, i) => a + i * b.value, 0);
    const sumX2 = data.reduce((a, _, i) => a + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    return {
      isDegrading: slope > 0.1, // Positive slope indicates degradation
      slope,
      trend: slope > 0.1 ? 'degrading' : slope < -0.1 ? 'improving' : 'stable',
    };
  }

  private calculateImpact(data: any): 'high' | 'medium' | 'low' {
    // Impact calculation based on severity and scope
    const severity = data.anomalies?.length || 0;
    const deviation = data.stats?.stdDev || 0;
    
    if (severity > 5 || deviation > 3) return 'high';
    if (severity > 2 || deviation > 2) return 'medium';
    return 'low';
  }

  private async getHistoricalData(projectId: string, days: number) {
    // Implementation would fetch from database
    return [];
  }

  private async getPerformanceMetrics(projectId: string, metric: string) {
    // Implementation would fetch from database
    return [];
  }
}

interface AnomalyAlert {
  type: 'anomaly';
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  data: any;
  detectedAt: Date;
  projectId: string;
}
```

### 4. Prediction Agent

Create `packages/ai/src/agents/prediction.ts`:
```typescript
import { Agent, Tool } from '@mastra/core';
import { z } from 'zod';

export class PredictionAgent extends Agent {
  name = 'Analytics Predictor';
  description = 'Generates predictions for future metrics';

  tools = [
    new Tool({
      name: 'predict_traffic',
      description: 'Predict future traffic patterns',
      parameters: z.object({
        projectId: z.string(),
        timeframe: z.enum(['day', 'week', 'month']),
        historicalDays: z.number().default(90),
      }),
      execute: async ({ projectId, timeframe, historicalDays }) => {
        // Fetch historical data
        const historical = await this.getHistoricalMetrics(
          projectId,
          'traffic',
          historicalDays
        );
        
        // Apply time series analysis
        const forecast = this.timeSeriesForecast(historical, timeframe);
        
        return forecast;
      },
    }),

    new Tool({
      name: 'predict_conversion',
      description: 'Predict conversion rates',
      parameters: z.object({
        projectId: z.string(),
        factors: z.array(z.string()).optional(),
      }),
      execute: async ({ projectId, factors }) => {
        // Analyze conversion factors
        const conversionData = await this.getConversionData(projectId);
        
        // Build prediction model
        const prediction = this.predictConversion(conversionData, factors);
        
        return prediction;
      },
    }),
  ];

  async generatePredictions(projectId: string): Promise<Prediction[]> {
    const predictions: Prediction[] = [];

    // Traffic predictions
    const trafficForecast = await this.execute('predict_traffic', {
      projectId,
      timeframe: 'week',
    });

    const trafficPrediction = await this.createPrediction(
      'traffic',
      'week',
      trafficForecast,
      projectId
    );
    predictions.push(trafficPrediction);

    // Conversion predictions
    const conversionForecast = await this.execute('predict_conversion', {
      projectId,
    });

    const conversionPrediction = await this.createPrediction(
      'conversion',
      'week',
      conversionForecast,
      projectId
    );
    predictions.push(conversionPrediction);

    return predictions;
  }

  private async createPrediction(
    metric: string,
    timeframe: string,
    forecast: any,
    projectId: string
  ): Promise<Prediction> {
    const prompt = `
      Based on this ${metric} forecast data:
      ${JSON.stringify(forecast)}
      
      Generate a prediction including:
      1. Expected value with confidence interval
      2. Key factors influencing the prediction
      3. Recommendations to improve outcomes
      4. Risk factors to monitor
    `;

    const analysis = await this.llm.generate(prompt);

    return {
      metric,
      timeframe,
      predictedValue: forecast.value,
      confidence: forecast.confidence,
      factors: forecast.factors || [],
      explanation: analysis.explanation,
      recommendations: analysis.recommendations,
      targetDate: this.calculateTargetDate(timeframe),
      createdAt: new Date(),
      projectId,
    };
  }

  private timeSeriesForecast(historical: any[], timeframe: string) {
    // Simplified ARIMA-like forecasting
    const values = historical.map(h => h.value);
    const trend = this.calculateTrend(values);
    const seasonality = this.calculateSeasonality(values);
    
    const forecast = trend.slope * values.length + trend.intercept + seasonality;
    const confidence = Math.min(0.9, 1 - (trend.error / trend.intercept));
    
    return {
      value: Math.max(0, forecast),
      confidence,
      trend,
      seasonality,
      method: 'time_series',
    };
  }

  private predictConversion(data: any, factors?: string[]) {
    // Multi-factor regression for conversion prediction
    const baseRate = data.historicalRate;
    const factorImpacts = this.analyzeFactors(data, factors);
    
    const predictedRate = baseRate * (1 + factorImpacts.totalImpact);
    
    return {
      value: predictedRate,
      confidence: 0.75,
      factors: factorImpacts.factors,
      method: 'regression',
    };
  }

  private calculateTrend(values: number[]) {
    // Linear regression
    const n = values.length;
    const sumX = values.reduce((a, _, i) => a + i, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((a, b, i) => a + i * b, 0);
    const sumX2 = values.reduce((a, _, i) => a + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate error
    const predictions = values.map((_, i) => slope * i + intercept);
    const errors = values.map((v, i) => Math.pow(v - predictions[i], 2));
    const error = Math.sqrt(errors.reduce((a, b) => a + b, 0) / n);
    
    return { slope, intercept, error };
  }

  private calculateSeasonality(values: number[]) {
    // Simple weekly seasonality
    const weeklyPattern = new Array(7).fill(0);
    const counts = new Array(7).fill(0);
    
    values.forEach((value, index) => {
      const dayOfWeek = index % 7;
      weeklyPattern[dayOfWeek] += value;
      counts[dayOfWeek]++;
    });
    
    const avgPattern = weeklyPattern.map((sum, i) => sum / counts[i]);
    const todayPattern = avgPattern[new Date().getDay()];
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    
    return (todayPattern - avgValue) * 0.3; // 30% weight to seasonality
  }

  private analyzeFactors(data: any, factors?: string[]) {
    // Analyze impact of various factors on conversion
    const impacts = {
      traffic_source: 0.1,
      device_type: 0.05,
      time_of_day: 0.08,
      page_performance: 0.15,
    };
    
    const relevantFactors = factors || Object.keys(impacts);
    const totalImpact = relevantFactors.reduce((sum, factor) => {
      return sum + (impacts[factor] || 0);
    }, 0);
    
    return {
      totalImpact,
      factors: relevantFactors.map(f => ({
        name: f,
        impact: impacts[f] || 0,
      })),
    };
  }

  private calculateTargetDate(timeframe: string): Date {
    const date = new Date();
    switch (timeframe) {
      case 'day':
        date.setDate(date.getDate() + 1);
        break;
      case 'week':
        date.setDate(date.getDate() + 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() + 1);
        break;
    }
    return date;
  }

  private async getHistoricalMetrics(projectId: string, metric: string, days: number) {
    // Implementation would fetch from database
    return [];
  }

  private async getConversionData(projectId: string) {
    // Implementation would fetch from database
    return { historicalRate: 0.02 };
  }
}

interface Prediction {
  metric: string;
  timeframe: string;
  predictedValue: number;
  confidence: number;
  factors: any[];
  explanation: string;
  recommendations?: string[];
  targetDate: Date;
  createdAt: Date;
  projectId: string;
}
```

### 5. Natural Language Query Agent

Create `packages/ai/src/agents/query.ts`:
```typescript
import { Agent, Tool } from '@mastra/core';
import { z } from 'zod';
import { db } from '@repo/database';

export class QueryAgent extends Agent {
  name = 'Natural Language Analytics';
  description = 'Answers analytics questions in natural language';

  tools = [
    new Tool({
      name: 'translate_to_sql',
      description: 'Convert natural language to SQL query',
      parameters: z.object({
        question: z.string(),
        schema: z.string(),
      }),
      execute: async ({ question, schema }) => {
        const prompt = `
          Given this database schema:
          ${schema}
          
          Translate this question to a SQL query:
          "${question}"
          
          Return only the SQL query, no explanation.
        `;
        
        const sql = await this.llm.generate(prompt);
        return { sql: sql.trim() };
      },
    }),

    new Tool({
      name: 'execute_analytics_query',
      description: 'Execute analytics query safely',
      parameters: z.object({
        sql: z.string(),
        projectId: z.string(),
      }),
      execute: async ({ sql, projectId }) => {
        // Validate and sanitize SQL
        const safeSql = this.validateSql(sql, projectId);
        
        // Execute query with timeout
        const results = await db.execute(safeSql);
        
        return results;
      },
    }),

    new Tool({
      name: 'format_results',
      description: 'Format query results for user',
      parameters: z.object({
        results: z.any(),
        question: z.string(),
      }),
      execute: async ({ results, question }) => {
        const prompt = `
          Format these query results to answer the question:
          Question: "${question}"
          Results: ${JSON.stringify(results)}
          
          Provide a clear, concise answer with:
          1. Direct answer to the question
          2. Key insights from the data
          3. Relevant visualizations if applicable
        `;
        
        const formatted = await this.llm.generate(prompt);
        return formatted;
      },
    }),
  ];

  async answerQuestion(
    question: string,
    projectId: string
  ): Promise<QueryResponse> {
    try {
      // Get relevant schema
      const schema = this.getRelevantSchema(question);
      
      // Translate to SQL
      const { sql } = await this.execute('translate_to_sql', {
        question,
        schema,
      });
      
      // Execute query
      const results = await this.execute('execute_analytics_query', {
        sql,
        projectId,
      });
      
      // Format response
      const formatted = await this.execute('format_results', {
        results,
        question,
      });
      
      return {
        question,
        answer: formatted.answer,
        data: results,
        insights: formatted.insights,
        visualization: this.suggestVisualization(results, question),
        confidence: 0.9,
      };
    } catch (error) {
      return {
        question,
        answer: "I couldn't process that question. Please try rephrasing.",
        error: error.message,
        confidence: 0,
      };
    }
  }

  private getRelevantSchema(question: string): string {
    // Determine which tables are relevant based on keywords
    const keywords = question.toLowerCase().split(' ');
    
    let schema = '';
    
    if (keywords.some(k => ['user', 'visitor', 'people'].includes(k))) {
      schema += 'tracked_users table: id, user_id, email, properties, sessions, events\n';
    }
    
    if (keywords.some(k => ['page', 'url', 'content'].includes(k))) {
      schema += 'events table: page_url, page_title, name, timestamp\n';
    }
    
    if (keywords.some(k => ['session', 'visit', 'duration'].includes(k))) {
      schema += 'sessions table: id, user_id, duration, page_views, started_at\n';
    }
    
    if (keywords.some(k => ['metric', 'analytics', 'performance'].includes(k))) {
      schema += 'daily_analytics table: date, page_views, visitors, bounce_rate\n';
    }
    
    return schema || 'All analytics tables available';
  }

  private validateSql(sql: string, projectId: string): string {
    // Basic SQL injection prevention
    const forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE'];
    const upperSql = sql.toUpperCase();
    
    for (const word of forbidden) {
      if (upperSql.includes(word)) {
        throw new Error(`Forbidden SQL operation: ${word}`);
      }
    }
    
    // Ensure project filter
    if (!sql.includes('project_id')) {
      sql = sql.replace('WHERE', `WHERE project_id = '${projectId}' AND`);
      if (!sql.includes('WHERE')) {
        sql = sql.replace('FROM', `FROM table WHERE project_id = '${projectId}'`);
      }
    }
    
    // Add reasonable limit
    if (!upperSql.includes('LIMIT')) {
      sql += ' LIMIT 1000';
    }
    
    return sql;
  }

  private suggestVisualization(results: any, question: string): VisualizationType {
    const resultCount = Array.isArray(results) ? results.length : 1;
    const hasTime = question.toLowerCase().includes('time') || 
                   question.toLowerCase().includes('trend');
    const hasComparison = question.toLowerCase().includes('compare') ||
                         question.toLowerCase().includes('vs');
    
    if (hasTime && resultCount > 1) return 'line';
    if (hasComparison) return 'bar';
    if (resultCount === 1) return 'metric';
    if (resultCount < 10) return 'bar';
    
    return 'table';
  }
}

interface QueryResponse {
  question: string;
  answer: string;
  data?: any;
  insights?: string[];
  visualization?: VisualizationType;
  confidence: number;
  error?: string;
}

type VisualizationType = 'line' | 'bar' | 'pie' | 'metric' | 'table' | 'map';
```

### 6. AI Orchestrator

Create `packages/ai/src/orchestrator.ts`:
```typescript
import { InsightsAgent } from './agents/insights';
import { AnomalyDetectionAgent } from './agents/anomaly';
import { PredictionAgent } from './agents/prediction';
import { QueryAgent } from './agents/query';
import { mastra } from './config';

export class AIOrchestrator {
  private insights: InsightsAgent;
  private anomaly: AnomalyDetectionAgent;
  private prediction: PredictionAgent;
  private query: QueryAgent;

  constructor() {
    this.insights = new InsightsAgent({ mastra });
    this.anomaly = new AnomalyDetectionAgent({ mastra });
    this.prediction = new PredictionAgent({ mastra });
    this.query = new QueryAgent({ mastra });
  }

  /**
   * Run all AI analysis for a project
   */
  async runFullAnalysis(projectId: string) {
    const [insights, anomalies, predictions] = await Promise.all([
      this.insights.generateInsights(projectId),
      this.anomaly.detectAnomalies(projectId),
      this.prediction.generatePredictions(projectId),
    ]);

    return {
      insights,
      anomalies,
      predictions,
      generatedAt: new Date(),
    };
  }

  /**
   * Answer a natural language question
   */
  async answerQuestion(question: string, projectId: string) {
    return this.query.answerQuestion(question, projectId);
  }

  /**
   * Get real-time insights for dashboard
   */
  async getRealTimeInsights(projectId: string, metric: string) {
    // Quick insights for specific metrics
    return this.insights.generateInsights(projectId);
  }

  /**
   * Check for anomalies in real-time
   */
  async checkAnomalies(projectId: string, data: any) {
    return this.anomaly.detectAnomalies(projectId);
  }
}

// Export singleton instance
export const ai = new AIOrchestrator();
```

### 7. Package Exports

Update `packages/ai/src/index.ts`:
```typescript
// Config
export { mastra, models, env } from './config';

// Agents
export { InsightsAgent } from './agents/insights';
export { AnomalyDetectionAgent } from './agents/anomaly';
export { PredictionAgent } from './agents/prediction';
export { QueryAgent } from './agents/query';

// Orchestrator
export { AIOrchestrator, ai } from './orchestrator';

// Types
export type { Insight } from './agents/insights';
export type { AnomalyAlert } from './agents/anomaly';
export type { Prediction } from './agents/prediction';
export type { QueryResponse, VisualizationType } from './agents/query';
```

## Testing Requirements

1. Test Mastra configuration with API keys
2. Test each agent independently
3. Test LLM prompt responses
4. Test tool execution
5. Test orchestrator coordination
6. Mock OpenRouter API calls for unit tests
7. Test error handling and fallbacks

## Success Criteria

- ✅ Mastra framework configured
- ✅ All AI agents implemented
- ✅ Natural language queries working
- ✅ Insights generation functional
- ✅ Anomaly detection operational
- ✅ Predictions generating
- ✅ Orchestrator coordinating agents

## Handoff to Next Agent

Agent 5 will need:
- AI agent interfaces
- Understanding of insight/prediction types
- Integration points for analytics engine
- AI orchestrator for coordinated analysis

## Notes

- Use appropriate models for each task
- Implement caching for expensive operations
- Consider rate limiting for API calls
- Monitor token usage
- Design for async processing