import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { workoutColors } from '@/lib/workoutColors'

export const revalidate = 0

const MUSCLE_MAP: Record<string, string[]> = {
  full_body_a:    ['Chest', 'Back', 'Legs', 'Shoulders', 'Core'],
  full_body_b:    ['Back', 'Hamstrings', 'Chest', 'Core'],
  upper:          ['Chest', 'Back', 'Shoulders', 'Arms'],
  lower:          ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  recovery:       ['Core', 'Mobility', 'Full Body'],
  back_biceps:    ['Back', 'Lats', 'Biceps'],
  chest_triceps:  ['Chest', 'Shoulders', 'Triceps'],
  shoulders_arms: ['Shoulders', 'Biceps', 'Triceps'],
  legs_glutes:    ['Quads', 'Glutes', 'Hamstrings', 'Calves'],
  core_mobility:  ['Core', 'Hip Flexors', 'Stability'],
}

// What to do after each session type
const NEXT_SESSION: Record<string, string> = {
  'Full Body A':     'Full Body B',
  'Full Body B':     'Back & Biceps',
  'Back & Biceps':   'Chest & Triceps',
  'Chest & Triceps': 'Shoulders & Arms',
  'Shoulders & Arms':'Legs & Glutes',
  'Legs & Glutes':   'Core & Mobility',
  'Core & Mobility': 'Full Body A',
  'Upper Body':      'Lower Body',
  'Lower Body':      'Full Body A',
  'Active Recovery': 'Full Body A',
}

export default async function ChooseWorkoutPage() {
  const supabase = await createClient()
  const [{ data: allTemplates }, { data: lastWorkout }] = await Promise.all([
    supabase.from('workout_templates').select('id, name, description, focus, estimated_duration_minutes, goals').order('created_at'),
    supabase.from('workouts').select('name').eq('completed', true).order('date', { ascending: false }).limit(1).maybeSingle(),
  ])

  // Fall back to Full Body A if no history or last workout name not in the map
  const recommendedName = lastWorkout
    ? (NEXT_SESSION[lastWorkout.name] ?? 'Full Body A')
    : 'Full Body A'

  const standardTemplates = (allTemplates ?? []).filter(t => t.focus !== 'custom_saved')
  const savedTemplates    = (allTemplates ?? []).filter(t => t.focus === 'custom_saved')

  return (
    <div className="px-4 pt-8 pb-6">
      <h1 className="text-3xl font-bold text-white mb-1">Choose your session</h1>
      {lastWorkout ? (
        <p className="text-secondary-text text-sm mb-6">Last session: <span className="text-white">{lastWorkout.name}</span></p>
      ) : (
        <p className="text-secondary-text text-sm mb-6">What are we hitting today?</p>
      )}

      {/* Standard templates */}
      <div className="flex flex-col gap-3">
        {standardTemplates.map(t => {
          const colors = workoutColors(t.focus)
          const isRecommended = t.name === recommendedName
          return (
            <Link
              key={t.id}
              href={`/workout/${t.id}`}
              className={`${colors.bg} ${colors.border} border rounded-2xl p-4 active:scale-[0.98] transition-transform relative`}
            >
              {isRecommended && (
                <span className="absolute top-3 right-3 bg-success text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  Recommended
                </span>
              )}
              <div className="flex items-start justify-between mb-1 pr-28">
                <h2 className="text-white font-semibold text-lg">{t.name}</h2>
                <span className="text-secondary-text text-sm shrink-0 ml-2">~{t.estimated_duration_minutes} min</span>
              </div>
              <p className="text-secondary-text text-sm mb-3 leading-relaxed">{t.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {(t.goals ?? []).map((g: string) => (
                  <span key={g} className="bg-success/15 text-success text-xs px-2.5 py-1 rounded-full font-medium">{g}</span>
                ))}
                {(MUSCLE_MAP[t.focus] ?? []).filter((m: string) => !(t.goals ?? []).includes(m)).map((m: string) => (
                  <span key={m} className="bg-primary/15 text-primary text-xs px-2.5 py-1 rounded-full">{m}</span>
                ))}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Saved custom workouts */}
      {savedTemplates.length > 0 && (
        <div className="mt-6">
          <p className="text-secondary-text text-xs uppercase tracking-wide mb-3">Saved custom workouts</p>
          <div className="flex flex-col gap-3">
            {savedTemplates.map(t => {
              const colors = workoutColors('custom_saved')
              return (
                <Link
                  key={t.id}
                  href={`/workout/${t.id}`}
                  className={`${colors.bg} ${colors.border} border rounded-2xl p-4 active:scale-[0.98] transition-transform`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h2 className="text-white font-semibold">{t.name}</h2>
                    <span className="text-secondary-text text-sm shrink-0 ml-2">~{t.estimated_duration_minutes ?? 35} min</span>
                  </div>
                  <p className="text-secondary-text text-xs">Custom · {(t.goals ?? []).join(', ')}</p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Custom builder */}
      <div className="mt-4">
        <Link
          href="/workout/custom"
          className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-2xl p-4 text-secondary-text text-sm active:scale-[0.98] transition-transform hover:border-rose-500/50 hover:text-rose-400"
        >
          <span className="text-xl font-light">+</span>
          <span>Build a custom workout</span>
        </Link>
      </div>
    </div>
  )
}
