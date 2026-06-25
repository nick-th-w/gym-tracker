'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Background from '@/components/Background'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Incorrect email or password — try again')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <>
      <Background />
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">The Grind</h1>
        <p className="text-secondary-text text-sm mb-12">Sign in to continue</p>

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
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full bg-card border border-border text-white rounded-xl px-4 py-4 mb-4 text-center text-lg placeholder:text-secondary-text"
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-success active:scale-95 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl text-lg transition-all mb-4"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <p className="text-secondary-text text-sm">
            No account?{' '}
            <Link href="/register" className="text-primary underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </>
  )
}
