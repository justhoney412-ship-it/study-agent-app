import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase'

type ChatRequestBody = {
  userMessage?: unknown
  subject?: unknown
  concept?: unknown
}

type ConceptRow = {
  subject?: string | null
  concept?: string | null
  mastery_level?: string | null
  weak_areas?: string | null
  strong_areas?: string | null
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as ChatRequestBody | null

  if (!body || typeof body.userMessage !== 'string' || !body.userMessage.trim()) {
    return NextResponse.json(
      { error: 'A non-empty userMessage is required.' },
      { status: 400 }
    )
  }

  const userMessage = body.userMessage.trim()
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const concept = typeof body.concept === 'string' ? body.concept.trim() : ''

  let systemPrompt = `You are a patient and adaptive tutor. Explain the topic clearly, use supportive language, and tailor the response to the learner's needs.`

  const shouldLookup = Boolean(subject && concept)

  if (shouldLookup) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('concepts')
      .select('*')
      .eq('subject', subject)
      .eq('concept', concept)
      .maybeSingle<ConceptRow>()

    if (!error && data) {
      const masteryLevel = data.mastery_level?.trim()
      const weakAreas = data.weak_areas?.trim()
      const strongAreas = data.strong_areas?.trim()

      if (masteryLevel === 'Introduced' || masteryLevel === 'Developing') {
        systemPrompt = `You are a supportive tutor helping a learner who is still building understanding. Use a moderate pace, reference prior knowledge where it helps, acknowledge weak areas, and explain ideas in a way that feels approachable rather than overly technical.`
      } else if (masteryLevel === 'Proficient' || masteryLevel === 'Strong') {
        systemPrompt = `You are an expert tutor helping a learner with strong prior understanding. Avoid re-explaining basics unless necessary, focus on nuance, precision, and deeper insight, and keep the explanation concise and technically sharp.`
      } else {
        systemPrompt = `You are a patient and adaptive tutor. Explain the topic clearly, use supportive language, and tailor the response to the learner's needs.`
      }

      const contextParts: string[] = []
      if (weakAreas) {
        contextParts.push(`Weak areas to keep in mind: ${weakAreas}`)
      }
      if (strongAreas) {
        contextParts.push(`Strong areas to build on: ${strongAreas}`)
      }

      if (contextParts.length > 0) {
        systemPrompt += `\n\nLearner context:\n- ${contextParts.join('\n- ')}`
      }
    }
  }

  const result = streamText({
    model: anthropic('claude-sonnet-4-5")
    prompt: userMessage,
  })

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()

      try {
        for await (const chunk of result.textStream) {
          controller.enqueue(encoder.encode(chunk))
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
