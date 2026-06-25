import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

type DetectConceptRequestBody = {
  userMessage?: unknown
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as DetectConceptRequestBody | null

  if (!body || typeof body.userMessage !== 'string' || !body.userMessage.trim()) {
    return NextResponse.json(
      { error: 'A non-empty userMessage is required.' },
      { status: 400 }
    )
  }

  const result = await generateText({
    model: anthropic('claude-sonnet-4-5'),
    system:
      'You extract the subject and concept from a learner message. If the message is not about studying a concept, return empty strings. Respond with ONLY valid JSON in this shape: {"subject":"","concept":""}.',
    prompt: body.userMessage.trim(),
  })

  const text = result.text.trim()
  let parsed: { subject?: unknown; concept?: unknown } | null = null

  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = null
  }

  if (
    !parsed ||
    typeof parsed.subject !== 'string' ||
    typeof parsed.concept !== 'string'
  ) {
    return NextResponse.json({ subject: '', concept: '' })
  }

  return NextResponse.json({
    subject: parsed.subject,
    concept: parsed.concept,
  })
}
