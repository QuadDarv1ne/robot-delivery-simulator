import { NextResponse } from 'next/server'
import { z } from 'zod'

export interface ApiError {
  error: string
  message?: string
  details?: unknown
}

export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: unknown
): NextResponse<ApiError> {
  const message = getErrorMessage(error)
  
  return NextResponse.json(
    { 
      error, 
      message,
      ...(details ? { details } : {})
    },
    { status }
  )
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }
  
  if (error instanceof z.ZodError) {
    return error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

export function handleApiError(
  error: unknown,
  context: string = 'API Error'
): NextResponse<ApiError> {
  console.error(`[${context}]`, error)
  
  if (error instanceof z.ZodError) {
    return createErrorResponse('Validation Error', 400, error.issues)
  }
  
  if (error instanceof Error) {
    if (error.message.includes('not found')) {
      return createErrorResponse('Not Found', 404)
    }
    if (error.message.includes('unauthorized') || error.message.includes('auth')) {
      return createErrorResponse('Unauthorized', 401)
    }
    if (error.message.includes('forbidden')) {
      return createErrorResponse('Forbidden', 403)
    }
  }
  
  return createErrorResponse('Internal Server Error', 500)
}

export function validateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context: string = 'Request'
): { success: true; data: T } | { success: false; error: NextResponse } {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    return {
      success: false,
      error: createErrorResponse('Validation Error', 400, {
        context,
        errors: result.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      }),
    }
  }
  
  return { success: true, data: result.data }
}

export async function safeJsonParse<T>(
  request: Request
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    const body = await request.json()
    return { success: true, data: body as T }
  } catch (error) {
    return {
      success: false,
      error: createErrorResponse('Invalid JSON', 400),
    }
  }
}
