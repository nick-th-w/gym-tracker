import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { code } = await request.json()

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: groupId, error } = await supabase.rpc('join_group_by_code', {
    p_code: code.trim().toLowerCase(),
  })

  if (error) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
  }

  revalidatePath('/groups', 'layout')
  revalidatePath('/')
  return NextResponse.json({ groupId })
}
