import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GroupLeaderboardView from '../GroupLeaderboardView'

export const revalidate = 60

export default async function GroupLeaderboardPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="px-4 pt-8 pb-6">
      <GroupLeaderboardView groupId={groupId} user={user} />
    </div>
  )
}
