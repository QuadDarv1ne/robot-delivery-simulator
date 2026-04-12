import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit, createRateLimitResponse, rateLimits, getClientIP } from '@/lib/rate-limit'
import { handleApiError, successResponse } from '@/lib/api-error'

interface LeaderboardUser {
  id: string
  name: string | null
  email: string
  group: string | null
  avatar: string | null
  totalDeliveries: number
  successfulDeliveries: number
  successRate: number
  totalDistance: number
  totalCollisions: number
  avgDuration: number
  bestTime: number | null
  achievements: number
  score: number
  rank?: number
  previousRank?: number | null
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(request, rateLimits.api)

  if (limit.limited) {
    return createRateLimitResponse(limit.resetTime)
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'all'
    const group = searchParams.get('group') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limitParam = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    let dateFilter: any = {}
    const now = new Date()

    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateFilter = { gte: weekAgo }
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      dateFilter = { gte: monthAgo }
    }

    const userWhere: any = { role: 'student' }
    if (group) {
      userWhere.group = group
    }

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
    const leaderboard: LeaderboardUser[] = users.map(user => {
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

    const total = sortedLeaderboard.length
    const totalPages = Math.ceil(total / limitParam)
    const paginatedLeaderboard = sortedLeaderboard
      .slice((page - 1) * limitParam, page * limitParam)
      .map((user, index) => ({
        ...user,
        rank: (page - 1) * limitParam + index + 1,
        previousRank: null,
      }))

    // Get available groups for filter
    const groups = await db.user.findMany({
      where: { role: 'student', group: { not: null } },
      select: { group: true },
      distinct: ['group']
    })

    // Get current user position (if authenticated)
    const currentUserId = request.headers.get('x-user-id')
    let currentUserPosition: LeaderboardUser | null = null
    if (currentUserId) {
      const position = sortedLeaderboard.findIndex(u => u.id === currentUserId)
      if (position !== -1) {
        currentUserPosition = {
          ...sortedLeaderboard[position],
          rank: position + 1
        }
      }
    }

    const response = NextResponse.json({
      leaderboard: paginatedLeaderboard,
      groups: groups.map(g => g.group).filter(Boolean),
      currentUserPosition,
      period,
      total,
      pagination: {
        page,
        limit: limitParam,
        totalPages,
      },
    })

    response.headers.set('X-RateLimit-Limit', rateLimits.api.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', limit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', limit.resetTime.toString())

    return response

  } catch (error) {
    return handleApiError(error, 'Leaderboard.GET')
  }
}
