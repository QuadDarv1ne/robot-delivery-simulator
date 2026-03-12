import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Токен и пароль обязательны' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен быть минимум 6 символов' },
        { status: 400 }
      )
    }

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

    return NextResponse.json({
      success: true,
      message: 'Пароль успешно изменён'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
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
    console.error('Verify token error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
