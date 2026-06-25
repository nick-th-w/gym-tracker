import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE = 'gym-auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow the login page and auth API through
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE)?.value
  if (token !== process.env.AUTH_SECRET) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
