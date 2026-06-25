'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { workoutColors } from '@/lib/workoutColors'

type Exercise = { id: string; name: string; muscle_groups: string[]; equipment: string; tips: string }
type TE = {
  id: string; exercise_id: string; order_index: number
  target_sets: number; target_reps_min: number; target_reps_max: number
  goal_type: string; reps_unit: string; exercises: Exercise
}
type Template = { id: string; name: string; description: string; estimated_duration_minutes: number; goals: string[]; focus?: string }

export default function WorkoutPreviewPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const router = useRouter()

  const [template, setTemplate] = useState<Template | null>(null)
  const [tes, setTes] = useState<TE[]>([])
  const [altMap, setAltMap] = useState<Record<string, Exercise[]>>({})
  const [swaps, setSwaps] = useState<Record<string, Exercise>>({})
  const [swapOpen, setSwapOpen] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: tmpl }, { data: teRows }, { data: allExs }] = await Promise.all([
        supabase.from('workout_templates').select('id, name, description, estimated_duration_minutes, goals, focus').eq('id', templateId).single(),
        supabase.from('template_exercises').select('id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit, exercises(id, name, muscle_groups, equipment, tips)').eq('template_id', templateId).order('order_index'),
        supabase.from('exercises').select('id, name, muscle_groups, equipment, tips'),
      ])
      if (!tmpl || !teRows) return
      setTemplate(tmpl as Template)
      setTes(teRows as unknown as TE[])

      const ids = teRows.map(te => te.exercise_id)
      const { data: links } = await supabase.from('exercise_alternatives').select('exercise_id, alternative_exercise_id').in('exercise_id', ids)

      // Build altMap from defined alternatives
      const map: Record<string, Exercise[]> = {}
      for (const l of links ?? []) {
        const ex = allExs?.find(e => e.id === l.alternative_exercise_id)
        if (ex) (map[l.exercise_id] ??= []).push(ex as Exercise)
      }

      // Fallback: for exercises with no defined alternatives, require same primary muscle
      // then sort by total overlap so the closest matches surface first
      for (const te of teRows) {
        if (!map[te.exercise_id]) {
          const mg = (te.exercises as Exercise)?.muscle_groups ?? []
          const primary = mg[0] ?? ''
          const fallbacks = (allExs ?? [])
            .filter(e => e.id !== te.exercise_id && primary && (e.muscle_groups as string[])?.includes(primary))
            .sort((a, b) => {
              const aScore = (a.muscle_groups as string[])?.filter(m => mg.includes(m)).length ?? 0
              const bScore = (b.muscle_groups as string[])?.filter(m => mg.includes(m)).length ?? 0
              return bScore - aScore
            })
            .slice(0, 4)
          if (fallbacks.length) map[te.exercise_id] = fallbacks as Exercise[]
        }
      }
      setAltMap(map)
    }
    load()
  }, [templateId])

  async function beginWorkout() {
    if (!template) return
    setStarting(true)
    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({ name: template.name, date: new Date().toISOString().split('T')[0] })
      .select('id').single()

    if (error || !workout) { setStarting(false); return }

    await supabase.from('workout_exercises').insert(
      tes.map(te => ({
        workout_id: workout.id,
        exercise_id: swaps[te.id]?.id ?? te.exercise_id,
        order_index: te.order_index,
        target_sets: te.target_sets,
        target_reps_min: te.target_reps_min,
        target_reps_max: te.target_reps_max,
        goal_type: te.goal_type,
        reps_unit: te.reps_unit,
      }))
    )
    router.push(`/workout/active/${workout.id}`)
  }

  const allMuscles = [...new Set(tes.flatMap(te => (swaps[te.id] ?? te.exercises)?.muscle_groups ?? []))]

  if (!template) return <div className="px-4 pt-8"><p className="text-secondary-text">Loading...</p></div>

  const colors = workoutColors(template.focus ?? template.name)

  return (
    <div className="px-4 pt-8 pb-32">
      <button onClick={() => router.back()} className="text-secondary-text text-sm mb-4 block">← Back</button>

      {/* Coloured header card */}
      <div className={`${colors.bg} ${colors.border} border rounded-2xl p-4 mb-6`}>
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-3xl font-bold text-white">{template.name}</h1>
          <span className="text-secondary-text text-sm mt-1 shrink-0 ml-2">~{template.estimated_duration_minutes} min</span>
        </div>
        <p className="text-secondary-text text-sm mb-3 leading-relaxed">{template.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {(template.goals ?? []).map(g => (
            <span key={g} className="bg-success/15 text-success text-xs px-2.5 py-1 rounded-full font-medium">{g}</span>
          ))}
        </div>
      </div>

      {/* Muscle coverage — orange */}
      <div className="bg-card border border-border rounded-xl p-3 mb-6">
        <p className="text-secondary-text text-xs uppercase tracking-wide mb-2">Muscles worked</p>
        <div className="flex flex-wrap gap-1.5">
          {allMuscles.map(m => (
            <span key={m} className="bg-primary/15 text-primary text-xs px-2.5 py-1 rounded-full">{m}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {tes.map(te => {
          const ex = swaps[te.id] ?? te.exercises
          const isOpen = swapOpen === te.id
          const alts = altMap[te.exercise_id] ?? []
          const repRange = te.target_reps_min === te.target_reps_max
            ? `${te.target_reps_min} ${te.reps_unit}`
            : `${te.target_reps_min}–${te.target_reps_max} ${te.reps_unit}`

          return (
            <div key={te.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{ex?.name}</p>
                    <p className="text-secondary-text text-xs mt-0.5">{te.target_sets} sets · {repRange} · {ex?.equipment}</p>
                    {/* Muscle tags — orange */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(ex?.muscle_groups ?? []).map(m => (
                        <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setSwapOpen(isOpen ? null : te.id)}
                    className="ml-3 text-primary text-xs font-medium shrink-0"
                  >
                    {isOpen ? 'Close' : 'Swap'}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border px-4 pb-3 pt-2">
                  <p className="text-secondary-text text-xs mb-2">Choose alternative</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => { setSwaps(s => { const n = { ...s }; delete n[te.id]; return n }); setSwapOpen(null) }}
                      className={`text-left px-3 py-2.5 rounded-lg text-sm ${!swaps[te.id] ? 'bg-primary/20 text-primary' : 'bg-border text-white'}`}
                    >
                      {te.exercises?.name} <span className="text-secondary-text text-xs">(default)</span>
                    </button>
                    {alts.map(alt => (
                      <button
                        key={alt.id}
                        onClick={() => { setSwaps(s => ({ ...s, [te.id]: alt })); setSwapOpen(null) }}
                        className={`text-left px-3 py-2.5 rounded-lg text-sm ${swaps[te.id]?.id === alt.id ? 'bg-primary/20 text-primary' : 'bg-border text-white'}`}
                      >
                        <span className="block">{alt.name} <span className="text-secondary-text text-xs">· {alt.equipment}</span></span>
                        <span className="flex flex-wrap gap-1 mt-1">
                          {(alt.muscle_groups ?? []).map(m => (
                            <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>
                          ))}
                        </span>
                      </button>
                    ))}
                    {alts.length === 0 && (
                      <p className="text-secondary-text text-xs px-3">No alternatives available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4">
        <button
          onClick={beginWorkout}
          disabled={starting}
          className="w-full bg-success hover:opacity-90 active:scale-95 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
        >
          {starting ? 'Starting...' : 'Begin Workout'}
        </button>
      </div>
    </div>
  )
}
