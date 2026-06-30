import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeaderboardEntry } from '@/lib/types'
import GroupSettingsForm from './GroupSettingsForm'

export default async function GroupSettingsPage({ params }: { params: Promise<{ groupId: string }> }) {
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
  if (group.created_by !== user.id) redirect(`/groups/${groupId}`)

  const { data: leaderboard } = await supabase.rpc('get_group_leaderboard', { p_group_id: groupId })

  return (
    <div className="px-4 pt-8 pb-6">
      <h1 className="text-3xl font-bold text-white mb-1">Group settings</h1>
      <p className="text-secondary-text text-sm mb-6">{group.name}</p>

      <GroupSettingsForm group={group} members={(leaderboard ?? []) as LeaderboardEntry[]} currentUserId={user.id} />
    </div>
  )
}
