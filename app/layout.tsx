import type { Metadata } from 'next'
import { Gabarito } from 'next/font/google'
import { Suspense } from 'react'
import Link from 'next/link'
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
  title: 'The Grind',
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
          <Link
            href="/profile"
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/20 active:scale-95 rounded-full pl-2 pr-3 py-1 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
            <span className="text-white text-sm font-bold tracking-tight">
              {user?.user_metadata?.display_name ?? 'The Grind'}
            </span>
          </Link>
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
