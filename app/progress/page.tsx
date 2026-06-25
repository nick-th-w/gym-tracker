import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { estimate1RM } from '@/lib/recommendation'
import ExerciseSelect from './ExerciseSelect'

function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length < 2) return (
    <div className="h-28 flex items-center justify-center">
      <p className="text-secondary-text text-sm">Need at least 2 sessions to show a chart</p>
    </div>
  )
  const W = 340, H = 130
  const P = { t: 12, r: 12, b: 28, l: 46 }
  const cW = W - P.l - P.r, cH = H - P.t - P.b
  const vals = data.map(d => d.value)
  const lo = Math.min(...vals), hi = Math.max(...vals)
  const span = hi - lo || 1
  const px = (i: number) => P.l + (i / (data.length - 1)) * cW
  const py = (v: number) => P.t + cH - ((v - lo) / span) * cH
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.value)}`).join(' ')
  const area = `${path} L${px(data.length - 1)},${P.t + cH} L${px(0)},${P.t + cH} Z`
  const ticks = [lo, lo + span / 2, hi]
  const showIdx = data.length <= 6 ? data.map((_, i) => i) : [0, Math.floor(data.length / 2), data.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={P.l} y1={py(v)} x2={W - P.r} y2={py(v)} stroke="#525254" strokeWidth="0.5" strokeDasharray="3,3" />
          <text x={P.l - 5} y={py(v) + 4} textAnchor="end" fill="#8e8e93" fontSize="9">{Math.round(v)}</text>
        </g>
      ))}
      <path d={area} fill="#8cc63f" fillOpacity="0.08" />
      <path d={path} fill="none" stroke="#8cc63f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => <circle key={i} cx={px(i)} cy={py(d.value)} r="3" fill="#8cc63f" />)}
      {showIdx.map(i => data[i] && (
        <text key={i} x={px(i)} y={H - 5} textAnchor="middle" fill="#8e8e93" fontSize="9">{data[i].label}</text>
      ))}
    </svg>
  )
}

export default async function ProgressPage({ searchParams }: { searchParams?: { muscle?: string; exercise?: string } }) {
  const activeMuscle = searchParams?.muscle ?? null
  const activeExerciseId = searchParams?.exercise ?? null

  const { data: allExercises } = await supabase.from('exercises').select('id, name, muscle_groups').order('name')

  const allMuscles = [...new Set((allExercises ?? []).flatMap(e => e.muscle_groups as string[]))].sort()

  const filteredExercises = activeMuscle
    ? (allExercises ?? []).filter(e => (e.muscle_groups as string[]).includes(activeMuscle))
    : (allExercises ?? [])

  const activeExerciseName = allExercises?.find(e => e.id === activeExerciseId)?.name ?? null

  const { data: completedWorkouts } = await supabase
    .from('workouts').select('id, date').eq('completed', true).order('date')

  const allWorkoutIds = (completedWorkouts ?? []).map(w => w.id)
  const dateByWorkout: Record<string, string> = {}
  for (const w of completedWorkouts ?? []) dateByWorkout[w.id] = w.date

  const { data: allWEs } = allWorkoutIds.length
    ? await supabase.from('workout_exercises').select('id, exercise_id, workout_id').in('workout_id', allWorkoutIds)
    : { data: null }

  const allWeIds = (allWEs ?? []).map(we => we.id)
  const { data: allSets } = allWeIds.length
    ? await supabase.from('sets').select('workout_exercise_id, weight_kg, reps').in('workout_exercise_id', allWeIds).eq('completed', true)
    : { data: null }

  const setsByWE: Record<string, { weight_kg: number; reps: number }[]> = {}
  for (const s of allSets ?? []) {
    if (s.weight_kg && s.reps) (setsByWE[s.workout_exercise_id] ??= []).push({ weight_kg: s.weight_kg, reps: s.reps })
  }

  const weByExercise: Record<string, { weId: string; workoutId: string }[]> = {}
  for (const we of allWEs ?? []) (weByExercise[we.exercise_id] ??= []).push({ weId: we.id, workoutId: we.workout_id })

  // Personal bests
  const pbByExercise: Record<string, { rm: number; weight: number; reps: number }> = {}
  for (const [exId, wes] of Object.entries(weByExercise)) {
    for (const { weId } of wes) {
      for (const s of setsByWE[weId] ?? []) {
        const rm = estimate1RM(s.weight_kg, s.reps)
        if (!pbByExercise[exId] || rm > pbByExercise[exId].rm)
          pbByExercise[exId] = { rm, weight: s.weight_kg, reps: s.reps }
      }
    }
  }

  // Exercise chart data
  let chartData: { label: string; value: number }[] = []
  let allTimeBest: { weight: number; reps: number; rm: number } | null = null

  if (activeExerciseId) {
    const rmByDate: Record<string, { rm: number; weight: number; reps: number }> = {}
    for (const { weId, workoutId } of weByExercise[activeExerciseId] ?? []) {
      const date = dateByWorkout[workoutId]
      if (!date) continue
      for (const s of setsByWE[weId] ?? []) {
        const rm = estimate1RM(s.weight_kg, s.reps)
        if (!rmByDate[date] || rm > rmByDate[date].rm)
          rmByDate[date] = { rm, weight: s.weight_kg, reps: s.reps }
      }
    }
    chartData = Object.entries(rmByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ label: fmtDate(date), value: Math.round(d.rm) }))
    allTimeBest = pbByExercise[activeExerciseId] ?? null
  }

  const hasAnyData = Object.keys(pbByExercise).length > 0

  return (
    <div className="px-4 pt-8 pb-6">
      <h1 className="text-3xl font-bold text-white mb-1">Progress</h1>
      <p className="text-secondary-text text-sm mb-5">Track your lifts over time</p>

      {/* Body part filter — all green */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        <Link
          href={activeExerciseId ? `/progress?exercise=${activeExerciseId}` : '/progress'}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${!activeMuscle ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}
        >
          All muscles
        </Link>
        {allMuscles.map(m => (
          <Link
            key={m}
            href={activeExerciseId ? `/progress?muscle=${encodeURIComponent(m)}&exercise=${activeExerciseId}` : `/progress?muscle=${encodeURIComponent(m)}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${activeMuscle === m ? 'bg-success text-white' : 'bg-card text-secondary-text border border-border'}`}
          >
            {m}
          </Link>
        ))}
      </div>

      {/* Exercise dropdown */}
      <ExerciseSelect
        exercises={filteredExercises.map(e => ({ id: e.id, name: e.name }))}
        activeId={activeExerciseId}
        activeMuscle={activeMuscle}
      />

      {!hasAnyData ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <p className="text-white font-semibold text-xl mb-2">No data yet</p>
          <p className="text-secondary-text text-sm">Complete a workout to start tracking your progress.</p>
        </div>
      ) : activeExerciseId ? (
        /* Single exercise view */
        <div>
          <h2 className="text-xl font-bold text-white mb-1">{activeExerciseName}</h2>
          <div className="flex flex-wrap gap-1 mb-4">
            {(allExercises?.find(e => e.id === activeExerciseId)?.muscle_groups as string[] ?? []).map(m => (
              <span key={m} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full">{m}</span>
            ))}
          </div>
          {allTimeBest && (
            <div className="bg-success/15 border border-success/30 rounded-xl p-4 mb-4">
              <p className="text-success text-xs font-semibold uppercase tracking-wide mb-1">All-time best</p>
              <p className="text-white font-bold text-2xl">{allTimeBest.weight}kg × {allTimeBest.reps}</p>
              <p className="text-secondary-text text-xs mt-1">Est. 1RM: {Math.round(allTimeBest.rm)}kg</p>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <p className="text-secondary-text text-xs uppercase tracking-wide mb-3">Estimated 1RM over time</p>
            <LineChart data={chartData} />
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-secondary-text text-xs uppercase tracking-wide mb-3">Session history</p>
            {chartData.length === 0 ? (
              <p className="text-secondary-text text-sm">No sessions logged yet.</p>
            ) : [...chartData].reverse().map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-secondary-text text-sm">{d.label}</span>
                <span className="text-white text-sm font-medium">{d.value}kg est. 1RM</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Overview — PBs list only */
        <div className="flex flex-col gap-2">
          {(allExercises ?? [])
            .filter(e => {
              if (!pbByExercise[e.id]) return false
              if (activeMuscle) return (e.muscle_groups as string[]).includes(activeMuscle)
              return true
            })
            .sort((a, b) => (pbByExercise[b.id]?.rm ?? 0) - (pbByExercise[a.id]?.rm ?? 0))
            .map(e => {
              const pb = pbByExercise[e.id]
              return (
                <Link
                  key={e.id}
                  href={activeMuscle ? `/progress?muscle=${encodeURIComponent(activeMuscle)}&exercise=${e.id}` : `/progress?exercise=${e.id}`}
                  className="bg-card border border-border rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{e.name}</p>
                    <div className="flex gap-1 mt-1">
                      {(e.muscle_groups as string[]).map(m => (
                        <span key={m} className="bg-primary/15 text-primary text-xs px-1.5 py-0.5 rounded-full">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-white font-bold">{pb.weight}kg × {pb.reps}</p>
                    <p className="text-secondary-text text-xs">{Math.round(pb.rm)}kg 1RM</p>
                  </div>
                </Link>
              )
            })
          }
        </div>
      )}
    </div>
  )
}
