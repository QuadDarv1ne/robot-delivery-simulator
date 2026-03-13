import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const difficulty = searchParams.get('difficulty')
    const weather = searchParams.get('weather')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    if (weather) {
      where.weather = weather
    }

    const [scenarios, total] = await Promise.all([
      db.scenario.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.scenario.count({ where })
    ])

    return NextResponse.json({
      scenarios,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to search scenarios:', error)
    return NextResponse.json(
      { error: 'Failed to search scenarios' },
      { status: 500 }
    )
  }
}
