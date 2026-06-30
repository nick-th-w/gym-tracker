'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GroupJoinCreate() {
  const router = useRouter()
  const [mode, setMode] = useState<'join' | 'create'>('join')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Could not join group'); return }
    router.push(`/groups/${data.groupId}`)
    router.refresh()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/groups/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Could not create group'); return }
    router.push(`/groups/${data.groupId}`)
    router.refresh()
  }

  return (
    <div>
      <div className="flex bg-card border border-border rounded-xl p-1 mb-4">
        <button
          onClick={() => setMode('join')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'join' ? 'bg-primary text-white' : 'text-secondary-text'}`}
        >
          Join a group
        </button>
        <button
          onClick={() => setMode('create')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'create' ? 'bg-primary text-white' : 'text-secondary-text'}`}
        >
          Create a group
        </button>
      </div>

      {mode === 'join' ? (
        <form onSubmit={handleJoin} className="bg-card border border-border rounded-2xl p-4">
          <p className="text-secondary-text text-xs uppercase tracking-wide mb-2">Invite code</p>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="e.g. a1b2c3d4"
            autoFocus
            maxLength={20}
            className="w-full bg-background border border-border text-white rounded-xl px-4 py-3 mb-3 text-center text-lg placeholder:text-secondary-text"
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full bg-primary text-white rounded-xl py-3 font-semibold disabled:opacity-50"
          >
            {loading ? 'Joining…' : 'Join group'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-2xl p-4">
          <p className="text-secondary-text text-xs uppercase tracking-wide mb-2">Group name</p>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Gym Crew"
            autoFocus
            maxLength={60}
            className="w-full bg-background border border-border text-white rounded-xl px-4 py-3 mb-3 text-center text-lg placeholder:text-secondary-text"
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-primary text-white rounded-xl py-3 font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create group'}
          </button>
        </form>
      )}
    </div>
  )
}
