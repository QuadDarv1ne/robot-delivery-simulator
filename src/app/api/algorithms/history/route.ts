import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - List algorithm run history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
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

    return NextResponse.json({
      deliveries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch run history:', error)
    return NextResponse.json(
      { error: 'Ошибка получения истории запусков' },
      { status: 500 }
    )
  }
}
