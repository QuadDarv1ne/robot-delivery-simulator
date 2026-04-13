import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { scenarioCreateSchema, scenarioUpdateSchema } from '@/lib/validators'
import { handleApiError, createErrorResponse, successResponse } from '@/lib/api-error'

// GET - List scenarios
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const publicOnly = searchParams.get('public') === 'true'

    const where: any = {}
    if (publicOnly) where.isPublic = true

    const scenarios = await db.deliveryScenario.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        difficulty: true,
        distance: true,
        timeLimit: true,
        weather: true,
        traffic: true,
        robotType: true,
        robotCount: true,
        cargoCapacity: true,
        cargoFragile: true,
        startPoint: true,
        endPoint: true,
        waypoints: true,
        obstacles: true,
        isPublic: true,
        playsCount: true,
        avgScore: true,
        createdAt: true,
        creator: { select: { id: true, name: true } }
      }
    })

    // Добавляем количество deliveryResults к каждому сценарию
    const scenariosWithCounts = await Promise.all(
      scenarios.map(async (scenario) => {
        const count = await db.deliveryResult.count({
          where: { scenarioId: scenario.id }
        })
        return { ...scenario, deliveryResultsCount: count }
      })
    )

    return successResponse({ scenarios: scenariosWithCounts })
  } catch (error) {
    return handleApiError(error, 'Scenarios.GET')
  }
}

// POST - Create scenario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return createErrorResponse({ message: 'Не авторизован', status: 401, context: 'Scenarios.POST' })
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } })

    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return createErrorResponse({ message: 'Недостаточно прав', status: 403, context: 'Scenarios.POST' })
    }

    const body = await request.json()
    const validation = scenarioCreateSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      return createErrorResponse({ message: 'Ошибка валидации', status: 400, context: 'Scenarios.POST', details: errors })
    }

    const { name, description, difficulty, distance, timeLimit, weather, traffic, robotType, robotCount, cargoCapacity, cargoFragile, startPoint, endPoint, waypoints, obstacles, isPublic } = validation.data

    const scenario = await db.deliveryScenario.create({
      data: {
        name,
        description: description || '',
        difficulty: difficulty || 'medium',
        distance: distance || 1000,
        timeLimit: timeLimit || 300,
        weather: weather || 'sunny',
        traffic: traffic || 'low',
        robotType: robotType || 'standard',
        robotCount: robotCount || 1,
        cargoCapacity: cargoCapacity || 10.0,
        cargoFragile: cargoFragile || false,
        startPoint,
        endPoint,
        waypoints,
        obstacles,
        isPublic: isPublic ?? true,
        createdById: user.id
      }
    })

    return successResponse({ scenario })
  } catch (error) {
    return handleApiError(error, 'Scenarios.POST')
  }
}

// PUT - Update scenario
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return createErrorResponse({ message: 'Не авторизован', status: 401, context: 'Scenarios.PUT' })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user) {
      return createErrorResponse({ message: 'Пользователь не найден', status: 404, context: 'Scenarios.PUT' })
    }

    const body = await request.json()
    const validation = scenarioUpdateSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      return createErrorResponse({ message: 'Ошибка валидации', status: 400, context: 'Scenarios.PUT', details: errors })
    }

    const { id, ...updateData } = validation.data

    const existing = await db.deliveryScenario.findUnique({ where: { id }, select: { createdById: true } })

    if (!existing) {
      return createErrorResponse({ message: 'Сценарий не найден', status: 404, context: 'Scenarios.PUT' })
    }

    if (existing.createdById !== user.id && user.role !== 'admin') {
      return createErrorResponse({ message: 'Нет прав на редактирование', status: 403, context: 'Scenarios.PUT' })
    }

    const scenario = await db.deliveryScenario.update({ where: { id }, data: updateData })

    return successResponse({ scenario })
  } catch (error) {
    return handleApiError(error, 'Scenarios.PUT')
  }
}

// DELETE - Delete scenario
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return createErrorResponse({ message: 'Не авторизован', status: 401, context: 'Scenarios.DELETE' })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user) {
      return createErrorResponse({ message: 'Пользователь не найден', status: 404, context: 'Scenarios.DELETE' })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return createErrorResponse({ message: 'ID сценария обязателен', status: 400, context: 'Scenarios.DELETE' })
    }

    const existing = await db.deliveryScenario.findUnique({ where: { id }, select: { createdById: true } })

    if (!existing) {
      return createErrorResponse({ message: 'Сценарий не найден', status: 404, context: 'Scenarios.DELETE' })
    }

    if (existing.createdById !== user.id && user.role !== 'admin') {
      return createErrorResponse({ message: 'Нет прав на удаление', status: 403, context: 'Scenarios.DELETE' })
    }

    await db.deliveryScenario.delete({ where: { id } })

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error, 'Scenarios.DELETE')
  }
}
