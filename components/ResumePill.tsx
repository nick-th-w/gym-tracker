'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResumePill() {
  const pathname = usePathname()
  const [workoutId, setWorkoutId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setWorkoutId(null); return }

      const { data } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setWorkoutId(data?.id ?? null)
    }
    check()
  }, [])

  // Hide on active workout pages and while loading
  if (!workoutId || pathname?.startsWith('/workout/active')) return null

  return (
    <Link
      href={`/workout/active/${workoutId}`}
      className="flex items-center gap-1.5 bg-white/15 hover:bg-white/20 active:scale-95 rounded-full px-3 py-1 transition-all text-white text-xs font-semibold"
    >
      <span>▶</span>
      <span>Resume workout</span>
    </Link>
  )
}
