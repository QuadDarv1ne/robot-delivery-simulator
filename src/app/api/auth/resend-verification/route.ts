import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// POST - Send verification email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email обязателен' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        success: true,
        message: 'Если пользователь с таким email существует, письмо отправлено'
      })
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email уже подтверждён'
      })
    }

    // Delete any existing tokens
    await db.emailVerificationToken.deleteMany({
      where: { email }
    })

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await db.emailVerificationToken.create({
      data: {
        email,
        token,
        expiresAt
      }
    })

    // In production, send actual email
    // For demo, log the verification link
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`
    
    console.log('========================================')
    console.log('📧 EMAIL VERIFICATION (DEV MODE)')
    console.log('========================================')
    console.log(`To: ${email}`)
    console.log(`Verification URL: ${verificationUrl}`)
    console.log('========================================')

    // For development, return the token
    return NextResponse.json({
      success: true,
      message: 'Письмо отправлено',
      // Remove in production
      _dev_token: process.env.NODE_ENV === 'development' ? token : undefined,
      _dev_url: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
    })

  } catch (error) {
    console.error('Send verification error:', error)
    return NextResponse.json(
      { error: 'Ошибка отправки письма' },
      { status: 500 }
    )
  }
}
