import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { algorithmCloneSchema } from '@/lib/validators'
import { handleApiError, successResponse } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = algorithmCloneSchema.safeParse(body)

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

    const { id } = validation.data

    const original = await db.algorithm.findUnique({
      where: { id }
    })

    if (!original) {
      return NextResponse.json(
        { error: 'Алгоритм не найден' },
        { status: 404 }
      )
    }

    const cloned = await db.algorithm.create({
      data: {
        name: `${original.name} (Copy)`,
        description: original.description,
        language: original.language,
        code: original.code,
        isPublic: false,
        userId: original.userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return successResponse({ algorithm: cloned })
  } catch (error) {
    return handleApiError(error, 'Algorithms.CLONE')
  }
}
