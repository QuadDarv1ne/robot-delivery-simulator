import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'all' // all, week, month
    const group = searchParams.get('group') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build date filter
    let dateFilter: any = {}
    const now = new Date()
    
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateFilter = { gte: weekAgo }
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      dateFilter = { gte: monthAgo }
    }

    // Build where clause for users
    const userWhere: any = { role: 'student' }
    if (group) {
      userWhere.group = group
    }

    // Get leaderboard data
    const users = await db.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        email: true,
        group: true,
        avatar: true,
        createdAt: true,
        deliveries: {
          where: dateFilter.gte ? { createdAt: dateFilter } : {},
          select: {
            status: true,
            distance: true,
            duration: true,
            collisions: true,
            createdAt: true,
          }
        },
        _count: {
          select: {
            achievements: true
          }
        }
      }
    })

    // Calculate stats for each user
    const leaderboard = users.map(user => {
      const deliveries = user.deliveries
      const totalDeliveries = deliveries.length
      const successfulDeliveries = deliveries.filter(d => d.status === 'success').length
      const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0
      const totalDistance = deliveries.reduce((sum, d) => sum + (d.distance || 0), 0)
      const totalCollisions = deliveries.reduce((sum, d) => sum + (d.collisions || 0), 0)
      const avgDuration = totalDeliveries > 0 
        ? deliveries.reduce((sum, d) => sum + (d.duration || 0), 0) / totalDeliveries 
        : 0
      const bestTime = deliveries.length > 0 
        ? Math.min(...deliveries.filter(d => d.status === 'success').map(d => d.duration || Infinity))
        : null

      // Calculate score
      // Score formula: success% * 100 + deliveries * 10 + distance/100 - collisions * 5 + achievements * 20
      const score = Math.round(
        successRate * 100 + 
        totalDeliveries * 10 + 
        totalDistance / 100 - 
        totalCollisions * 5 +
        user._count.achievements * 20
      )

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        group: user.group,
        avatar: user.avatar,
        totalDeliveries,
        successfulDeliveries,
        successRate: Math.round(successRate * 10) / 10,
        totalDistance,
        totalCollisions,
        avgDuration: Math.round(avgDuration),
        bestTime: bestTime === Infinity ? null : bestTime,
        achievements: user._count.achievements,
        score,
      }
    })

    // Sort by score and add rank
    const sortedLeaderboard = leaderboard
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
        previousRank: null, // Could be calculated with historical data
      }))

    // Get available groups for filter
    const groups = await db.user.findMany({
      where: { role: 'student', group: { not: null } },
      select: { group: true },
      distinct: ['group']
    })

    // Get current user position (if authenticated)
    const currentUserId = request.headers.get('x-user-id')
    let currentUserPosition = null
    if (currentUserId) {
      const allSorted = leaderboard.sort((a, b) => b.score - a.score)
      const position = allSorted.findIndex(u => u.id === currentUserId)
      if (position !== -1) {
        currentUserPosition = {
          rank: position + 1,
          ...allSorted[position]
        }
      }
    }

    return NextResponse.json({
      leaderboard: sortedLeaderboard,
      groups: groups.map(g => g.group).filter(Boolean),
      currentUserPosition,
      period,
      total: leaderboard.length,
    })

  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { error: 'Ошибка загрузки рейтинга' },
      { status: 500 }
    )
  }
}
