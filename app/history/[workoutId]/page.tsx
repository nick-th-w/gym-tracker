import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import DeleteWorkoutButton from './DeleteWorkoutButton'

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const RATING_LABEL: Record<number, { label: string; colour: string }> = {
  1: { label: 'Easy',  colour: 'text-success' },
  2: { label: 'OK',    colour: 'text-success' },
  3: { label: 'Right', colour: 'text-primary' },
  4: { label: 'Tough', colour: 'text-orange-400' },
  5: { label: 'Max',   colour: 'text-red-400' },
}

export default async function WorkoutDetailPage({ params }: { params: { workoutId: string } }) {
  const { workoutId } = params

  const { data: workout } = await supabase
    .from('workouts')
    .select('id, name, date, duration_minutes')
    .eq('id', workoutId)
    .single()

  if (!workout) return <div className="px-4 pt-8"><p className="text-secondary-text">Workout not found.</p></div>

  const { data: wes } = await supabase
    .from('workout_exercises')
    .select('id, exercise_id, order_index, exercises(name, muscle_groups)')
    .eq('workout_id', workoutId)
    .order('order_index')

  const weIds = (wes ?? []).map(we => we.id)
  const exerciseIds = (wes ?? []).map(we => we.exercise_id)

  const [{ data: allSets }, { data: ratings }] = await Promise.all([
    weIds.length
      ? supabase.from('sets').select('workout_exercise_id, set_number, weight_kg, reps').in('workout_exercise_id', weIds).eq('completed', true).order('set_number')
      : { data: null },
    exerciseIds.length
      ? supabase.from('exercise_feedback').select('exercise_id, rating').eq('workout_id', workoutId)
      : { data: null },
  ])

  const setsByWE: Record<string, { set_number: number; weight_kg: number; reps: number }[]> = {}
  for (const s of allSets ?? []) {
    (setsByWE[s.workout_exercise_id] ??= []).push(s)
  }

  const ratingByExercise: Record<string, number> = {}
  for (const r of ratings ?? []) {
    ratingByExercise[r.exercise_id] = r.rating
  }

  const totalSets = allSets?.length ?? 0
  const totalVolume = (allSets ?? []).reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)

  return (
    <div className="px-4 pt-8 pb-24">
      <Link href="/history" className="text-secondary-text text-sm mb-4 block">← History</Link>

      <h1 className="text-3xl font-bold text-white mb-1">{workout.name}</h1>
      <p className="text-secondary-text text-sm mb-6">{formatDate(workout.date)}</p>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Duration', value: `${workout.duration_minutes ?? 0}m` },
          { label: 'Sets',     value: totalSets },
          { label: 'Volume',   value: totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${Math.round(totalVolume)}kg` },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-secondary-text text-xs mb-1">{stat.label}</p>
            <p className="text-white font-bold text-xl">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Exercise breakdown */}
      <div className="flex flex-col gap-3 mb-8">
        {(wes ?? []).map(we => {
          const ex = we.exercises as any
          const sets = setsByWE[we.id] ?? []
          const rating = ratingByExercise[we.exercise_id]
          const ratingMeta = rating ? RATING_LABEL[rating] : null

          return (
            <div key={we.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white font-semibold">{ex?.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(ex?.muscle_groups ?? []).map((m: string) => (
                      <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
                {ratingMeta && (
                  <span className={`text-xs font-medium shrink-0 ml-2 ${ratingMeta.colour}`}>
                    {ratingMeta.label} {rating}/5
                  </span>
                )}
              </div>

              {sets.length > 0 ? (
                <div className="flex flex-col gap-1 mt-3">
                  {sets.map(s => (
                    <div key={s.set_number} className="flex items-center gap-2">
                      <span className="text-secondary-text text-xs w-10">Set {s.set_number}</span>
                      <span className="text-white text-sm font-medium">
                        {s.weight_kg > 0 ? `${s.weight_kg}kg × ${s.reps}` : `${s.reps} reps`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary-text text-xs mt-2">No sets recorded</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-center">
        <DeleteWorkoutButton workoutId={workoutId} />
      </div>
    </div>
  )
}
