import type { Metadata } from 'next'
import { Gabarito } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import Background from '@/components/Background'
import SessionCountBadge from '@/components/SessionCountBadge'
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

  return (
    <html lang="en">
      <body className={gabarito.className}>
        <Background />

        {/* ── Slim persistent header ──────────────────────────────────────── */}
        <header className="fixed top-0 left-0 right-0 z-50 h-11 flex items-center justify-between px-4" style={{ backgroundColor: '#8aad3e' }}>
          <span className="text-white text-sm font-bold tracking-tight">
            {user?.user_metadata?.display_name ?? 'The Grind'}
          </span>
          {/* Loads asynchronously — does not block page render */}
          <Suspense fallback={null}>
            <SessionCountBadge />
          </Suspense>
        </header>

        <main className="pt-11 pb-20 min-h-screen">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
