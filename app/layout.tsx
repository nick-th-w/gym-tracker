import type { Metadata } from 'next'
import { Gabarito } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import Background from '@/components/Background'
import { createClient } from '@/lib/supabase/server'

const gabarito = Gabarito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Nickel and Grind',
  description: 'Track your workouts',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let sessionCount: number | null = null
  if (user) {
    const { count } = await supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('completed', true)
    sessionCount = count
  }

  return (
    <html lang="en">
      <body className={gabarito.className}>
        <Background />

        {/* ── Slim persistent header ──────────────────────────────────────── */}
        <header className="fixed top-0 left-0 right-0 z-50 h-11 flex items-center justify-between px-4" style={{ backgroundColor: '#8aad3e' }}>
          <span className="text-white text-sm font-bold tracking-tight">
            {user?.user_metadata?.display_name ?? 'The Grind'}
          </span>
          {sessionCount !== null && sessionCount > 0 && (
            <span className="text-white text-xs font-bold bg-white/20 border border-white/30 rounded-full px-3 py-1">
              #{sessionCount}
            </span>
          )}
        </header>

        <main className="pt-11 pb-20 min-h-screen">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
