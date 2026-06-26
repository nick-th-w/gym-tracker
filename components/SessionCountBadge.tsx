import { createClient } from '@/lib/supabase/server'

export default async function SessionCountBadge() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { count } = await supabase
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .eq('completed', true)

  if (!count || count === 0) return null

  return (
    <span className="text-white text-xs font-bold bg-white/20 border border-white/30 rounded-full px-3 py-1">
      #{count}
    </span>
  )
}
