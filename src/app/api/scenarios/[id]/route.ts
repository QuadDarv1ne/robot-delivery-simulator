import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { scenarioIdSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID сценария обязателен' },
        { status: 400 }
      )
    }

    const validation = scenarioIdSchema.safeParse({ id })

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

    const scenario = await db.deliveryScenario.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        deliveryResults: {
          select: {
            id: true,
            status: true,
            distance: true,
            duration: true,
            efficiencyScore: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            startTime: 'desc'
          },
          take: 10
        }
      }
    })

    if (!scenario) {
      return NextResponse.json(
        { error: 'Сценарий не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({ scenario })
  } catch (error) {
    console.error('Failed to fetch scenario:', error)
    return NextResponse.json(
      { error: 'Ошибка получения сценария' },
      { status: 500 }
    )
  }
}
