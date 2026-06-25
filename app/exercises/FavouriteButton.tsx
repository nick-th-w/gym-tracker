'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FavouriteButton({
  exerciseId,
  isFavourite: initial,
  size = 'md',
}: {
  exerciseId: string
  isFavourite: boolean
  size?: 'sm' | 'md'
}) {
  const [fav, setFav] = useState(initial)
  const [busy, setBusy] = useState(false)

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return

    const next = !fav
    setFav(next) // optimistic update
    setBusy(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setFav(fav) // revert — not signed in
      setBusy(false)
      return
    }

    if (next) {
      await supabase
        .from('user_exercise_favourites')
        .insert({ user_id: user.id, exercise_id: exerciseId })
    } else {
      await supabase
        .from('user_exercise_favourites')
        .delete()
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
    }

    setBusy(false)
  }

  const cls = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="shrink-0 p-1 disabled:opacity-60"
      aria-label={fav ? 'Remove favourite' : 'Add favourite'}
    >
      <svg
        viewBox="0 0 24 24"
        className={`${cls} transition-colors ${fav ? 'fill-primary stroke-primary' : 'fill-none stroke-secondary-text'}`}
        strokeWidth="1.8"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </button>
  )
}
