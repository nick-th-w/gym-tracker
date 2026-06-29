'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { workoutColors } from '@/lib/workoutColors'

const ALL_EQUIPMENT = ['Barbell', 'Dumbbell', 'Cable Machine', 'Machine', 'Bodyweight', 'Resistance Band']

type Exercise = {
  id: string; name: string; muscle_groups: string[]; equipment: string
  tips: string; difficulty: string; is_favourite: boolean; gif_url: string | null
}
type TE = {
  id: string; exercise_id: string; order_index: number
  target_sets: number; target_reps_min: number; target_reps_max: number
  goal_type: string; reps_unit: string; exercises: Exercise
}
type Template = { id: string; name: string; description: string; estimated_duration_minutes: number; goals: string[]; focus?: string }

const DIFF_COLOUR: Record<string, string> = {
  beginner:     'text-success',
  intermediate: 'text-primary',
  difficult:    'text-red-400',
}

export default function WorkoutPreviewPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const router = useRouter()

  const [template, setTemplate] = useState<Template | null>(null)
  const [tes, setTes] = useState<TE[]>([])
  const [allExs, setAllExs] = useState<Exercise[]>([])
  const [swaps, setSwaps] = useState<Record<string, Exercise>>({})
  const [swapOpen, setSwapOpen] = useState<string | null>(null)
  const [swapSearch, setSwapSearch] = useState('')
  const [swapDifficulty, setSwapDifficulty] = useState<string | null>(null)
  const [swapFavOnly, setSwapFavOnly] = useState(false)
  const [swapPreview, setSwapPreview] = useState<Exercise | null>(null)
  const [starting, setStarting] = useState(false)

  // Equipment modal
  const [showEquipmentModal, setShowEquipmentModal] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set(ALL_EQUIPMENT))

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const [{ data: tmpl }, { data: teRows }, { data: exs }, { data: favRows }] = await Promise.all([
        supabase.from('workout_templates').select('id, name, description, estimated_duration_minutes, goals, focus').eq('id', templateId).single(),
        supabase.from('template_exercises').select('id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit, exercises(id, name, muscle_groups, equipment, tips, difficulty, gif_url)').eq('template_id', templateId).order('order_index'),
        supabase.from('exercises').select('id, name, muscle_groups, equipment, difficulty, gif_url').order('name'),
        user
          ? supabase.from('user_exercise_favourites').select('exercise_id').eq('user_id', user.id)
          : Promise.resolve({ data: null }),
      ])
      if (!tmpl || !teRows) return

      const favSet = new Set((favRows ?? []).map((f: { exercise_id: string }) => f.exercise_id))
      const exsWithFav = (exs ?? []).map(e => ({ ...e, is_favourite: favSet.has(e.id) }))

      setTemplate(tmpl as Template)
      setTes(teRows as unknown as TE[])
      setAllExs(exsWithFav as Exercise[])
    }
    load()
  }, [templateId])

  function toggleEquipment(e: string) {
    setSelectedEquipment(prev => {
      const next = new Set<string>(Array.from(prev))
      if (next.has(e)) next.delete(e)
      else next.add(e)
      return next
    })
  }

  // Reset swap filters when opening a new slot
  function openSwap(teId: string) {
    setSwapOpen(swapOpen === teId ? null : teId)
    setSwapSearch('')
    setSwapDifficulty(null)
    setSwapFavOnly(false)
    setSwapPreview(null)
  }

  function getSwapOptions(te: TE): Exercise[] {
    const currentEx = swaps[te.id] ?? te.exercises
    const primaryMuscle = (currentEx?.muscle_groups ?? [])[0]
    return allExs
      .filter(e => {
        if (e.id === (swaps[te.id]?.id ?? te.exercise_id)) return false
        if (primaryMuscle && !(e.muscle_groups).includes(primaryMuscle)) return false
        if (swapFavOnly && !e.is_favourite) return false
        if (swapDifficulty && e.difficulty !== swapDifficulty) return false
        if (swapSearch && !e.name.toLowerCase().includes(swapSearch.toLowerCase())) return false
        return true
      })
      .slice(0, 25)
  }

  async function beginWorkout(equipment: Set<string>) {
    if (!template) return
    setStarting(true)
    setShowEquipmentModal(false)

    // Auto-swap default exercises that need unavailable equipment (manual swaps are preserved)
    const finalSwaps = { ...swaps }
    for (const te of tes) {
      if (finalSwaps[te.id]) continue // user already swapped this slot manually
      const ex = te.exercises
      if (ex && !equipment.has(ex.equipment)) {
        const primaryMuscle = ex.muscle_groups[0]
        const alt = allExs.find(a =>
          a.id !== te.exercise_id &&
          equipment.has(a.equipment) &&
          a.muscle_groups.includes(primaryMuscle)
        )
        if (alt) finalSwaps[te.id] = alt
      }
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStarting(false); return }

    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({ name: template.name, date: new Date().toISOString().split('T')[0], user_id: user.id })
      .select('id').single()
    if (error || !workout) { setStarting(false); return }

    await supabase.from('workout_exercises').insert(
      tes.map(te => ({
        workout_id: workout.id,
        exercise_id: finalSwaps[te.id]?.id ?? te.exercise_id,
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
          const repRange = te.target_reps_min === te.target_reps_max
            ? `${te.target_reps_min} ${te.reps_unit}`
            : `${te.target_reps_min}–${te.target_reps_max} ${te.reps_unit}`
          const swapOptions = isOpen ? getSwapOptions(te) : []

          return (
            <div key={te.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{ex?.name}</p>
                    <p className="text-secondary-text text-xs mt-0.5">{te.target_sets} sets · {repRange} · {ex?.equipment}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(ex?.muscle_groups ?? []).map(m => (
                        <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => openSwap(te.id)} className="ml-3 text-primary text-xs font-medium shrink-0">
                    {isOpen ? 'Close' : 'Swap'}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <div className="flex gap-2 mb-3">
                    <input
                      type="search"
                      placeholder="Search exercises..."
                      value={swapSearch}
                      onChange={e => { setSwapSearch(e.target.value); setSwapPreview(null) }}
                      className="flex-1 bg-border text-white text-xs rounded-lg px-3 py-2 placeholder:text-secondary-text"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    <button
                      onClick={() => setSwapFavOnly(f => !f)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${swapFavOnly ? 'bg-primary text-white' : 'bg-border text-secondary-text'}`}
                    >
                      <svg viewBox="0 0 24 24" className={`w-3 h-3 ${swapFavOnly ? 'fill-white' : 'fill-none stroke-current'}`} strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                      Favourites
                    </button>
                    {['beginner', 'intermediate', 'difficult'].map(d => (
                      <button
                        key={d}
                        onClick={() => { setSwapDifficulty(swapDifficulty === d ? null : d); setSwapPreview(null) }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${swapDifficulty === d ? 'bg-success text-white' : 'bg-border text-secondary-text'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  {swapPreview && (
                    <div className="bg-background border border-border rounded-xl p-3 mb-3">
                      {swapPreview.gif_url && (() => {
                        const f1 = swapPreview.gif_url as string
                        const f2 = f1.replace(/\/0\.(\w+)$/, '/1.$1')
                        return (
                          <div className="relative w-full rounded-lg mb-3 overflow-hidden bg-card">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={f1} alt={swapPreview.name} className="w-full h-auto block" style={{ animation: 'show-a 2.4s ease-in-out infinite' }} />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={f2} alt={swapPreview.name} className="absolute inset-0 w-full h-full object-contain" style={{ animation: 'show-b 2.4s ease-in-out infinite' }} />
                          </div>
                        )
                      })()}
                      <p className="text-white font-semibold text-sm mb-1">{swapPreview.name}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {swapPreview.muscle_groups.map(m => (
                          <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>
                        ))}
                        <span className={`text-xs font-medium capitalize ${DIFF_COLOUR[swapPreview.difficulty] ?? ''}`}>· {swapPreview.difficulty}</span>
                      </div>
                      <button
                        onClick={() => { setSwaps(s => ({ ...s, [te.id]: swapPreview })); setSwapOpen(null); setSwapPreview(null) }}
                        className="w-full bg-success text-white text-sm font-semibold py-2.5 rounded-xl"
                      >
                        Swap to {swapPreview.name}
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => { setSwaps(s => { const n = { ...s }; delete n[te.id]; return n }); setSwapOpen(null); setSwapPreview(null) }}
                      className={`text-left px-3 py-2.5 rounded-lg text-sm ${!swaps[te.id] ? 'bg-primary/20 text-primary' : 'bg-border text-white'}`}
                    >
                      {te.exercises?.name} <span className="text-secondary-text text-xs">(current)</span>
                    </button>
                    {swapOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setSwapPreview(swapPreview?.id === opt.id ? null : opt)}
                        className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${swapPreview?.id === opt.id ? 'bg-success/20 border border-success/40 text-white' : 'bg-border text-white'}`}
                      >
                        <span className="block">{opt.name}</span>
                        <span className="flex gap-1.5 mt-1 flex-wrap">
                          {opt.muscle_groups.map(m => <span key={m} className="bg-primary/15 text-primary text-xs px-1.5 py-0.5 rounded-full">{m}</span>)}
                          <span className={`text-xs capitalize ${DIFF_COLOUR[opt.difficulty] ?? ''}`}>· {opt.difficulty}</span>
                          {opt.is_favourite && <span className="text-primary text-xs">♥</span>}
                        </span>
                      </button>
                    ))}
                    {swapOptions.length === 0 && (
                      <p className="text-secondary-text text-xs px-3 py-2">No exercises match your filters.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Begin Workout button */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <button
          onClick={() => setShowEquipmentModal(true)}
          disabled={starting}
          className="w-full bg-success hover:opacity-90 active:scale-95 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
        >
          {starting ? 'Starting...' : 'Begin Workout'}
        </button>
      </div>

      {/* Equipment selection modal */}
      {showEquipmentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setShowEquipmentModal(false)}>
          <div className="bg-card w-full rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-1">What equipment do you have?</h2>
            <p className="text-secondary-text text-sm mb-6">We'll swap out anything you don't have access to.</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {ALL_EQUIPMENT.map(e => (
                <button
                  key={e}
                  onClick={() => toggleEquipment(e)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedEquipment.has(e)
                      ? 'bg-success text-white'
                      : 'bg-border text-secondary-text'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <button
              onClick={() => beginWorkout(selectedEquipment)}
              disabled={selectedEquipment.size === 0}
              className="w-full bg-success active:scale-95 disabled:opacity-40 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
            >
              Start Workout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
