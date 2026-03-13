import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const algorithm = await db.algorithm.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: { deliveryResults: true }
        }
      }
    })

    if (!algorithm) {
      return NextResponse.json(
        { error: 'Алгоритм не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({ algorithm })
  } catch (error) {
    console.error('Failed to fetch algorithm:', error)
    return NextResponse.json(
      { error: 'Ошибка получения алгоритма' },
      { status: 500 }
    )
  }
}
