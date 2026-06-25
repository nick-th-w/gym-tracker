import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Suspense } from 'react'
import SearchInput from './SearchInput'
import FavouriteButton from './FavouriteButton'

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  difficult:    'Difficult',
}

const DIFFICULTY_COLOUR: Record<string, string> = {
  beginner:     'bg-success/15 text-success',
  intermediate: 'bg-primary/15 text-primary',
  difficult:    'bg-red-500/15 text-red-400',
}

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams?: {
    search?: string; muscle?: string; equipment?: string
    difficulty?: string; completion?: string; favourite?: string
  }
}) {
  const activeSearch     = searchParams?.search     ?? ''
  const activeMuscle     = searchParams?.muscle     ?? null
  const activeEquipment  = searchParams?.equipment  ?? null
  const activeDifficulty = searchParams?.difficulty ?? null
  const activeCompletion = searchParams?.completion ?? null
  const showFavourites   = searchParams?.favourite === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Parallel: exercises + completed workouts + user's favourites
  const [{ data: exercises }, { data: completedWks }, { data: favRows }] = await Promise.all([
    supabase.from('exercises').select('id, name, muscle_groups, equipment, difficulty').order('name'),
    supabase.from('workouts').select('id').eq('completed', true),
    user
      ? supabase.from('user_exercise_favourites').select('exercise_id').eq('user_id', user.id)
      : Promise.resolve({ data: null }),
  ])

  const favouriteIds = new Set((favRows ?? []).map((f: { exercise_id: string }) => f.exercise_id))

  // Completion counts per exercise
  const cWkIds = (completedWks ?? []).map(w => w.id)
  const { data: cWEs } = cWkIds.length
    ? await supabase.from('workout_exercises').select('id, exercise_id').in('workout_id', cWkIds)
    : { data: null }

  const cWeIds = (cWEs ?? []).map(we => we.id)
  const { data: cSets } = cWeIds.length
    ? await supabase.from('sets').select('workout_exercise_id').in('workout_exercise_id', cWeIds).eq('completed', true)
    : { data: null }

  const weWithSets = new Set((cSets ?? []).map(s => s.workout_exercise_id))
  const completionCount: Record<string, number> = {}
  for (const we of cWEs ?? []) {
    if (weWithSets.has(we.id))
      completionCount[we.exercise_id] = (completionCount[we.exercise_id] ?? 0) + 1
  }

  function getCompletionTier(exId: string): 'new' | 'novice' | 'experienced' {
    const c = completionCount[exId] ?? 0
    if (c === 0)   return 'new'
    if (c <= 10)   return 'novice'
    return 'experienced'
  }

  const allMuscles   = [...new Set((exercises ?? []).flatMap(e => e.muscle_groups as string[]))].sort()
  const allEquipment = [...new Set((exercises ?? []).map(e => e.equipment))].sort()

  const filtered = (exercises ?? []).filter(e => {
    if (showFavourites   && !favouriteIds.has(e.id)) return false
    if (activeMuscle     && !(e.muscle_groups as string[]).includes(activeMuscle)) return false
    if (activeEquipment  && e.equipment !== activeEquipment) return false
    if (activeDifficulty && e.difficulty !== activeDifficulty) return false
    if (activeCompletion && getCompletionTier(e.id) !== activeCompletion) return false
    if (activeSearch     && !e.name.toLowerCase().includes(activeSearch.toLowerCase())) return false
    return true
  })

  function href(overrides: Record<string, string | null>) {
    const p = new URLSearchParams()
    const vals: Record<string, string | null> = {
      search:     activeSearch     || null,
      muscle:     activeMuscle,
      equipment:  activeEquipment,
      difficulty: activeDifficulty,
      completion: activeCompletion,
      favourite:  showFavourites ? 'true' : null,
      ...overrides,
    }
    for (const [k, v] of Object.entries(vals)) if (v) p.set(k, v)
    const s = p.toString()
    return `/exercises${s ? `?${s}` : ''}`
  }

  return (
    <div className="px-4 pt-8 pb-6">
      <h1 className="text-3xl font-bold text-white mb-1">Exercises</h1>
      <p className="text-secondary-text text-sm mb-4">{filtered.length} exercise{filtered.length !== 1 ? 's' : ''}</p>

      {/* Search */}
      <Suspense>
        <SearchInput defaultValue={activeSearch} muscle={activeMuscle} equipment={activeEquipment} />
      </Suspense>

      {/* Favourites quick filter */}
      <div className="flex gap-2 mb-3">
        <Link
          href={href({ favourite: showFavourites ? null : 'true' })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${showFavourites ? 'bg-primary text-white' : 'bg-card text-secondary-text border border-border'}`}
        >
          <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${showFavourites ? 'fill-white stroke-white' : 'fill-none stroke-secondary-text'}`} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          Favourites
        </Link>
      </div>

      {/* Muscle filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        <Link href={href({ muscle: null })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${!activeMuscle ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>All muscles</Link>
        {allMuscles.map(m => (
          <Link key={m} href={href({ muscle: activeMuscle === m ? null : m })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${activeMuscle === m ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>{m}</Link>
        ))}
      </div>

      {/* Equipment filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        <Link href={href({ equipment: null })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${!activeEquipment ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>All equipment</Link>
        {allEquipment.map(eq => (
          <Link key={eq} href={href({ equipment: activeEquipment === eq ? null : eq })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${activeEquipment === eq ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>{eq}</Link>
        ))}
      </div>

      {/* Difficulty filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        <Link href={href({ difficulty: null })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${!activeDifficulty ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>All levels</Link>
        {['beginner', 'intermediate', 'difficult'].map(d => (
          <Link key={d} href={href({ difficulty: activeDifficulty === d ? null : d })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${activeDifficulty === d ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>{DIFFICULTY_LABEL[d]}</Link>
        ))}
      </div>

      {/* Completion filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        <Link href={href({ completion: null })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${!activeCompletion ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>All</Link>
        {[
          { key: 'new',        label: 'New — never done' },
          { key: 'novice',     label: 'Novice — 1–10×' },
          { key: 'experienced',label: 'Experienced — 10+×' },
        ].map(({ key, label }) => (
          <Link key={key} href={href({ completion: activeCompletion === key ? null : key })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${activeCompletion === key ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>{label}</Link>
        ))}
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-3">
        {filtered.map(e => {
          const count = completionCount[e.id] ?? 0
          const tier = getCompletionTier(e.id)
          return (
            <div key={e.id} className="relative">
              <Link href={`/exercises/${e.id}`} className="bg-card border border-border rounded-xl p-4 block active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between mb-2 pr-8">
                  <p className="text-white font-semibold">{e.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 font-medium ${DIFFICULTY_COLOUR[e.difficulty] ?? 'bg-card text-secondary-text'}`}>
                    {DIFFICULTY_LABEL[e.difficulty] ?? e.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-secondary-text text-xs">{e.equipment}</p>
                  <span className="text-secondary-text text-xs">·</span>
                  <p className="text-secondary-text text-xs">
                    {tier === 'new' ? 'Never done' : tier === 'novice' ? `${count}× done` : `${count}× done`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(e.muscle_groups as string[]).map(m => (
                    <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>
                  ))}
                </div>
              </Link>
              {/* Favourite button sits outside the Link */}
              <div className="absolute top-3 right-3">
                <FavouriteButton exerciseId={e.id} isFavourite={!!favouriteIds.has(e.id)} size="sm" />
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-secondary-text text-sm text-center pt-8">No exercises match your filters.</p>
        )}
      </div>
    </div>
  )
}
