'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SaveWorkoutButton({ workoutId, initialSaved }: { workoutId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('workouts').update({ is_saved: !saved }).eq('id', workoutId)
    setSaved(s => !s)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-60 active:scale-[0.98] ${
        saved
          ? 'bg-rose-600/20 border-rose-500/40 text-rose-400'
          : 'bg-black/20 border-white/20 text-white/70'
      }`}
    >
      {saved ? 'Saved ✓' : 'Save'}
    </button>
  )
}
