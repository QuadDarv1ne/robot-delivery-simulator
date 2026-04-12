import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleApiError, successResponse } from '@/lib/api-error'

// POST - Verify email with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Токен обязателен' },
        { status: 400 }
      )
    }

    // Find token
    const verificationToken = await db.emailVerificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 400 }
      )
    }

    // Check if token expired
    if (verificationToken.expiresAt < new Date()) {
      await db.emailVerificationToken.delete({
        where: { token }
      })
      return NextResponse.json(
        { error: 'Токен истёк. Запросите новое письмо' },
        { status: 400 }
      )
    }

    // Check if already used
    if (verificationToken.used) {
      return NextResponse.json(
        { error: 'Токен уже использован' },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: verificationToken.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() }
    })

    // Mark token as used
    await db.emailVerificationToken.update({
      where: { token },
      data: { used: true }
    })

    // Delete used token
    await db.emailVerificationToken.delete({
      where: { token }
    })

    return successResponse({
      success: true,
      message: 'Email успешно подтверждён',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

  } catch (error) {
    return handleApiError(error, 'AuthVerifyEmail.POST')
  }
}

// GET - Check verification status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Токен обязателен' },
        { status: 400 }
      )
    }

    const verificationToken = await db.emailVerificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken) {
      return NextResponse.json({
        valid: false,
        error: 'Токен не найден'
      })
    }

    if (verificationToken.used) {
      return NextResponse.json({
        valid: false,
        error: 'Токен уже использован'
      })
    }

    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'Токен истёк'
      })
    }

    return NextResponse.json({
      valid: true,
      email: verificationToken.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    })

  } catch (error) {
    return handleApiError(error, 'AuthVerifyToken.GET')
  }
}
