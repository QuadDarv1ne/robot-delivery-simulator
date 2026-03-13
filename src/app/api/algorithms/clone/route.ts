import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Algorithm ID is required' },
        { status: 400 }
      )
    }

    const original = await db.algorithm.findUnique({
      where: { id }
    })

    if (!original) {
      return NextResponse.json(
        { error: 'Algorithm not found' },
        { status: 404 }
      )
    }

    const cloned = await db.algorithm.create({
      data: {
        name: `${original.name} (Copy)`,
        description: original.description,
        language: original.language,
        code: original.code,
        isPublic: false,
        userId: original.userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ algorithm: cloned })
  } catch (error) {
    console.error('Failed to clone algorithm:', error)
    return NextResponse.json(
      { error: 'Failed to clone algorithm' },
      { status: 500 }
    )
  }
}
