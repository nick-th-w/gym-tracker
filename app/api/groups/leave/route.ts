import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { error } = await supabase.from('group_members').delete().eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'Could not leave group' }, { status: 400 })

  revalidatePath('/groups', 'layout')
  revalidatePath('/')
  return NextResponse.json({ ok: true })
}
