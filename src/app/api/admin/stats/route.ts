import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// Check admin access
async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value

  if (!token) return null

  const session = await db.userSession.findUnique({
    where: { token },
    include: { user: true }
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  if (session.user.role !== 'admin' && session.user.role !== 'teacher') {
    return null
  }

  return session.user
}

export async function GET() {
  try {
    const admin = await checkAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    // Get all statistics
    const [
      totalUsers,
      studentsCount,
      teachersCount,
      adminsCount,
      totalDeliveries,
      successfulDeliveries,
      totalDistanceResult,
      totalCollisionsResult,
      recentUsers,
      recentDeliveries,
      topPerformers,
      dailyStats
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'student' } }),
      db.user.count({ where: { role: 'teacher' } }),
      db.user.count({ where: { role: 'admin' } }),
      db.deliveryResult.count(),
      db.deliveryResult.count({ where: { status: 'success' } }),
      db.user.aggregate({
        _sum: { totalDistance: true }
      }),
      db.user.aggregate({
        _sum: { totalCollisions: true }
      }),
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      }),
      db.deliveryResult.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          scenarioName: true,
          status: true,
          distance: true,
          duration: true,
          createdAt: true,
          user: {
            select: { name: true, email: true }
          }
        }
      }),
      db.user.findMany({
        take: 5,
        where: { totalDeliveries: { gt: 0 } },
        orderBy: { successRate: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          successRate: true,
          totalDeliveries: true,
          bestTime: true
        }
      }),
      // Get daily registrations for last 7 days
      db.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT date(created_at) as date, COUNT(*) as count
        FROM User
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY date(created_at)
        ORDER BY date DESC
      `
    ])

    // Calculate averages
    const averageSuccessRate = totalDeliveries > 0 
      ? Math.round((successfulDeliveries / totalDeliveries) * 100) 
      : 0

    return NextResponse.json({
      overview: {
        totalUsers,
        studentsCount,
        teachersCount,
        adminsCount,
        totalDeliveries,
        successfulDeliveries,
        failedDeliveries: totalDeliveries - successfulDeliveries,
        averageSuccessRate,
        totalDistance: totalDistanceResult._sum.totalDistance || 0,
        totalCollisions: totalCollisionsResult._sum.totalCollisions || 0
      },
      recentUsers,
      recentDeliveries,
      topPerformers,
      dailyStats
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
