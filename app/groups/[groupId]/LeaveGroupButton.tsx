'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LeaveGroupButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLeave() {
    if (!confirm('Leave this group? Your workout history stays intact, you just leave the leaderboard.')) return
    setLoading(true)
    await fetch('/api/groups/leave', { method: 'POST' })
    setLoading(false)
    router.push('/groups')
    router.refresh()
  }

  return (
    <button
      onClick={handleLeave}
      disabled={loading}
      className="w-full border border-red-500/40 text-red-400 font-semibold py-3 rounded-2xl text-sm mt-6 active:scale-95 transition-all disabled:opacity-50"
    >
      {loading ? 'Leaving…' : 'Leave group'}
    </button>
  )
}
