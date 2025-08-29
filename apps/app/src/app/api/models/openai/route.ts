import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Filter for chat models and transform to our format
    const chatModels = data.data
      .filter((model: any) => 
        model.id.includes('gpt') || 
        model.id.includes('o1') || 
        model.id.includes('chatgpt')
      )
      .map((model: any) => ({
        id: model.id,
        name: model.id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        provider: 'openai',
        description: `Owned by: ${model.owned_by}`,
      }))
      .sort((a: any, b: any) => {
        // Sort to put latest models first
        const order = ['o1-preview', 'o1-mini', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
        const aIndex = order.findIndex(m => a.id.startsWith(m))
        const bIndex = order.findIndex(m => b.id.startsWith(m))
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
      })

    return NextResponse.json({ models: chatModels })
  } catch (error) {
    console.error('Error fetching OpenAI models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch OpenAI models' },
      { status: 500 }
    )
  }
}