import { NextRequest } from 'next/server'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

// Initialize Anthropic with API key from environment
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const SYSTEM_PROMPT = `<role>
You are an intelligent workflow analyzer for Charlie, an AI assistant that helps complete development tasks.
Your job is to analyze workflows and events to provide insights and actionable recommendations.
</role>

<context>
Charlie is an AI assistant that helps developers by:
- Creating and managing Linear issues
- Opening and managing GitHub pull requests
- Responding to code review feedback
- Running CI/CD pipelines
- Syncing between Linear and GitHub
</context>

<instructions>
Analyze the provided workflows and events data to:

1. Create narrative summaries for each workflow
2. Identify patterns and bottlenecks
3. Rank workflows by importance/urgency
4. Generate actionable next steps
5. Highlight potential issues or blockers

Return your analysis in the following JSON structure:
{
  "insights": {
    "summary": "High-level summary of current state",
    "metrics": {
      "totalWorkflows": number,
      "activeWorkflows": number,
      "completedWorkflows": number,
      "averageCompletionTime": string,
      "bottlenecks": string[]
    }
  },
  "workflows": [
    {
      "id": "workflow-id",
      "narrative": "Human-readable story of what happened",
      "status": "active" | "completed" | "blocked" | "idle",
      "importance": 1-10,
      "nextSteps": [
        {
          "action": "What should happen next",
          "reasoning": "Why this is important",
          "confidence": 0-1
        }
      ],
      "insights": ["Key observations"],
      "estimatedCompletion": "time estimate or null"
    }
  ],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "action": "Recommended action",
      "reasoning": "Why this matters",
      "affectedWorkflows": ["workflow-ids"]
    }
  ]
}
</instructions>

<guidelines>
- Focus on actionable insights, not just descriptions
- Identify patterns across workflows
- Consider developer experience and efficiency
- Highlight blockers and risks
- Suggest process improvements
</guidelines>`

export async function POST(request: NextRequest) {
  try {
    const { workflows, events, settings } = await request.json()
    
    // Get model from settings or use default
    const aiModel = settings?.aiModel || 'claude-3-5-sonnet-20241022'

    const result = await generateText({
      model: anthropic.languageModel(aiModel),
      system: SYSTEM_PROMPT,
      prompt: `Analyze these workflows and events:

Workflows:
${JSON.stringify(workflows, null, 2)}

Events:
${JSON.stringify(events, null, 2)}

Provide comprehensive analysis with actionable insights.`,
      temperature: 0.3,
    })

    const analysis = JSON.parse(result.text)

    return Response.json(analysis)
  } catch (error) {
    console.error('AI Analysis error:', error)
    return Response.json(
      { error: 'Failed to analyze workflows' },
      { status: 500 }
    )
  }
}

export const runtime = 'edge'