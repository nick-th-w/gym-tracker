import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { estimate1RM } from '@/lib/recommendation'
import { workoutColors } from '@/lib/workoutColors'

function parseDateParts(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return { day: d, month: date.toLocaleDateString('en-GB', { month: 'short' }), weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }) }
}

function getMondayKey(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const offset = date.getDay() === 0 ? -6 : 1 - date.getDay()
  date.setDate(date.getDate() + offset)
  return date.toISOString().split('T')[0]
}

function fmtShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function FrequencyChart({ data }: { data: { label: string; count: number }[] }) {
  const W = 340, H = 100
  const P = { t: 8, r: 8, b: 22, l: 20 }
  const cW = W - P.l - P.r, cH = H - P.t - P.b
  const maxC = Math.max(...data.map(d => d.count), 1)
  const bW = (cW / data.length) - 4

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {data.map((d, i) => {
        const bH = (d.count / maxC) * cH
        const bX = P.l + i * (cW / data.length) + 2
        const bY = P.t + cH - bH
        return (
          <g key={i}>
            <rect x={bX} y={bY} width={bW} height={bH || 1} fill={d.count > 0 ? '#8cc63f' : '#3a3a3c'} rx="2" />
            {(i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)) && (
              <text x={bX + bW / 2} y={H - 4} textAnchor="middle" fill="#8e8e93" fontSize="8">{d.label}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

const RANGES = [
  { label: 'All time', value: 'all' },
  { label: '90 days',  value: '90'  },
  { label: '30 days',  value: '30'  },
  { label: '7 days',   value: '7'   },
]

export default async function HistoryPage({
  searchParams,
}: {
  searchParams?: { type?: string; range?: string }
}) {
  const activeFilter = searchParams?.type ?? null
  const activeRange = searchParams?.range ?? 'all'

  const { data: workouts } = await supabase
    .from('workouts').select('id, name, date, duration_minutes').eq('completed', true).order('date', { ascending: false })

  if (!workouts?.length) {
    return (
      <div className="px-4 pt-8 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <p className="text-white font-semibold text-xl mb-2">No workouts yet</p>
        <p className="text-secondary-text text-sm">Complete your first session to see your history here.</p>
      </div>
    )
  }

  const workoutIds = workouts.map(w => w.id)
  const workoutTypes = [...new Set(workouts.map(w => w.name))]

  const [{ data: wes }, { data: allRatings }] = await Promise.all([
    supabase.from('workout_exercises').select('id, workout_id, exercise_id, exercises(muscle_groups)').in('workout_id', workoutIds),
    supabase.from('exercise_feedback').select('workout_id, rating').in('workout_id', workoutIds),
  ])

  const weIds = (wes ?? []).map(we => we.id)
  const { data: allSets } = weIds.length
    ? await supabase.from('sets').select('workout_exercise_id, weight_kg, reps').in('workout_exercise_id', weIds).eq('completed', true)
    : { data: null }

  const setsByWE: Record<string, { weight_kg: number; reps: number }[]> = {}
  for (const s of allSets ?? []) {
    if (s.weight_kg != null && s.reps != null) (setsByWE[s.workout_exercise_id] ??= []).push({ weight_kg: s.weight_kg, reps: s.reps })
  }

  const wesByWorkout: Record<string, typeof wes> = {}
  const completedCountByWorkout: Record<string, number> = {}
  const musclesByWorkout: Record<string, string[]> = {}

  for (const we of wes ?? []) {
    (wesByWorkout[we.workout_id] ??= []).push(we)
    if ((setsByWE[we.id]?.length ?? 0) > 0) {
      completedCountByWorkout[we.workout_id] = (completedCountByWorkout[we.workout_id] ?? 0) + 1
      const muscles: string[] = (we.exercises as any)?.muscle_groups ?? []
      musclesByWorkout[we.workout_id] = [...new Set([...(musclesByWorkout[we.workout_id] ?? []), ...muscles])]
    }
  }

  const ratingByWorkout: Record<string, number> = {}
  for (const r of allRatings ?? []) ratingByWorkout[r.workout_id] = (ratingByWorkout[r.workout_id] ?? 0) + r.rating

  // PB/NEW (sorted by date ascending)
  const sortedByDate = [...workouts].sort((a, b) => a.date.localeCompare(b.date))
  const runningBest: Record<string, number> = {}
  const pbNewByWorkout: Record<string, { newCount: number; pbCount: number }> = {}

  for (const w of sortedByDate) {
    let newCount = 0, pbCount = 0
    for (const we of wesByWorkout[w.id] ?? []) {
      const weSets = setsByWE[we.id] ?? []
      if (!weSets.length) continue
      const cur1RM = Math.max(...weSets.map(s => estimate1RM(s.weight_kg, s.reps)))
      const prev = runningBest[we.exercise_id]
      if (prev === undefined) newCount++
      else if (cur1RM > prev) pbCount++
      runningBest[we.exercise_id] = Math.max(runningBest[we.exercise_id] ?? 0, cur1RM)
    }
    pbNewByWorkout[w.id] = { newCount, pbCount }
  }

  // ── Monthly summary (current month, all workouts) ─────────────────────────
  const currentMonth = new Date().toISOString().substring(0, 7)
  const thisMonthWorkouts = workouts.filter(w => w.date.startsWith(currentMonth))
  const thisMonthExercises = thisMonthWorkouts.reduce((sum, w) => sum + (completedCountByWorkout[w.id] ?? 0), 0)

  // ── Time range filter ─────────────────────────────────────────────────────
  const cutoffDate = activeRange !== 'all'
    ? new Date(Date.now() - parseInt(activeRange) * 86400000).toISOString().split('T')[0]
    : null

  // ── Frequency chart data (weeks in selected range) ────────────────────────
  const rangeWeeks = activeRange === '7' ? 1 : activeRange === '30' ? 5 : activeRange === '90' ? 13 : 12
  const workoutsByWeek: Record<string, number> = {}
  for (const w of workouts) {
    if (activeFilter && w.name !== activeFilter) continue
    if (cutoffDate && w.date < cutoffDate) continue
    const week = getMondayKey(w.date)
    workoutsByWeek[week] = (workoutsByWeek[week] ?? 0) + 1
  }

  const chartWeeks = Array.from({ length: rangeWeeks }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (rangeWeeks - 1 - i) * 7)
    const offset = d.getDay() === 0 ? -6 : 1 - d.getDay()
    d.setDate(d.getDate() + offset)
    const key = d.toISOString().split('T')[0]
    return { label: fmtShort(key).split(' ')[0], count: workoutsByWeek[key] ?? 0 }
  })

  // ── Filtered workout list ─────────────────────────────────────────────────
  const filtered = workouts.filter(w => {
    if (activeFilter && w.name !== activeFilter) return false
    if (cutoffDate && w.date < cutoffDate) return false
    return true
  })

  // Build range-aware href helper
  function href(params: Record<string, string | null>) {
    const p = new URLSearchParams()
    if (params.type ?? activeFilter) p.set('type', params.type ?? activeFilter ?? '')
    if (params.range ?? activeRange !== 'all') p.set('range', params.range ?? activeRange)
    const str = p.toString()
    return `/history${str ? `?${str}` : ''}`
  }

  return (
    <div className="px-4 pt-8 pb-6">
      <h1 className="text-3xl font-bold text-white mb-4">History</h1>

      {/* ── Monthly summary callouts ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-secondary-text text-xs mb-1">This month</p>
          <p className="text-white font-bold text-2xl">{thisMonthWorkouts.length}</p>
          <p className="text-secondary-text text-xs mt-0.5">workouts</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-secondary-text text-xs mb-1">This month</p>
          <p className="text-white font-bold text-2xl">{thisMonthExercises}</p>
          <p className="text-secondary-text text-xs mt-0.5">exercises done</p>
        </div>
      </div>

      {/* ── Frequency chart ───────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-4 mb-5">
        <p className="text-secondary-text text-xs uppercase tracking-wide mb-3">
          Workout frequency {activeFilter ? `— ${activeFilter}` : ''}
        </p>
        <FrequencyChart data={chartWeeks} />
      </div>

      {/* ── Workout type filter ───────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        <Link href={href({ type: null })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${!activeFilter ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>
          All
        </Link>
        {workoutTypes.map(type => (
          <Link key={type} href={href({ type })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${activeFilter === type ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>
            {type}
          </Link>
        ))}
      </div>

      {/* ── Time range filter ─────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {RANGES.map(r => (
          <Link key={r.value} href={href({ range: r.value })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${activeRange === r.value ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>
            {r.label}
          </Link>
        ))}
      </div>

      {/* ── Workout cards ─────────────────────────────────────────────────── */}
      <p className="text-secondary-text text-xs mb-3">{filtered.length} session{filtered.length !== 1 ? 's' : ''}</p>

      <div className="flex flex-col gap-3">
        {filtered.map(w => {
          const { day, month, weekday } = parseDateParts(w.date)
          const muscles = musclesByWorkout[w.id] ?? []
          const completedCount = completedCountByWorkout[w.id] ?? 0
          const { newCount, pbCount } = pbNewByWorkout[w.id] ?? { newCount: 0, pbCount: 0 }
          const colors = workoutColors(w.name)

          return (
            <Link key={w.id} href={`/history/${w.id}`} className="flex gap-3 active:scale-[0.98] transition-transform">
              <div className="bg-card border border-border rounded-2xl p-3 w-[72px] shrink-0 flex flex-col items-center justify-center text-center">
                <p className="text-white font-bold text-2xl leading-none">{day}</p>
                <p className="text-primary text-xs font-medium mt-1">{month}</p>
                <p className="text-secondary-text text-xs">{weekday}</p>
              </div>
              <div className={`${colors.bg} ${colors.border} border rounded-2xl p-4 flex-1 min-w-0`}>
                <p className="text-white font-semibold text-base leading-tight mb-1">{w.name}</p>
                <p className="text-secondary-text text-xs mb-2">{completedCount} exercise{completedCount !== 1 ? 's' : ''} completed</p>
                {muscles.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {muscles.map(m => <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>)}
                  </div>
                )}
                {(newCount > 0 || pbCount > 0) && (
                  <div className="flex gap-2 mt-2">
                    {newCount > 0 && <span className="bg-primary text-white text-xs px-2.5 py-0.5 rounded-full font-bold">NEW ×{newCount}</span>}
                    {pbCount > 0 && <span className="bg-success text-white text-xs px-2.5 py-0.5 rounded-full font-bold">PB ×{pbCount}</span>}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-secondary-text text-sm text-center pt-8">No sessions match these filters.</p>
        )}
      </div>
    </div>
  )
}
