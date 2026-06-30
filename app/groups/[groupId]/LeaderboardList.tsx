'use client'

import { useState } from 'react'
import { LeaderboardEntry } from '@/lib/types'

const WINDOWS = [
  { key: 'last_7_days_count', label: 'Last 7 days' },
  { key: 'last_30_days_count', label: 'Last 30 days' },
  { key: 'all_time_count', label: 'All-time' },
] as const

type WindowKey = typeof WINDOWS[number]['key']

export default function LeaderboardList({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[]
  currentUserId: string
}) {
  const [period, setPeriod] = useState<WindowKey>('last_7_days_count')

  const sorted = [...entries].sort((a, b) => {
    if (b[period] !== a[period]) return b[period] - a[period]
    return a.display_name.localeCompare(b.display_name)
  })

  // Same rank for ties
  let rank = 0
  let lastCount: number | null = null
  const ranked = sorted.map((entry, i) => {
    const count = entry[period]
    if (count !== lastCount) { rank = i + 1; lastCount = count }
    return { ...entry, rank, count }
  })

  return (
    <div>
      <div className="flex bg-card border border-border rounded-xl p-1 mb-4">
        {WINDOWS.map(w => (
          <button
            key={w.key}
            onClick={() => setPeriod(w.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${period === w.key ? 'bg-primary text-white' : 'text-secondary-text'}`}
          >
            {w.label}
          </button>
        ))}
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
