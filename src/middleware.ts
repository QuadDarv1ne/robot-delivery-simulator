import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit, createRateLimitResponse, rateLimits } from './lib/rate-limit'

const PROTECTED_PATHS = [
  '/api/auth',
  '/api/user',
  '/api/algorithms',
  '/api/scenarios',
  '/api/reports',
]

const STRICT_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/api') || pathname === '/api/health') {
    return NextResponse.next()
  }

  const isStrictPath = STRICT_PATHS.some(path => pathname.startsWith(path))
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path))

  if (!isProtectedPath) {
    return NextResponse.next()
  }

  const config = isStrictPath ? rateLimits.auth : rateLimits.api
  const limit = rateLimit(request, config)

  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', limit.remaining.toString())
  response.headers.set('X-RateLimit-Reset', limit.resetTime.toString())

  if (limit.limited) {
    return createRateLimitResponse(limit.resetTime)
  }

  return response
}

export const config = {
  matcher: '/api/:path*',
}
