'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

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

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setFav(f => !f)
    await supabase.from('exercises').update({ is_favourite: !fav }).eq('id', exerciseId)
  }

  const cls = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'

  return (
    <button onClick={toggle} className="shrink-0 p-1" aria-label={fav ? 'Remove favourite' : 'Add favourite'}>
      <svg viewBox="0 0 24 24" className={`${cls} transition-colors ${fav ? 'fill-primary stroke-primary' : 'fill-none stroke-secondary-text'}`} strokeWidth="1.8">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </button>
  )
}
