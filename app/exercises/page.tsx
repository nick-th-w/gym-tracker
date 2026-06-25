import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Suspense } from 'react'
import SearchInput from './SearchInput'

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams?: { search?: string; muscle?: string; equipment?: string }
}) {
  const activeSearch    = searchParams?.search    ?? ''
  const activeMuscle    = searchParams?.muscle    ?? null
  const activeEquipment = searchParams?.equipment ?? null

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, muscle_groups, equipment, difficulty')
    .order('name')

  const allMuscles   = [...new Set((exercises ?? []).flatMap(e => e.muscle_groups as string[]))].sort()
  const allEquipment = [...new Set((exercises ?? []).map(e => e.equipment))].sort()

  const filtered = (exercises ?? []).filter(e => {
    if (activeMuscle    && !(e.muscle_groups as string[]).includes(activeMuscle)) return false
    if (activeEquipment && e.equipment !== activeEquipment) return false
    if (activeSearch    && !e.name.toLowerCase().includes(activeSearch.toLowerCase())) return false
    return true
  })

  function href(params: { search?: string; muscle?: string | null; equipment?: string | null }) {
    const p = new URLSearchParams()
    const s = params.search    !== undefined ? params.search    : activeSearch
    const m = params.muscle    !== undefined ? params.muscle    : activeMuscle
    const q = params.equipment !== undefined ? params.equipment : activeEquipment
    if (s) p.set('search', s)
    if (m) p.set('muscle', m)
    if (q) p.set('equipment', q)
    const str = p.toString()
    return `/exercises${str ? `?${str}` : ''}`
  }

  return (
    <div className="px-4 pt-8 pb-6">
      <h1 className="text-3xl font-bold text-white mb-1">Exercises</h1>
      <p className="text-secondary-text text-sm mb-4">{filtered.length} exercise{filtered.length !== 1 ? 's' : ''}</p>

      {/* Search */}
      <Suspense>
        <SearchInput defaultValue={activeSearch} muscle={activeMuscle} equipment={activeEquipment} />
      </Suspense>

      {/* Muscle filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        <Link href={href({ muscle: null })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${!activeMuscle ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>
          All muscles
        </Link>
        {allMuscles.map(m => (
          <Link key={m} href={href({ muscle: activeMuscle === m ? null : m })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${activeMuscle === m ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>
            {m}
          </Link>
        ))}
      </div>

      {/* Equipment filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        <Link href={href({ equipment: null })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${!activeEquipment ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>
          All equipment
        </Link>
        {allEquipment.map(eq => (
          <Link key={eq} href={href({ equipment: activeEquipment === eq ? null : eq })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${activeEquipment === eq ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>
            {eq}
          </Link>
        ))}
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-3">
        {filtered.map(e => (
          <Link
            key={e.id}
            href={`/exercises/${e.id}`}
            className="bg-card border border-border rounded-xl p-4 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-white font-semibold">{e.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 font-medium ${
                e.difficulty === 'beginner' ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'
              }`}>
                {e.difficulty === 'beginner' ? 'Beginner' : 'Intermediate'}
              </span>
            </div>
            <p className="text-secondary-text text-xs mb-2">{e.equipment}</p>
            <div className="flex flex-wrap gap-1">
              {(e.muscle_groups as string[]).map(m => (
                <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>
              ))}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-secondary-text text-sm text-center pt-8">No exercises match your filters.</p>
        )}
      </div>
    </div>
  )
}
