import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { scenarioCloneSchema } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = scenarioCloneSchema.safeParse(body)

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

    const original = await db.deliveryScenario.findUnique({
      where: { id }
    })

    if (!original) {
      return NextResponse.json(
        { error: 'Сценарий не найден' },
        { status: 404 }
      )
    }

    const cloned = await db.deliveryScenario.create({
      data: {
        name: `${original.name} (Copy)`,
        description: original.description,
        difficulty: original.difficulty,
        distance: original.distance,
        timeLimit: original.timeLimit,
        weather: original.weather,
        traffic: original.traffic,
        startPoint: original.startPoint,
        endPoint: original.endPoint,
        waypoints: original.waypoints,
        obstacles: original.obstacles,
        isPublic: false,
        createdById: original.createdById
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ scenario: cloned })
  } catch (error) {
    console.error('Failed to clone scenario:', error)
    return NextResponse.json(
      { error: 'Не удалось клонировать сценарий' },
      { status: 500 }
    )
  }
}
