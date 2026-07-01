// One-time import route — run locally only (localhost:3001/api/import-exercises)
// Fetches ~800 exercises from the free open-source ExerciseDB JSON dataset
// and upserts them into your Supabase exercises table.
// Safe to run multiple times — skips exercises that already exist by name.

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const EQUIPMENT: Record<string, string> = {
  'barbell':        'Barbell',
  'dumbbell':       'Dumbbell',
  'body only':      'Bodyweight',
  'cable':          'Cable Machine',
  'machine':        'Machine',
  'resistance band':'Resistance Band',
  'bands':          'Resistance Band',
  'kettlebell':     'Kettlebell',
  'medicine ball':  'Medicine Ball',
  'none':           'Bodyweight',
  'e-z curl bar':   'Barbell',
  'exercise ball':  'Other',
  'foam roll':      'Other',
  'other':          'Other',
}

const MUSCLE: Record<string, string> = {
  'abdominals':  'Core',
  'abductors':   'Abductors',
  'adductors':   'Adductors',
  'biceps':      'Biceps',
  'calves':      'Calves',
  'chest':       'Chest',
  'forearms':    'Forearms',
  'glutes':      'Glutes',
  'hamstrings':  'Hamstrings',
  'lats':        'Back',
  'lower back':  'Lower Back',
  'middle back': 'Back',
  'neck':        'Neck',
  'quadriceps':  'Quads',
  'shoulders':   'Shoulders',
  'traps':       'Upper Back',
  'triceps':     'Triceps',
}

type RawExercise = {
  id: string
  name: string
  force: string | null
  level: string
  mechanic: string | null
  equipment: string
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  category: string
  images: string[]
}

/** Normalise a name for deduplication: lowercase, collapse spaces, strip trailing 's'. */
function normaliseName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/s$/, '')
}

export async function GET() {
  // 1. Fetch the full exercise dataset from the open-source repo
  let raw: RawExercise[]
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
      { cache: 'no-store' }
    )
    raw = await res.json()
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch exercise data', detail: String(err) }, { status: 500 })
  }

  // 2. Get existing names to skip duplicates (normalised for fuzzy match)
  const { data: existing } = await supabase.from('exercises').select('name')
  const existingNorms = new Set((existing ?? []).map((e: any) => normaliseName(e.name)))

  // 3. Map and filter
  const toInsert = raw
    .filter(e => !existingNorms.has(normaliseName(e.name)))
    .map(e => {
      // Merge primary + secondary, deduplicate, normalise names
      const muscles = [...new Set(
        [...e.primaryMuscles, ...e.secondaryMuscles]
          .map(m => MUSCLE[m.toLowerCase()] ?? m)
      )]

      const equipment = EQUIPMENT[e.equipment?.toLowerCase()] ?? 'Other'
      const difficulty = e.level === 'expert' ? 'intermediate' : (e.level || 'beginner')

      // Build structured tips: Setup / Technique / Feel It
      const steps = e.instructions ?? []
      const setup     = steps[0] ?? ''
      const technique = steps.slice(1, steps.length > 2 ? -1 : undefined).join(' ')
      const feel      = muscles.length
        ? `Feel the ${muscles.slice(0, 2).join(' and ')} working throughout each rep.`
        : ''
      const tips = [setup, technique, feel].filter(Boolean).join('\n')

      // First image from the repo as a static preview
      const gif_url = e.images?.[0]
        ? `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${e.images[0]}`
        : null

      const video_url = `https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + ' form tutorial')}`

      return {
        name: e.name,
        muscle_groups: muscles,
        equipment,
        difficulty,
        tips,
        gif_url,
        video_url,
        exercisedb_id: e.id,
      }
    })

  // 4. Insert in batches of 50
  let inserted = 0
  const errors: string[] = []

  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50)
    const { error } = await supabase.from('exercises').insert(batch)
    if (error) errors.push(error.message)
    else inserted += batch.length
  }

  return NextResponse.json({
    message: 'Import complete',
    total_in_source: raw.length,
    already_existed: raw.length - toInsert.length,
    inserted,
    errors: errors.length ? errors : undefined,
  })
}
