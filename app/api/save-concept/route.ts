import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase'

type SaveConceptRequestBody = {
  subject?: unknown
  concept?: unknown
  masteryLevel?: unknown
  overviewGist?: unknown
  deepDiveGist?: unknown
  strongAreas?: unknown
  weakAreas?: unknown
  nextSteps?: unknown
  notes?: unknown
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SaveConceptRequestBody | null

  if (
    !body ||
    typeof body.subject !== 'string' ||
    !body.subject.trim() ||
    typeof body.concept !== 'string' ||
    !body.concept.trim()
  ) {
    return NextResponse.json(
      { error: 'subject and concept are required.' },
      { status: 400 }
    )
  }

  const supabase = createClient()

  const payload = {
    subject: body.subject.trim(),
    concept: body.concept.trim(),
    mastery_level: typeof body.masteryLevel === 'string' ? body.masteryLevel : null,
    overview_gist: typeof body.overviewGist === 'string' ? body.overviewGist : null,
    deep_dive_gist: Array.isArray(body.deepDiveGist)
      ? body.deepDiveGist.filter((item): item is string => typeof item === 'string')
      : [],
    strong_areas: Array.isArray(body.strongAreas)
      ? body.strongAreas.filter((item): item is string => typeof item === 'string')
      : [],
    weak_areas: Array.isArray(body.weakAreas)
      ? body.weakAreas.filter((item): item is string => typeof item === 'string')
      : [],
    next_steps: Array.isArray(body.nextSteps)
      ? body.nextSteps.filter((item): item is string => typeof item === 'string')
      : [],
    notes: typeof body.notes === 'string' ? body.notes : null,
    last_updated: new Date().toISOString(),
  }

  const { error } = await supabase.from('concepts').upsert(payload, {
    onConflict: 'subject,concept',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
