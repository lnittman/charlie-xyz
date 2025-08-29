# Agent 2: AI Opinion Engine
*"Build Mastra-powered AI agents for generating diverse opinions on user topics"*

## Scope
This agent implements the core AI functionality using Mastra framework. It creates agents for real-time interpretation, opinion generation, and trend analysis. The system must support multiple AI models through OpenRouter and provide structured, consistent outputs.

## Packages to Modify
- `apps/ai/` - Complete Mastra implementation
  - `src/agents/` - AI agent definitions
  - `src/tools/` - Custom tools for agents
  - `src/workflows/` - Opinion polling workflows
  - `src/schemas/` - Zod schemas for responses
  - `prompts/` - XML prompt templates
- `packages/ai/` - Remove analytics-focused AI, add shared utilities

## Implementation Details

### 1. Mastra Configuration

```typescript
// apps/ai/src/index.ts
import { Mastra } from '@mastra/core';
import { createOpenAIProvider } from '@mastra/openai';

import { interpretationAgent } from './agents/interpretation-agent';
import { opinionAgent } from './agents/opinion-agent';
import { analysisAgent } from './agents/analysis-agent';
import { consensusAgent } from './agents/consensus-agent';

import { pollOpinionsWorkflow } from './workflows/poll-opinions';
import { analyzeTrendsWorkflow } from './workflows/analyze-trends';
import { generateInsightsWorkflow } from './workflows/generate-insights';

// Configure OpenRouter as OpenAI-compatible provider
const openRouterProvider = createOpenAIProvider({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultOptions: {
    headers: {
      'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
      'X-Title': 'Vibes Radar',
    },
  },
});

export const mastra = new Mastra({
  providers: {
    openrouter: openRouterProvider,
  },
  agents: {
    interpretation: interpretationAgent,
    opinion: opinionAgent,
    analysis: analysisAgent,
    consensus: consensusAgent,
  },
  workflows: {
    pollOpinions: pollOpinionsWorkflow,
    analyzeTrends: analyzeTrendsWorkflow,
    generateInsights: generateInsightsWorkflow,
  },
  logger: process.env.NODE_ENV === 'development',
});

// Export typed clients
export const agents = mastra.agents;
export const workflows = mastra.workflows;
```

### 2. Agent Schemas

```typescript
// apps/ai/src/schemas/interpretation.ts
import { z } from 'zod';

export const interpretationSchema = z.object({
  topic: z.string().describe('Core topic extracted from query'),
  category: z.string().optional().describe('Topic category'),
  complexity: z.enum(['simple', 'moderate', 'complex']),
  suggestedInterval: z.enum(['hourly', 'daily', 'weekly']),
  relatedQuestions: z.array(z.string()).max(5),
  confidence: z.number().min(0).max(1),
});

export type Interpretation = z.infer<typeof interpretationSchema>;

// apps/ai/src/schemas/opinion.ts
export const opinionSchema = z.object({
  content: z.string().min(100).max(1000),
  summary: z.string().max(200),
  sentiment: z.enum(['very_positive', 'positive', 'neutral', 'negative', 'very_negative']),
  confidence: z.number().min(0).max(1),
  topics: z.array(z.string()).max(10),
  reasoning: z.object({
    mainPoints: z.array(z.string()),
    sources: z.array(z.string()).optional(),
    caveats: z.array(z.string()).optional(),
  }),
});

export type Opinion = z.infer<typeof opinionSchema>;

// apps/ai/src/schemas/trend.ts
export const trendAnalysisSchema = z.object({
  direction: z.enum(['rising', 'stable', 'falling', 'volatile']),
  strength: z.number().min(0).max(1),
  summary: z.string().max(300),
  keyChanges: z.array(z.object({
    aspect: z.string(),
    change: z.string(),
    significance: z.enum(['high', 'medium', 'low']),
  })),
  prediction: z.object({
    nextPeriod: z.string(),
    confidence: z.number().min(0).max(1),
  }).optional(),
});

export type TrendAnalysis = z.infer<typeof trendAnalysisSchema>;
```

### 3. Interpretation Agent (Edge-Optimized)

```typescript
// apps/ai/src/agents/interpretation-agent.ts
import { Agent } from '@mastra/core';
import { interpretationSchema } from '../schemas/interpretation';
import { readFileSync } from 'fs';
import { join } from 'path';

const promptTemplate = readFileSync(
  join(process.cwd(), 'apps/ai/prompts/interpret.xml'),
  'utf-8'
);

export const interpretationAgent = new Agent({
  id: 'interpretation-agent',
  name: 'Vibe Interpreter',
  description: 'Interprets user queries for radar creation',
  
  model: {
    provider: 'openrouter',
    name: 'openai/gpt-4o-mini', // Fast, cheap model for edge
    temperature: 0.7,
    maxTokens: 300,
  },
  
  systemPrompt: promptTemplate,
  
  outputSchema: interpretationSchema,
  
  // Edge-optimized settings
  options: {
    timeout: 5000, // 5s max
    retries: 1,
    cache: {
      ttl: 3600, // Cache for 1 hour
      key: (input) => `interpret:${input.messages[0].content}`,
    },
  },
});
```

### 4. Opinion Generation Agent

```typescript
// apps/ai/src/agents/opinion-agent.ts
import { Agent } from '@mastra/core';
import { opinionSchema } from '../schemas/opinion';

export const opinionAgent = new Agent({
  id: 'opinion-agent',
  name: 'Opinion Generator',
  description: 'Generates detailed opinions on topics',
  
  model: {
    provider: 'openrouter',
    name: 'anthropic/claude-3-haiku', // Good balance of quality/cost
    temperature: 0.8,
    maxTokens: 800,
  },
  
  systemPrompt: `<system>
You are an AI opinion analyst for Vibes Radar. Your role is to provide thoughtful, 
balanced opinions on topics users are tracking. 

Guidelines:
1. Be specific and cite reasoning
2. Acknowledge multiple perspectives
3. Identify key themes and patterns
4. Express appropriate confidence levels
5. Maintain consistency in sentiment analysis

Always structure your response according to the provided schema.
</system>`,
  
  outputSchema: opinionSchema,
  
  tools: [
    // Could add web search tool here for current events
  ],
});

// Create variant agents for different models
export const opinionAgentGPT4 = new Agent({
  ...opinionAgent.config,
  id: 'opinion-agent-gpt4',
  model: {
    provider: 'openrouter',
    name: 'openai/gpt-4-turbo',
    temperature: 0.8,
    maxTokens: 800,
  },
});

export const opinionAgentMixtral = new Agent({
  ...opinionAgent.config,
  id: 'opinion-agent-mixtral',
  model: {
    provider: 'openrouter',
    name: 'mistralai/mixtral-8x7b-instruct',
    temperature: 0.8,
    maxTokens: 800,
  },
});
```

### 5. Consensus Building Agent

```typescript
// apps/ai/src/agents/consensus-agent.ts
import { Agent } from '@mastra/core';
import { z } from 'zod';

const consensusSchema = z.object({
  overallSentiment: z.enum(['very_positive', 'positive', 'neutral', 'negative', 'very_negative']),
  confidence: z.number().min(0).max(1),
  agreements: z.array(z.string()),
  disagreements: z.array(z.string()),
  synthesis: z.string().max(500),
  minorityViews: z.array(z.object({
    view: z.string(),
    model: z.string(),
  })).optional(),
});

export const consensusAgent = new Agent({
  id: 'consensus-agent',
  name: 'Consensus Builder',
  description: 'Synthesizes multiple AI opinions into consensus',
  
  model: {
    provider: 'openrouter',
    name: 'openai/gpt-4o',
    temperature: 0.5, // Lower temp for consistency
    maxTokens: 600,
  },
  
  systemPrompt: `You are a consensus builder that synthesizes multiple AI opinions.
Analyze the provided opinions and create a balanced consensus view that:
1. Identifies common themes and agreements
2. Highlights significant disagreements
3. Weighs confidence levels appropriately
4. Provides a nuanced synthesis`,
  
  outputSchema: consensusSchema,
});
```

### 6. Opinion Polling Workflow

```typescript
// apps/ai/src/workflows/poll-opinions.ts
import { Workflow, Step } from '@mastra/core';
import { z } from 'zod';
import { prisma } from '@repo/database';
import { opinionAgent, opinionAgentGPT4, opinionAgentMixtral } from '../agents/opinion-agent';
import { consensusAgent } from '../agents/consensus-agent';

const pollOpinionsInput = z.object({
  radarId: z.string(),
  models: z.array(z.string()).optional(),
  forceRefresh: z.boolean().optional(),
});

export const pollOpinionsWorkflow = new Workflow({
  id: 'poll-opinions',
  name: 'Poll AI Opinions',
  description: 'Polls multiple AI models for opinions on a radar topic',
  
  inputSchema: pollOpinionsInput,
  
  steps: [
    // Step 1: Fetch radar details
    new Step({
      id: 'fetch-radar',
      execute: async ({ input }) => {
        const radar = await prisma.radar.findUnique({
          where: { id: input.radarId },
          include: { 
            opinions: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        });
        
        if (!radar) throw new Error('Radar not found');
        
        return { radar };
      },
    }),
    
    // Step 2: Generate opinions from multiple models
    new Step({
      id: 'generate-opinions',
      execute: async ({ input, context }) => {
        const { radar } = context.previousSteps['fetch-radar'];
        const models = input.models || ['claude-3-haiku', 'gpt-4o-mini', 'mixtral-8x7b'];
        
        const agents = {
          'claude-3-haiku': opinionAgent,
          'gpt-4-turbo': opinionAgentGPT4,
          'mixtral-8x7b': opinionAgentMixtral,
          'gpt-4o-mini': opinionAgent, // Use base agent with model override
        };
        
        const opinionPromises = models.map(async (modelName) => {
          const agent = agents[modelName] || opinionAgent;
          
          try {
            const result = await agent.generate({
              messages: [{
                role: 'user',
                content: `Generate an opinion about: ${radar.query}
                
Context: ${radar.description || 'No additional context'}
Previous opinions trend: ${radar.opinions.length > 0 ? 'Available' : 'First opinion'}`,
              }],
              model: modelName.includes('/') ? modelName : undefined,
            });
            
            return {
              model: modelName,
              opinion: result.data,
              usage: result.usage,
            };
          } catch (error) {
            console.error(`Failed to get opinion from ${modelName}:`, error);
            return null;
          }
        });
        
        const opinions = (await Promise.all(opinionPromises)).filter(Boolean);
        
        return { opinions };
      },
    }),
    
    // Step 3: Build consensus
    new Step({
      id: 'build-consensus',
      execute: async ({ context }) => {
        const { opinions } = context.previousSteps['generate-opinions'];
        
        if (opinions.length < 2) {
          return { consensus: null };
        }
        
        const consensusInput = opinions.map(o => ({
          model: o.model,
          sentiment: o.opinion.sentiment,
          summary: o.opinion.summary,
          confidence: o.opinion.confidence,
          mainPoints: o.opinion.reasoning.mainPoints,
        }));
        
        const result = await consensusAgent.generate({
          messages: [{
            role: 'user',
            content: `Build a consensus from these AI opinions:\n${JSON.stringify(consensusInput, null, 2)}`,
          }],
        });
        
        return { consensus: result.data };
      },
    }),
    
    // Step 4: Store opinions
    new Step({
      id: 'store-opinions',
      execute: async ({ input, context }) => {
        const { radar } = context.previousSteps['fetch-radar'];
        const { opinions } = context.previousSteps['generate-opinions'];
        
        const storedOpinions = await Promise.all(
          opinions.map(({ model, opinion }) =>
            prisma.opinion.create({
              data: {
                radarId: radar.id,
                model,
                content: opinion.content,
                summary: opinion.summary,
                sentiment: opinion.sentiment.toUpperCase(),
                confidence: opinion.confidence,
                topics: opinion.topics,
                metadata: {
                  reasoning: opinion.reasoning,
                  generatedAt: new Date().toISOString(),
                },
              },
            })
          )
        );
        
        // Update radar's last polled time
        await prisma.radar.update({
          where: { id: radar.id },
          data: { 
            lastPolledAt: new Date(),
            nextPollAt: calculateNextPollTime(radar.pollInterval),
          },
        });
        
        return { storedOpinions };
      },
    }),
  ],
  
  outputSchema: z.object({
    opinions: z.array(z.any()),
    consensus: z.any().nullable(),
    storedCount: z.number(),
  }),
});

function calculateNextPollTime(interval: string): Date {
  const now = new Date();
  switch (interval) {
    case 'HOURLY':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'WEEKLY':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'MONTHLY':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'DAILY':
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}
```

### 7. XML Prompt Templates

```xml
<!-- apps/ai/prompts/interpret.xml -->
<system>
  <role>Radar Query Interpreter</role>
  
  <context>
    You help users create "radars" to track AI opinions on topics over time.
    Analyze their query to extract the core topic and suggest optimal settings.
  </context>
  
  <guidelines>
    <guideline>Extract the essence of what they want to track</guideline>
    <guideline>Categorize appropriately (Technology, Business, Culture, etc.)</guideline>
    <guideline>Assess complexity to suggest polling frequency</guideline>
    <guideline>Generate related questions they might find interesting</guideline>
    <guideline>Be concise but insightful</guideline>
  </guidelines>
  
  <output_format>
    Return a JSON object matching the interpretation schema.
    Confidence should reflect how well you understood the query.
  </output_format>
</system>

<user>
  <query>{USER_QUERY}</query>
</user>
```

```xml
<!-- apps/ai/prompts/opinion.xml -->
<system>
  <role>AI Opinion Analyst</role>
  
  <context>
    You provide thoughtful opinions on topics for the Vibes Radar platform.
    Users want to understand "what AI thinks" about their topics.
    Your opinions are tracked over time to show how AI perspectives evolve.
  </context>
  
  <approach>
    <step>Understand the topic deeply</step>
    <step>Consider multiple perspectives</step>
    <step>Form a balanced opinion</step>
    <step>Support with reasoning</step>
    <step>Express appropriate confidence</step>
  </approach>
  
  <guidelines>
    <guideline>Be specific rather than generic</guideline>
    <guideline>Acknowledge uncertainties</guideline>
    <guideline>Identify key themes</guideline>
    <guideline>Maintain consistent sentiment analysis</guideline>
    <guideline>Provide actionable insights when relevant</guideline>
  </guidelines>
  
  <output_format>
    Structure your response according to the opinion schema.
    Ensure all required fields are populated thoughtfully.
  </output_format>
</system>

<user>
  <topic>{TOPIC}</topic>
  <context>{ADDITIONAL_CONTEXT}</context>
</user>
```

### 8. Environment Configuration

```typescript
// apps/ai/src/env.ts
import { z } from 'zod';

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  VERCEL_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```

## Dependencies
- Agent 1 (Database Schema) must be complete
- OpenRouter API key configured
- Mastra package installed

## Testing Strategy

### 1. Agent Testing
```typescript
// Test interpretation agent
const result = await interpretationAgent.generate({
  messages: [{ role: 'user', content: 'Best coffee shops in SF' }],
});
console.log(result.data); // Should match schema

// Test opinion generation
const opinion = await opinionAgent.generate({
  messages: [{ role: 'user', content: 'Generate opinion about: AI startup trends' }],
});
console.log(opinion.data); // Should be detailed opinion
```

### 2. Workflow Testing
```typescript
// Test full polling workflow
const result = await pollOpinionsWorkflow.execute({
  radarId: 'test-radar-id',
  models: ['gpt-4o-mini'],
});
```

### 3. Multi-Model Testing
Verify different models provide varied perspectives on same topic

## Security Considerations
- API keys stored securely in env vars
- Rate limiting on OpenRouter side
- Input sanitization for prompts
- No user data in prompts
- Cost monitoring for API usage

## Effort Estimate
2-3 developer days

## Success Metrics
- [ ] All agents return schema-compliant responses
- [ ] Multi-model opinions show diversity
- [ ] Consensus building identifies key themes
- [ ] Response times under 5s for interpretation
- [ ] Error handling for API failures
- [ ] Workflows complete successfully