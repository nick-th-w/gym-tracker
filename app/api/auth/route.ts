import { NextResponse } from 'next/server'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 days
}

// POST /api/auth — login
export async function POST(request: Request) {
  const { password } = await request.json()

  if (!password || password !== process.env.AUTH_PASSWORD) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('gym-auth', process.env.AUTH_SECRET!, COOKIE_OPTS)
  return res
}

// DELETE /api/auth — logout
export async function DELETE() {
  const res = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'))
  res.cookies.set('gym-auth', '', { ...COOKIE_OPTS, maxAge: 0 })
  return res
}
