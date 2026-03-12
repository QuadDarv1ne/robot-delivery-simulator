import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Check database connection
    let dbStatus = 'disconnected'
    try {
      await db.$queryRaw`SELECT 1`
      dbStatus = 'connected'
    } catch {
      dbStatus = 'error'
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
      },
      services: {
        database: dbStatus,
      },
      responseTime: Date.now() - startTime,
    }

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503,
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    }, { status: 503 })
  }
}
