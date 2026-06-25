'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EditNameButton({ currentName }: { currentName: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed || trimmed === currentName) { setEditing(false); return }

    setLoading(true)
    const supabase = createClient()
    await supabase.auth.updateUser({ data: { display_name: trimmed } })
    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 ml-2 flex-1 justify-end">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          maxLength={40}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
          className="bg-transparent border-b border-primary text-white text-sm text-right outline-none w-32"
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="text-success text-xs font-semibold disabled:opacity-50"
        >
          {loading ? '...' : 'Save'}
        </button>
        <button onClick={() => { setName(currentName); setEditing(false) }} className="text-secondary-text text-xs">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-primary text-xs font-medium"
    >
      Edit
    </button>
  )
}
