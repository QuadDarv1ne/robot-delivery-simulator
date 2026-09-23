import { cookies } from 'next/headers'
import { db } from './db'

/**
 * Возвращает текущего пользователя по cookie session_token
 * (единый механизм аутентификации приложения, см. /api/auth/login).
 * Возвращает null, если пользователь не авторизован или сессия истекла.
 */
export async function getSessionUser() {
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

  return session.user
}
