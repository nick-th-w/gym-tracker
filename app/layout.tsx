import type { Metadata } from 'next'
import { Gabarito } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import Background from '@/components/Background'

const gabarito = Gabarito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Nickel and Grind',
  description: 'Track your workouts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={gabarito.className}>
        <Background />
        <main className="pb-20 min-h-screen">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
