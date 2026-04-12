import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { algorithmIdSchema } from '@/lib/validators'
import { handleApiError, successResponse } from '@/lib/api-error'

// GET - List favorite algorithms
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

    const favorites = await db.favoriteAlgorithm.findMany({
      where: { userId: user.id },
      include: {
        algorithm: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return successResponse({
      favorites: favorites.map(f => f.algorithm)
    })
  } catch (error) {
    return handleApiError(error, 'AlgorithmFavorite.GET')
  }
}

// POST - Add to favorites
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validation = algorithmIdSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      return NextResponse.json(
        { error: 'Ошибка валидации', details: errors },
        { status: 400 }
      )
    }

    const { id: algorithmId } = validation.data

    // Check if algorithm exists
    const algorithm = await db.algorithm.findUnique({
      where: { id: algorithmId }
    })

    if (!algorithm) {
      return NextResponse.json({ error: 'Алгоритм не найден' }, { status: 404 })
    }

    // Check if already favorited
    const existing = await db.favoriteAlgorithm.findUnique({
      where: {
        userId_algorithmId: {
          userId: user.id,
          algorithmId
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Уже в избранном' }, { status: 400 })
    }

    const favorite = await db.favoriteAlgorithm.create({
      data: {
        userId: user.id,
        algorithmId
      },
      include: {
        algorithm: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return successResponse({ favorite: favorite.algorithm })
  } catch (error) {
    return handleApiError(error, 'AlgorithmFavorite.POST')
  }
}

// DELETE - Remove from favorites
export async function DELETE(request: NextRequest) {
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
    const algorithmId = searchParams.get('id')

    if (!algorithmId) {
      return NextResponse.json({ error: 'ID алгоритма обязателен' }, { status: 400 })
    }

    const favorite = await db.favoriteAlgorithm.findUnique({
      where: {
        userId_algorithmId: {
          userId: user.id,
          algorithmId
        }
      }
    })

    if (!favorite) {
      return NextResponse.json({ error: 'Не в избранном' }, { status: 404 })
    }

    await db.favoriteAlgorithm.delete({
      where: { id: favorite.id }
    })

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error, 'AlgorithmFavorite.DELETE')
  }
}
