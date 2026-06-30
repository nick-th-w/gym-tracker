'use client'

import { useState } from 'react'
import { LeaderboardEntry } from '@/lib/types'

export default function LeaderboardList({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[]
  currentUserId: string
}) {
  const [period, setPeriod] = useState<'weekly' | 'all_time'>('weekly')

  const sorted = [...entries].sort((a, b) => {
    const aCount = period === 'weekly' ? a.weekly_count : a.all_time_count
    const bCount = period === 'weekly' ? b.weekly_count : b.all_time_count
    if (bCount !== aCount) return bCount - aCount
    return a.display_name.localeCompare(b.display_name)
  })

  // Same rank for ties
  let rank = 0
  let lastCount: number | null = null
  const ranked = sorted.map((entry, i) => {
    const count = period === 'weekly' ? entry.weekly_count : entry.all_time_count
    if (count !== lastCount) { rank = i + 1; lastCount = count }
    return { ...entry, rank, count }
  })

  return (
    <div>
      <div className="flex bg-card border border-border rounded-xl p-1 mb-4">
        <button
          onClick={() => setPeriod('weekly')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${period === 'weekly' ? 'bg-primary text-white' : 'text-secondary-text'}`}
        >
          This week
        </button>
        <button
          onClick={() => setPeriod('all_time')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${period === 'all_time' ? 'bg-primary text-white' : 'text-secondary-text'}`}
        >
          All-time
        </button>
      </div>

      {ranked.length === 0 ? (
        <p className="text-secondary-text text-sm text-center py-8">No one&apos;s here yet.</p>
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {ranked.map(entry => (
            <div
              key={entry.user_id}
              className={`flex items-center justify-between px-4 py-3 ${entry.user_id === currentUserId ? 'bg-primary/10' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-secondary-text text-sm font-bold w-6">#{entry.rank}</span>
                <span className="text-white text-sm font-medium">{entry.display_name}</span>
              </div>
              <span className="text-success font-bold text-lg">{entry.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
