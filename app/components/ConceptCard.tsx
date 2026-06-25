'use client'

import { useState } from 'react'

type ConceptCardProps = {
  subject: string
  concept: string
  masteryLevel: string | null
  overviewGist: string | null
  deepDiveGist: string[]
  strongAreas: string[]
  weakAreas: string[]
  nextSteps: string[]
  lastUpdated: string | null
}

const subjectStyles: Record<string, string> = {
  Physics: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
  Biology: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  Mathematics: 'bg-violet-500/15 text-violet-300 ring-violet-400/30',
  'Computer Science': 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  Chemistry: 'bg-rose-500/15 text-rose-300 ring-rose-400/30',
}

function getSubjectStyle(subject: string) {
  return subjectStyles[subject] ?? 'bg-zinc-800/70 text-zinc-300 ring-zinc-700'
}

function getMasteryBadge(level: string | null) {
  switch (level) {
    case 'Strong':
      return 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30'
    case 'Proficient':
      return 'bg-blue-500/15 text-blue-300 ring-blue-400/30'
    case 'Developing':
      return 'bg-amber-500/15 text-amber-300 ring-amber-400/30'
    case 'Introduced':
      return 'bg-zinc-700/80 text-zinc-300 ring-zinc-600'
    default:
      return 'bg-slate-500/15 text-slate-300 ring-slate-400/30'
  }
}

function getProgressPercent(level: string | null) {
  switch (level) {
    case 'Strong':
      return 100
    case 'Proficient':
      return 75
    case 'Developing':
      return 50
    case 'Introduced':
      return 25
    default:
      return 0
  }
}

export function ConceptCard({
  subject,
  concept,
  masteryLevel,
  overviewGist,
  deepDiveGist,
  strongAreas,
  weakAreas,
  nextSteps,
  lastUpdated,
}: ConceptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <button
      type="button"
      onClick={() => setIsExpanded((value) => !value)}
      className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-left shadow-sm transition hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${getSubjectStyle(subject)}`}>
            {subject}
          </span>
          <h3 className="text-base font-semibold text-zinc-100">{concept}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${getMasteryBadge(masteryLevel)}`}>
          {masteryLevel ?? 'In Progress'}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
          <span>Progress</span>
          <span>{getProgressPercent(masteryLevel)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
            style={{ width: `${getProgressPercent(masteryLevel)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-400">
        <p className="max-w-2xl text-sm text-zinc-400">{overviewGist || 'No overview captured yet.'}</p>
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Not saved'}
        </span>
      </div>

      {isExpanded && (
        <div className="mt-5 space-y-4 border-t border-zinc-800 pt-4 text-sm text-zinc-300">
          {strongAreas.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Strong areas</h4>
              <div className="flex flex-wrap gap-2">
                {strongAreas.map((area) => (
                  <span key={area} className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {weakAreas.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">Weak areas</h4>
              <div className="flex flex-wrap gap-2">
                {weakAreas.map((area) => (
                  <span key={area} className="rounded-full bg-rose-500/15 px-2.5 py-1 text-xs text-rose-300">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {nextSteps.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">Next steps</h4>
              <div className="flex flex-wrap gap-2">
                {nextSteps.map((step) => (
                  <span key={step} className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs text-sky-300">
                    {step}
                  </span>
                ))}
              </div>
            </div>
          )}

          {deepDiveGist.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Deep dive</h4>
              <ul className="list-disc space-y-1 pl-5 text-zinc-400">
                {deepDiveGist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </button>
  )
}
