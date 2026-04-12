import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { handleApiError, successResponse } from '@/lib/api-error'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (token) {
      await db.userSession.deleteMany({
        where: { token }
      })

      await db.userSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
    }

    cookieStore.delete('session_token')

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error, 'Auth.LOGOUT')
  }
}
