import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit, createRateLimitResponse, rateLimits } from './lib/rate-limit'

// Paths that require rate limiting
const PROTECTED_PATHS = [
  '/api/auth',
  '/api/user',
  '/api/algorithms',
  '/api/scenarios',
  '/api/reports',
]

// Paths with stricter limits (auth endpoints)
const STRICT_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip rate limiting for non-API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Skip rate limiting for health checks
  if (pathname === '/api/health') {
    return NextResponse.next()
  }

  // Determine which rate limit to apply
  const isStrictPath = STRICT_PATHS.some(path => pathname.startsWith(path))
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path))

  if (!isProtectedPath) {
    return NextResponse.next()
  }

  // Apply rate limiting
  const config = isStrictPath ? rateLimits.auth : rateLimits.api
  const limit = rateLimit(request, config)

  if (limit.limited) {
    return createRateLimitResponse(limit.resetTime)
  }

  // Add rate limit headers to response
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', limit.remaining.toString())
  response.headers.set('X-RateLimit-Reset', limit.resetTime.toString())

  return response
}

export const config = {
  matcher: [
    /*
     * Match all API paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/api/:path*',
  ],
}
