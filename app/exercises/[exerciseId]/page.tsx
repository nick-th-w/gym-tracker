import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { estimate1RM } from '@/lib/recommendation'
import FavouriteButton from '../FavouriteButton'

function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length < 2) return null
  const W = 340, H = 110
  const P = { t: 10, r: 12, b: 24, l: 44 }
  const cW = W - P.l - P.r, cH = H - P.t - P.b
  const vals = data.map(d => d.value)
  const lo = Math.min(...vals), hi = Math.max(...vals)
  const span = hi - lo || 1
  const px = (i: number) => P.l + (i / (data.length - 1)) * cW
  const py = (v: number) => P.t + cH - ((v - lo) / span) * cH
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.value)}`).join(' ')
  const area = `${path} L${px(data.length - 1)},${P.t + cH} L${px(0)},${P.t + cH} Z`
  const ticks = [lo, hi]
  const showIdx = data.length <= 4 ? data.map((_, i) => i) : [0, Math.floor(data.length / 2), data.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={P.l} y1={py(v)} x2={W - P.r} y2={py(v)} stroke="#525254" strokeWidth="0.5" strokeDasharray="3,3" />
          <text x={P.l - 4} y={py(v) + 4} textAnchor="end" fill="#8e8e93" fontSize="8">{Math.round(v)}kg</text>
        </g>
      ))}
      <path d={area} fill="#8cc63f" fillOpacity="0.08" />
      <path d={path} fill="none" stroke="#8cc63f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => <circle key={i} cx={px(i)} cy={py(d.value)} r="3" fill="#8cc63f" />)}
      {showIdx.map(i => data[i] && (
        <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fill="#8e8e93" fontSize="6.5">{data[i].label}</text>
      ))}
    </svg>
  )
}

export default async function ExerciseDetailPage({ params }: { params: { exerciseId: string } }) {
  const { exerciseId } = params

  const { data: exercise } = await supabase
    .from('exercises')
    .select('id, name, muscle_groups, equipment, difficulty, tips, video_url, gif_url, is_favourite')
    .eq('id', exerciseId)
    .single()

  if (!exercise) return <div className="px-4 pt-8"><p className="text-secondary-text">Exercise not found.</p></div>

  // ── Performance data ──────────────────────────────────────────────────────
  const { data: weRows } = await supabase
    .from('workout_exercises').select('id, workout_id').eq('exercise_id', exerciseId)

  const wkIds = (weRows ?? []).map(we => we.workout_id)
  const { data: doneWkts } = wkIds.length
    ? await supabase.from('workouts').select('id, date').in('id', wkIds).eq('completed', true).order('date')
    : { data: null }

  const doneIds = new Set((doneWkts ?? []).map(w => w.id))
  const dateByWorkout: Record<string, string> = {}
  for (const w of doneWkts ?? []) dateByWorkout[w.id] = w.date

  const weToWorkout: Record<string, string> = {}
  for (const we of weRows ?? []) if (doneIds.has(we.workout_id)) weToWorkout[we.id] = we.workout_id

  const validWeIds = (weRows ?? []).filter(we => doneIds.has(we.workout_id)).map(we => we.id)
  const { data: perfSets } = validWeIds.length
    ? await supabase.from('sets').select('workout_exercise_id, weight_kg, reps').in('workout_exercise_id', validWeIds).eq('completed', true)
    : { data: null }

  const rmByDate: Record<string, { rm: number; weight: number; reps: number }> = {}
  for (const s of perfSets ?? []) {
    if (!s.weight_kg || !s.reps) continue
    const date = dateByWorkout[weToWorkout[s.workout_exercise_id]]
    if (!date) continue
    const rm = estimate1RM(s.weight_kg, s.reps)
    if (!rmByDate[date] || rm > rmByDate[date].rm) rmByDate[date] = { rm, weight: s.weight_kg, reps: s.reps }
  }

  const chartData = Object.entries(rmByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ label: fmtShort(date), value: Math.round(d.rm) }))

  const allTimeBest = Object.values(rmByDate).reduce<{ rm: number; weight: number; reps: number } | null>(
    (best, d) => (!best || d.rm > best.rm ? d : best), null
  )

  const recentSessions = Object.entries(rmByDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 5)

  // Parse tips
  const [setup, technique, feel] = (exercise.tips ?? '').split('\n')
  const hasPerformance = chartData.length > 0

  return (
    <div className="px-4 pt-8 pb-8">
      <Link href="/exercises" className="text-secondary-text text-sm mb-4 block">← Exercises</Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-3xl font-bold text-white">{exercise.name}</h1>
        <FavouriteButton exerciseId={exercise.id} isFavourite={!!exercise.is_favourite} />
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {(exercise.muscle_groups as string[]).map(m => (
          <span key={m} className="bg-primary/15 text-primary text-xs px-2.5 py-1 rounded-full">{m}</span>
        ))}
        <span className="text-secondary-text text-xs">{exercise.equipment}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          exercise.difficulty === 'beginner' ? 'bg-success/15 text-success' :
          exercise.difficulty === 'difficult' ? 'bg-red-500/15 text-red-400' :
          'bg-primary/15 text-primary'
        }`}>
          {exercise.difficulty === 'beginner' ? 'Beginner' : exercise.difficulty === 'difficult' ? 'Difficult' : 'Intermediate'}
        </span>
      </div>

      {/* Exercise image / GIF */}
      {exercise.gif_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={exercise.gif_url}
          alt={exercise.name}
          loading="lazy"
          className="w-full rounded-xl mb-4 object-cover max-h-64"
        />
      )}

      {/* Technique tips */}
      {exercise.tips && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 flex flex-col gap-3">
          {setup && (
            <div>
              <p className="text-success text-xs font-semibold uppercase tracking-wide mb-1">Setup</p>
              <p className="text-secondary-text text-sm leading-relaxed">{setup}</p>
            </div>
          )}
          {technique && (
            <div>
              <p className="text-success text-xs font-semibold uppercase tracking-wide mb-1">Technique</p>
              <p className="text-secondary-text text-sm leading-relaxed">{technique}</p>
            </div>
          )}
          {feel && (
            <div>
              <p className="text-success text-xs font-semibold uppercase tracking-wide mb-1">Feel it</p>
              <p className="text-secondary-text text-sm leading-relaxed">{feel}</p>
            </div>
          )}
          {exercise.video_url && (
            <a href={exercise.video_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm font-medium underline underline-offset-2 mt-1">
              Watch technique video →
            </a>
          )}
        </div>
      )}

      {/* Performance */}
      {hasPerformance ? (
        <div>
          <p className="text-white font-semibold mb-3">Your performance</p>

          {allTimeBest && (
            <div className="bg-success/15 border border-success/30 rounded-xl p-4 mb-4">
              <p className="text-success text-xs font-semibold uppercase tracking-wide mb-1">All-time best</p>
              <p className="text-white font-bold text-2xl">{allTimeBest.weight}kg × {allTimeBest.reps}</p>
              <p className="text-secondary-text text-xs mt-1">Est. 1RM: {Math.round(allTimeBest.rm)}kg</p>
            </div>
          )}

          {chartData.length >= 2 && (
            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <p className="text-secondary-text text-xs uppercase tracking-wide mb-3">Est. 1RM over time</p>
              <LineChart data={chartData} />
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-secondary-text text-xs uppercase tracking-wide mb-3">Recent sessions</p>
            {recentSessions.map(([date, d], i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <span className="text-secondary-text text-sm">{fmtDate(date)}</span>
                <div className="text-right">
                  <span className="text-white text-sm font-medium">{d.weight}kg × {d.reps}</span>
                  <span className="text-secondary-text text-xs ml-2">{Math.round(d.rm)}kg 1RM</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-secondary-text text-sm mb-3">No performance data yet</p>
          <Link
            href="/workout"
            className="bg-success text-white text-sm font-semibold px-5 py-2.5 rounded-xl inline-block"
          >
            Start a workout
          </Link>
        </div>
      )}

      {/* CTA */}
      <div className="mt-5">
        <Link
          href="/workout/custom"
          className="w-full border border-dashed border-border rounded-xl py-3 text-secondary-text text-sm text-center block active:scale-[0.98] transition-transform"
        >
          + Add to a custom workout
        </Link>
      </div>
    </div>
  )
}
