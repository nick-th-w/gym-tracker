// One-time route — hit localhost:3001/api/update-difficulty once
// Re-fetches source to find 'expert' exercises, sets them to 'difficult' in Supabase

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const res = await fetch(
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
    { cache: 'no-store' }
  )
  const raw = await res.json()

  const expertIds: string[] = raw.filter((e: any) => e.level === 'expert').map((e: any) => e.id)

  // Update in batches of 200
  let updated = 0
  for (let i = 0; i < expertIds.length; i += 200) {
    const batch = expertIds.slice(i, i + 200)
    const { count } = await supabase
      .from('exercises')
      .update({ difficulty: 'difficult' })
      .in('exercisedb_id', batch)
      .select('id', { count: 'exact', head: true })
    updated += count ?? 0
  }

  return NextResponse.json({ expert_in_source: expertIds.length, updated_to_difficult: updated })
}
