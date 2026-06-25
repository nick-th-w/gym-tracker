'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full border border-red-500/40 text-red-400 font-semibold py-4 rounded-2xl text-base active:scale-95 transition-all"
    >
      Sign out
    </button>
  )
}
