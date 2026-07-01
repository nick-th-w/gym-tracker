'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function QuickStartButton() {
  const router = useRouter()
  const [starting, setStarting] = useState(false)

  async function quickStart() {
    setStarting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStarting(false); return }

    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    const label = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

    const { data: workout } = await supabase
      .from('workouts')
      .insert({ name: `Freestyle · ${label}`, date: dateStr, user_id: user.id })
      .select('id').single()

    if (!workout) { setStarting(false); return }
    router.push(`/workout/active/${workout.id}`)
  }

  return (
    <button
      onClick={quickStart}
      disabled={starting}
      className="flex items-center gap-3 bg-rose-600 rounded-2xl px-5 py-3.5 active:scale-[0.98] transition-transform disabled:opacity-60 mx-auto"
    >
      <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>
      <span className="text-white font-semibold">{starting ? 'Starting...' : 'Quick Start'}</span>
    </button>
  )
}
