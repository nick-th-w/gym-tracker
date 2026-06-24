import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function WorkoutCompletePage({ params }: { params: { workoutId: string } }) {
  const { data: workout } = await supabase
    .from('workouts').select('name, duration_minutes').eq('id', params.workoutId).single()

  const { data: wes } = await supabase
    .from('workout_exercises').select('id, exercises(name)').eq('workout_id', params.workoutId)

  const weIds = (wes ?? []).map(we => we.id)
  const { data: allSets } = weIds.length
    ? await supabase.from('sets').select('workout_exercise_id, weight_kg, reps').in('workout_exercise_id', weIds).eq('completed', true)
    : { data: [] }

  const totalVolume = (allSets ?? []).reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)

  return (
    <div className="px-4 pt-12 flex flex-col items-center text-center min-h-[calc(100vh-5rem)]">
      <h1 className="text-4xl font-bold text-white mb-1">Done.</h1>
      <p className="text-secondary-text mb-8">{workout?.name}</p>

      <div className="w-full grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Duration', value: `${workout?.duration_minutes ?? 0}m` },
          { label: 'Sets', value: allSets?.length ?? 0 },
          { label: 'Volume', value: `${(totalVolume / 1000).toFixed(1)}t` },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-secondary-text text-xs mb-1">{stat.label}</p>
            <p className="text-white font-bold text-xl">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="w-full bg-card border border-border rounded-xl p-4 mb-8 text-left">
        <p className="text-secondary-text text-xs uppercase tracking-wide mb-3">Exercises</p>
        {(wes ?? []).map(we => (
          <div key={we.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
            <span className="text-white text-sm">{(we.exercises as any)?.name}</span>
            <span className="text-secondary-text text-xs">
              {allSets?.filter(s => s.workout_exercise_id === we.id).length ?? 0} sets
            </span>
          </div>
        ))}
      </div>

      <Link href="/" className="w-full bg-success text-white font-semibold py-4 rounded-2xl text-lg text-center block">
        Back to home
      </Link>
    </div>
  )
}
