'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getRecommendation } from '@/lib/recommendation'
import type { GoalType, UserProfile } from '@/lib/types'

type SetLog = { set_number: number; weight_kg: number; reps: number; completed: boolean }
type PriorSet = { set_number: number; weight_kg: number; reps: number }
type Session = {
  weId: string; exerciseId: string; name: string; muscleGroups: string[]
  equipment: string; tips: string; videoUrl: string; targetSets: number; targetRepsMin: number
  targetRepsMax: number; goalType: GoalType; repsUnit: string
  priorSets: PriorSet[]; recWeight: number; recNote: string
  sets: SetLog[]; rated: boolean
}
type ExercisePick = {
  id: string; name: string; muscle_groups: string[]; equipment: string
  difficulty: string; tips: string; video_url: string | null; is_favourite: boolean
}

export default function ActiveWorkoutPage() {
  const { workoutId } = useParams<{ workoutId: string }>()
  const router = useRouter()

  const [sessions, setSessions] = useState<Session[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [idx, setIdx] = useState(0)
  const [startedAt] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [pendingFinish, setPendingFinish] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [tipsOpen, setTipsOpen] = useState(true)

  // Picker state
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerDifficulty, setPickerDifficulty] = useState<string | null>(null)
  const [pickerEquipment, setPickerEquipment] = useState<string | null>(null)
  const [pickerMuscle, setPickerMuscle] = useState<string | null>(null)
  const [pickerFavOnly, setPickerFavOnly] = useState(false)
  const [allExercises, setAllExercises] = useState<ExercisePick[] | null>(null)
  const [addingExercise, setAddingExercise] = useState(false)
  const [showNextOptions, setShowNextOptions] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startedAt])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      let loadedProfile: UserProfile | null = null
      if (user) {
        const { data: prof } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, sex, body_weight_kg, units, experience, primary_goal')
          .eq('user_id', user.id)
          .maybeSingle()
        loadedProfile = prof as UserProfile | null
        setProfile(loadedProfile)
      }

      const { data: wes } = await supabase
        .from('workout_exercises')
        .select('id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit, exercises(name, muscle_groups, equipment, tips, video_url)')
        .eq('workout_id', workoutId)
        .order('order_index')

      if (!wes?.length) {
        setLoading(false)
        return
      }

      const exerciseIds = wes.map(we => we.exercise_id)
      const weIds = wes.map(we => we.id)

      const [
        { data: pastWEs },
        { data: allRatings },
        { data: thisWorkoutFeedback },
        { data: existingSets },
      ] = await Promise.all([
        supabase.from('workout_exercises').select('id, exercise_id, workout_id').in('exercise_id', exerciseIds).neq('workout_id', workoutId).order('created_at', { ascending: false }).limit(100),
        supabase.from('exercise_feedback').select('exercise_id, rating').in('exercise_id', exerciseIds).order('created_at', { ascending: false }),
        // Which exercises are already rated in THIS workout
        supabase.from('exercise_feedback').select('exercise_id').eq('workout_id', workoutId),
        // Sets already logged for THIS workout's exercises
        supabase.from('sets').select('workout_exercise_id, set_number, weight_kg, reps, completed').in('workout_exercise_id', weIds).order('set_number'),
      ])

      const ratedExerciseIds = new Set((thisWorkoutFeedback ?? []).map(r => r.exercise_id))

      const existingSetsByWeId: Record<string, SetLog[]> = {}
      for (const s of existingSets ?? []) {
        if (s.weight_kg != null && s.reps != null) {
          (existingSetsByWeId[s.workout_exercise_id] ??= []).push({
            set_number: s.set_number,
            weight_kg: s.weight_kg,
            reps: s.reps,
            completed: s.completed ?? false,
          })
        }
      }

      const pastWorkoutIds = [...new Set((pastWEs ?? []).map(we => we.workout_id))]
      const { data: doneWkts } = pastWorkoutIds.length
        ? await supabase.from('workouts').select('id').in('id', pastWorkoutIds).eq('completed', true)
        : { data: null }

      const doneIds = new Set((doneWkts ?? []).map(w => w.id))
      const lastWEId: Record<string, string> = {}
      for (const we of pastWEs ?? []) {
        if (!lastWEId[we.exercise_id] && doneIds.has(we.workout_id)) lastWEId[we.exercise_id] = we.id
      }

      const priorWeIds = Object.values(lastWEId)
      const { data: priorSetsAll } = priorWeIds.length
        ? await supabase.from('sets').select('workout_exercise_id, set_number, weight_kg, reps').in('workout_exercise_id', priorWeIds).eq('completed', true).order('set_number')
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

      const builtSessions: Session[] = wes.map(we => {
        const ex = we.exercises as any
        const goalType = (we.goal_type ?? 'hypertrophy') as GoalType
        const repsMin = we.target_reps_min ?? 8
        const repsMax = we.target_reps_max ?? 10
        const priorSets = priorByWE[lastWEId[we.exercise_id]] ?? []
        const rec = getRecommendation(priorSets, lastRating[we.exercise_id] ?? null, repsMin, repsMax, goalType, ex?.name, loadedProfile)
        const rated = ratedExerciseIds.has(we.exercise_id)
        const savedSets = existingSetsByWeId[we.id]

        return {
          weId: we.id, exerciseId: we.exercise_id,
          name: ex?.name ?? '', muscleGroups: ex?.muscle_groups ?? [],
          equipment: ex?.equipment ?? '', tips: ex?.tips ?? '', videoUrl: ex?.video_url ?? '',
          targetSets: we.target_sets ?? 3, targetRepsMin: repsMin, targetRepsMax: repsMax,
          goalType, repsUnit: we.reps_unit ?? 'reps',
          priorSets, recWeight: rec.weight_kg, recNote: rec.note,
          sets: savedSets?.length
            ? savedSets
            : Array.from({ length: we.target_sets ?? 3 }, (_, i) => ({
                set_number: i + 1, weight_kg: rec.weight_kg, reps: repsMin, completed: false,
              })),
          rated,
        }
      })

      setSessions(builtSessions)

      // Resume at first unrated exercise, or stay at last if all done
      const firstUnrated = builtSessions.findIndex(s => !s.rated)
      setIdx(firstUnrated === -1 ? builtSessions.length - 1 : firstUnrated)

      setLoading(false)
    }
    load()
  }, [workoutId])

  async function openPicker() {
    setPickerOpen(true)
    setPickerSearch('')
    setPickerDifficulty(null)
    setPickerEquipment(null)
    setPickerMuscle(null)
    setPickerFavOnly(false)
    if (allExercises) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: exs }, { data: favRows }] = await Promise.all([
      supabase.from('exercises').select('id, name, muscle_groups, equipment, difficulty, tips, video_url').order('name'),
      user
        ? supabase.from('user_exercise_favourites').select('exercise_id').eq('user_id', user.id)
        : Promise.resolve({ data: null }),
    ])
    const favSet = new Set((favRows ?? []).map((f: { exercise_id: string }) => f.exercise_id))
    setAllExercises((exs ?? []).map(e => ({ ...e, is_favourite: favSet.has(e.id) })) as ExercisePick[])
  }

  async function addExercise(ex: ExercisePick) {
    setAddingExercise(true)
    const supabase = createClient()
    const orderIndex = sessions.length

    const { data: we } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: workoutId,
        exercise_id: ex.id,
        order_index: orderIndex,
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 10,
        goal_type: 'hypertrophy',
        reps_unit: 'reps',
      })
      .select('id').single()

    if (!we) { setAddingExercise(false); return }

    const { data: pastWEs } = await supabase
      .from('workout_exercises')
      .select('id, workout_id')
      .eq('exercise_id', ex.id)
      .neq('workout_id', workoutId)
      .order('created_at', { ascending: false })
      .limit(20)

    const pastWorkoutIds = [...new Set((pastWEs ?? []).map(w => w.workout_id))]
    const { data: doneWkts } = pastWorkoutIds.length
      ? await supabase.from('workouts').select('id').in('id', pastWorkoutIds).eq('completed', true)
      : { data: null }

    const doneIds = new Set((doneWkts ?? []).map(w => w.id))
    const lastWE = (pastWEs ?? []).find(w => doneIds.has(w.workout_id))
    const { data: priorSetsRaw } = lastWE
      ? await supabase.from('sets').select('set_number, weight_kg, reps').eq('workout_exercise_id', lastWE.id).eq('completed', true).order('set_number')
      : { data: null }

    const priorSets: PriorSet[] = (priorSetsRaw ?? []).filter(s => s.weight_kg != null && s.reps != null) as PriorSet[]

    const { data: lastRatingRow } = await supabase
      .from('exercise_feedback')
      .select('rating')
      .eq('exercise_id', ex.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const rec = getRecommendation(priorSets, lastRatingRow?.rating ?? null, 8, 10, 'hypertrophy', ex.name, profile)

    const newSession: Session = {
      weId: we.id,
      exerciseId: ex.id,
      name: ex.name,
      muscleGroups: ex.muscle_groups,
      equipment: ex.equipment,
      tips: ex.tips ?? '',
      videoUrl: ex.video_url ?? '',
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 10,
      goalType: 'hypertrophy',
      repsUnit: 'reps',
      priorSets,
      recWeight: rec.weight_kg,
      recNote: rec.note,
      sets: Array.from({ length: 3 }, (_, i) => ({
        set_number: i + 1, weight_kg: rec.weight_kg, reps: 8, completed: false,
      })),
      rated: false,
    }

    setSessions(prev => {
      const next = [...prev, newSession]
      setIdx(next.length - 1)
      return next
    })
    setPickerOpen(false)
    setAddingExercise(false)
  }

  const cur = sessions[idx]

  const workedMuscles = [...new Set(sessions.flatMap(s => s.muscleGroups))]
  const unworkedMuscles = allExercises
    ? [...new Set((allExercises ?? []).flatMap(e => e.muscle_groups))].filter(m => !workedMuscles.includes(m))
    : []

  const allEquipment = allExercises ? [...new Set(allExercises.map(e => e.equipment))].sort() : []
  const allMuscleOptions = allExercises ? [...new Set(allExercises.flatMap(e => e.muscle_groups))].sort() : []

  const pickerFiltered = (allExercises ?? []).filter(e => {
    if (pickerFavOnly && !e.is_favourite) return false
    if (pickerDifficulty && e.difficulty !== pickerDifficulty) return false
    if (pickerEquipment && e.equipment !== pickerEquipment) return false
    if (pickerMuscle && !e.muscle_groups.includes(pickerMuscle)) return false
    if (pickerSearch && !e.name.toLowerCase().includes(pickerSearch.toLowerCase())) return false
    return true
  })

  function updateSet(si: number, field: 'weight_kg' | 'reps', val: number) {
    setSessions(prev => prev.map((s, i) => i !== idx ? s : {
      ...s, sets: s.sets.map((set, j) => j !== si ? set : { ...set, [field]: val }),
    }))
  }

  async function toggleSet(si: number) {
    const session = sessions[idx]
    const set = session.sets[si]
    const nowCompleted = !set.completed

    setSessions(prev => prev.map((s, i) => i !== idx ? s : {
      ...s, sets: s.sets.map((set, j) => j !== si ? set : { ...set, completed: nowCompleted }),
    }))

    const supabase = createClient()
    if (nowCompleted) {
      await supabase.from('sets').upsert({
        workout_exercise_id: session.weId,
        set_number: set.set_number,
        weight_kg: set.weight_kg,
        reps: set.reps,
        completed: true,
      }, { onConflict: 'workout_exercise_id,set_number' })
    } else {
      await supabase.from('sets')
        .delete()
        .eq('workout_exercise_id', session.weId)
        .eq('set_number', set.set_number)
    }
  }

  function addSet() {
    if (!cur) return
    setSessions(prev => prev.map((s, i) => i !== idx ? s : {
      ...s, sets: [...s.sets, { set_number: s.sets.length + 1, weight_kg: cur.recWeight, reps: cur.targetRepsMin, completed: false }],
    }))
  }

  async function submitRating(rating: number) {
    const s = sessions[idx]
    const completedSets = s.sets.filter(set => set.completed)
    const supabase = createClient()

    await Promise.all([
      completedSets.length > 0
        ? supabase.from('sets').upsert(
            completedSets.map(set => ({
              workout_exercise_id: s.weId, set_number: set.set_number,
              weight_kg: set.weight_kg, reps: set.reps, completed: true,
            })),
            { onConflict: 'workout_exercise_id,set_number' }
          )
        : Promise.resolve(),
      supabase.from('exercise_feedback').insert({
        exercise_id: s.exerciseId, workout_id: workoutId, rating,
        ...(userId ? { user_id: userId } : {}),
      }),
    ])

    setSessions(prev => prev.map((s, i) => i !== idx ? s : { ...s, rated: true }))
    setShowRatingModal(false)

    if (pendingFinish) {
      setPendingFinish(false)
      await finishWorkout()
    } else if (idx < sessions.length - 1) {
      setIdx(i => i + 1)
    } else {
      setShowNextOptions(true)
    }
  }

  async function finishWorkout() {
    const supabase = createClient()
    await supabase.from('workouts')
      .update({ completed: true, duration_minutes: Math.round((Date.now() - startedAt) / 60000) })
      .eq('id', workoutId)
    setShowFinishModal(false)
    setCelebrating(true)
    setTimeout(() => router.push('/'), 2500)
  }

  function handleFinishTap() {
    if (sessions.length === 0 || cur?.rated) {
      finishWorkout()
      return
    }
    setShowFinishModal(false)
    setPendingFinish(true)
    setShowRatingModal(true)
  }

  if (loading) return <div className="px-4 pt-8"><p className="text-secondary-text">Loading workout...</p></div>

  if (celebrating) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center text-center px-6">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold text-white mb-2">Great work!</h1>
        <p className="text-secondary-text">Heading home...</p>
      </div>
    )
  }

  const header = (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-secondary-text text-sm">
          {sessions.length > 0 ? `${idx + 1} of ${sessions.length}` : 'Quick start'}
          <span className="ml-2">
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

      <div className="flex items-center justify-between mb-4">
        <button onClick={openPicker} className="text-rose-400 text-xs font-medium">
          + Add exercise
        </button>
        <button onClick={() => setShowFinishModal(true)} className="text-secondary-text text-xs underline underline-offset-2">
          Finish workout
        </button>
      </div>

      {workedMuscles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {workedMuscles.map(m => (
            <span key={m} className="bg-rose-600/15 text-rose-400 text-xs px-2.5 py-1 rounded-full">{m}</span>
          ))}
        </div>
      )}
    </div>
  )

  const picker = pickerOpen && (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setPickerOpen(false)}>
      <div className="bg-card w-full rounded-t-3xl p-5 pb-10 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4 shrink-0" />
        <h2 className="text-lg font-bold text-white mb-3 shrink-0">Add exercise</h2>

        {workedMuscles.length > 0 && unworkedMuscles.length > 0 && (
          <div className="mb-3 shrink-0">
            <p className="text-secondary-text text-xs mb-1.5">Not yet worked</p>
            <div className="flex flex-wrap gap-1.5">
              {unworkedMuscles.slice(0, 6).map(m => (
                <button
                  key={m}
                  onClick={() => setPickerSearch(m)}
                  className="bg-rose-600/15 text-rose-400 text-xs px-2.5 py-1 rounded-full"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        <input
          type="search"
          placeholder="Search exercises..."
          value={pickerSearch}
          onChange={e => setPickerSearch(e.target.value)}
          className="w-full bg-border text-white text-sm rounded-xl px-4 py-3 mb-3 placeholder:text-secondary-text shrink-0"
          autoFocus
        />

        <div className="flex gap-1.5 flex-wrap mb-2 shrink-0">
          <button
            onClick={() => setPickerFavOnly(f => !f)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${pickerFavOnly ? 'bg-primary text-white' : 'bg-border text-secondary-text'}`}
          >
            <svg viewBox="0 0 24 24" className={`w-3 h-3 ${pickerFavOnly ? 'fill-white' : 'fill-none stroke-current'}`} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            Favourites
          </button>
          {['beginner', 'intermediate', 'difficult'].map(d => (
            <button
              key={d}
              onClick={() => setPickerDifficulty(pickerDifficulty === d ? null : d)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${pickerDifficulty === d ? 'bg-success text-white' : 'bg-border text-secondary-text'}`}
            >
              {d}
            </button>
          ))}
        </div>

        {allEquipment.length > 0 && (
          <div className="mb-2 shrink-0">
            <p className="text-secondary-text text-xs mb-1.5">Equipment</p>
            <div className="flex gap-1.5 flex-wrap">
              {allEquipment.map(eq => (
                <button
                  key={eq}
                  onClick={() => setPickerEquipment(pickerEquipment === eq ? null : eq)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${pickerEquipment === eq ? 'bg-orange-500 text-white' : 'bg-border text-secondary-text'}`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>
        )}

        {allMuscleOptions.length > 0 && (
          <div className="mb-3 shrink-0">
            <p className="text-secondary-text text-xs mb-1.5">Body part</p>
            <div className="flex gap-1.5 flex-wrap">
              {allMuscleOptions.map(m => (
                <button
                  key={m}
                  onClick={() => setPickerMuscle(pickerMuscle === m ? null : m)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${pickerMuscle === m ? 'bg-orange-500 text-white' : workedMuscles.includes(m) ? 'bg-success/10 text-success' : 'bg-border text-secondary-text'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex flex-col gap-2">
          {allExercises === null && (
            <p className="text-secondary-text text-sm text-center py-6">Loading exercises...</p>
          )}
          {allExercises !== null && pickerFiltered.length === 0 && (
            <p className="text-secondary-text text-sm text-center py-6">No exercises match your filters.</p>
          )}
          {pickerFiltered.map(e => (
            <button
              key={e.id}
              onClick={() => !addingExercise && addExercise(e)}
              disabled={addingExercise}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-background text-left active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              <div>
                <p className="text-white text-sm font-medium">{e.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {e.muscle_groups.map(m => (
                    <span key={m} className={`text-xs px-1.5 py-0.5 rounded-full ${workedMuscles.includes(m) ? 'bg-success/10 text-success' : 'bg-primary/15 text-primary'}`}>{m}</span>
                  ))}
                  <span className="text-secondary-text text-xs">· {e.equipment}</span>
                </div>
              </div>
              {addingExercise ? (
                <span className="text-secondary-text text-xs shrink-0 ml-3">Adding...</span>
              ) : (
                <span className="text-rose-400 text-xl shrink-0 ml-3">+</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  if (!cur) {
    return (
      <div className="px-4 pt-8 pb-32">
        {header}

        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="w-16 h-16 bg-rose-600/15 rounded-2xl flex items-center justify-center mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-rose-400">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <h2 className="text-white font-semibold text-xl mb-2">No exercises yet</h2>
          <p className="text-secondary-text text-sm mb-8 leading-relaxed">
            Add your first exercise to get started. Pick anything — you can keep adding as you go.
          </p>
          <button
            onClick={openPicker}
            className="bg-rose-600 text-white font-semibold px-8 py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
          >
            + Add exercise
          </button>
        </div>

        {picker}

        {showFinishModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setShowFinishModal(false)}>
            <div className="bg-card w-full rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">End workout?</h2>
              <p className="text-secondary-text text-sm mb-8">No exercises recorded — your session will still be saved.</p>
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

  const isBodyweight = cur.equipment === 'Bodyweight' || cur.equipment === 'Resistance Band'

  return (
    <div className="px-4 pt-8 pb-32">
      {header}

      <h1 className="text-3xl font-bold text-white mb-1">{cur.name}</h1>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {cur.muscleGroups.map(m => (
          <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>
        ))}
      </div>

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
                {cur.videoUrl && (
                  <a href={cur.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs font-medium underline underline-offset-2 mt-1">
                    Watch technique video →
                  </a>
                )}
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

      <div className="fixed bottom-20 left-0 right-0 px-4">
        <button
          onClick={() => setShowRatingModal(true)}
          className="w-full bg-success active:scale-95 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
        >
          Complete Exercise
        </button>
      </div>

      {picker}

      {showNextOptions && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
          <div className="bg-card w-full rounded-t-3xl p-6 pb-12">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            <p className="text-success text-xs font-semibold uppercase tracking-wide text-center mb-1">Exercise done</p>
            <h2 className="text-2xl font-bold text-white text-center mb-8">What's next?</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setShowNextOptions(false); openPicker() }}
                className="w-full bg-rose-600 active:scale-95 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
              >
                + Add another exercise
              </button>
              <button
                onClick={() => { setShowNextOptions(false); finishWorkout() }}
                className="w-full bg-success active:scale-95 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
              >
                Finish workout
              </button>
            </div>
          </div>
        </div>
      )}

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

      {showFinishModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setShowFinishModal(false)}>
          <div className="bg-card w-full rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">End workout?</h2>
            <p className="text-secondary-text text-sm mb-8">
              {cur.rated ? 'Your progress will be saved.' : "You'll rate the current exercise first, then finish."}
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
