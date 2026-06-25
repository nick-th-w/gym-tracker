'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getRecommendation } from '@/lib/recommendation'
import type { GoalType } from '@/lib/types'

type SetLog = { set_number: number; weight_kg: number; reps: number; completed: boolean }
type PriorSet = { set_number: number; weight_kg: number; reps: number }
type Session = {
  weId: string; exerciseId: string; name: string; muscleGroups: string[]
  equipment: string; tips: string; videoUrl: string; targetSets: number; targetRepsMin: number
  targetRepsMax: number; goalType: GoalType; repsUnit: string
  priorSets: PriorSet[]; recWeight: number; recNote: string
  sets: SetLog[]; rated: boolean
}

export default function ActiveWorkoutPage() {
  const { workoutId } = useParams<{ workoutId: string }>()
  const router = useRouter()

  const [sessions, setSessions] = useState<Session[]>([])
  const [idx, setIdx] = useState(0)
  const [startedAt] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [pendingFinish, setPendingFinish] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [tipsOpen, setTipsOpen] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startedAt])

  useEffect(() => {
    async function load() {
      const { data: wes } = await supabase
        .from('workout_exercises')
        .select('id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit, exercises(name, muscle_groups, equipment, tips, video_url)')
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
        ? await supabase.from('sets').select('workout_exercise_id, set_number, weight_kg, reps').in('workout_exercise_id', weIds).eq('completed', true).order('set_number')
        : { data: null }

      const priorByWE: Record<string, PriorSet[]> = {}
      for (const s of priorSetsAll ?? []) {
        if (s.weight_kg != null && s.reps != null)
          (priorByWE[s.workout_exercise_id] ??= []).push({ set_number: s.set_number, weight_kg: s.weight_kg, reps: s.reps })
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
        const rec = getRecommendation(priorSets, lastRating[we.exercise_id] ?? null, repsMin, repsMax, goalType, ex?.name)

        return {
          weId: we.id, exerciseId: we.exercise_id,
          name: ex?.name ?? '', muscleGroups: ex?.muscle_groups ?? [],
          equipment: ex?.equipment ?? '', tips: ex?.tips ?? '', videoUrl: ex?.video_url ?? '',
          targetSets: we.target_sets ?? 3, targetRepsMin: repsMin, targetRepsMax: repsMax,
          goalType, repsUnit: we.reps_unit ?? 'reps',
          priorSets, recWeight: rec.weight_kg, recNote: rec.note,
          sets: Array.from({ length: we.target_sets ?? 3 }, (_, i) => ({
            set_number: i + 1, weight_kg: rec.weight_kg, reps: repsMin, completed: false,
          })),
          rated: false,
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
    const completedSets = s.sets.filter(set => set.completed)

    await Promise.all([
      completedSets.length > 0
        ? supabase.from('sets').insert(completedSets.map(set => ({
            workout_exercise_id: s.weId, set_number: set.set_number,
            weight_kg: set.weight_kg, reps: set.reps, completed: true,
          })))
        : Promise.resolve(),
      supabase.from('exercise_feedback').insert({ exercise_id: s.exerciseId, workout_id: workoutId, rating }),
    ])

    setSessions(prev => prev.map((s, i) => i !== idx ? s : { ...s, rated: true }))
    setShowRatingModal(false)

    if (pendingFinish) {
      setPendingFinish(false)
      await finishWorkout()
    } else if (idx < sessions.length - 1) {
      setIdx(i => i + 1)
    }
  }

  async function finishWorkout() {
    await supabase.from('workouts')
      .update({ completed: true, duration_minutes: Math.round((Date.now() - startedAt) / 60000) })
      .eq('id', workoutId)
    setShowFinishModal(false)
    setCelebrating(true)
    setTimeout(() => router.push('/'), 2500)
  }

  function handleFinishTap() {
    if (!cur.rated) {
      setShowFinishModal(false)
      setPendingFinish(true)
      setShowRatingModal(true)
    } else {
      finishWorkout()
    }
  }

  if (loading) return <div className="px-4 pt-8"><p className="text-secondary-text">Loading workout...</p></div>
  if (!cur) return null

  const isBodyweight = cur.equipment === 'Bodyweight' || cur.equipment === 'Resistance Band'

  if (celebrating) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center text-center px-6">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold text-white mb-2">Great work!</h1>
        <p className="text-secondary-text">Heading home...</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-8 pb-32">
      {/* Progress circles — ✓ when rated, clickable to jump */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-secondary-text text-sm">
          {idx + 1} of {sessions.length}
          <span className="ml-2 text-secondary-text">
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
          </span>
        </span>
        <div className="flex gap-1.5">
          {sessions.map((s, i) => (
            <button
              key={i}
              onClick={() => { setIdx(i); setShowRatingModal(false) }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all active:scale-90 border-2 ${
                s.rated
                  ? 'bg-success border-success text-white'
                  : i === idx
                    ? 'border-success bg-success/20 text-success'
                    : 'border-success/30 bg-transparent text-transparent'
              }`}
            >
              {s.rated ? '✓' : ''}
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => setShowFinishModal(true)} className="text-secondary-text text-xs text-right w-full mb-6 underline underline-offset-2">
        Finish workout
      </button>

      <h1 className="text-3xl font-bold text-white mb-1">{cur.name}</h1>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {cur.muscleGroups.map(m => (
          <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>
        ))}
      </div>
      {cur.tips && (() => {
        const [setup, technique, feel] = cur.tips.split('\n')
        return (
          <div className="bg-card border border-border rounded-xl p-4 mb-5 flex flex-col gap-3">
            {setup && (
              <div>
                <p className="text-success text-xs font-semibold uppercase tracking-wide mb-1">Setup</p>
                <p className="text-secondary-text text-xs leading-relaxed">{setup}</p>
              </div>
            )}
            {technique && (
              <div>
                <p className="text-success text-xs font-semibold uppercase tracking-wide mb-1">Technique</p>
                <p className="text-secondary-text text-xs leading-relaxed">{technique}</p>
              </div>
            )}
            {feel && (
              <div>
                <p className="text-success text-xs font-semibold uppercase tracking-wide mb-1">Feel it</p>
                <p className="text-secondary-text text-xs leading-relaxed">{feel}</p>
              </div>
            )}
            {cur.videoUrl && (
              <a
                href={cur.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-xs font-medium underline underline-offset-2 mt-1"
              >
                Watch technique video →
              </a>
            )}
          </div>
        )
      })()}

      {/* Sticky collapsible tips */}
      {cur.tips && (() => {
        const [setup, technique, feel] = cur.tips.split('\n')
        return (
          <div className="sticky top-0 z-10 mb-4">
            <button
              onClick={() => setTipsOpen(o => !o)}
              className="w-full flex items-center justify-between bg-card/95 backdrop-blur border border-border rounded-xl px-4 py-2.5"
            >
              <span className="text-success text-xs font-semibold uppercase tracking-wide">Technique tips</span>
              <span className="text-secondary-text text-xs">{tipsOpen ? '▲ hide' : '▼ show'}</span>
            </button>
            {tipsOpen && (
              <div className="bg-card/95 backdrop-blur border border-t-0 border-border rounded-b-xl px-4 pb-3 pt-2 flex flex-col gap-2">
                {setup && <p className="text-secondary-text text-xs leading-relaxed"><span className="text-success font-semibold">Setup: </span>{setup}</p>}
                {technique && <p className="text-secondary-text text-xs leading-relaxed"><span className="text-success font-semibold">Technique: </span>{technique}</p>}
                {feel && <p className="text-secondary-text text-xs leading-relaxed"><span className="text-success font-semibold">Feel it: </span>{feel}</p>}
              </div>
            )}
          </div>
        )
      })()}

      <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-5">
        <p className="text-primary text-xs font-medium uppercase tracking-wide mb-1">Today's target</p>
        <p className="text-white font-semibold">
          {isBodyweight ? 'Bodyweight' : `${cur.recWeight}kg`}
          {' × '}
          {cur.targetRepsMin === cur.targetRepsMax ? cur.targetRepsMin : `${cur.targetRepsMin}–${cur.targetRepsMax}`}
          {' '}{cur.repsUnit}
        </p>
        <p className="text-secondary-text text-xs mt-1">{cur.recNote}</p>
      </div>

      <div className="flex flex-col gap-3 mb-3">
        {cur.sets.map((set, i) => {
          const prior = cur.priorSets.find(p => p.set_number === set.set_number)
          return (
            <div key={i} className={`bg-card border rounded-xl p-4 transition-colors ${set.completed ? 'border-success/40 opacity-60' : 'border-border'}`}>
              <div className="flex items-end gap-3">
                <div className="w-10 shrink-0">
                  <span className="text-secondary-text text-sm">Set {set.set_number}</span>
                  {prior && (
                    <p className="text-secondary-text text-xs mt-0.5 leading-tight">{prior.weight_kg}kg×{prior.reps}</p>
                  )}
                </div>
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
          )
        })}
      </div>

      <button onClick={addSet} className="w-full border border-dashed border-border rounded-xl py-3 text-secondary-text text-sm mb-4">
        + Add set
      </button>

      {/* Complete Exercise — always visible */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <button
          onClick={() => setShowRatingModal(true)}
          className="w-full bg-success active:scale-95 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
        >
          Complete Exercise
        </button>
      </div>

      {/* Rating modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-card w-full rounded-t-3xl p-6 pb-10">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-1 text-center">{cur.name}</h2>
            <p className="text-secondary-text text-sm text-center mb-8">How hard was that?</p>
            <div className="grid grid-cols-5 gap-2">
              {(['Easy', 'OK', 'Right', 'Tough', 'Max'] as const).map((label, i) => (
                <button
                  key={i}
                  onClick={() => submitRating(i + 1)}
                  className="flex flex-col items-center gap-2 bg-border rounded-xl py-4 active:scale-95 transition-transform"
                >
                  <span className="text-2xl font-bold text-white">{i + 1}</span>
                  <span className="text-secondary-text text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Finish confirmation modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setShowFinishModal(false)}>
          <div className="bg-card w-full rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">End workout?</h2>
            <p className="text-secondary-text text-sm mb-8">
              {cur.rated ? 'Your progress will be saved.' : 'You\'ll rate the current exercise first, then finish.'}
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={handleFinishTap} className="w-full bg-success active:scale-95 text-white font-semibold py-4 rounded-2xl text-lg transition-all">
                Yes, finish
              </button>
              <button onClick={() => setShowFinishModal(false)} className="w-full bg-border active:scale-95 text-white font-semibold py-4 rounded-2xl text-lg transition-all">
                Keep going
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
