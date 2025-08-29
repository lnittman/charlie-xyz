import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // For Google, we'll return a static list since their API requires more complex auth
  // In production, you'd use the Google AI SDK or Vertex AI API
  
  const models = [
    {
      id: 'gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash (Experimental)',
      provider: 'google',
      description: 'Latest experimental flash model with enhanced capabilities',
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'google',
      description: 'Advanced model with 1M context window',
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'google',
      description: 'Fast and efficient for high-volume tasks',
    },
    {
      id: 'gemini-1.5-flash-8b',
      name: 'Gemini 1.5 Flash 8B',
      provider: 'google',
      description: 'Smaller, faster variant of Flash',
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'google',
      description: 'Versatile model for text generation',
    },
  ]

  return NextResponse.json({ models })
}