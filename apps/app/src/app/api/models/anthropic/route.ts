import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Anthropic API key not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform to our format
    const models = data.data.map((model: any) => ({
      id: model.id,
      name: model.display_name || model.id,
      provider: 'anthropic',
      description: `Created: ${model.created_at}`,
    }))

    return NextResponse.json({ models })
  } catch (error) {
    console.error('Error fetching Anthropic models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Anthropic models' },
      { status: 500 }
    )
  }
}