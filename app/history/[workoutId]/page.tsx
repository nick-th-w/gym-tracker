import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { estimate1RM } from '@/lib/recommendation'
import DeleteWorkoutButton from './DeleteWorkoutButton'
import WorkoutEditor from './WorkoutEditor'

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function WorkoutDetailPage({ params }: { params: { workoutId: string } }) {
  const supabase = await createClient()
  const { workoutId } = params

  const { data: workout } = await supabase
    .from('workouts').select('id, name, date, duration_minutes').eq('id', workoutId).single()

  if (!workout) return <div className="px-4 pt-8"><p className="text-secondary-text">Workout not found.</p></div>

  const { data: wes } = await supabase
    .from('workout_exercises')
    .select('id, exercise_id, order_index, exercises(name, muscle_groups)')
    .eq('workout_id', workoutId)
    .order('order_index')

  const weIds = (wes ?? []).map(we => we.id)
  const exerciseIds = (wes ?? []).map(we => we.exercise_id)

  const [{ data: allSets }, { data: ratings }, { data: histWERows }] = await Promise.all([
    weIds.length
      ? supabase.from('sets').select('id, workout_exercise_id, set_number, weight_kg, reps').in('workout_exercise_id', weIds).eq('completed', true).order('set_number')
      : { data: null },
    exerciseIds.length
      ? supabase.from('exercise_feedback').select('id, exercise_id, rating').eq('workout_id', workoutId)
      : { data: null },
    exerciseIds.length
      ? supabase.from('workout_exercises').select('id, exercise_id, workout_id').in('exercise_id', exerciseIds).neq('workout_id', workoutId)
      : { data: null },
  ])

  // Validate historical workouts are completed
  const histWorkoutIds = [...new Set((histWERows ?? []).map(we => we.workout_id))]
  const { data: histWorkoutsData } = histWorkoutIds.length
    ? await supabase.from('workouts').select('id').in('id', histWorkoutIds).eq('completed', true)
    : { data: null }

  const completedHistIds = new Set((histWorkoutsData ?? []).map(w => w.id))
  const validHistWEIds = (histWERows ?? []).filter(we => completedHistIds.has(we.workout_id)).map(we => we.id)

  const { data: histSets } = validHistWEIds.length
    ? await supabase.from('sets').select('workout_exercise_id, weight_kg, reps').in('workout_exercise_id', validHistWEIds).eq('completed', true)
    : { data: null }

  // Build maps
  const setsByWE: Record<string, { id: string; set_number: number; weight_kg: number; reps: number }[]> = {}
  for (const s of allSets ?? []) {
    (setsByWE[s.workout_exercise_id] ??= []).push(s)
  }

  const ratingByExercise: Record<string, number> = {}
  const ratingIdByExercise: Record<string, string> = {}
  for (const r of ratings ?? []) {
    ratingByExercise[r.exercise_id] = r.rating
    ratingIdByExercise[r.exercise_id] = r.id
  }

  const histWEToExercise: Record<string, string> = {}
  for (const we of histWERows ?? []) {
    if (completedHistIds.has(we.workout_id)) histWEToExercise[we.id] = we.exercise_id
  }

  const historicalMaxWeight: Record<string, number> = {}
  const historicalBest1RM: Record<string, number> = {}
  for (const s of histSets ?? []) {
    const exId = histWEToExercise[s.workout_exercise_id]
    if (!exId || !s.weight_kg || !s.reps) continue
    historicalMaxWeight[exId] = Math.max(historicalMaxWeight[exId] ?? 0, s.weight_kg)
    historicalBest1RM[exId] = Math.max(historicalBest1RM[exId] ?? 0, estimate1RM(s.weight_kg, s.reps))
  }

  const currentBest1RM: Record<string, number> = {}
  const currentMaxWeight: Record<string, number> = {}
  for (const we of wes ?? []) {
    const weSets = setsByWE[we.id] ?? []
    const weightedSets = weSets.filter(s => s.weight_kg > 0 && s.reps > 0)
    if (weightedSets.length) {
      currentBest1RM[we.exercise_id] = Math.max(...weightedSets.map(s => estimate1RM(s.weight_kg, s.reps)))
      currentMaxWeight[we.exercise_id] = Math.max(...weightedSets.map(s => s.weight_kg))
    }
  }

  function getPBStatus(exerciseId: string) {
    const cur1RM = currentBest1RM[exerciseId]
    if (cur1RM === undefined) return null // no weighted sets
    const prev1RM = historicalBest1RM[exerciseId]
    if (prev1RM === undefined) return 'new' as const
    if (cur1RM > prev1RM) return 'pb' as const
    const delta = (historicalMaxWeight[exerciseId] ?? 0) - (currentMaxWeight[exerciseId] ?? 0)
    return { delta }
  }

  const totalRating = (ratings ?? []).reduce((sum, r) => sum + r.rating, 0)
  const ratedCount = ratings?.length ?? 0
  const totalSets = allSets?.length ?? 0

  const editorExercises = (wes ?? []).map(we => {
    const ex = we.exercises as any
    const pbStatus = getPBStatus(we.exercise_id)
    return {
      weId: we.id,
      exerciseId: we.exercise_id,
      name: ex?.name ?? '',
      muscleGroups: (ex?.muscle_groups ?? []) as string[],
      rating: ratingByExercise[we.exercise_id] ?? null,
      ratingId: ratingIdByExercise[we.exercise_id] ?? null,
      pb: pbStatus === null ? 'none' as const : pbStatus === 'new' ? 'new' as const : pbStatus === 'pb' ? 'pb' as const : 'delta' as const,
      pbDelta: typeof pbStatus === 'object' && pbStatus !== null ? pbStatus.delta : undefined,
      sets: (setsByWE[we.id] ?? []).map(s => ({ id: s.id, set_number: s.set_number, weight_kg: s.weight_kg, reps: s.reps })),
    }
  })

  return (
    <div className="px-4 pt-8 pb-24">
      <Link href="/history" className="text-secondary-text text-sm mb-4 block">← History</Link>

      <WorkoutEditor
        workoutId={workoutId}
        initialName={workout.name ?? ''}
        initialDate={workout.date}
        exercises={editorExercises}
        formatDate={formatDate}
      >
        {/* Summary stats — sets, exercises, rating */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Exercises', value: wes?.length ?? 0 },
            { label: 'Sets done', value: totalSets },
            { label: 'Rating', value: ratedCount > 0 ? `${totalRating}/${ratedCount * 5}` : '—' },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-secondary-text text-xs mb-1">{stat.label}</p>
              <p className="text-white font-bold text-xl">{stat.value}</p>
            </div>
          ))}
        </div>
      </WorkoutEditor>

      <div className="flex justify-center mt-2">
        <DeleteWorkoutButton workoutId={workoutId} />
      </div>
    </div>
  )
}
