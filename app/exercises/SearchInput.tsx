'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const p = new URLSearchParams()
    if (e.target.value) p.set('search', e.target.value)
    if (muscle)    p.set('muscle', muscle)
    if (equipment) p.set('equipment', equipment)
    start(() => router.push(`/exercises?${p.toString()}`))
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
