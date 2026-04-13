import { NextResponse } from 'next/server'
import { logger } from './logger'

interface ApiErrorOptions {
  message: string
  status?: number
  context?: string
  error?: unknown
  details?: Array<{ field: string; message: string }>
  retryable?: boolean
}

export function createErrorResponse({
  message,
  status = 500,
  context = 'API',
  error,
  details,
  retryable = false
}: ApiErrorOptions) {
  logger.error(message, context, error)

  const body: Record<string, unknown> = {
    error: message,
    status,
    retryable
  }

  if (details) {
    body.details = details
  }

  return NextResponse.json(body, { status })
}

export function handleApiError(error: unknown, context: string): NextResponse {
  logger.error('API error', context, error)

  // Prisma errors
  if (error instanceof Error) {
    if (error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any
      switch (prismaError.code) {
        case 'P2002': // Unique constraint violation
          return createErrorResponse({
            message: 'Дублирующиеся данные',
            status: 409,
            context,
            details: [{ field: 'unknown', message: 'Нарушено ограничение уникальности' }]
          })
        case 'P2025': // Record not found
          return createErrorResponse({
            message: 'Запись не найдена',
            status: 404,
            context
          })
        case 'P2003': // Foreign key constraint violation
          return createErrorResponse({
            message: 'Ошибка связи данных',
            status: 400,
            context
          })
        default:
          return createErrorResponse({
            message: 'Ошибка базы данных',
            status: 500,
            context,
            error: prismaError.code
          })
      }
    }

    // Zod validation errors
    if (error.name === 'ZodError') {
      const zodError = error as any
      return createErrorResponse({
        message: 'Ошибка валидации',
        status: 400,
        context,
        details: zodError.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message
        }))
      })
    }

    // Standard errors
    if (error.message.includes('Not found') || error.message.includes('not found')) {
      return createErrorResponse({
        message: 'Не найдено',
        status: 404,
        context
      })
    }

    if (error.message.includes('Unauthorized') || error.message.includes('Not authenticated')) {
      return createErrorResponse({
        message: 'Не авторизован',
        status: 401,
        context
      })
    }

    if (error.message.includes('Forbidden') || error.message.includes('Not enough permissions')) {
      return createErrorResponse({
        message: 'Нет прав',
        status: 403,
        context
      })
    }
  }

  // Unknown errors
  return createErrorResponse({
    message: 'Внутренняя ошибка сервера',
    status: 500,
    context,
    error,
    retryable: true
  })
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function createSuccessResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function handleNotFoundError(message: string = 'Не найдено', context: string = 'API') {
  return createErrorResponse({
    message,
    status: 404,
    context
  })
}

export function handleUnauthorizedError(message: string = 'Не авторизован', context: string = 'API') {
  return createErrorResponse({
    message,
    status: 401,
    context
  })
}

export function handleForbiddenError(message: string = 'Нет прав', context: string = 'API') {
  return createErrorResponse({
    message,
    status: 403,
    context
  })
}

export function handleValidationError(message: string = 'Ошибка валидации', details: Array<{ field: string; message: string }>, context: string = 'API') {
  return createErrorResponse({
    message,
    status: 400,
    context,
    details
  })
}
