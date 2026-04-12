import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { profileUpdateSchema } from '@/lib/validators'
import { handleApiError, createErrorResponse, successResponse } from '@/lib/api-error'

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (!token) {
      return createErrorResponse({ message: 'Не авторизован', status: 401, context: 'User.PATCH' })
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
      return createErrorResponse({ message: 'Сессия истекла', status: 401, context: 'User.PATCH' })
    }

    const body = await request.json()
    const validation = profileUpdateSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      return createErrorResponse({
        message: 'Ошибка валидации',
        status: 400,
        context: 'User.PATCH',
        details: errors
      })
    }

    const updateData = validation.data

    const updatedUser = await db.user.update({
      where: { id: session.userId },
      data: updateData
    })

    return successResponse({
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
    return handleApiError(error, 'User.PATCH')
  }
}
