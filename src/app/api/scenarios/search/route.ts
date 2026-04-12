import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { scenarioSearchSchema } from '@/lib/validators'
import { handleApiError, successResponse } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const difficulty = searchParams.get('difficulty')
    const weather = searchParams.get('weather')
    const sortBy = searchParams.get('sortBy')
    const sortOrder = searchParams.get('sortOrder')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const validation = scenarioSearchSchema.safeParse({ q: query, difficulty, weather, page, limit, sortBy, sortOrder })

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

    const { q, difficulty: diff, weather: w, page: validatedPage, limit: validatedLimit, sortBy: sort, sortOrder: order } = validation.data

    const where: any = {}

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ]
    }

    if (diff) {
      where.difficulty = diff
    }

    if (w) {
      where.weather = w
    }

    const [scenarios, total] = await Promise.all([
      db.deliveryScenario.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { [sort]: order },
        skip: (validatedPage - 1) * validatedLimit,
        take: validatedLimit
      }),
      db.deliveryScenario.count({ where })
    ])

    return successResponse({
      scenarios,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        pages: Math.ceil(total / validatedLimit)
      }
    })
  } catch (error) {
    return handleApiError(error, 'Scenarios.SEARCH')
  }
}
