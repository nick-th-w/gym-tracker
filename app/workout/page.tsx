import { createClient } from '@/lib/supabase/server'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import WorkoutTabs from './WorkoutTabs'

const getCachedTemplates = unstable_cache(
  async () => {
    const supabase = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('workout_templates')
      .select('id, name, description, focus, estimated_duration_minutes, goals')
      .order('created_at')
    return data ?? []
  },
  ['workout-templates'],
  { revalidate: 3600 }
)

const NEXT_SESSION: Record<string, string> = {
  'Full Body A':     'Full Body B',
  'Full Body B':     'Back & Biceps',
  'Back & Biceps':   'Chest & Triceps',
  'Chest & Triceps': 'Shoulders & Arms',
  'Shoulders & Arms':'Legs & Glutes',
  'Legs & Glutes':   'Core & Mobility',
  'Core & Mobility': 'Full Body A',
  'Upper Body':      'Lower Body',
  'Lower Body':      'Full Body A',
  'Active Recovery': 'Full Body A',
}

export default async function ChooseWorkoutPage() {
  const supabase = await createClient()
  const [allTemplates, { data: { user } }, { data: lastWorkout }] = await Promise.all([
    getCachedTemplates(),
    supabase.auth.getUser(),
    supabase.from('workouts').select('name').eq('completed', true).order('date', { ascending: false }).limit(1).maybeSingle(),
  ])

  const recommendedName = lastWorkout
    ? (NEXT_SESSION[lastWorkout.name] ?? 'Full Body A')
    : 'Full Body A'

  const standardTemplates = (allTemplates ?? []).filter(t => t.focus !== 'custom_saved')
  const savedTemplates    = (allTemplates ?? []).filter(t => t.focus === 'custom_saved')

  // Fetch user's saved workouts with exercise names
  type SavedWorkout = { id: string; name: string; date: string; exercise_names: string[] }
  let savedWorkouts: SavedWorkout[] = []
  if (user) {
    const { data: rawSaved } = await supabase
      .from('workouts')
      .select('id, name, date')
      .eq('user_id', user.id)
      .eq('is_saved', true)
      .eq('completed', true)
      .order('date', { ascending: false })

    if (rawSaved?.length) {
      const ids = rawSaved.map(w => w.id)
      const { data: weRows } = await supabase
        .from('workout_exercises')
        .select('workout_id, exercises(name)')
        .in('workout_id', ids)
        .order('order_index')

      const namesByWorkout: Record<string, string[]> = {}
      for (const we of weRows ?? []) {
        const ex = we.exercises as any
        if (ex?.name) {
          ;(namesByWorkout[we.workout_id] ??= []).push(ex.name)
        }
      }

      savedWorkouts = rawSaved.map(w => ({
        id: w.id,
        name: w.name ?? 'Workout',
        date: w.date,
        exercise_names: namesByWorkout[w.id] ?? [],
      }))
    }
  }

  return (
    <div className="px-4 pt-8 pb-6">
      <h1 className="text-3xl font-bold text-white mb-1">Choose your session</h1>
      {lastWorkout ? (
        <p className="text-secondary-text text-sm mb-6">Last session: <span className="text-white">{lastWorkout.name}</span></p>
      ) : (
        <p className="text-secondary-text text-sm mb-6">What are we hitting today?</p>
      )}

      <WorkoutTabs
        standardTemplates={standardTemplates}
        savedTemplates={savedTemplates}
        savedWorkouts={savedWorkouts}
        recommendedName={recommendedName}
      />
    </div>
  )
}
