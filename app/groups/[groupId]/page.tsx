import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeaderboardEntry } from '@/lib/types'
import LeaderboardList from './LeaderboardList'
import LeaveGroupButton from './LeaveGroupButton'

export default async function GroupLeaderboardPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: group } = await supabase
    .from('groups')
    .select('id, name, invite_code, created_by')
    .eq('id', groupId)
    .maybeSingle()

  if (!group) notFound()

  const { data: leaderboard } = await supabase.rpc('get_group_leaderboard', { p_group_id: groupId })

  const isAdmin = group.created_by === user.id

  return (
    <div className="px-4 pt-8 pb-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-white">{group.name}</h1>
        {isAdmin && (
          <Link href={`/groups/${group.id}/settings`} className="text-primary text-sm font-medium">
            Settings
          </Link>
        )}
      </div>
      <p className="text-secondary-text text-sm mb-6">Invite code: {group.invite_code}</p>

      <LeaderboardList entries={(leaderboard ?? []) as LeaderboardEntry[]} currentUserId={user.id} />

      {!isAdmin && <LeaveGroupButton />}
    </div>
  )
}
