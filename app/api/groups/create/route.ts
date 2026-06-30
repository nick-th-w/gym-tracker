import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { name } = await request.json()

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: groupId, error } = await supabase.rpc('create_group', {
    p_name: name.trim().slice(0, 60),
  })

  if (error) {
    return NextResponse.json({ error: 'Could not create group' }, { status: 400 })
  }

  revalidatePath('/groups', 'layout')
  revalidatePath('/')
  return NextResponse.json({ groupId })
}
