import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/api-error'
import { logger } from '@/lib/logger'

export async function GET() {
  const startTime = Date.now()

  try {
    let dbStatus = 'disconnected'
    let dbLatency: number | null = null

    try {
      const dbStart = Date.now()
      await db.$queryRaw`SELECT 1`
      dbStatus = 'connected'
      dbLatency = Date.now() - dbStart
    } catch (error) {
      dbStatus = 'error'
      logger.warn('Database health check failed', 'Health', error)
    }

    const health = {
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      services: {
        database: {
          status: dbStatus,
          latency: dbLatency,
        },
      },
      responseTime: Date.now() - startTime,
    }

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    return handleApiError(error, 'Health.GET')
  }
}
