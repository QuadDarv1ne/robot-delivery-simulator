import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Scenario ID is required' },
        { status: 400 }
      )
    }

    const original = await db.scenario.findUnique({
      where: { id }
    })

    if (!original) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      )
    }

    const cloned = await db.scenario.create({
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
        creatorId: original.creatorId
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
      { error: 'Failed to clone scenario' },
      { status: 500 }
    )
  }
}
