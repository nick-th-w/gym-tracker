import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { estimate1RM } from '@/lib/recommendation'

function parseDateParts(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return {
    day: d,
    month: date.toLocaleDateString('en-GB', { month: 'short' }),
    weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }),
  }
}

export default async function HistoryPage() {
  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, name, date, duration_minutes')
    .eq('completed', true)
    .order('date', { ascending: false })

  if (!workouts?.length) {
    return (
      <div className="px-4 pt-8 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <p className="text-white font-semibold text-xl mb-2">No workouts yet</p>
        <p className="text-secondary-text text-sm">Complete your first session to see your history here.</p>
      </div>
    )
  }

  const workoutIds = workouts.map(w => w.id)

  const [{ data: wes }, { data: allRatings }] = await Promise.all([
    supabase.from('workout_exercises').select('id, workout_id, exercise_id, exercises(muscle_groups)').in('workout_id', workoutIds),
    supabase.from('exercise_feedback').select('workout_id, rating').in('workout_id', workoutIds),
  ])

  const weIds = (wes ?? []).map(we => we.id)
  const { data: allSets } = weIds.length
    ? await supabase.from('sets').select('workout_exercise_id, weight_kg, reps').in('workout_exercise_id', weIds).eq('completed', true)
    : { data: null }

  // Build lookup maps
  const wesByWorkout: Record<string, typeof wes> = {}
  const musclesByWorkout: Record<string, string[]> = {}
  const countByWorkout: Record<string, number> = {}

  for (const we of wes ?? []) {
    ;(wesByWorkout[we.workout_id] ??= []).push(we)
    countByWorkout[we.workout_id] = (countByWorkout[we.workout_id] ?? 0) + 1
    const muscles: string[] = (we.exercises as any)?.muscle_groups ?? []
    musclesByWorkout[we.workout_id] = [...new Set([...(musclesByWorkout[we.workout_id] ?? []), ...muscles])]
  }

  const setsByWE: Record<string, { weight_kg: number; reps: number }[]> = {}
  for (const s of allSets ?? []) {
    if (s.weight_kg != null && s.reps != null)
      (setsByWE[s.workout_exercise_id] ??= []).push({ weight_kg: s.weight_kg, reps: s.reps })
  }

  const ratingByWorkout: Record<string, number> = {}
  for (const r of allRatings ?? []) {
    ratingByWorkout[r.workout_id] = (ratingByWorkout[r.workout_id] ?? 0) + r.rating
  }

  // Compute PB/NEW per workout (process in date order)
  const sortedByDate = [...workouts].sort((a, b) => a.date.localeCompare(b.date))
  const runningBest: Record<string, number> = {}
  const pbNewByWorkout: Record<string, { newCount: number; pbCount: number }> = {}

  for (const w of sortedByDate) {
    let newCount = 0, pbCount = 0
    for (const we of wesByWorkout[w.id] ?? []) {
      const weSets = setsByWE[we.id] ?? []
      if (!weSets.length) continue
      const cur1RM = Math.max(...weSets.map(s => estimate1RM(s.weight_kg, s.reps)))
      const prev = runningBest[we.exercise_id]
      if (prev === undefined) newCount++
      else if (cur1RM > prev) pbCount++
      runningBest[we.exercise_id] = Math.max(runningBest[we.exercise_id] ?? 0, cur1RM)
    }
    pbNewByWorkout[w.id] = { newCount, pbCount }
  }

  return (
    <div className="px-4 pt-8 pb-6">
      <h1 className="text-3xl font-bold text-white mb-1">History</h1>
      <p className="text-secondary-text text-sm mb-6">{workouts.length} session{workouts.length !== 1 ? 's' : ''} completed</p>

      <div className="flex flex-col gap-3">
        {workouts.map(w => {
          const { day, month, weekday } = parseDateParts(w.date)
          const muscles = musclesByWorkout[w.id] ?? []
          const exCount = countByWorkout[w.id] ?? 0
          const totalRating = ratingByWorkout[w.id] ?? 0
          const { newCount, pbCount } = pbNewByWorkout[w.id] ?? { newCount: 0, pbCount: 0 }

          return (
            <Link key={w.id} href={`/history/${w.id}`} className="flex gap-3 active:scale-[0.98] transition-transform">

              {/* Date card — small square */}
              <div className="bg-card border border-border rounded-2xl p-3 w-[72px] shrink-0 flex flex-col items-center justify-center text-center">
                <p className="text-white font-bold text-2xl leading-none">{day}</p>
                <p className="text-primary text-xs font-medium mt-1">{month}</p>
                <p className="text-secondary-text text-xs">{weekday}</p>
              </div>

              {/* Info card — wider */}
              <div className="bg-card border border-border rounded-2xl p-4 flex-1 min-w-0">
                <p className="text-white font-semibold text-base leading-tight mb-1">{w.name}</p>
                <p className="text-secondary-text text-xs mb-2">
                  {exCount} exercises{totalRating > 0 ? ` · Rating: ${totalRating}` : ''}
                </p>

                <div className="flex flex-wrap gap-1 mb-2">
                  {muscles.map(m => (
                    <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>
                  ))}
                </div>

                {(newCount > 0 || pbCount > 0) && (
                  <div className="flex gap-2 mt-2">
                    {newCount > 0 && (
                      <span className="bg-primary text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                        NEW ×{newCount}
                      </span>
                    )}
                    {pbCount > 0 && (
                      <span className="bg-success text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                        PB ×{pbCount}
                      </span>
                    )}
                  </div>
                )}
              </div>

            </Link>
          )
        })}
      </div>
    </div>
  )
}
