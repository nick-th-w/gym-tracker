'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { workoutColors } from '@/lib/workoutColors'

type Template = {
  id: string
  name: string
  description: string
  focus: string
  estimated_duration_minutes: number
  goals: string[]
}

type SavedWorkout = {
  id: string
  name: string
  date: string
  exercise_names: string[]
}

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

type Tab = 'quickstart' | 'templates' | 'saved'

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function WorkoutTabs({
  standardTemplates,
  savedTemplates,
  savedWorkouts,
  recommendedName,
}: {
  standardTemplates: Template[]
  savedTemplates: Template[]
  savedWorkouts: SavedWorkout[]
  recommendedName: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('quickstart')
  const [starting, setStarting] = useState(false)

  async function quickStart() {
    setStarting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStarting(false); return }

    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    const label = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const name = `Freestyle · ${label}`

    const { data: workout } = await supabase
      .from('workouts')
      .insert({ name, date: dateStr, user_id: user.id })
      .select('id').single()

    if (!workout) { setStarting(false); return }
    router.push(`/workout/active/${workout.id}`)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'quickstart', label: 'Quick Start' },
    { key: 'templates', label: 'Templates' },
    { key: 'saved', label: 'Saved' },
  ]

  return (
    <div>
      {/* Tab nav */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-sm py-2 rounded-lg font-medium transition-colors ${
              tab === t.key
                ? 'bg-orange-500 text-white'
                : 'text-secondary-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Quick start tab */}
      {tab === 'quickstart' && (
        <div className="flex flex-col gap-4">
          <button
            onClick={quickStart}
            disabled={starting}
            className="flex items-center gap-4 bg-rose-600 rounded-2xl p-5 active:scale-[0.98] transition-transform disabled:opacity-60 text-left w-full"
          >
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-lg leading-tight">
                {starting ? 'Starting...' : 'Jump in now'}
              </p>
              <p className="text-white/65 text-sm mt-0.5">Build your workout as you go</p>
            </div>
            <span className="text-white/70 text-xl">›</span>
          </button>

          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-secondary-text text-xs mb-2">How it works</p>
            <div className="flex flex-col gap-2">
              {[
                'Tap Jump in — a session starts immediately',
                'Add exercises one at a time as you move around the gym',
                'See muscles worked update live as you add more',
              ].map((tip, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-rose-500 font-semibold text-sm shrink-0">{i + 1}.</span>
                  <p className="text-secondary-text text-sm leading-snug">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Templates tab */}
      {tab === 'templates' && (
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

          {savedTemplates.length > 0 && (
            <div className="mt-2">
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

          <div className="mt-1">
            <Link
              href="/workout/custom"
              className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-2xl p-4 text-secondary-text text-sm active:scale-[0.98] transition-transform hover:border-rose-500/50 hover:text-rose-400"
            >
              <span className="text-xl font-light">+</span>
              <span>Build a custom workout</span>
            </Link>
          </div>
        </div>
      )}

      {/* Saved tab */}
      {tab === 'saved' && (
        <div className="flex flex-col gap-3">
          {savedWorkouts.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-white font-semibold mb-1">No saved workouts yet</p>
              <p className="text-secondary-text text-sm leading-relaxed">
                After completing a workout, open it from History and tap <span className="text-white">Save workout</span> to add it here.
              </p>
            </div>
          ) : (
            savedWorkouts.map(w => (
              <Link
                key={w.id}
                href={`/workout/repeat/${w.id}`}
                className="bg-card border border-border rounded-2xl p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between mb-1">
                  <h2 className="text-white font-semibold">{w.name}</h2>
                  <span className="text-secondary-text text-xs shrink-0 ml-2">{formatDate(w.date)}</span>
                </div>
                {w.exercise_names.length > 0 && (
                  <p className="text-secondary-text text-xs leading-relaxed">
                    {w.exercise_names.slice(0, 4).join(' · ')}{w.exercise_names.length > 4 ? ` +${w.exercise_names.length - 4}` : ''}
                  </p>
                )}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
