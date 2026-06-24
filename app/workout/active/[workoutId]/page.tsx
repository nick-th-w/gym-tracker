'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getRecommendation } from '@/lib/recommendation'
import type { GoalType } from '@/lib/types'

type SetLog = { set_number: number; weight_kg: number; reps: number; completed: boolean }
type Session = {
  weId: string; exerciseId: string; name: string; muscleGroups: string[]
  equipment: string; tips: string; targetSets: number; targetRepsMin: number
  targetRepsMax: number; goalType: GoalType; repsUnit: string
  priorSets: { weight_kg: number; reps: number }[]
  recWeight: number; recNote: string; sets: SetLog[]
}

export default function ActiveWorkoutPage() {
  const { workoutId } = useParams<{ workoutId: string }>()
  const router = useRouter()

  const [sessions, setSessions] = useState<Session[]>([])
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'exercise' | 'rating'>('exercise')
  const [startedAt] = useState(Date.now())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: wes } = await supabase
        .from('workout_exercises')
        .select('id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit, exercises(name, muscle_groups, equipment, tips)')
        .eq('workout_id', workoutId)
        .order('order_index')

      if (!wes?.length) return

      const exerciseIds = wes.map(we => we.exercise_id)

      const [{ data: pastWEs }, { data: allRatings }] = await Promise.all([
        supabase.from('workout_exercises').select('id, exercise_id, workout_id').in('exercise_id', exerciseIds).neq('workout_id', workoutId).order('created_at', { ascending: false }).limit(100),
        supabase.from('exercise_feedback').select('exercise_id, rating').in('exercise_id', exerciseIds).order('created_at', { ascending: false }),
      ])

      const pastWorkoutIds = [...new Set((pastWEs ?? []).map(we => we.workout_id))]
      const { data: doneWkts } = pastWorkoutIds.length
        ? await supabase.from('workouts').select('id').in('id', pastWorkoutIds).eq('completed', true)
        : { data: null }

      const doneIds = new Set((doneWkts ?? []).map(w => w.id))
      const lastWEId: Record<string, string> = {}
      for (const we of pastWEs ?? []) {
        if (!lastWEId[we.exercise_id] && doneIds.has(we.workout_id)) lastWEId[we.exercise_id] = we.id
      }

      const weIds = Object.values(lastWEId)
      const { data: priorSetsAll } = weIds.length
        ? await supabase.from('sets').select('workout_exercise_id, weight_kg, reps').in('workout_exercise_id', weIds).eq('completed', true)
        : { data: null }

      const priorByWE: Record<string, { weight_kg: number; reps: number }[]> = {}
      for (const s of priorSetsAll ?? []) {
        if (s.weight_kg != null && s.reps != null)
          (priorByWE[s.workout_exercise_id] ??= []).push({ weight_kg: s.weight_kg, reps: s.reps })
      }

      const lastRating: Record<string, number> = {}
      for (const r of allRatings ?? []) {
        if (!(r.exercise_id in lastRating)) lastRating[r.exercise_id] = r.rating
      }

      setSessions(wes.map(we => {
        const ex = we.exercises as any
        const goalType = (we.goal_type ?? 'hypertrophy') as GoalType
        const repsMin = we.target_reps_min ?? 8
        const repsMax = we.target_reps_max ?? 10
        const priorSets = priorByWE[lastWEId[we.exercise_id]] ?? []
        const rec = getRecommendation(priorSets, lastRating[we.exercise_id] ?? null, repsMin, repsMax, goalType)

        return {
          weId: we.id, exerciseId: we.exercise_id,
          name: ex?.name ?? '', muscleGroups: ex?.muscle_groups ?? [],
          equipment: ex?.equipment ?? '', tips: ex?.tips ?? '',
          targetSets: we.target_sets ?? 3, targetRepsMin: repsMin, targetRepsMax: repsMax,
          goalType, repsUnit: we.reps_unit ?? 'reps',
          priorSets, recWeight: rec.weight_kg, recNote: rec.note,
          sets: Array.from({ length: we.target_sets ?? 3 }, (_, i) => ({
            set_number: i + 1, weight_kg: rec.weight_kg, reps: repsMin, completed: false,
          })),
        }
      }))
      setLoading(false)
    }
    load()
  }, [workoutId])

  const cur = sessions[idx]

  function updateSet(si: number, field: 'weight_kg' | 'reps', val: number) {
    setSessions(prev => prev.map((s, i) => i !== idx ? s : {
      ...s, sets: s.sets.map((set, j) => j !== si ? set : { ...set, [field]: val }),
    }))
  }

  function toggleSet(si: number) {
    setSessions(prev => prev.map((s, i) => i !== idx ? s : {
      ...s, sets: s.sets.map((set, j) => j !== si ? set : { ...set, completed: !set.completed }),
    }))
  }

  function addSet() {
    setSessions(prev => prev.map((s, i) => i !== idx ? s : {
      ...s, sets: [...s.sets, { set_number: s.sets.length + 1, weight_kg: cur.recWeight, reps: cur.targetRepsMin, completed: false }],
    }))
  }

  async function submitRating(rating: number) {
    const s = sessions[idx]
    await Promise.all([
      supabase.from('sets').insert(
        s.sets.filter(set => set.completed).map(set => ({
          workout_exercise_id: s.weId, set_number: set.set_number,
          weight_kg: set.weight_kg, reps: set.reps, completed: true,
        }))
      ),
      supabase.from('exercise_feedback').insert({ exercise_id: s.exerciseId, workout_id: workoutId, rating }),
    ])

    if (idx < sessions.length - 1) {
      setIdx(i => i + 1)
      setPhase('exercise')
    } else {
      await supabase.from('workouts')
        .update({ completed: true, duration_minutes: Math.round((Date.now() - startedAt) / 60000) })
        .eq('id', workoutId)
      router.push(`/workout/complete/${workoutId}`)
    }
  }

  if (loading) return <div className="px-4 pt-8"><p className="text-secondary-text">Loading workout...</p></div>
  if (!cur) return null

  const allDone = cur.sets.every(s => s.completed)
  const isBodyweight = cur.equipment === 'Bodyweight'

  if (phase === 'rating') {
    return (
      <div className="px-4 pt-12 flex flex-col min-h-[calc(100vh-5rem)]">
        <p className="text-secondary-text text-sm mb-2 text-center">{idx + 1} of {sessions.length}</p>
        <h2 className="text-2xl font-bold text-white mb-1 text-center">{cur.name}</h2>
        <p className="text-secondary-text text-sm text-center mb-12">How hard was that?</p>
        <div className="grid grid-cols-5 gap-2">
          {(['Easy', 'OK', 'Right', 'Tough', 'Max'] as const).map((label, i) => (
            <button
              key={i}
              onClick={() => submitRating(i + 1)}
              className="flex flex-col items-center gap-2 bg-card border border-border rounded-xl py-5 active:scale-95 transition-transform"
            >
              <span className="text-2xl font-bold text-white">{i + 1}</span>
              <span className="text-secondary-text text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-8 pb-28">
      <div className="flex items-center justify-between mb-6">
        <span className="text-secondary-text text-sm">{idx + 1} of {sessions.length}</span>
        <div className="flex gap-1">
          {sessions.map((_, i) => (
            <div key={i} className={`h-1.5 w-6 rounded-full ${i < idx ? 'bg-success' : i === idx ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
      </div>

      <h1 className="text-3xl font-bold text-white mb-1">{cur.name}</h1>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {cur.muscleGroups.map(m => (
          <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>
        ))}
      </div>
      {cur.tips && <p className="text-secondary-text text-xs italic mb-5">{cur.tips}</p>}

      <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-4">
        <p className="text-primary text-xs font-medium uppercase tracking-wide mb-1">Today's target</p>
        <p className="text-white font-semibold">
          {isBodyweight ? 'Bodyweight' : `${cur.recWeight}kg`}
          {' × '}
          {cur.targetRepsMin === cur.targetRepsMax ? cur.targetRepsMin : `${cur.targetRepsMin}–${cur.targetRepsMax}`}
          {' '}{cur.repsUnit}
        </p>
        <p className="text-secondary-text text-xs mt-1">{cur.recNote}</p>
      </div>

      {cur.priorSets.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-3 mb-5">
          <p className="text-secondary-text text-xs uppercase tracking-wide mb-2">Last session</p>
          <p className="text-white text-sm">{cur.priorSets.map(s => `${s.weight_kg}kg×${s.reps}`).join(', ')}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-3">
        {cur.sets.map((set, i) => (
          <div key={i} className={`bg-card border rounded-xl p-4 transition-colors ${set.completed ? 'border-success/40 opacity-60' : 'border-border'}`}>
            <div className="flex items-end gap-3">
              <span className="text-secondary-text text-sm pb-2.5 w-10 shrink-0">Set {set.set_number}</span>
              <div className="flex-1">
                <p className="text-secondary-text text-xs mb-1">kg</p>
                <input
                  type="number" inputMode="decimal"
                  value={set.weight_kg || ''}
                  onChange={e => updateSet(i, 'weight_kg', parseFloat(e.target.value) || 0)}
                  disabled={set.completed || isBodyweight}
                  className="w-full bg-border text-white text-center rounded-lg py-2.5 text-lg font-semibold disabled:opacity-40"
                />
              </div>
              <span className="text-secondary-text pb-2.5">×</span>
              <div className="flex-1">
                <p className="text-secondary-text text-xs mb-1">{cur.repsUnit}</p>
                <input
                  type="number" inputMode="numeric"
                  value={set.reps || ''}
                  onChange={e => updateSet(i, 'reps', parseInt(e.target.value) || 0)}
                  disabled={set.completed}
                  className="w-full bg-border text-white text-center rounded-lg py-2.5 text-lg font-semibold disabled:opacity-40"
                />
              </div>
              <button
                onClick={() => toggleSet(i)}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${set.completed ? 'bg-success border-success text-white' : 'border-border'}`}
              >
                {set.completed ? '✓' : ''}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addSet} className="w-full border border-dashed border-border rounded-xl py-3 text-secondary-text text-sm mb-4">
        + Add set
      </button>

      {allDone && (
        <div className="fixed bottom-20 left-0 right-0 px-4">
          <button
            onClick={() => setPhase('rating')}
            className="w-full bg-success active:scale-95 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
          >
            {idx < sessions.length - 1 ? 'Rate & Next Exercise' : 'Rate & Finish'}
          </button>
        </div>
      )}
    </div>
  )
}
