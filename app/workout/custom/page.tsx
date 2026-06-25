'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Exercise = { id: string; name: string; muscle_groups: string[]; equipment: string; difficulty: string; is_favourite: boolean }

// Primary muscle group → suggested complementary muscles
const MUSCLE_PAIRS: Record<string, string[]> = {
  'Chest':       ['Back', 'Triceps'],
  'Back':        ['Chest', 'Biceps'],
  'Quads':       ['Hamstrings', 'Glutes'],
  'Hamstrings':  ['Quads', 'Glutes'],
  'Shoulders':   ['Back', 'Triceps'],
  'Biceps':      ['Triceps', 'Back'],
  'Triceps':     ['Biceps', 'Chest'],
  'Core':        ['Glutes', 'Lower Back'],
  'Glutes':      ['Hamstrings', 'Quads'],
}

function getMuscleBalance(selected: Exercise[]): { covered: string[]; suggested: string[] } {
  const covered = [...new Set(selected.flatMap(e => e.muscle_groups))]
  const suggested = [...new Set(
    covered.flatMap(m => MUSCLE_PAIRS[m] ?? []).filter(m => !covered.includes(m))
  )].slice(0, 3)
  return { covered, suggested }
}

export default function CustomWorkoutBuilderPage() {
  const router = useRouter()
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const [name, setName] = useState(`Custom Workout · ${today}`)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selected, setSelected] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null)
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null)
  const [favOnly, setFavOnly] = useState(false)
  const [editingName, setEditingName] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const [{ data: exs }, { data: favRows }] = await Promise.all([
        supabase.from('exercises').select('id, name, muscle_groups, equipment, difficulty').order('name'),
        user
          ? supabase.from('user_exercise_favourites').select('exercise_id').eq('user_id', user.id)
          : Promise.resolve({ data: null }),
      ])
      if (!exs) return
      const favSet = new Set((favRows ?? []).map((f: { exercise_id: string }) => f.exercise_id))
      setExercises(exs.map(e => ({ ...e, is_favourite: favSet.has(e.id) })) as Exercise[])
    }
    load()
  }, [])

  const allMuscles = [...new Set(exercises.flatMap(e => e.muscle_groups))].sort()

  const filtered = exercises.filter(e => {
    if (activeMuscle     && !e.muscle_groups.includes(activeMuscle)) return false
    if (activeDifficulty && e.difficulty !== activeDifficulty) return false
    if (favOnly          && !e.is_favourite) return false
    if (search           && !e.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function toggle(ex: Exercise) {
    setSelected(prev =>
      prev.some(s => s.id === ex.id) ? prev.filter(s => s.id !== ex.id) : [...prev, ex]
    )
  }

  function goToPreview() {
    const ids = selected.map(e => e.id).join(',')
    router.push(`/workout/custom/preview?exercises=${ids}&name=${encodeURIComponent(name)}`)
  }

  const { covered, suggested } = getMuscleBalance(selected)

  return (
    <div className="px-4 pt-8 pb-40">
      <button onClick={() => router.back()} className="text-secondary-text text-sm mb-4 block">← Back</button>

      {/* Editable name */}
      {editingName ? (
        <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)}
          onBlur={() => setEditingName(false)}
          className="w-full bg-rose-500/10 border border-rose-500/40 text-white text-xl font-bold rounded-xl px-4 py-3 mb-3" />
      ) : (
        <button onClick={() => setEditingName(true)} className="w-full text-left bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 mb-3">
          <p className="text-white text-xl font-bold">{name}</p>
          <p className="text-rose-400 text-xs mt-0.5">Tap to rename</p>
        </button>
      )}

      {/* Muscle coverage tracker */}
      {selected.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-3 mb-4">
          <p className="text-secondary-text text-xs uppercase tracking-wide mb-2">Muscles covered</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {covered.map(m => <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>)}
          </div>
          {suggested.length > 0 && (
            <p className="text-secondary-text text-xs">
              Consider adding: {suggested.map((m, i) => (
                <button key={m} onClick={() => setActiveMuscle(m)} className="text-success underline underline-offset-1">
                  {m}{i < suggested.length - 1 ? ', ' : ''}
                </button>
              ))}
            </p>
          )}
        </div>
      )}

      {/* Search */}
      <input type="search" placeholder="Search exercises..." value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-card border border-border text-white text-sm rounded-xl px-4 py-3 mb-3 placeholder:text-secondary-text" />

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
        <button onClick={() => setFavOnly(f => !f)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${favOnly ? 'bg-primary text-white' : 'bg-card text-secondary-text border border-border'}`}>
          ♥ Favourites
        </button>
        {['beginner', 'intermediate', 'difficult'].map(d => (
          <button key={d} onClick={() => setActiveDifficulty(activeDifficulty === d ? null : d)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 capitalize ${activeDifficulty === d ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>
            {d}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button onClick={() => setActiveMuscle(null)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${!activeMuscle ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>All</button>
        {allMuscles.map(m => (
          <button key={m} onClick={() => setActiveMuscle(activeMuscle === m ? null : m)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${activeMuscle === m ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>
            {m}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-2">
        {filtered.map(ex => {
          const isSelected = selected.some(s => s.id === ex.id)
          return (
            <button key={ex.id} onClick={() => toggle(ex)}
              className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${isSelected ? 'bg-success/15 border-success/40' : 'bg-card border-border'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-medium">{ex.name}</p>
                  {ex.is_favourite && <span className="text-primary text-xs">♥</span>}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {ex.muscle_groups.map(m => <span key={m} className="bg-primary/15 text-primary text-xs px-1.5 py-0.5 rounded-full">{m}</span>)}
                  <span className={`text-xs capitalize ${ex.difficulty === 'beginner' ? 'text-success' : ex.difficulty === 'difficult' ? 'text-red-400' : 'text-primary'}`}>· {ex.difficulty}</span>
                </div>
                <p className="text-secondary-text text-xs mt-0.5">{ex.equipment}</p>
              </div>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 text-sm font-bold transition-all ${isSelected ? 'bg-success border-success text-white' : 'border-border text-secondary-text'}`}>
                {isSelected ? '✓' : '+'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <div className="bg-background pt-2 pb-2">
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selected.map(ex => (
                <button key={ex.id} onClick={() => toggle(ex)} className="bg-success/20 text-success text-xs px-2.5 py-1 rounded-full font-medium">
                  {ex.name} ×
                </button>
              ))}
            </div>
          )}
          <button onClick={goToPreview} disabled={selected.length === 0}
            className="w-full bg-rose-500 active:scale-95 disabled:opacity-40 text-white font-semibold py-4 rounded-2xl text-lg transition-all">
            {selected.length === 0 ? 'Add exercises to continue' : `Preview Workout (${selected.length}) →`}
          </button>
        </div>
      </div>
    </div>
  )
}
