'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Background from '@/components/Background'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Incorrect password — try again')
      setLoading(false)
    }
  }

  return (
    <>
      <Background />
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Gym Tracker</h1>
        <p className="text-secondary-text text-sm mb-12">Enter your password to continue</p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            className="w-full bg-card border border-border text-white rounded-xl px-4 py-4 mb-4 text-center text-lg placeholder:text-secondary-text"
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-success active:scale-95 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </>
  )
}
