import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { adminUserUpdateSchema } from '@/lib/validators'

// Check admin access
async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value

  if (!token) return null

  const session = await db.userSession.findUnique({
    where: { token },
    include: { user: true }
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  if (session.user.role !== 'admin' && session.user.role !== 'teacher') {
    return null
  }

  return session.user
}

// Get all users
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''

    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { group: { contains: search } }
          ]
        } : {},
        role ? { role } : {}
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          group: true,
          avatar: true,
          totalDeliveries: true,
          successRate: true,
          totalDistance: true,
          totalCollisions: true,
          averageTime: true,
          bestTime: true,
          createdAt: true,
          lastActiveAt: true,
          _count: {
            select: {
              deliveries: true,
              algorithms: true,
              achievements: true
            }
          }
        }
      }),
      db.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

// Update user
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = adminUserUpdateSchema.safeParse(body)

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

    const { userId, data } = validation.data

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        group: true
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

// Delete user
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin()
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещён. Требуются права администратора' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'ID пользователя обязателен' },
        { status: 400 }
      )
    }

    // Prevent self-deletion
    if (userId === admin.id) {
      return NextResponse.json(
        { error: 'Нельзя удалить свой аккаунт' },
        { status: 400 }
      )
    }

    await db.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      success: true,
      message: 'Пользователь удалён'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
