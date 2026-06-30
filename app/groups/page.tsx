import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GroupJoinCreate from './GroupJoinCreate'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (membership) redirect(`/groups/${membership.group_id}`)

  return (
    <div className="px-4 pt-8 pb-6">
      <h1 className="text-3xl font-bold text-white mb-1">Leaderboard</h1>
      <p className="text-secondary-text text-sm mb-6">Join a group or start your own to compare workout counts with friends.</p>
      <GroupJoinCreate />
    </div>
  )
}
