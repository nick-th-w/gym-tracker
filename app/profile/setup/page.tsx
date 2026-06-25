'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Background from '@/components/Background'
import { createClient } from '@/lib/supabase/client'

type Screen = 1 | 2

const GOALS = [
  { value: 'strength',    label: 'Strength',        sub: 'Lift heavy, build power' },
  { value: 'hypertrophy', label: 'Hypertrophy',     sub: 'Build muscle size' },
  { value: 'fitness',     label: 'General Fitness',  sub: 'Feel good, stay active' },
  { value: 'fat_loss',    label: 'Fat Loss',         sub: 'Lose weight, get lean' },
]

const EXPERIENCE = [
  { value: 'beginner',     label: 'Beginner',     sub: 'Less than 1 year of consistent training' },
  { value: 'intermediate', label: 'Intermediate', sub: '1–3 years of consistent training' },
  { value: 'advanced',     label: 'Advanced',     sub: '3+ years of consistent training' },
]

export default function ProfileSetupPage() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Screen 1 fields
  const [name, setName] = useState('')
  const [sex, setSex] = useState<'male' | 'female' | 'other' | ''>('')
  const [bodyWeight, setBodyWeight] = useState('')
  const [units, setUnits] = useState<'kg' | 'lbs'>('kg')

  // Screen 2 fields
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('')
  const [goal, setGoal] = useState<'strength' | 'hypertrophy' | 'fitness' | 'fat_loss' | ''>('')

  function screen1Valid() {
    return name.trim().length > 0 && sex !== '' && bodyWeight !== '' && parseFloat(bodyWeight) > 0
  }

  function screen2Valid() {
    return experience !== '' && goal !== ''
  }

  async function handleFinish() {
    if (!screen2Valid()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Session expired — please sign in again'); setLoading(false); return }

    const weightKg = units === 'lbs'
      ? parseFloat(bodyWeight) * 0.453592
      : parseFloat(bodyWeight)

    // Save display name to auth metadata
    await supabase.auth.updateUser({ data: { display_name: name.trim() } })

    // Save full profile
    const { error: dbError } = await supabase.from('user_profiles').upsert({
      user_id: user.id,
      display_name: name.trim(),
      sex,
      body_weight_kg: Math.round(weightKg * 10) / 10,
      units,
      experience,
      primary_goal: goal,
    })

    if (dbError) {
      setError('Could not save your profile — try again')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <>
      <Background />
      <div className="flex flex-col min-h-screen px-6 pt-14 pb-8">

        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-10">
          {[1, 2].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${s === screen ? 'w-8 bg-success' : s < screen ? 'w-8 bg-success/40' : 'w-4 bg-border'}`} />
          ))}
        </div>

        {screen === 1 && (
          <>
            <h1 className="text-3xl font-bold text-white mb-2">About you</h1>
            <p className="text-secondary-text text-sm mb-8">This helps us personalise your starting weights and rankings.</p>

            {/* Name */}
            <label className="text-secondary-text text-xs uppercase tracking-wide mb-2 block">What should we call you?</label>
            <input
              type="text"
              placeholder="Name or nickname"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              maxLength={40}
              className="w-full bg-card border border-border text-white rounded-xl px-4 py-4 mb-6 text-lg placeholder:text-secondary-text"
            />

            {/* Sex */}
            <label className="text-secondary-text text-xs uppercase tracking-wide mb-2 block">Sex</label>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {(['male', 'female', 'other'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSex(s)}
                  className={`py-3 rounded-xl border text-sm font-medium capitalize transition-all ${sex === s ? 'bg-success/15 border-success text-success' : 'bg-card border-border text-secondary-text'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Body weight */}
            <label className="text-secondary-text text-xs uppercase tracking-wide mb-2 block">Body weight</label>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder={units === 'kg' ? '75' : '165'}
                value={bodyWeight}
                onChange={e => setBodyWeight(e.target.value)}
                className="flex-1 bg-card border border-border text-white rounded-xl px-4 py-4 text-lg placeholder:text-secondary-text"
              />
              <div className="flex rounded-xl overflow-hidden border border-border">
                {(['kg', 'lbs'] as const).map(u => (
                  <button
                    key={u}
                    onClick={() => setUnits(u)}
                    className={`px-4 py-2 text-sm font-medium transition-all ${units === u ? 'bg-success text-white' : 'bg-card text-secondary-text'}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-secondary-text text-xs mb-8">Used to calculate relative strength rankings.</p>

            <button
              onClick={() => { if (screen1Valid()) { setScreen(2); setError('') } }}
              disabled={!screen1Valid()}
              className="w-full bg-success active:scale-95 disabled:opacity-40 text-white font-semibold py-4 rounded-2xl text-lg transition-all mt-auto"
            >
              Next →
            </button>
          </>
        )}

        {screen === 2 && (
          <>
            <button onClick={() => setScreen(1)} className="text-secondary-text text-sm mb-6 self-start">← Back</button>
            <h1 className="text-3xl font-bold text-white mb-2">Your training</h1>
            <p className="text-secondary-text text-sm mb-8">Sets your default intensity and starting weights.</p>

            {/* Experience */}
            <label className="text-secondary-text text-xs uppercase tracking-wide mb-2 block">Experience level</label>
            <div className="flex flex-col gap-2 mb-6">
              {EXPERIENCE.map(e => (
                <button
                  key={e.value}
                  onClick={() => setExperience(e.value as typeof experience)}
                  className={`p-4 rounded-xl border text-left transition-all ${experience === e.value ? 'bg-success/15 border-success' : 'bg-card border-border'}`}
                >
                  <p className={`font-semibold text-sm ${experience === e.value ? 'text-success' : 'text-white'}`}>{e.label}</p>
                  <p className="text-secondary-text text-xs mt-0.5">{e.sub}</p>
                </button>
              ))}
            </div>

            {/* Primary goal */}
            <label className="text-secondary-text text-xs uppercase tracking-wide mb-2 block">Primary goal</label>
            <div className="grid grid-cols-2 gap-2 mb-8">
              {GOALS.map(g => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value as typeof goal)}
                  className={`p-4 rounded-xl border text-left transition-all ${goal === g.value ? 'bg-success/15 border-success' : 'bg-card border-border'}`}
                >
                  <p className={`font-semibold text-sm ${goal === g.value ? 'text-success' : 'text-white'}`}>{g.label}</p>
                  <p className="text-secondary-text text-xs mt-0.5">{g.sub}</p>
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <button
              onClick={handleFinish}
              disabled={loading || !screen2Valid()}
              className="w-full bg-success active:scale-95 disabled:opacity-40 text-white font-semibold py-4 rounded-2xl text-lg transition-all mt-auto"
            >
              {loading ? 'Saving...' : "Let's train"}
            </button>
          </>
        )}

      </div>
    </>
  )
}
