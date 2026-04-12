import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { algorithmCreateSchema, algorithmUpdateSchema } from '@/lib/validators'
import { handleApiError, createErrorResponse, successResponse } from '@/lib/api-error'

// GET - List user's algorithms
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return createErrorResponse({ message: 'Не авторизован', status: 401, context: 'Algorithms.GET' })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user) {
      return createErrorResponse({ message: 'Пользователь не найден', status: 404, context: 'Algorithms.GET' })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    // Teachers can view all algorithms, students only their own
    const where: any = {}
    if (user.role === 'admin' || user.role === 'teacher') {
      if (userId) where.userId = userId
    } else {
      where.userId = user.id
    }

    const algorithms = await db.algorithm.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, group: true }
        },
        _count: {
          select: { deliveryResults: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return successResponse({ algorithms })

  } catch (error) {
    return handleApiError(error, 'Algorithms.GET')
  }
}

// POST - Create new algorithm
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return createErrorResponse({ message: 'Не авторизован', status: 401, context: 'Algorithms.POST' })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return createErrorResponse({ message: 'Пользователь не найден', status: 404, context: 'Algorithms.POST' })
    }

    const body = await request.json()
    const validation = algorithmCreateSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      return createErrorResponse({
        message: 'Ошибка валидации',
        status: 400,
        context: 'Algorithms.POST',
        details: errors
      })
    }

    const { name, description, code, language, isPublic } = validation.data

    const algorithm = await db.algorithm.create({
      data: {
        name,
        description: description || '',
        code,
        language: language || 'python',
        isPublic: isPublic || false,
        userId: user.id,
      }
    })

    return successResponse({ algorithm })

  } catch (error) {
    return handleApiError(error, 'Algorithms.POST')
  }
}

// PUT - Update algorithm
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return createErrorResponse({ message: 'Не авторизован', status: 401, context: 'Algorithms.PUT' })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user) {
      return createErrorResponse({ message: 'Пользователь не найден', status: 404, context: 'Algorithms.PUT' })
    }

    const body = await request.json()
    const validation = algorithmUpdateSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      return createErrorResponse({
        message: 'Ошибка валидации',
        status: 400,
        context: 'Algorithms.PUT',
        details: errors
      })
    }

    const { id, ...updateData } = validation.data

    const existing = await db.algorithm.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existing) {
      return createErrorResponse({ message: 'Алгоритм не найден', status: 404, context: 'Algorithms.PUT' })
    }

    if (existing.userId !== user.id && user.role !== 'admin' && user.role !== 'teacher') {
      return createErrorResponse({ message: 'Нет прав на редактирование', status: 403, context: 'Algorithms.PUT' })
    }

    const algorithm = await db.algorithm.update({
      where: { id },
      data: { ...updateData, updatedAt: new Date() }
    })

    return successResponse({ algorithm })

  } catch (error) {
    return handleApiError(error, 'Algorithms.PUT')
  }
}

// DELETE - Delete algorithm
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return createErrorResponse({ message: 'Не авторизован', status: 401, context: 'Algorithms.DELETE' })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user) {
      return createErrorResponse({ message: 'Пользователь не найден', status: 404, context: 'Algorithms.DELETE' })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return createErrorResponse({ message: 'ID алгоритма обязателен', status: 400, context: 'Algorithms.DELETE' })
    }

    const existing = await db.algorithm.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existing) {
      return createErrorResponse({ message: 'Алгоритм не найден', status: 404, context: 'Algorithms.DELETE' })
    }

    if (existing.userId !== user.id && user.role !== 'admin') {
      return createErrorResponse({ message: 'Нет прав на удаление', status: 403, context: 'Algorithms.DELETE' })
    }

    await db.algorithm.delete({ where: { id } })

    return successResponse({ success: true })

  } catch (error) {
    return handleApiError(error, 'Algorithms.DELETE')
  }
}
