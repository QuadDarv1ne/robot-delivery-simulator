import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@test.ru' },
    update: {},
    create: {
      email: 'demo@test.ru',
      name: 'Demo User',
      password: hashedPassword,
      role: 'student',
      group: 'TEST-01',
    },
  })

  console.log('✅ Created demo user:', demoUser.email)

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.ru' },
    update: {},
    create: {
      email: 'admin@test.ru',
      name: 'Admin User',
      password: adminPassword,
      role: 'admin',
    },
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create teacher user
  const teacherPassword = await bcrypt.hash('teacher123', 10)
  
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@test.ru' },
    update: {},
    create: {
      email: 'teacher@test.ru',
      name: 'Teacher User',
      password: teacherPassword,
      role: 'teacher',
    },
  })

  console.log('✅ Created teacher user:', teacherUser.email)

  // Create some achievements
  const achievements = [
    {
      name: 'First Delivery',
      description: 'Complete your first delivery mission',
      icon: '🚀',
    },
    {
      name: 'Speed Demon',
      description: 'Complete a mission in under 60 seconds',
      icon: '⚡',
    },
    {
      name: 'Safety First',
      description: 'Complete 10 missions without collisions',
      icon: '🛡️',
    },
    {
      name: 'Marathon Runner',
      description: 'Travel 10km total distance',
      icon: '🏃',
    },
  ]

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: {},
      create: achievement,
    })
  }

  console.log('✅ Created achievements')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
