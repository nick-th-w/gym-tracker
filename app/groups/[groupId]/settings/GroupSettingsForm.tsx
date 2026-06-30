'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Group, LeaderboardEntry } from '@/lib/types'

export default function GroupSettingsForm({
  group,
  members,
  currentUserId,
}: {
  group: Group
  members: LeaderboardEntry[]
  currentUserId: string
}) {
  const router = useRouter()
  const [name, setName] = useState(group.name)
  const [loading, setLoading] = useState(false)

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name.trim() === group.name) return
    setLoading(true)
    await fetch('/api/groups/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: group.id, name }),
    })
    setLoading(false)
    router.refresh()
  }

  async function handleRegenerateCode() {
    if (!confirm('Regenerate the invite code? The old code will stop working.')) return
    setLoading(true)
    await fetch('/api/groups/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: group.id, regenerateCode: true }),
    })
    setLoading(false)
    router.refresh()
  }

  async function handleRemoveMember(userId: string, displayName: string) {
    if (!confirm(`Remove ${displayName} from the group?`)) return
    setLoading(true)
    await fetch('/api/groups/remove-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: group.id, userId }),
    })
    setLoading(false)
    router.refresh()
  }

  async function handleDeleteGroup() {
    if (!confirm('Delete this group permanently? All members will be removed. This cannot be undone.')) return
    setLoading(true)
    await fetch('/api/groups/settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: group.id }),
    })
    router.push('/groups')
    router.refresh()
  }

  return (
    <div>
      <form onSubmit={handleRename} className="bg-card border border-border rounded-2xl p-4 mb-6">
        <p className="text-secondary-text text-xs uppercase tracking-wide mb-2">Group name</p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={60}
          className="w-full bg-background border border-border text-white rounded-xl px-4 py-3 mb-3 text-sm"
        />
        <button
          type="submit"
          disabled={loading || !name.trim() || name.trim() === group.name}
          className="w-full bg-primary text-white rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50"
        >
          Save name
        </button>
      </form>

      <div className="bg-card border border-border rounded-2xl p-4 mb-6">
        <p className="text-secondary-text text-xs uppercase tracking-wide mb-2">Invite code</p>
        <div className="flex items-center justify-between">
          <p className="text-white text-lg font-mono">{group.invite_code}</p>
          <button
            onClick={handleRegenerateCode}
            disabled={loading}
            className="text-primary text-xs font-medium disabled:opacity-50"
          >
            Regenerate
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden mb-6">
        <p className="text-secondary-text text-xs uppercase tracking-wide px-4 pt-3 pb-2">Members</p>
        {members.map(member => (
          <div key={member.user_id} className="flex items-center justify-between px-4 py-3">
            <span className="text-white text-sm">{member.display_name}</span>
            {member.user_id !== currentUserId && (
              <button
                onClick={() => handleRemoveMember(member.user_id, member.display_name)}
                disabled={loading}
                className="text-red-400 text-xs font-medium disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleDeleteGroup}
        disabled={loading}
        className="w-full border border-red-500/40 text-red-400 font-semibold py-3 rounded-2xl text-sm active:scale-95 transition-all disabled:opacity-50"
      >
        Delete group
      </button>
    </div>
  )
}
