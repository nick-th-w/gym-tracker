import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'
import EditNameButton from './EditNameButton'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const displayName = user.user_metadata?.display_name as string | undefined
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const { count: sessionCount } = await supabase
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .eq('completed', true)

  return (
    <div className="px-4 pt-8 pb-6">
      <h1 className="text-3xl font-bold text-white mb-1">
        {displayName ?? 'Profile'}
      </h1>
      <p className="text-secondary-text text-sm mb-6">{user.email}</p>

      {sessionCount !== null && sessionCount > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-secondary-text text-xs uppercase tracking-wide mb-0.5">The Grind</p>
            <p className="text-white font-bold text-2xl">{sessionCount} sessions</p>
          </div>
          <p className="text-4xl font-black text-success/20">#{sessionCount}</p>
        </div>
      )}


      <div className="bg-card border border-border rounded-2xl p-4 mb-6">
        <p className="text-secondary-text text-xs uppercase tracking-wide mb-1">Display name</p>
        <div className="flex items-center justify-between">
          <p className="text-white text-sm">{displayName ?? '—'}</p>
          <EditNameButton currentName={displayName ?? ''} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 mb-6">
        <p className="text-secondary-text text-xs uppercase tracking-wide mb-1">Email</p>
        <p className="text-white text-sm">{user.email}</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 mb-6">
        <p className="text-secondary-text text-xs uppercase tracking-wide mb-1">Member since</p>
        <p className="text-white text-sm">{joinedDate}</p>
      </div>

      <SignOutButton />
    </div>
  )
}
