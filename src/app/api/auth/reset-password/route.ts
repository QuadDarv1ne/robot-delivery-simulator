import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { resetPasswordSchema } from '@/lib/validators'
import { rateLimit, createRateLimitResponse, rateLimits } from '@/lib/rate-limit'
import { handleApiError, successResponse } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(request, rateLimits.auth)
    if (limit.limited) {
      return createRateLimitResponse(limit.resetTime)
    }

    const body = await request.json()
    const validation = resetPasswordSchema.safeParse(body)

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

    const { token, password } = validation.data

    // Find reset token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 400 }
      )
    }

    // Check if token is expired or used
    if (resetToken.expiresAt < new Date() || resetToken.used) {
      return NextResponse.json(
        { error: 'Токен истёк или уже использован' },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: resetToken.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password and mark token as used
    await Promise.all([
      db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ])

    // Delete all user sessions (force re-login)
    await db.userSession.deleteMany({
      where: { userId: user.id }
    })

    const response = successResponse({
      success: true,
      message: 'Пароль успешно изменён'
    })

    response.headers.set('X-RateLimit-Limit', rateLimits.auth.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', limit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', limit.resetTime.toString())

    return response
  } catch (error) {
    return handleApiError(error, 'AuthResetPassword.POST')
  }
}

// Verify token endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Токен обязателен' },
        { status: 400 }
      )
    }

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      return NextResponse.json(
        { valid: false, error: 'Недействительный токен' },
        { status: 400 }
      )
    }

    if (resetToken.expiresAt < new Date() || resetToken.used) {
      return NextResponse.json(
        { valid: false, error: 'Токен истёк или уже использован' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: resetToken.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    })
  } catch (error) {
    return handleApiError(error, 'AuthResetToken.GET')
  }
}
