'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Background from '@/components/Background'
import { createClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3

const GOALS = [
  { value: 'strength',    label: 'Strength',       sub: 'Lift heavy, build power' },
  { value: 'hypertrophy', label: 'Hypertrophy',    sub: 'Build muscle size' },
  { value: 'fitness',     label: 'General Fitness', sub: 'Feel good, stay active' },
  { value: 'fat_loss',    label: 'Fat Loss',        sub: 'Lose weight, get lean' },
]

const EXPERIENCE = [
  { value: 'beginner',     label: 'Beginner',     sub: 'Less than 1 year of consistent training' },
  { value: 'intermediate', label: 'Intermediate', sub: '1–3 years of consistent training' },
  { value: 'advanced',     label: 'Advanced',     sub: '3+ years of consistent training' },
]

export default function RegisterPage() {
  const router = useRouter()

  // Step 1 — credentials
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')

  // Step 2 — about you
  const [name, setName]             = useState('')
  const [sex, setSex]               = useState<'male' | 'female' | 'other' | ''>('')
  const [bodyWeight, setBodyWeight] = useState('')
  const [units, setUnits]           = useState<'kg' | 'lbs'>('kg')

  // Step 3 — training
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('')
  const [goal, setGoal]             = useState<'strength' | 'hypertrophy' | 'fitness' | 'fat_loss' | ''>('')

  const [step, setStep]   = useState<Step>(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Step 1 submit — sign up ─────────────────────────────────────────────────
  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (error) { setError(error.message); return }
    setStep(2)
  }

  // ── Step 3 submit — save profile + enter app ────────────────────────────────
  async function handleFinish() {
    if (!experience || !goal) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Session expired — please try again'); setLoading(false); return }

    const weightKg = units === 'lbs'
      ? parseFloat(bodyWeight) * 0.453592
      : parseFloat(bodyWeight)

    await Promise.all([
      supabase.auth.updateUser({ data: { display_name: name.trim() } }),
      supabase.from('user_profiles').upsert({
        user_id:       user.id,
        display_name:  name.trim(),
        sex:           sex || null,
        body_weight_kg: bodyWeight ? Math.round(weightKg * 10) / 10 : null,
        units,
        experience,
        primary_goal:  goal,
      }),
    ])

    router.push('/')
    router.refresh()
  }

  const progressDots = (
    <div className="flex gap-2 justify-center mb-8">
      {([1, 2, 3] as Step[]).map(s => (
        <div key={s} className={`h-1.5 rounded-full transition-all ${
          s === step ? 'w-8 bg-success' : s < step ? 'w-8 bg-success/40' : 'w-4 bg-border'
        }`} />
      ))}
    </div>
  )

  return (
    <>
      <Background />
      <div className="flex flex-col min-h-screen px-6 pt-14 pb-8">

        {/* ── Step 1: Credentials ──────────────────────────────────────────── */}
        {step === 1 && (
          <>
            {progressDots}
            <h1 className="text-3xl font-bold text-white mb-1 text-center">The Grind</h1>
            <p className="text-secondary-text text-sm mb-8 text-center">Create your account</p>

            <form onSubmit={handleCredentials} className="flex flex-col gap-3">
              <input type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)} autoFocus autoComplete="email"
                className="w-full bg-card border border-border text-white rounded-xl px-4 py-4 text-center text-lg placeholder:text-secondary-text" />
              <input type="password" placeholder="Password (min 8 chars)" value={password}
                onChange={e => setPassword(e.target.value)} autoComplete="new-password"
                className="w-full bg-card border border-border text-white rounded-xl px-4 py-4 text-center text-lg placeholder:text-secondary-text" />
              <input type="password" placeholder="Confirm password" value={confirm}
                onChange={e => setConfirm(e.target.value)} autoComplete="new-password"
                className="w-full bg-card border border-border text-white rounded-xl px-4 py-4 text-center text-lg placeholder:text-secondary-text" />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading || !email || !password || !confirm}
                className="w-full bg-success active:scale-95 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl text-lg transition-all mt-1">
                {loading ? 'Creating account...' : 'Continue →'}
              </button>
              <p className="text-secondary-text text-sm text-center">
                Already have an account?{' '}
                <Link href="/login" className="text-primary underline">Sign in</Link>
              </p>
            </form>
          </>
        )}

        {/* ── Step 2: About you ────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            {progressDots}
            <h1 className="text-3xl font-bold text-white mb-1">About you</h1>
            <p className="text-secondary-text text-sm mb-6">Personalises your starting weights and rankings.</p>

            <label className="text-secondary-text text-xs uppercase tracking-wide mb-1.5 block">What should we call you?</label>
            <input type="text" placeholder="Name or nickname" value={name}
              onChange={e => setName(e.target.value)} autoFocus maxLength={40}
              className="w-full bg-card border border-border text-white rounded-xl px-4 py-4 mb-5 text-lg placeholder:text-secondary-text" />

            <label className="text-secondary-text text-xs uppercase tracking-wide mb-1.5 block">Sex</label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {(['male', 'female', 'other'] as const).map(s => (
                <button key={s} onClick={() => setSex(s)}
                  className={`py-3 rounded-xl border text-sm font-medium capitalize transition-all ${sex === s ? 'bg-success/15 border-success text-success' : 'bg-card border-border text-secondary-text'}`}>
                  {s}
                </button>
              ))}
            </div>

            <label className="text-secondary-text text-xs uppercase tracking-wide mb-1.5 block">Body weight</label>
            <div className="flex gap-2 mb-1">
              <input type="number" inputMode="decimal" placeholder={units === 'kg' ? '75' : '165'}
                value={bodyWeight} onChange={e => setBodyWeight(e.target.value)}
                className="flex-1 bg-card border border-border text-white rounded-xl px-4 py-4 text-lg placeholder:text-secondary-text" />
              <div className="flex rounded-xl overflow-hidden border border-border">
                {(['kg', 'lbs'] as const).map(u => (
                  <button key={u} onClick={() => setUnits(u)}
                    className={`px-4 py-2 text-sm font-medium transition-all ${units === u ? 'bg-success text-white' : 'bg-card text-secondary-text'}`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-secondary-text text-xs mb-6">Used to calculate relative strength rankings.</p>

            <button
              onClick={() => { if (name.trim()) { setError(''); setStep(3) } }}
              disabled={!name.trim()}
              className="w-full bg-success active:scale-95 disabled:opacity-40 text-white font-semibold py-4 rounded-2xl text-lg transition-all mt-auto">
              Next →
            </button>
          </>
        )}

        {/* ── Step 3: Training ─────────────────────────────────────────────── */}
        {step === 3 && (
          <>
            {progressDots}
            <button onClick={() => setStep(2)} className="text-secondary-text text-sm mb-5 self-start">← Back</button>
            <h1 className="text-3xl font-bold text-white mb-1">Your training</h1>
            <p className="text-secondary-text text-sm mb-6">Sets your default intensity and starting weights.</p>

            <label className="text-secondary-text text-xs uppercase tracking-wide mb-1.5 block">Experience level</label>
            <div className="flex flex-col gap-2 mb-5">
              {EXPERIENCE.map(e => (
                <button key={e.value} onClick={() => setExperience(e.value as typeof experience)}
                  className={`p-4 rounded-xl border text-left transition-all ${experience === e.value ? 'bg-success/15 border-success' : 'bg-card border-border'}`}>
                  <p className={`font-semibold text-sm ${experience === e.value ? 'text-success' : 'text-white'}`}>{e.label}</p>
                  <p className="text-secondary-text text-xs mt-0.5">{e.sub}</p>
                </button>
              ))}
            </div>

            <label className="text-secondary-text text-xs uppercase tracking-wide mb-1.5 block">Primary goal</label>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {GOALS.map(g => (
                <button key={g.value} onClick={() => setGoal(g.value as typeof goal)}
                  className={`p-4 rounded-xl border text-left transition-all ${goal === g.value ? 'bg-success/15 border-success' : 'bg-card border-border'}`}>
                  <p className={`font-semibold text-sm ${goal === g.value ? 'text-success' : 'text-white'}`}>{g.label}</p>
                  <p className="text-secondary-text text-xs mt-0.5">{g.sub}</p>
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button onClick={handleFinish} disabled={loading || !experience || !goal}
              className="w-full bg-success active:scale-95 disabled:opacity-40 text-white font-semibold py-4 rounded-2xl text-lg transition-all mt-auto">
              {loading ? 'Saving...' : "Let\'s train"}
            </button>
          </>
        )}

      </div>
    </>
  )
}
