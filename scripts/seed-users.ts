import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding demo users...')

  const users = [
    {
      email: 'demo@test.ru',
      password: 'demo123',
      name: 'Демо Студент',
      role: 'student',
      group: 'ИУ7-72Б'
    },
    {
      email: 'admin@test.ru',
      password: 'admin123',
      name: 'Администратор',
      role: 'admin',
      group: null
    },
    {
      email: 'teacher@test.ru',
      password: 'teacher123',
      name: 'Преподаватель',
      role: 'teacher',
      group: 'ИУ7'
    }
  ]

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      console.log(`⏭️  User ${userData.email} already exists`)
      continue
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10)

    await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
        group: userData.group
      }
    })

    console.log(`✅ Created user: ${userData.email}`)
  }

  console.log('✨ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
