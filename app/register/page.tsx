'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Background from '@/components/Background'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Redirect to profile setup after sign-up
      router.push('/profile/setup')
      router.refresh()
    }
  }

  return (
    <>
      <Background />
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Nickel and Grind</h1>
        <p className="text-secondary-text text-sm mb-12">Create your account</p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
            autoComplete="email"
            className="w-full bg-card border border-border text-white rounded-xl px-4 py-4 mb-3 text-center text-lg placeholder:text-secondary-text"
          />
          <input
            type="password"
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full bg-card border border-border text-white rounded-xl px-4 py-4 mb-3 text-center text-lg placeholder:text-secondary-text"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="w-full bg-card border border-border text-white rounded-xl px-4 py-4 mb-4 text-center text-lg placeholder:text-secondary-text"
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading || !email || !password || !confirm}
            className="w-full bg-success active:scale-95 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl text-lg transition-all mb-4"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
          <p className="text-secondary-text text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </>
  )
}
