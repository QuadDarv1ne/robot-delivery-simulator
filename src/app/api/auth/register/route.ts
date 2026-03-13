import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { rateLimit, createRateLimitResponse, rateLimits } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const limit = rateLimit(request, rateLimits.auth)

  if (limit.limited) {
    return createRateLimitResponse(limit.resetTime)
  }

  try {
    const { email, password, name, group } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email обязателен' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Пароль обязателен' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Имя обязательно' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Неверный формат email' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      )
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Имя должно содержать минимум 2 символа' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name.trim(),
        group: group || null,
        role: 'student'
      }
    })

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await db.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || undefined
      }
    })

    const cookieStore = await cookies()
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        group: user.group
      }
    })

    response.headers.set('X-RateLimit-Limit', rateLimits.auth.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', limit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', limit.resetTime.toString())

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
