import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { algorithmSearchSchema } from '@/lib/validators'
import { handleApiError, successResponse } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const language = searchParams.get('language')
    const sortBy = searchParams.get('sortBy')
    const sortOrder = searchParams.get('sortOrder')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const validation = algorithmSearchSchema.safeParse({ q: query, language, page, limit, sortBy, sortOrder })

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

    const { q, language: lang, page: validatedPage, limit: validatedLimit, sortBy: sort, sortOrder: order } = validation.data

    const where: any = {}

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ]
    }

    if (lang) {
      where.language = lang
    }

    const [algorithms, total] = await Promise.all([
      db.algorithm.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { [sort]: order },
        skip: (validatedPage - 1) * validatedLimit,
        take: validatedLimit
      }),
      db.algorithm.count({ where })
    ])

    return successResponse({
      algorithms,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        pages: Math.ceil(total / validatedLimit)
      }
    })
  } catch (error) {
    return handleApiError(error, 'Algorithms.SEARCH')
  }
}
