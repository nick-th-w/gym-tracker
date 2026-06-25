'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DeleteWorkoutButton({ workoutId }: { workoutId: string }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function deleteWorkout() {
    setDeleting(true)
    await supabase.from('exercise_feedback').delete().eq('workout_id', workoutId)
    await supabase.from('workouts').delete().eq('id', workoutId)
    router.push('/history')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-secondary-text text-sm underline underline-offset-2"
      >
        Delete workout
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setShowModal(false)}>
          <div className="bg-card w-full rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">Delete workout?</h2>
            <p className="text-secondary-text text-sm mb-8">This cannot be undone. All sets and ratings will be removed.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={deleteWorkout}
                disabled={deleting}
                className="w-full bg-red-600 active:scale-95 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-border active:scale-95 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
