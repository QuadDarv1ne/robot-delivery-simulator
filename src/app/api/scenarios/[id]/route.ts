import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { scenarioIdSchema } from '@/lib/validators'
import { handleApiError, createErrorResponse, successResponse } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return createErrorResponse({ message: 'ID сценария обязателен', status: 400, context: 'ScenarioId.GET' })
    }

    const validation = scenarioIdSchema.safeParse({ id })

    if (!validation.success) {
      const errors = validation.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      return createErrorResponse({
        message: 'Ошибка валидации',
        status: 400,
        context: 'ScenarioId.GET',
        details: errors
      })
    }

    const scenario = await db.deliveryScenario.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        deliveryResults: {
          select: {
            id: true,
            status: true,
            distance: true,
            duration: true,
            efficiencyScore: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true } }
          },
          orderBy: { startTime: 'desc' },
          take: 10
        }
      }
    })

    if (!scenario) {
      return createErrorResponse({ message: 'Сценарий не найден', status: 404, context: 'ScenarioId.GET' })
    }

    return successResponse({ scenario })
  } catch (error) {
    return handleApiError(error, 'ScenarioId.GET')
  }
}
