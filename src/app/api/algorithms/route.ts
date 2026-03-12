import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - List user's algorithms
export async function GET(request: NextRequest) {
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
    const userId = searchParams.get('userId')

    // Teachers can view all algorithms, students only their own
    const where: any = {}
    if (user.role === 'admin' || user.role === 'teacher') {
      if (userId) where.userId = userId
    } else {
      where.userId = user.id
    }

    const algorithms = await db.algorithm.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, group: true }
        },
        _count: {
          select: { deliveryResults: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ algorithms })

  } catch (error) {
    console.error('Algorithms fetch error:', error)
    return NextResponse.json(
      { error: 'Ошибка загрузки алгоритмов' },
      { status: 500 }
    )
  }
}

// POST - Create new algorithm
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, code, language, isPublic } = body

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Название и код алгоритма обязательны' },
        { status: 400 }
      )
    }

    const algorithm = await db.algorithm.create({
      data: {
        name,
        description: description || '',
        code,
        language: language || 'python',
        isPublic: isPublic || false,
        userId: user.id,
      }
    })

    return NextResponse.json({ algorithm })

  } catch (error) {
    console.error('Algorithm create error:', error)
    return NextResponse.json(
      { error: 'Ошибка создания алгоритма' },
      { status: 500 }
    )
  }
}

// PUT - Update algorithm
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
    const { id, name, description, code, language, isPublic } = body

    // Check ownership
    const existing = await db.algorithm.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Алгоритм не найден' }, { status: 404 })
    }

    if (existing.userId !== user.id && user.role !== 'admin' && user.role !== 'teacher') {
      return NextResponse.json({ error: 'Нет прав на редактирование' }, { status: 403 })
    }

    const algorithm = await db.algorithm.update({
      where: { id },
      data: {
        name,
        description,
        code,
        language,
        isPublic,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ algorithm })

  } catch (error) {
    console.error('Algorithm update error:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления алгоритма' },
      { status: 500 }
    )
  }
}

// DELETE - Delete algorithm
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
      return NextResponse.json({ error: 'ID алгоритма обязателен' }, { status: 400 })
    }

    // Check ownership
    const existing = await db.algorithm.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Алгоритм не найден' }, { status: 404 })
    }

    if (existing.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Нет прав на удаление' }, { status: 403 })
    }

    await db.algorithm.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Algorithm delete error:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления алгоритма' },
      { status: 500 }
    )
  }
}
