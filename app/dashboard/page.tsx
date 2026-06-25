import { ConceptCard } from '@/app/components/ConceptCard'
import { NavBar } from '@/app/components/NavBar'
import { createClient } from '@/lib/supabase'

type ConceptRecord = {
  subject: string | null
  concept: string | null
  mastery_level: string | null
  overview_gist: string | null
  deep_dive_gist: string[] | null
  strong_areas: string[] | null
  weak_areas: string[] | null
  next_steps: string[] | null
  last_updated: string | null
}

function getMasteryScore(level: string | null) {
  switch (level) {
    case 'Strong':
      return 4
    case 'Proficient':
      return 3
    case 'Developing':
      return 2
    case 'Introduced':
      return 1
    case 'In Progress':
      return 0
    default:
      return 0
  }
}

function getAveragePercent(concepts: ConceptRecord[]) {
  if (concepts.length === 0) {
    return 0
  }

  const total = concepts.reduce((sum, concept) => sum + getMasteryScore(concept.mastery_level), 0)
  return Math.round((total / (concepts.length * 4)) * 100)
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data, error } = await supabase.from('concepts').select('*').order('last_updated', { ascending: false })
  const concepts = (data ?? []) as ConceptRecord[]

  const totalConcepts = concepts.length
  const uniqueSubjects = new Set(concepts.map((concept) => concept.subject ?? '')).size
  const averagePercent = getAveragePercent(concepts)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <NavBar />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/20">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-400">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold">Your concept study tracker</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Review your saved learning progress, see how you are improving across subjects, and pick up where you left off.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
            <p className="text-sm text-zinc-400">Total concepts studied</p>
            <p className="mt-2 text-3xl font-semibold">{error ? '—' : totalConcepts}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
            <p className="text-sm text-zinc-400">Unique subjects</p>
            <p className="mt-2 text-3xl font-semibold">{error ? '—' : uniqueSubjects}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
            <p className="text-sm text-zinc-400">Average mastery</p>
            <p className="mt-2 text-3xl font-semibold">{error ? '—' : `${averagePercent}%`}</p>
          </div>
        </section>

        <section className="space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-800/50 bg-red-950/40 p-4 text-sm text-red-300">
              Unable to load concepts right now.
            </div>
          )}

          {!error && concepts.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-sm text-zinc-400">
              No concepts have been saved yet. Start a chat and save your progress to populate this dashboard.
            </div>
          )}

          {!error && concepts.map((concept) => (
            <ConceptCard
              key={`${concept.subject}-${concept.concept}`}
              subject={concept.subject ?? 'General'}
              concept={concept.concept ?? 'Untitled concept'}
              masteryLevel={concept.mastery_level}
              overviewGist={concept.overview_gist}
              deepDiveGist={concept.deep_dive_gist ?? []}
              strongAreas={concept.strong_areas ?? []}
              weakAreas={concept.weak_areas ?? []}
              nextSteps={concept.next_steps ?? []}
              lastUpdated={concept.last_updated}
            />
          ))}
        </section>
      </main>
    </div>
  )
}
