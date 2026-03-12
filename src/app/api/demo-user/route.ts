import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Create demo users on first load
export async function GET() {
  try {
    // Check if demo user exists
    const existingDemo = await db.user.findUnique({
      where: { email: 'demo@test.ru' }
    })

    if (!existingDemo) {
      const hashedPassword = await bcrypt.hash('demo123', 10)
      
      // Create demo student
      await db.user.create({
        data: {
          email: 'demo@test.ru',
          name: 'Демо Студент',
          password: hashedPassword,
          role: 'student',
          group: 'Демо-группа',
          totalDeliveries: 5,
          successRate: 85.5,
          totalDistance: 2500,
          totalCollisions: 1,
          averageTime: 180,
          bestTime: 120
        }
      })
    }

    // Check if admin user exists
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@test.ru' }
    })

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      
      // Create admin user
      await db.user.create({
        data: {
          email: 'admin@test.ru',
          name: 'Администратор',
          password: hashedPassword,
          role: 'admin',
          totalDeliveries: 50,
          successRate: 95,
          totalDistance: 25000,
          totalCollisions: 2,
          averageTime: 150,
          bestTime: 90
        }
      })
    }

    // Check if teacher user exists
    const existingTeacher = await db.user.findUnique({
      where: { email: 'teacher@test.ru' }
    })

    if (!existingTeacher) {
      const hashedPassword = await bcrypt.hash('teacher123', 10)
      
      // Create teacher user
      await db.user.create({
        data: {
          email: 'teacher@test.ru',
          name: 'Преподаватель',
          password: hashedPassword,
          role: 'teacher',
          group: 'ИУ7',
          totalDeliveries: 20,
          successRate: 90,
          totalDistance: 10000,
          totalCollisions: 0,
          averageTime: 160,
          bestTime: 100
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      users: [
        { email: 'demo@test.ru', password: 'demo123', role: 'student' },
        { email: 'admin@test.ru', password: 'admin123', role: 'admin' },
        { email: 'teacher@test.ru', password: 'teacher123', role: 'teacher' }
      ]
    })
  } catch (error) {
    console.error('Create demo users error:', error)
    return NextResponse.json(
      { error: 'Ошибка создания демо пользователей' },
      { status: 500 }
    )
  }
}
