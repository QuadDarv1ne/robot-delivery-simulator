import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleApiError, successResponse } from '@/lib/api-error'

export async function GET() {
  try {
    // Get overall stats
    const totalDeliveries = await db.deliveryResult.count()
    const successfulDeliveries = await db.deliveryResult.count({
      where: { status: 'success' }
    })
    const totalUsers = await db.user.count({
      where: { role: 'student' }
    })
    const totalDistance = await db.deliveryResult.aggregate({
      _sum: { distance: true }
    })
    const totalCollisions = await db.deliveryResult.aggregate({
      _sum: { collisions: true }
    })

    // Get daily stats for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyStats = await db.deliveryResult.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: { id: true },
      _sum: { distance: true, collisions: true }
    })

    // Get top performers by different metrics
    const topBySuccess = await db.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        name: true,
        avatar: true,
        deliveries: {
          select: { status: true }
        }
      },
      take: 5
    })

    const topBySpeed = await db.deliveryResult.findMany({
      where: { status: 'success' },
      select: {
        duration: true,
        user: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { duration: 'asc' },
      take: 5
    })

    // Recent activity
    const recentActivity = await db.deliveryResult.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        distance: true,
        duration: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, avatar: true, group: true }
        }
      }
    })

    return successResponse({
      overview: {
        totalDeliveries,
        successfulDeliveries,
        successRate: totalDeliveries > 0 
          ? Math.round((successfulDeliveries / totalDeliveries) * 100) 
          : 0,
        totalUsers,
        totalDistance: totalDistance._sum.distance || 0,
        totalCollisions: totalCollisions._sum.collisions || 0,
      },
      dailyStats: dailyStats.map(d => ({
        date: d.createdAt,
        deliveries: d._count.id,
        distance: d._sum.distance || 0,
        collisions: d._sum.collisions || 0,
      })),
      topBySpeed: topBySpeed.map(d => ({
        user: d.user,
        duration: d.duration
      })),
      recentActivity: recentActivity.map(a => ({
        id: a.id,
        status: a.status,
        distance: a.distance,
        duration: a.duration,
        createdAt: a.createdAt,
        user: a.user
      }))
    })

  } catch (error) {
    return handleApiError(error, 'LeaderboardStats.GET')
  }
}
