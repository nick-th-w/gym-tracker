import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GroupJoinCreate from './GroupJoinCreate'
import SoloStats from './SoloStats'

export const revalidate = 60

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

  const todayStr = new Date().toISOString().split('T')[0]
  const last7DaysCutoff = new Date(Date.now() - 6 * 86_400_000).toISOString().split('T')[0]
  const last30DaysCutoff = new Date(Date.now() - 29 * 86_400_000).toISOString().split('T')[0]

  const [{ count: last7Days }, { count: last30Days }, { count: allTime }] = await Promise.all([
    supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('completed', true).gte('date', last7DaysCutoff).lte('date', todayStr),
    supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('completed', true).gte('date', last30DaysCutoff).lte('date', todayStr),
    supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('completed', true),
  ])

  return (
    <div className="px-4 pt-8 pb-6">
      <h1 className="text-3xl font-bold text-white mb-1">Leaderboard</h1>
      <p className="text-secondary-text text-sm mb-6">Join a group or start your own to compare workout counts with friends.</p>

      {(allTime ?? 0) > 0 && (
        <SoloStats last7Days={last7Days ?? 0} last30Days={last30Days ?? 0} allTime={allTime ?? 0} />
      )}

      <GroupJoinCreate />
    </div>
  )
}
