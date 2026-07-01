'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { workoutColors } from '@/lib/workoutColors'

type EditSet = { id: string | null; set_number: number; weight_kg: number; reps: number }
type EditExercise = {
  weId: string
  exerciseId: string
  name: string
  muscleGroups: string[]
  rating: number | null
  ratingId: string | null
  pb: 'none' | 'new' | 'pb' | 'delta'
  pbDelta?: number
  sets: EditSet[]
}

const RATING_META: Record<number, { label: string; colour: string }> = {
  1: { label: 'Easy',  colour: 'text-success' },
  2: { label: 'OK',    colour: 'text-success' },
  3: { label: 'Right', colour: 'text-primary' },
  4: { label: 'Tough', colour: 'text-orange-400' },
  5: { label: 'Max',   colour: 'text-red-400' },
}

export default function WorkoutEditor({
  workoutId,
  initialName,
  initialDate,
  exercises,
  formatDate,
  children,
}: {
  workoutId: string
  initialName: string
  initialDate: string
  exercises: EditExercise[]
  formatDate: (d: string) => string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(initialName)
  const [date, setDate] = useState(initialDate)
  const [rows, setRows] = useState<EditExercise[]>(exercises)

  function updateSet(weId: string, si: number, field: 'weight_kg' | 'reps', val: number) {
    setRows(prev => prev.map(r => r.weId !== weId ? r : {
      ...r, sets: r.sets.map((s, i) => i !== si ? s : { ...s, [field]: val }),
    }))
  }

  function addSet(weId: string) {
    setRows(prev => prev.map(r => r.weId !== weId ? r : {
      ...r, sets: [...r.sets, { id: null, set_number: r.sets.length + 1, weight_kg: 0, reps: 0 }],
    }))
  }

  function removeSet(weId: string, si: number) {
    setRows(prev => prev.map(r => r.weId !== weId ? r : {
      ...r, sets: r.sets.filter((_, i) => i !== si),
    }))
  }

  function setRating(weId: string, rating: number) {
    setRows(prev => prev.map(r => r.weId !== weId ? r : { ...r, rating }))
  }

  function cancel() {
    setName(initialName)
    setDate(initialDate)
    setRows(exercises)
    setEditing(false)
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('workouts').update({ name, date }).eq('id', workoutId)

    for (const r of rows) {
      const originalIds = new Set(exercises.find(e => e.weId === r.weId)?.sets.map(s => s.id).filter(Boolean))
      const keptIds = new Set(r.sets.map(s => s.id).filter(Boolean))
      const deletedIds = [...originalIds].filter(id => !keptIds.has(id))

      await Promise.all([
        deletedIds.length ? supabase.from('sets').delete().in('id', deletedIds as string[]) : Promise.resolve(),
        ...r.sets.map((s, i) => {
          const set_number = i + 1
          return s.id
            ? supabase.from('sets').update({ set_number, weight_kg: s.weight_kg, reps: s.reps }).eq('id', s.id)
            : supabase.from('sets').insert({
                workout_exercise_id: r.weId, set_number, weight_kg: s.weight_kg, reps: s.reps, completed: true,
              })
        }),
      ])

      if (r.rating != null) {
        if (r.ratingId) {
          await supabase.from('exercise_feedback').update({ rating: r.rating }).eq('id', r.ratingId)
        } else {
          await supabase.from('exercise_feedback').insert({
            exercise_id: r.exerciseId, workout_id: workoutId, rating: r.rating,
            ...(user ? { user_id: user.id } : {}),
          })
        }
      }
    }

    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  const colors = workoutColors(name)

  return (
    <div>
      {/* Coloured session header */}
      <div className={`${colors.bg} ${colors.border} border rounded-2xl p-4 mb-6`}>
        {editing ? (
          <div className="flex flex-col gap-2">
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Workout name"
              className="w-full bg-black/20 text-white text-xl font-bold rounded-lg px-3 py-2"
            />
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-black/20 text-white text-sm rounded-lg px-3 py-2 w-fit"
            />
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-white mb-1">{name || 'Workout'}</h1>
            <p className="text-secondary-text text-sm">{formatDate(date)}</p>
          </>
        )}
      </div>

      {children}

      <div className="flex justify-end mb-3">
        {editing ? (
          <div className="flex gap-3">
            <button onClick={cancel} disabled={saving} className="text-secondary-text text-sm underline underline-offset-2">
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="bg-success active:scale-95 disabled:opacity-60 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-all">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-secondary-text text-sm underline underline-offset-2">
            Edit workout
          </button>
        )}
      </div>

      {/* Exercise rows */}
      <div className="flex flex-col gap-3 mb-8">
        {rows.map(r => {
          const ratingMeta = r.rating ? RATING_META[r.rating] : null

          if (!editing) {
            return (
              <div key={r.weId} className="grid grid-cols-12 gap-2">
                <div className="col-span-6 bg-card border border-border rounded-xl p-3 min-w-0">
                  <p className="text-white font-semibold text-sm leading-tight mb-1">{r.name}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {r.muscleGroups.map(m => (
                      <span key={m} className="bg-primary/15 text-primary text-xs px-1.5 py-0.5 rounded-full">{m}</span>
                    ))}
                  </div>
                  {r.sets.length > 0 ? r.sets.map((s, i) => (
                    <p key={i} className="text-secondary-text text-xs leading-relaxed">
                      {i + 1}. {s.weight_kg > 0 ? `${s.weight_kg}kg × ${s.reps}` : `${s.reps} reps`}
                    </p>
                  )) : (
                    <p className="text-secondary-text text-xs">No sets recorded</p>
                  )}
                </div>

                <div className="col-span-3 bg-card border border-border rounded-xl p-2 flex flex-col items-center justify-center text-center">
                  {ratingMeta ? (
                    <>
                      <p className={`text-xs font-bold leading-tight ${ratingMeta.colour}`}>{ratingMeta.label}</p>
                      <p className="text-secondary-text text-xs">{r.rating}/5</p>
                    </>
                  ) : (
                    <p className="text-secondary-text text-xs">—</p>
                  )}
                </div>

                <div className="col-span-3 bg-card border border-border rounded-xl p-2 flex flex-col items-center justify-center text-center gap-1">
                  {r.pb === 'none' && <p className="text-secondary-text text-xs">—</p>}
                  {r.pb === 'new' && (
                    <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full font-bold">NEW</span>
                  )}
                  {r.pb === 'pb' && (
                    <span className="bg-success text-white text-xs px-2 py-0.5 rounded-full font-bold">PB</span>
                  )}
                  {r.pb === 'delta' && (
                    <>
                      <p className="text-secondary-text text-xs font-medium">
                        {r.pbDelta === 0 ? 'Matched' : `−${r.pbDelta}kg`}
                      </p>
                      <p className="text-secondary-text text-xs">vs PB</p>
                    </>
                  )}
                </div>
              </div>
            )
          }

          return (
            <div key={r.weId} className="bg-card border border-border rounded-xl p-3">
              <p className="text-white font-semibold text-sm mb-2">{r.name}</p>

              <div className="flex flex-col gap-2 mb-3">
                {r.sets.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-secondary-text text-xs w-4">{i + 1}.</span>
                    <input
                      type="number" inputMode="decimal" value={s.weight_kg || ''}
                      onChange={e => updateSet(r.weId, i, 'weight_kg', parseFloat(e.target.value) || 0)}
                      placeholder="kg"
                      className="flex-1 bg-border text-white text-center rounded-lg py-1.5 text-sm"
                    />
                    <span className="text-secondary-text text-xs">×</span>
                    <input
                      type="number" inputMode="numeric" value={s.reps || ''}
                      onChange={e => updateSet(r.weId, i, 'reps', parseInt(e.target.value) || 0)}
                      placeholder="reps"
                      className="flex-1 bg-border text-white text-center rounded-lg py-1.5 text-sm"
                    />
                    <button onClick={() => removeSet(r.weId, i)} className="text-secondary-text text-xs px-2">✕</button>
                  </div>
                ))}
              </div>

              <button onClick={() => addSet(r.weId)} className="w-full border border-dashed border-border rounded-lg py-1.5 text-secondary-text text-xs mb-3">
                + Add set
              </button>

              <p className="text-secondary-text text-xs uppercase tracking-wide mb-1.5">Rating</p>
              <div className="grid grid-cols-5 gap-1.5">
                {(['Easy', 'OK', 'Right', 'Tough', 'Max'] as const).map((label, i) => (
                  <button
                    key={i}
                    onClick={() => setRating(r.weId, i + 1)}
                    className={`flex flex-col items-center gap-0.5 rounded-lg py-2 transition-all ${r.rating === i + 1 ? 'bg-success text-white' : 'bg-border text-secondary-text'}`}
                  >
                    <span className="text-sm font-bold">{i + 1}</span>
                    <span className="text-[10px]">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
