'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Exercise = { id: string; name: string; muscle_groups: string[]; equipment: string }

export default function CustomWorkoutBuilderPage() {
  const router = useRouter()
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const [name, setName] = useState(`Custom Workout · ${today}`)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selected, setSelected] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)

  useEffect(() => {
    supabase.from('exercises').select('id, name, muscle_groups, equipment').order('name')
      .then(({ data }) => { if (data) setExercises(data as Exercise[]) })
  }, [])

  const allMuscles = [...new Set(exercises.flatMap(e => e.muscle_groups))].sort()

  const filtered = exercises.filter(e => {
    if (activeMuscle && !e.muscle_groups.includes(activeMuscle)) return false
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
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

  return (
    <div className="px-4 pt-8 pb-40">
      <button onClick={() => router.back()} className="text-secondary-text text-sm mb-4 block">← Back</button>

      {/* Editable workout name */}
      {editingName ? (
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={() => setEditingName(false)}
          className="w-full bg-rose-500/10 border border-rose-500/40 text-white text-xl font-bold rounded-xl px-4 py-3 mb-5"
        />
      ) : (
        <button onClick={() => setEditingName(true)} className="w-full text-left bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 mb-5">
          <p className="text-white text-xl font-bold">{name}</p>
          <p className="text-rose-400 text-xs mt-0.5">Tap to rename</p>
        </button>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search exercises..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-card border border-border text-white text-sm rounded-xl px-4 py-3 mb-3 placeholder:text-secondary-text"
      />

      {/* Muscle filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button
          onClick={() => setActiveMuscle(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${!activeMuscle ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}
        >
          All
        </button>
        {allMuscles.map(m => (
          <button
            key={m}
            onClick={() => setActiveMuscle(activeMuscle === m ? null : m)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${activeMuscle === m ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-2">
        {filtered.map(ex => {
          const isSelected = selected.some(s => s.id === ex.id)
          return (
            <button
              key={ex.id}
              onClick={() => toggle(ex)}
              className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                isSelected ? 'bg-success/15 border-success/40' : 'bg-card border-border'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{ex.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {ex.muscle_groups.map(m => (
                    <span key={m} className="bg-primary/15 text-primary text-xs px-1.5 py-0.5 rounded-full">{m}</span>
                  ))}
                </div>
                <p className="text-secondary-text text-xs mt-0.5">{ex.equipment}</p>
              </div>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 text-sm font-bold transition-all ${
                isSelected ? 'bg-success border-success text-white' : 'border-border text-secondary-text'
              }`}>
                {isSelected ? '✓' : '+'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Sticky bottom — selected chips + CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <div className="bg-background pt-2 pb-2">
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selected.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => toggle(ex)}
                  className="bg-success/20 text-success text-xs px-2.5 py-1 rounded-full font-medium"
                >
                  {ex.name} ×
                </button>
              ))}
            </div>
          )}
          <button
            onClick={goToPreview}
            disabled={selected.length === 0}
            className="w-full bg-rose-500 active:scale-95 disabled:opacity-40 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
          >
            {selected.length === 0 ? 'Add exercises to continue' : `Preview Workout (${selected.length}) →`}
          </button>
        </div>
      </div>
    </div>
  )
}
