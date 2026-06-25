'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Exercise = { id: string; name: string; muscle_groups: string[]; equipment: string }

export default function PreviewClient({
  exercises,
  initialName,
}: {
  exercises: Exercise[]
  initialName: string
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [editingName, setEditingName] = useState(false)
  const [starting, setStarting] = useState(false)

  const allMuscles = [...new Set(exercises.flatMap(e => e.muscle_groups))]

  async function beginWorkout() {
    setStarting(true)
    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({ name, date: new Date().toISOString().split('T')[0] })
      .select('id').single()

    if (error || !workout) { setStarting(false); return }

    await supabase.from('workout_exercises').insert(
      exercises.map((ex, i) => ({
        workout_id: workout.id,
        exercise_id: ex.id,
        order_index: i + 1,
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 10,
        goal_type: 'hypertrophy',
        reps_unit: 'reps',
      }))
    )
    router.push(`/workout/active/${workout.id}`)
  }

  return (
    <div className="px-4 pt-8 pb-32">
      <button onClick={() => router.back()} className="text-secondary-text text-sm mb-4 block">← Back</button>

      {/* Editable name */}
      {editingName ? (
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={() => setEditingName(false)}
          className="w-full bg-rose-500/10 border border-rose-500/40 text-white text-2xl font-bold rounded-xl px-4 py-3 mb-3"
        />
      ) : (
        <button onClick={() => setEditingName(true)} className="w-full text-left bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 mb-3">
          <p className="text-white text-2xl font-bold">{name}</p>
          <p className="text-rose-400 text-xs mt-0.5">Tap to rename</p>
        </button>
      )}

      <p className="text-secondary-text text-sm mb-4">{exercises.length} exercises · 3 sets each · defaults to 8–10 reps</p>

      {/* Muscle coverage */}
      <div className="bg-card border border-border rounded-xl p-3 mb-5">
        <p className="text-secondary-text text-xs uppercase tracking-wide mb-2">Muscles worked</p>
        <div className="flex flex-wrap gap-1.5">
          {allMuscles.map(m => (
            <span key={m} className="bg-primary/15 text-primary text-xs px-2.5 py-1 rounded-full">{m}</span>
          ))}
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-3">
        {exercises.map((ex, i) => (
          <div key={ex.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-secondary-text text-sm shrink-0 mt-0.5">{i + 1}.</span>
              <div>
                <p className="text-white font-semibold">{ex.name}</p>
                <p className="text-secondary-text text-xs mt-0.5">3 sets · 8–10 reps · {ex.equipment}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {ex.muscle_groups.map(m => (
                    <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4">
        <button
          onClick={beginWorkout}
          disabled={starting}
          className="w-full bg-rose-500 active:scale-95 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
        >
          {starting ? 'Starting...' : 'Begin Workout'}
        </button>
      </div>
    </div>
  )
}
