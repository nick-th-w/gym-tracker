import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { estimate1RM } from '@/lib/recommendation'
import { getDailyQuote } from '@/lib/quotes'
import QuoteCard from '@/components/QuoteCard'
import GroupRankCallout from '@/components/GroupRankCallout'

export const revalidate = 60

// ── Time-of-day voice ────────────────────────────────────────────────────────
function getGreeting(name: string | undefined, hour: number): { headline: string; sub: string } {
  const n = name ? `, ${name}` : ''

  if (hour >= 5 && hour < 9) return {
    headline: `First one in${n}.`,
    sub: 'Set the tone for today.',
  }
  if (hour >= 9 && hour < 12) return {
    headline: `Morning session${n}.`,
    sub: 'Best way to start the day.',
  }
  if (hour >= 12 && hour < 14) return {
    headline: `Lunch break well spent${n}.`,
    sub: 'Most people eat. You train.',
  }
  if (hour >= 14 && hour < 17) return {
    headline: `Afternoon grind${n}.`,
    sub: 'Halfway through. Finish strong.',
  }
  if (hour >= 17 && hour < 20) return {
    headline: `After-work session${n}.`,
    sub: 'Leave the day at the door.',
  }
  if (hour >= 20 && hour < 23) return {
    headline: `End it strong${n}.`,
    sub: 'Night shift. No excuses.',
  }
  return {
    headline: `Everyone else stopped${n}.`,
    sub: 'You didn\'t.',
  }
}

// ── Muscle readiness ─────────────────────────────────────────────────────────
type ReadinessStatus = 'fresh' | 'recovering' | 'fatigued'

function getMuscleReadiness(
  muscle: string,
  lastTrainedDate: string | undefined,
  todayStr: string,
): ReadinessStatus {
  if (!lastTrainedDate) return 'fresh'
  const [y, m, d] = lastTrainedDate.split('-').map(Number)
  const [ty, tm, td] = todayStr.split('-').map(Number)
  const msPerDay = 86_400_000
  const hoursAgo = (new Date(ty, tm - 1, td).getTime() - new Date(y, m - 1, d).getTime()) / (msPerDay / 24)
  if (hoursAgo >= 72) return 'fresh'
  if (hoursAgo >= 48) return 'recovering'
  return 'fatigued'
}

const READINESS_STYLE: Record<ReadinessStatus, { dot: string; text: string }> = {
  fresh:      { dot: 'bg-success',      text: 'text-success' },
  recovering: { dot: 'bg-amber-400',    text: 'text-amber-400' },
  fatigued:   { dot: 'bg-red-400',      text: 'text-red-400' },
}

const PRIMARY_MUSCLES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']

export default async function TodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const displayName = user?.user_metadata?.display_name as string | undefined

  const hourUTC = new Date().getUTCHours()
  const hourLocal = (hourUTC + 10) % 24
  const { headline, sub } = getGreeting(displayName, hourLocal)
  const quote = getDailyQuote()

  // ── Single parallel fetch: last workout (with exercises+sets) + recent workouts (with muscle data)
  const [
    { data: lastWorkout },
    { data: recentWorkouts },
  ] = await Promise.all([
    supabase
      .from('workouts')
      .select('id, name, date, duration_minutes, workout_exercises(id, exercises(name), sets(weight_kg, reps, completed))')
      .eq('completed', true)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('workouts')
      .select('id, date, workout_exercises(exercises(muscle_groups))')
      .eq('completed', true)
      .order('date', { ascending: false })
      .limit(10),
  ])

  // New user — render immediately
  if (!lastWorkout) {
    return (
      <div className="flex flex-col px-4 pt-5 pb-6 gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{headline}</h1>
          <p className="text-secondary-text text-sm">{sub}</p>
        </div>
        <QuoteCard initial={quote} />
        <Link href="/workout"
          className="w-full bg-success hover:opacity-90 active:scale-95 text-white font-semibold py-4 rounded-2xl text-lg transition-all duration-150 block text-center">
          Start Workout
        </Link>
        {user && <GroupRankCallout userId={user.id} />}
      </div>
    )
  }

  // ── Last session notable set (derived from nested data — no extra queries)
  let lastSessionNote: string | null = null
  const lastWEs = (lastWorkout as any).workout_exercises ?? []
  const completedSets = lastWEs.flatMap((we: any) =>
    ((we.sets ?? []) as any[])
      .filter((s: any) => s.completed)
      .map((s: any) => ({ ...s, _exName: (we.exercises as any)?.name }))
  )
  if (completedSets.length) {
    const best = completedSets.reduce((b: any, s: any) =>
      estimate1RM(s.weight_kg ?? 0, s.reps ?? 0) > estimate1RM(b.weight_kg ?? 0, b.reps ?? 0) ? s : b
    )
    if (best._exName && best.weight_kg && best.reps) {
      lastSessionNote = `${best._exName} · ${best.weight_kg}kg × ${best.reps}`
    }
  }

  // ── Days since last session
  const todayStr = new Date().toISOString().split('T')[0]
  const [y, m, d] = lastWorkout.date.split('-').map(Number)
  const [ty, tm, td] = todayStr.split('-').map(Number)
  const daysSince = Math.floor(
    (new Date(ty, tm - 1, td).getTime() - new Date(y, m - 1, d).getTime()) / 86_400_000
  )

  // ── Muscle readiness (derived from nested recentWorkouts — no extra query)
  const allRecentWEs = (recentWorkouts ?? []).flatMap(w =>
    ((w as any).workout_exercises ?? []).map((we: any) => ({ we, date: w.date }))
  )

  const lastTrainedByMuscle: Record<string, string> = {}
  for (const { we, date } of allRecentWEs) {
    const muscles: string[] = (we.exercises as any)?.muscle_groups ?? []
    for (const muscle of muscles) {
      const primary = PRIMARY_MUSCLES.find(p =>
        muscle.toLowerCase().includes(p.toLowerCase()) ||
        (p === 'Arms' && (muscle === 'Biceps' || muscle === 'Triceps'))
      )
      if (primary && (!lastTrainedByMuscle[primary] || date > lastTrainedByMuscle[primary])) {
        lastTrainedByMuscle[primary] = date
      }
    }
  }

  const readiness = PRIMARY_MUSCLES.map(muscle => ({
    muscle,
    status: getMuscleReadiness(muscle, lastTrainedByMuscle[muscle], todayStr),
  }))

  const restLabel = daysSince === 0
    ? 'Trained today'
    : daysSince === 1
      ? '1 day rest'
      : `${daysSince} days rest`

  return (
    <div className="flex flex-col px-4 pt-5 pb-6 gap-3">

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">{headline}</h1>
        <p className="text-secondary-text text-sm">{sub}</p>
      </div>

      {/* ── Last session callout ─────────────────────────────────────────── */}
      {lastWorkout && (
        <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-secondary-text text-xs uppercase tracking-wide mb-0.5">Last session</p>
            <p className="text-white text-sm font-medium truncate">{lastWorkout.name}</p>
            {lastSessionNote && (
              <p className="text-secondary-text text-xs mt-0.5 truncate">{lastSessionNote}</p>
            )}
          </div>
          <div className="text-right shrink-0 ml-3">
            {restLabel && (
              <p className={`text-xs font-semibold ${daysSince !== null && daysSince > 3 ? 'text-amber-400' : 'text-secondary-text'}`}>
                {restLabel}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Muscle readiness ─────────────────────────────────────────────── */}
      {allRecentWEs.length > 0 && (
        <div className="bg-card border border-border rounded-2xl px-4 py-3">
          <p className="text-secondary-text text-xs uppercase tracking-wide mb-2.5">Muscle readiness</p>
          <div className="flex flex-wrap gap-2">
            {readiness.map(({ muscle, status }) => {
              const s = READINESS_STYLE[status]
              return (
                <div key={muscle} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                  <span className={`text-xs font-medium ${s.text}`}>{muscle}</span>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-2.5 pt-2.5 border-t border-border">
            {(['fresh', 'recovering', 'fatigued'] as const).map(s => (
              <div key={s} className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${READINESS_STYLE[s].dot}`} />
                <span className="text-secondary-text text-xs capitalize">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quote of the day ─────────────────────────────────────────────── */}
      <QuoteCard initial={quote} />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <Link
        href="/workout"
        className="w-full bg-success hover:opacity-90 active:scale-95 text-white font-semibold py-4 rounded-2xl text-lg transition-all duration-150 block text-center"
      >
        Start Workout
      </Link>

      {/* ── Group rank ───────────────────────────────────────────────────── */}
      {user && <GroupRankCallout userId={user.id} />}
    </div>
  )
}
