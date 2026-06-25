'use client'

import { useRouter } from 'next/navigation'

export default function ExerciseSelect({
  exercises,
  activeId,
  activeMuscle,
}: {
  exercises: { id: string; name: string }[]
  activeId: string | null
  activeMuscle: string | null
}) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    const base = activeMuscle ? `/progress?muscle=${encodeURIComponent(activeMuscle)}` : '/progress'
    router.push(val ? `${base}&exercise=${val}` : base)
  }

  return (
    <select
      value={activeId ?? ''}
      onChange={handleChange}
      className="w-full bg-card border border-border text-white text-sm rounded-xl px-4 py-3 mb-5 appearance-none cursor-pointer"
    >
      <option value="">All exercises</option>
      {exercises.map(e => (
        <option key={e.id} value={e.id}>{e.name}</option>
      ))}
    </select>
  )
}
