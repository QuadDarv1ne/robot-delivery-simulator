import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/session'
import { handleApiError, successResponse } from '@/lib/api-error'

// GET - List algorithm run history
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const algorithmId = searchParams.get('algorithmId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = { userId: user.id }
    if (algorithmId) {
      where.algorithmId = algorithmId
    }

    const [deliveries, total] = await Promise.all([
      db.deliveryResult.findMany({
        where,
        include: {
          algorithm: {
            select: {
              id: true,
              name: true,
              language: true
            }
          },
          scenario: {
            select: {
              id: true,
              name: true,
              difficulty: true
            }
          }
        },
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.deliveryResult.count({ where })
    ])

    return successResponse({
      deliveries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleApiError(error, 'AlgorithmHistory.GET')
  }
}
