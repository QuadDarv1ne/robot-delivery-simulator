import { NextResponse } from 'next/server'
import { logger } from './logger'

interface ApiErrorOptions {
  message: string
  status?: number
  context?: string
  error?: unknown
  details?: Array<{ field: string; message: string }>
}

export function createErrorResponse({
  message,
  status = 500,
  context = 'API',
  error,
  details
}: ApiErrorOptions) {
  logger.error(message, context, error)

  const body: Record<string, unknown> = {
    error: message,
    status
  }

  if (details) {
    body.details = details
  }

  return NextResponse.json(body, { status })
}

export function handleApiError(error: unknown, context: string): NextResponse {
  logger.error('API error', context, error)

  if (error instanceof Error) {
    if (error.message.includes('Validation')) {
      return createErrorResponse({
        message: 'Ошибка валидации',
        status: 400,
        context,
        details: [{ field: 'unknown', message: error.message }]
      })
    }

    if (error.message.includes('Not found')) {
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

  return createErrorResponse({
    message: 'Внутренняя ошибка сервера',
    status: 500,
    context,
    error
  })
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}
