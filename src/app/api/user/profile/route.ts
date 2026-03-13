import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const session = await db.userSession.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await db.userSession.delete({ where: { token } })
      }
      cookieStore.delete('session_token')
      return NextResponse.json(
        { error: 'Сессия истекла' },
        { status: 401 }
      )
    }

    const data = await request.json()

    const allowedFields = ['name', 'group', 'avatar']
    const updateData: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'name' && typeof data[field] === 'string') {
          const trimmed = data[field].trim()
          if (trimmed.length < 2) {
            return NextResponse.json(
              { error: 'Имя должно содержать минимум 2 символа' },
              { status: 400 }
            )
          }
          updateData[field] = trimmed
        } else if (field === 'group') {
          updateData[field] = data[field] || null
        } else if (field === 'avatar') {
          updateData[field] = data[field]
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Нет данных для обновления' },
        { status: 400 }
      )
    }

    const updatedUser = await db.user.update({
      where: { id: session.userId },
      data: updateData
    })

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        group: updatedUser.group,
        avatar: updatedUser.avatar
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
