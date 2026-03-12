import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  interval: number // ms
  maxRequests: number
}

interface ClientData {
  count: number
  resetTime: number
}

const clients = new Map<string, ClientData>()

const defaultConfig: RateLimitConfig = {
  interval: 60 * 1000, // 1 minute
  maxRequests: 10,
}

const authConfig: RateLimitConfig = {
  interval: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
}

const apiConfig: RateLimitConfig = {
  interval: 60 * 1000, // 1 minute
  maxRequests: 30,
}

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded 
    ? forwarded.split(',')[0].trim() 
    : request.headers.get('x-real-ip') || '127.0.0.1'
  return ip
}

export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = defaultConfig
): { limited: boolean; remaining: number; resetTime: number } {
  const ip = getClientIP(request)
  const now = Date.now()
  
  let client = clients.get(ip)
  
  if (!client || now > client.resetTime) {
    client = {
      count: 1,
      resetTime: now + config.interval,
    }
    clients.set(ip, client)
    return { limited: false, remaining: config.maxRequests - 1, resetTime: client.resetTime }
  }
  
  client.count++
  
  if (client.count > config.maxRequests) {
    return { 
      limited: true, 
      remaining: 0, 
      resetTime: client.resetTime 
    }
  }
  
  return { 
    limited: false, 
    remaining: config.maxRequests - client.count, 
    resetTime: client.resetTime 
  }
}

export function createRateLimitResponse(resetTime: number): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
  
  return NextResponse.json(
    { 
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter 
    },
    { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toString(),
        'Retry-After': retryAfter.toString(),
      },
    }
  )
}

export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetTime: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', defaultConfig.maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetTime.toString())
  return response
}

export const rateLimits = {
  default: defaultConfig,
  auth: authConfig,
  api: apiConfig,
}
