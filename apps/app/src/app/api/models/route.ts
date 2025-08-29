import { NextRequest } from 'next/server'

// Define available models for each provider
// In production, these could be fetched from each provider's API
const PROVIDER_MODELS = {
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Most capable, balanced model' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fast, efficient model' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Powerful model for complex tasks' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest model' }
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Latest multimodal flagship model' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Affordable small model' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Latest GPT-4 Turbo model' },
    { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo Preview', description: 'Preview with latest improvements' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Standard GPT-4 model' },
    { id: 'o1-preview', name: 'O1 Preview', description: 'Reasoning model preview' },
    { id: 'o1-mini', name: 'O1 Mini', description: 'Smaller reasoning model' }
  ],
  google: [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: 'Experimental next-gen model' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Advanced reasoning and analysis' },
    { id: 'gemini-1.5-pro-002', name: 'Gemini 1.5 Pro 002', description: 'Latest Pro version' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and versatile' },
    { id: 'gemini-1.5-flash-002', name: 'Gemini 1.5 Flash 002', description: 'Latest Flash version' },
    { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', description: 'Smaller, faster variant' }
  ]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    
    if (provider && provider in PROVIDER_MODELS) {
      // Return models for specific provider
      return Response.json({
        provider,
        models: PROVIDER_MODELS[provider as keyof typeof PROVIDER_MODELS]
      })
    }
    
    // Return all providers and their models
    return Response.json({
      providers: Object.keys(PROVIDER_MODELS),
      models: PROVIDER_MODELS
    })
  } catch (error) {
    console.error('Failed to fetch models:', error)
    return Response.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}

export const runtime = 'edge'