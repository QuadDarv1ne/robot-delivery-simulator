import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createErrorResponse } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return createErrorResponse('Не авторизован', 401)
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, role: true, group: true }
    })

    if (!user) {
      return createErrorResponse('Пользователь не найден', 404)
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'all'

    // Get user stats
    const deliveries = await db.deliveryResult.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    const totalDeliveries = deliveries.length
    const successfulDeliveries = deliveries.filter(d => d.status === 'success').length
    const totalDistance = deliveries.reduce((sum, d) => sum + (d.distance || 0), 0)
    const totalCollisions = deliveries.reduce((sum, d) => sum + (d.collisions || 0), 0)
    const avgDuration = totalDeliveries > 0
      ? deliveries.reduce((sum, d) => sum + (d.duration || 0), 0) / totalDeliveries
      : 0

    // Get algorithms
    const algorithms = await db.algorithm.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 10
    })

    // Build report data as JSON
    const reportData = {
      generatedAt: new Date().toISOString(),
      user: {
        name: user.name || 'Unknown',
        role: user.role,
        group: user.group
      },
      period,
      stats: {
        totalDeliveries,
        successfulDeliveries,
        successRate: totalDeliveries > 0
          ? ((successfulDeliveries / totalDeliveries) * 100).toFixed(1)
          : '0',
        totalDistance: Math.round(totalDistance),
        totalCollisions,
        avgDuration: Math.round(avgDuration)
      },
      deliveries: deliveries.slice(0, 20).map(d => ({
        date: new Date(d.createdAt).toISOString(),
        status: d.status,
        distance: Math.round(d.distance || 0),
        duration: d.duration || 0,
        collisions: d.collisions || 0,
        scenario: d.scenarioName || 'Unknown'
      })),
      algorithms: algorithms.map(a => ({
        name: a.name,
        language: a.language,
        runs: a.runsCount,
        avgScore: a.avgScore,
        createdAt: new Date(a.createdAt).toISOString()
      }))
    }

    // Return JSON report (safe, cross-platform)
    // For PDF generation, consider using a dedicated service or library
    return NextResponse.json(reportData, {
      headers: {
        'Content-Disposition': `attachment; filename="robot-simulator-report-${new Date().toISOString().split('T')[0]}.json"`
      }
    })

  } catch (error) {
    console.error('ReportExport.POST:', error)
    return createErrorResponse('Ошибка генерации отчёта', 500)
  }
}
