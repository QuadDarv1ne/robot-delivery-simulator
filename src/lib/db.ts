import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

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
    logger.info('Database connected successfully', 'DB')
  } catch (error) {
    logger.error('Database connection failed', 'DB', error)
    throw error
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await db.$disconnect()
  } catch (error) {
    logger.error('Database disconnection failed', 'DB', error)
  }
}