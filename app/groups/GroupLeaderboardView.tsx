import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { LeaderboardEntry } from '@/lib/types'
import LeaderboardList from './LeaderboardList'
import LeaveGroupButton from './LeaveGroupButton'
import SoloStats from './SoloStats'

export default async function GroupLeaderboardView({ groupId, user }: { groupId: string; user: User }) {
  const supabase = await createClient()

  const [{ data: group }, { data: leaderboard }] = await Promise.all([
    supabase
      .from('groups')
      .select('id, name, invite_code, created_by')
      .eq('id', groupId)
      .maybeSingle(),
    supabase.rpc('get_group_leaderboard', { p_group_id: groupId }),
  ])

  if (!group) notFound()

  const entries = (leaderboard ?? []) as LeaderboardEntry[]

  const isAdmin = group.created_by === user.id
  const myStats = entries.find(e => e.user_id === user.id)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-white">{group.name}</h1>
        {isAdmin && (
          <Link href={`/groups/${group.id}/settings`} className="text-primary text-sm font-medium">
            Settings
          </Link>
        )}
      </div>
      <p className="text-secondary-text text-sm mb-6">Invite code: {group.invite_code}</p>

      {myStats && (
        <SoloStats
          last7Days={myStats.last_7_days_count}
          last30Days={myStats.last_30_days_count}
          allTime={myStats.all_time_count}
        />
      )}

      <LeaderboardList entries={entries} currentUserId={user.id} />

      {!isAdmin && <LeaveGroupButton />}
    </div>
  )
}
