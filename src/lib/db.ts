import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export async function connectDatabase(): Promise<void> {
  try {
    await db.$connect()
    if (process.env.NODE_ENV === 'development') {
      console.log('Database connected successfully')
    }
  } catch (error) {
    console.error('Database connection failed:', error)
    throw error
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await db.$disconnect()
  } catch (error) {
    console.error('Database disconnection failed:', error)
  }
}