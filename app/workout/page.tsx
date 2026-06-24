import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const MUSCLE_MAP: Record<string, string[]> = {
  full_body_a: ['Chest', 'Back', 'Legs', 'Shoulders', 'Core'],
  full_body_b: ['Back', 'Hamstrings', 'Chest', 'Core'],
  upper:       ['Chest', 'Back', 'Shoulders', 'Arms'],
  lower:       ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  recovery:    ['Core', 'Mobility', 'Full Body'],
}

export default async function ChooseWorkoutPage() {
  const { data: templates } = await supabase
    .from('workout_templates')
    .select('id, name, description, focus, estimated_duration_minutes, goals')
    .order('created_at')

  return (
    <div className="px-4 pt-8 pb-6">
      <h1 className="text-3xl font-bold text-white mb-1">Choose your session</h1>
      <p className="text-secondary-text text-sm mb-6">What are we hitting today?</p>
      <div className="flex flex-col gap-3">
        {(templates ?? []).map(t => (
          <Link
            key={t.id}
            href={`/workout/${t.id}`}
            className="bg-card border border-border rounded-2xl p-4 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-white font-semibold text-lg">{t.name}</h2>
              <span className="text-secondary-text text-sm shrink-0 ml-2">~{t.estimated_duration_minutes} min</span>
            </div>
            <p className="text-secondary-text text-sm mb-3 leading-relaxed">{t.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {/* Goal tags — green */}
              {(t.goals ?? []).map((g: string) => (
                <span key={g} className="bg-success/15 text-success text-xs px-2.5 py-1 rounded-full font-medium">{g}</span>
              ))}
              {/* Muscle tags — orange */}
              {(MUSCLE_MAP[t.focus] ?? []).map(m => (
                <span key={m} className="bg-primary/15 text-primary text-xs px-2.5 py-1 rounded-full">{m}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
