import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { estimate1RM } from '@/lib/recommendation'
import { workoutColors } from '@/lib/workoutColors'

function parseDateParts(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return {
    day: d,
    month: date.toLocaleDateString('en-GB', { month: 'short' }),
    weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }),
  }
}

function fmtShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getDayKey(offsetFromToday: number): string {
  const d = new Date()
  d.setDate(d.getDate() - offsetFromToday)
  return d.toISOString().split('T')[0]
}

// ─── Dual-axis chart: daily bars (green) + cumulative line (orange) ──────────
function WorkoutChart({ data }: { data: { date: string; count: number; cumulative: number }[] }) {
  if (!data.some(d => d.count > 0)) return (
    <div className="h-28 flex items-center justify-center">
      <p className="text-secondary-text text-sm">No workouts in this period</p>
    </div>
  )

  const W = 340, H = 130
  const P = { t: 16, r: 36, b: 22, l: 24 }
  const cW = W - P.l - P.r
  const cH = H - P.t - P.b
  const n = data.length
  const slotW = cW / n
  const bW = Math.max(1.5, slotW - 0.8)

  const maxCount = Math.max(...data.map(d => d.count), 1)
  const maxCum = Math.max(...data.map(d => d.cumulative), 1)

  const bX = (i: number) => P.l + i * slotW + (slotW - bW) / 2
  const barH = (c: number) => (c / maxCount) * cH
  const lineY = (cum: number) => P.t + cH - (cum / maxCum) * cH

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${bX(i) + bW / 2},${lineY(d.cumulative)}`)
    .join(' ')

  // Show ~5 evenly spaced x-axis labels
  const labelStep = Math.max(1, Math.floor(n / 5))
  const labelIdxs = Array.from({ length: Math.ceil(n / labelStep) }, (_, i) => i * labelStep)
    .filter(i => i < n)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Horizontal guide line at half cumulative */}
      <line x1={P.l} y1={lineY(maxCum / 2)} x2={W - P.r} y2={lineY(maxCum / 2)} stroke="#525254" strokeWidth="0.4" strokeDasharray="3,3" />

      {/* Daily bars */}
      {data.map((d, i) => (
        d.count > 0 && (
          <rect
            key={i}
            x={bX(i)}
            y={P.t + cH - barH(d.count)}
            width={bW}
            height={barH(d.count)}
            fill="#8cc63f"
            fillOpacity="0.85"
            rx="0.5"
          />
        )
      ))}

      {/* Cumulative line */}
      <path d={linePath} fill="none" stroke="#ff5500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Line end dot */}
      <circle
        cx={bX(n - 1) + bW / 2}
        cy={lineY(data[n - 1].cumulative)}
        r="2.5"
        fill="#ff5500"
      />

      {/* Left Y axis — daily count */}
      <text x={P.l - 3} y={P.t + cH} textAnchor="end" fill="#8cc63f" fontSize="6.5">0</text>
      <text x={P.l - 3} y={P.t + 4} textAnchor="end" fill="#8cc63f" fontSize="6.5">{maxCount}</text>

      {/* Right Y axis — cumulative */}
      <text x={W - P.r + 4} y={P.t + cH} textAnchor="start" fill="#ff5500" fontSize="6.5">0</text>
      <text x={W - P.r + 4} y={P.t + 4} textAnchor="start" fill="#ff5500" fontSize="6.5">{maxCum}</text>

      {/* X axis labels */}
      {labelIdxs.map(i => (
        <text key={i} x={bX(i) + bW / 2} y={H - 3} textAnchor="middle" fill="#8e8e93" fontSize="6.5">
          {fmtShort(data[i].date)}
        </text>
      ))}
    </svg>
  )
}

const RANGES = [
  { label: '7 days',   value: '7'   },
  { label: '30 days',  value: '30'  },
  { label: '90 days',  value: '90'  },
  { label: 'All time', value: 'all' },
]

export default async function HistoryPage({
  searchParams,
}: {
  searchParams?: { type?: string; range?: string }
}) {
  const activeFilter = searchParams?.type ?? null
  const activeRange  = searchParams?.range ?? '90' // default 90 days

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

  const workoutTypes = [...new Set(workouts.map(w => w.name))]
  const workoutIds = workouts.map(w => w.id)

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

  // PB/NEW (processed in date order)
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

  // ── Apply filters ─────────────────────────────────────────────────────────
  const cutoffDate = activeRange !== 'all' ? getDayKey(parseInt(activeRange) - 1) : null

  const filtered = workouts.filter(w => {
    if (activeFilter && w.name !== activeFilter) return false
    if (cutoffDate && w.date < cutoffDate) return false
    return true
  })

  // ── Stats for filtered period ─────────────────────────────────────────────
  const periodWorkouts = filtered.length
  const periodExercises = filtered.reduce((sum, w) => sum + (completedCountByWorkout[w.id] ?? 0), 0)

  // ── Daily chart data (90 days default) ───────────────────────────────────
  const chartDays = activeRange === 'all' ? 90 : parseInt(activeRange)

  const workoutsByDay: Record<string, number> = {}
  for (const w of workouts) {
    if (activeFilter && w.name !== activeFilter) continue
    workoutsByDay[w.date] = (workoutsByDay[w.date] ?? 0) + 1
  }

  let cumulative = 0
  const chartData = Array.from({ length: chartDays }, (_, i) => {
    const date = getDayKey(chartDays - 1 - i)
    const count = workoutsByDay[date] ?? 0
    cumulative += count
    return { date, count, cumulative }
  })

  // Helper to build href preserving both filter params
  function href(params: Record<string, string | null>) {
    const p = new URLSearchParams()
    const type = params.type !== undefined ? params.type : activeFilter
    const range = params.range !== undefined ? params.range : activeRange
    if (type) p.set('type', type)
    if (range && range !== '90') p.set('range', range)
    const str = p.toString()
    return `/history${str ? `?${str}` : ''}`
  }

  return (
    <div className="px-4 pt-8 pb-6">
      <h1 className="text-3xl font-bold text-white mb-4">History</h1>

      {/* ── Filters at top — affect everything below ────────────────────── */}
      {/* Workout type */}
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

      {/* Time range */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {RANGES.map(r => (
          <Link key={r.value} href={href({ range: r.value })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${activeRange === r.value ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}>
            {r.label}
          </Link>
        ))}
      </div>

      {/* ── Period summary callouts (filtered) ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-secondary-text text-xs mb-1">Workouts</p>
          <p className="text-white font-bold text-2xl">{periodWorkouts}</p>
          <p className="text-secondary-text text-xs mt-0.5">in this period</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-secondary-text text-xs mb-1">Exercises done</p>
          <p className="text-white font-bold text-2xl">{periodExercises}</p>
          <p className="text-secondary-text text-xs mt-0.5">in this period</p>
        </div>
      </div>

      {/* ── Chart — daily bars + cumulative line (filtered) ─────────────── */}
      <div className="bg-card border border-border rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-secondary-text text-xs uppercase tracking-wide">Workout frequency</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-success"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-success/80"></span> Daily</span>
            <span className="flex items-center gap-1 text-xs text-primary"><span className="inline-block w-3 h-0.5 bg-primary"></span> Cumulative</span>
          </div>
        </div>
        <WorkoutChart data={chartData} />
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
