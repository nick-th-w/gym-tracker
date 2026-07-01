import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RepeatWorkoutPage({ params }: { params: { workoutId: string } }) {
  const supabase = await createClient()
  const { workoutId } = params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: source } = await supabase
    .from('workouts')
    .select('name')
    .eq('id', workoutId)
    .single()

  if (!source) redirect('/workout')

  const { data: wes } = await supabase
    .from('workout_exercises')
    .select('exercise_id, order_index, target_sets, target_reps_min, target_reps_max, goal_type, reps_unit')
    .eq('workout_id', workoutId)
    .order('order_index')

  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  const label = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const name = source.name ?? `Freestyle · ${label}`

  const { data: newWorkout } = await supabase
    .from('workouts')
    .insert({ name, date: dateStr, user_id: user.id })
    .select('id').single()

  if (!newWorkout) redirect('/workout')

  if (wes?.length) {
    await supabase.from('workout_exercises').insert(
      wes.map(we => ({
        workout_id: newWorkout.id,
        exercise_id: we.exercise_id,
        order_index: we.order_index,
        target_sets: we.target_sets,
        target_reps_min: we.target_reps_min,
        target_reps_max: we.target_reps_max,
        goal_type: we.goal_type,
        reps_unit: we.reps_unit,
      }))
    )
  }

  redirect(`/workout/active/${newWorkout.id}`)
}
