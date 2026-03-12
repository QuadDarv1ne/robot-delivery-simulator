import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - List scenarios
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const publicOnly = searchParams.get('public') === 'true'
    
    const where: any = {}
    if (publicOnly) {
      where.isPublic = true
    }

    const scenarios = await db.deliveryScenario.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { deliveryResults: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ scenarios })

  } catch (error) {
    console.error('Scenarios fetch error:', error)
    return NextResponse.json(
      { error: 'Ошибка загрузки сценариев' },
      { status: 500 }
    )
  }
}

// POST - Create scenario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      difficulty,
      distance,
      timeLimit,
      weather,
      traffic,
      startPoint,
      endPoint,
      waypoints,
      obstacles,
      isPublic
    } = body

    if (!name || !startPoint || !endPoint) {
      return NextResponse.json(
        { error: 'Название, начальная и конечная точки обязательны' },
        { status: 400 }
      )
    }

    const scenario = await db.deliveryScenario.create({
      data: {
        name,
        description: description || '',
        difficulty: difficulty || 'medium',
        distance: distance || 1000,
        timeLimit: timeLimit || 300,
        weather: weather || 'sunny',
        traffic: traffic || 'low',
        startPoint,
        endPoint,
        waypoints: waypoints || [],
        obstacles: obstacles || [],
        isPublic: isPublic ?? true,
        createdById: user.id
      }
    })

    return NextResponse.json({ scenario })

  } catch (error) {
    console.error('Scenario create error:', error)
    return NextResponse.json(
      { error: 'Ошибка создания сценария' },
      { status: 500 }
    )
  }
}

// PUT - Update scenario
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID сценария обязателен' }, { status: 400 })
    }

    // Check ownership or admin
    const existing = await db.deliveryScenario.findUnique({
      where: { id },
      select: { createdById: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Сценарий не найден' }, { status: 404 })
    }

    if (existing.createdById !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет прав на редактирование' }, { status: 403 })
    }

    const scenario = await db.deliveryScenario.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ scenario })

  } catch (error) {
    console.error('Scenario update error:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления сценария' },
      { status: 500 }
    )
  }
}

// DELETE - Delete scenario
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID сценария обязателен' }, { status: 400 })
    }

    const existing = await db.deliveryScenario.findUnique({
      where: { id },
      select: { createdById: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Сценарий не найден' }, { status: 404 })
    }

    if (existing.createdById !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет прав на удаление' }, { status: 403 })
    }

    await db.deliveryScenario.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Scenario delete error:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления сценария' },
      { status: 500 }
    )
  }
}
