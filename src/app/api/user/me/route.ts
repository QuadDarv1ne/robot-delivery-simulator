import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { handleApiError, successResponse } from '@/lib/api-error'

export async function GET() {
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

    await db.user.update({
      where: { id: session.user.id },
      data: { lastActiveAt: new Date() }
    })

    return successResponse({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        group: session.user.group,
        avatar: session.user.avatar,
        totalDeliveries: session.user.totalDeliveries,
        successRate: session.user.successRate,
        totalDistance: session.user.totalDistance,
        totalCollisions: session.user.totalCollisions,
        averageTime: session.user.averageTime,
        bestTime: session.user.bestTime
      }
    })
  } catch (error) {
    return handleApiError(error, 'UserMe.GET')
  }
}
