import { 
  createErrorResponse, 
  handleApiError, 
  successResponse,
  createSuccessResponse,
  handleNotFoundError,
  handleUnauthorizedError,
  handleForbiddenError,
  handleValidationError
} from '@/lib/api-error'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options, status: options?.status || 500 }))
  }
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn()
  }
}))

describe('API Error Handling Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createErrorResponse', () => {
    it('should create error response with default values', () => {
      const response = createErrorResponse({ message: 'Test error' }) as any
      
      expect(response.data).toEqual({
        error: 'Test error',
        status: 500,
        retryable: false
      })
      expect(response.options).toEqual({ status: 500 })
    })

    it('should create error response with custom status', () => {
      const response = createErrorResponse({ 
        message: 'Not found', 
        status: 404 
      }) as any
      
      expect(response.data).toEqual({
        error: 'Not found',
        status: 404,
        retryable: false
      })
    })

    it('should include details when provided', () => {
      const details = [
        { field: 'name', message: 'Required' },
        { field: 'email', message: 'Invalid' }
      ]
      
      const response = createErrorResponse({ 
        message: 'Validation failed', 
        status: 400,
        details 
      }) as any
      
      expect(response.data).toEqual({
        error: 'Validation failed',
        status: 400,
        retryable: false,
        details
      })
    })

    it('should mark error as retryable when specified', () => {
      const response = createErrorResponse({ 
        message: 'Server error', 
        retryable: true 
      }) as any
      
      expect(response.data.retryable).toBe(true)
    })
  })

  describe('handleApiError', () => {
    it('should handle Prisma unique constraint violation', () => {
      const prismaError = new Error('Unique constraint failed')
      ;(prismaError as any).name = 'PrismaClientKnownRequestError'
      ;(prismaError as any).code = 'P2002'

      const response = handleApiError(prismaError, 'Test.GET') as any
      
      expect(response.data).toEqual({
        error: 'Дублирующиеся данные',
        status: 409,
        retryable: false,
        details: [{ field: 'unknown', message: 'Нарушено ограничение уникальности' }]
      })
    })

    it('should handle Prisma record not found', () => {
      const prismaError = new Error('Record not found')
      ;(prismaError as any).name = 'PrismaClientKnownRequestError'
      ;(prismaError as any).code = 'P2025'

      const response = handleApiError(prismaError, 'Test.GET') as any
      
      expect(response.data).toEqual({
        error: 'Запись не найдена',
        status: 404,
        retryable: false
      })
    })

    it('should handle Prisma foreign key violation', () => {
      const prismaError = new Error('Foreign key constraint failed')
      ;(prismaError as any).name = 'PrismaClientKnownRequestError'
      ;(prismaError as any).code = 'P2003'

      const response = handleApiError(prismaError, 'Test.POST') as any
      
      expect(response.data).toEqual({
        error: 'Ошибка связи данных',
        status: 400,
        retryable: false
      })
    })

    it('should handle unknown Prisma errors', () => {
      const prismaError = new Error('Unknown error')
      ;(prismaError as any).name = 'PrismaClientKnownRequestError'
      ;(prismaError as any).code = 'P9999'

      const response = handleApiError(prismaError, 'Test.PUT') as any
      
      expect(response.data.error).toBe('Ошибка базы данных')
      expect(response.data.status).toBe(500)
    })

    it('should handle Zod validation errors', () => {
      const zodError = new Error('Validation failed')
      ;(zodError as any).name = 'ZodError'
      ;(zodError as any).errors = [
        { path: ['name'], message: 'Required' },
        { path: ['email'], message: 'Invalid email' }
      ]

      const response = handleApiError(zodError, 'Test.POST') as any
      
      expect(response.data).toEqual({
        error: 'Ошибка валидации',
        status: 400,
        retryable: false,
        details: [
          { field: 'name', message: 'Required' },
          { field: 'email', message: 'Invalid email' }
        ]
      })
    })

    it('should handle not found errors', () => {
      const error = new Error('Resource not found')

      const response = handleApiError(error, 'Test.GET') as any
      
      expect(response.data).toEqual({
        error: 'Не найдено',
        status: 404,
        retryable: false
      })
    })

    it('should handle unauthorized errors', () => {
      const error = new Error('Not authenticated')

      const response = handleApiError(error, 'Test.GET') as any
      
      expect(response.data).toEqual({
        error: 'Не авторизован',
        status: 401,
        retryable: false
      })
    })

    it('should handle forbidden errors', () => {
      const error = new Error('Not enough permissions')

      const response = handleApiError(error, 'Test.DELETE') as any
      
      expect(response.data).toEqual({
        error: 'Нет прав',
        status: 403,
        retryable: false
      })
    })

    it('should handle unknown errors as internal server error', () => {
      const error = new Error('Unexpected error')

      const response = handleApiError(error, 'Test.GET') as any
      
      expect(response.data).toEqual({
        error: 'Внутренняя ошибка сервера',
        status: 500,
        retryable: true
      })
    })

    it('should handle non-Error objects', () => {
      const response = handleApiError('String error', 'Test.GET') as any
      
      expect(response.data.error).toBe('Внутренняя ошибка сервера')
      expect(response.data.status).toBe(500)
      expect(response.data.retryable).toBe(true)
    })
  })

  describe('successResponse', () => {
    it('should create success response with data', () => {
      const data = { items: [1, 2, 3] }
      const response = successResponse(data) as any
      
      expect(response.data).toEqual({ data })
      expect(response.options).toEqual({ status: 200 })
    })

    it('should create success response with custom status', () => {
      const data = { created: true }
      const response = successResponse(data, 201) as any
      
      expect(response.data).toEqual({ data })
      expect(response.options).toEqual({ status: 201 })
    })
  })

  describe('createSuccessResponse', () => {
    it('should create success response with success flag', () => {
      const data = { id: '123' }
      const response = createSuccessResponse(data) as any
      
      expect(response.data).toEqual({ success: true, data })
      expect(response.options).toEqual({ status: 200 })
    })
  })

  describe('helper functions', () => {
    it('handleNotFoundError should create 404 response', () => {
      const response = handleNotFoundError('Resource not found', 'Test.GET') as any
      
      expect(response.data).toEqual({
        error: 'Resource not found',
        status: 404,
        retryable: false
      })
    })

    it('handleNotFoundError should use default message', () => {
      const response = handleNotFoundError() as any
      
      expect(response.data.error).toBe('Не найдено')
      expect(response.data.status).toBe(404)
    })

    it('handleUnauthorizedError should create 401 response', () => {
      const response = handleUnauthorizedError('Login required', 'Auth.GET') as any
      
      expect(response.data).toEqual({
        error: 'Login required',
        status: 401,
        retryable: false
      })
    })

    it('handleForbiddenError should create 403 response', () => {
      const response = handleForbiddenError('Admin only', 'Admin.DELETE') as any
      
      expect(response.data).toEqual({
        error: 'Admin only',
        status: 403,
        retryable: false
      })
    })

    it('handleValidationError should create 400 response with details', () => {
      const details = [
        { field: 'email', message: 'Invalid' }
      ]
      
      const response = handleValidationError('Bad request', details, 'Test.POST') as any
      
      expect(response.data).toEqual({
        error: 'Bad request',
        status: 400,
        retryable: false,
        details
      })
    })
  })
})
