import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// PATCH — rename group or regenerate invite code. Body: { groupId, name? } or { groupId, regenerateCode: true }
export async function PATCH(request: NextRequest) {
  const { groupId, name, regenerateCode } = await request.json()
  if (!groupId) return NextResponse.json({ error: 'groupId is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const update: Record<string, string> = {}
  if (name && typeof name === 'string' && name.trim()) update.name = name.trim().slice(0, 60)
  if (regenerateCode) update.invite_code = Math.random().toString(36).slice(2, 10)

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  // RLS "admin manages group" policy ensures only created_by = auth.uid() can update
  const { error } = await supabase.from('groups').update(update).eq('id', groupId)
  if (error) return NextResponse.json({ error: 'Could not update group' }, { status: 400 })

  revalidatePath('/groups', 'layout')
  revalidatePath('/')
  return NextResponse.json({ ok: true })
}

// DELETE — delete the group (admin only via RLS). Body: { groupId }
export async function DELETE(request: NextRequest) {
  const { groupId } = await request.json()
  if (!groupId) return NextResponse.json({ error: 'groupId is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { error } = await supabase.from('groups').delete().eq('id', groupId)
  if (error) return NextResponse.json({ error: 'Could not delete group' }, { status: 400 })

  revalidatePath('/groups', 'layout')
  revalidatePath('/')
  return NextResponse.json({ ok: true })
}
