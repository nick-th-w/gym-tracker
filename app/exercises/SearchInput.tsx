'use client'

import { useRouter } from 'next/navigation'
import { useRef, useTransition } from 'react'

export default function SearchInput({
  defaultValue,
  muscle,
  equipment,
}: {
  defaultValue: string
  muscle: string | null
  equipment: string | null
}) {
  const router = useRouter()
  const [, start] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const p = new URLSearchParams()
      if (val)       p.set('search', val)
      if (muscle)    p.set('muscle', muscle)
      if (equipment) p.set('equipment', equipment)
      start(() => router.push(`/exercises?${p.toString()}`))
    }, 300)
  }

  return (
    <input
      type="search"
      defaultValue={defaultValue}
      onChange={handleChange}
      placeholder="Search exercises..."
      className="w-full bg-card border border-border text-white text-sm rounded-xl px-4 py-3 mb-3 placeholder:text-secondary-text"
    />
  )
}
