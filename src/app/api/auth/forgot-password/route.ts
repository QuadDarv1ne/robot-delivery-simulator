import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { forgotPasswordSchema } from '@/lib/validators'
import { rateLimit, createRateLimitResponse, rateLimits } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(request, rateLimits.auth)
    if (limit.limited) {
      return createRateLimitResponse(limit.resetTime)
    }

    const body = await request.json()
    const validation = forgotPasswordSchema.safeParse(body)

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

    const { email } = validation.data

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email }
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Если email существует, письмо с инструкциями отправлено'
      })
    }

    // Delete old reset tokens for this email
    await db.passwordResetToken.deleteMany({
      where: { email }
    })

    // Create new reset token
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt
      }
    })

    // In production, send email here
    // For demo, we return the token
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?reset=${token}`

    console.log(`[DEMO] Password reset for ${email}: ${resetUrl}`)

    const response = NextResponse.json({
      success: true,
      message: 'Если email существует, письмо с инструкциями отправлено',
      // Remove in production
      demo: {
        token,
        resetUrl
      }
    })

    response.headers.set('X-RateLimit-Limit', rateLimits.auth.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', limit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', limit.resetTime.toString())

    return response
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
