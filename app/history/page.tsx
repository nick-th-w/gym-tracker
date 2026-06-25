import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function formatDate(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatVolume(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)}kg`
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
  const { data: wes } = await supabase
    .from('workout_exercises')
    .select('id, workout_id, exercises(muscle_groups)')
    .in('workout_id', workoutIds)

  const weIds = (wes ?? []).map(we => we.id)
  const { data: allSets } = weIds.length
    ? await supabase.from('sets').select('workout_exercise_id, weight_kg, reps').in('workout_exercise_id', weIds).eq('completed', true)
    : { data: null }

  // Build lookup maps
  const weToWorkout: Record<string, string> = {}
  const countByWorkout: Record<string, number> = {}
  const musclesByWorkout: Record<string, string[]> = {}

  for (const we of wes ?? []) {
    weToWorkout[we.id] = we.workout_id
    countByWorkout[we.workout_id] = (countByWorkout[we.workout_id] ?? 0) + 1
    const muscles: string[] = (we.exercises as any)?.muscle_groups ?? []
    musclesByWorkout[we.workout_id] = [...new Set([...(musclesByWorkout[we.workout_id] ?? []), ...muscles])]
  }

  const volumeByWorkout: Record<string, number> = {}
  for (const s of allSets ?? []) {
    const wid = weToWorkout[s.workout_exercise_id]
    if (wid) volumeByWorkout[wid] = (volumeByWorkout[wid] ?? 0) + (s.weight_kg ?? 0) * (s.reps ?? 0)
  }

  return (
    <div className="px-4 pt-8 pb-6">
      <h1 className="text-3xl font-bold text-white mb-1">History</h1>
      <p className="text-secondary-text text-sm mb-6">{workouts.length} session{workouts.length !== 1 ? 's' : ''} completed</p>

      <div className="flex flex-col gap-3">
        {workouts.map(w => {
          const muscles = musclesByWorkout[w.id] ?? []
          const volume = volumeByWorkout[w.id] ?? 0
          const exCount = countByWorkout[w.id] ?? 0

          return (
            <Link
              key={w.id}
              href={`/history/${w.id}`}
              className="bg-card border border-border rounded-2xl p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-white font-semibold text-lg">{w.name}</h2>
                <span className="text-secondary-text text-sm shrink-0 ml-2">{formatDate(w.date)}</span>
              </div>

              <div className="flex gap-3 mb-3">
                <span className="text-secondary-text text-xs">{w.duration_minutes ?? 0} min</span>
                <span className="text-secondary-text text-xs">·</span>
                <span className="text-secondary-text text-xs">{exCount} exercises</span>
                <span className="text-secondary-text text-xs">·</span>
                <span className="text-secondary-text text-xs">{formatVolume(volume)}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {muscles.map(m => (
                  <span key={m} className="bg-primary/15 text-primary text-xs px-2.5 py-1 rounded-full">{m}</span>
                ))}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
