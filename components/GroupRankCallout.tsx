import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LeaderboardEntry } from '@/lib/types'

export default async function GroupRankCallout({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('group_members')
    .select('group_id, groups(name)')
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership) return null

  const groupName = (membership.groups as unknown as { name: string } | null)?.name
  if (!groupName) return null

  const { data: leaderboard } = await supabase.rpc('get_group_leaderboard', { p_group_id: membership.group_id })
  const entries = (leaderboard ?? []) as LeaderboardEntry[]
  if (entries.length === 0) return null

  const sorted = [...entries].sort((a, b) => {
    if (b.last_7_days_count !== a.last_7_days_count) return b.last_7_days_count - a.last_7_days_count
    return a.display_name.localeCompare(b.display_name)
  })

  let rank = 0
  let lastCount: number | null = null
  let myRank: number | null = null
  sorted.forEach((entry, i) => {
    if (entry.last_7_days_count !== lastCount) { rank = i + 1; lastCount = entry.last_7_days_count }
    if (entry.user_id === userId) myRank = rank
  })

  if (myRank === null) return null

  return (
    <Link
      href={`/groups/${membership.group_id}`}
      className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center justify-between active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-2.5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-primary shrink-0">
          <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.176 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.546 3.75 3.75 0 013.255 3.718z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-white text-sm font-medium">#{myRank} in {groupName}</p>
          <p className="text-secondary-text text-xs mt-0.5">Last 7 days, tap to see leaderboard</p>
        </div>
      </div>
      <span className="text-success font-bold text-2xl shrink-0">#{myRank}</span>
    </Link>
  )
}
