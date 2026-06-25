import { createClient } from '@/lib/supabase/server'
import PreviewClient from './PreviewClient'

export default async function CustomWorkoutPreviewPage({
  searchParams,
}: {
  searchParams: { exercises?: string; name?: string }
}) {
  const supabase = await createClient()
  const exerciseIds = (searchParams.exercises ?? '').split(',').filter(Boolean)
  const initialName = decodeURIComponent(searchParams.name ?? 'Custom Workout')

  const { data } = exerciseIds.length
    ? await supabase.from('exercises').select('id, name, muscle_groups, equipment').in('id', exerciseIds)
    : { data: [] }

  // Preserve selection order
  const exercises = exerciseIds
    .map(id => (data ?? []).find(e => e.id === id))
    .filter(Boolean) as { id: string; name: string; muscle_groups: string[]; equipment: string }[]

  return <PreviewClient exercises={exercises} initialName={initialName} />
}
