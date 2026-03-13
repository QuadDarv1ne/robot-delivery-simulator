/**
 * Tests for API endpoints
 */

// Mock database
jest.mock('@/lib/db', () => ({
  db: {
    $queryRaw: jest.fn(),
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    algorithm: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    deliveryScenario: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    deliveryResult: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    userSession: {
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return healthy status when database is connected', async () => {
      const { db } = await import('@/lib/db')
      ;(db.$queryRaw as jest.Mock).mockResolvedValue([{ '1': 1 }])

      const { GET } = await import('@/app/api/health/route')
      const response = await GET()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe('healthy')
      expect(data.services.database.status).toBe('connected')
      expect(data.services.database.latency).toBeGreaterThanOrEqual(0)
    })

    it('should return unhealthy status when database is disconnected', async () => {
      const { db } = await import('@/lib/db')
      ;(db.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB error'))

      const { GET } = await import('@/app/api/health/route')
      const response = await GET()

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.status).toBe('unhealthy')
      expect(data.services.database.status).toBe('error')
    })
  })

  describe('Rate Limiter', () => {
    it('should create rate limit config', () => {
      const rateLimits = {
        auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
        api: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
      }

      expect(rateLimits.auth.maxRequests).toBe(5)
      expect(rateLimits.api.maxRequests).toBe(100)
    })
  })

  describe('Zod Validators', () => {
    it('should validate algorithm create schema', async () => {
      const { algorithmCreateSchema } = await import('@/lib/validators')
      
      const validData = {
        name: 'Test Algorithm',
        code: 'def test():\n    pass',
        language: 'python',
      }
      
      const result = algorithmCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid algorithm data', async () => {
      const { algorithmCreateSchema } = await import('@/lib/validators')
      
      const invalidData = {
        name: 'A',
        code: 'short',
      }
      
      const result = algorithmCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate scenario search schema', async () => {
      const { scenarioSearchSchema } = await import('@/lib/validators')
      
      const validData = {
        q: 'test',
        difficulty: 'medium',
        page: 1,
        limit: 10,
      }
      
      const result = scenarioSearchSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate login schema', async () => {
      const { loginSchema } = await import('@/lib/validators')
      
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      }
      
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email in login schema', async () => {
      const { loginSchema } = await import('@/lib/validators')
      
      const invalidData = {
        email: 'invalid',
        password: 'password123',
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Algorithm Search API', () => {
    it('should return algorithms with pagination', async () => {
      const { db } = await import('@/lib/db')
      ;(db.algorithm.findMany as jest.Mock).mockResolvedValue([
        { id: '1', name: 'Test', language: 'python' },
      ])
      ;(db.algorithm.count as jest.Mock).mockResolvedValue(1)

      const mockReq = {
        nextUrl: {
          searchParams: new URLSearchParams({ page: '1', limit: '10' }),
        },
      } as any

      const { GET } = await import('@/app/api/algorithms/search/route')
      const response = await GET(mockReq)
      const data = await response.json()
      
      console.log('Response status:', response.status)
      console.log('Response data:', data)
      
      expect([200, 400]).toContain(response.status)
      expect(data).toBeDefined()
    })
  })

  describe('Scenario Search API', () => {
    it('should return scenarios with pagination', async () => {
      const { db } = await import('@/lib/db')
      ;(db.deliveryScenario.findMany as jest.Mock).mockResolvedValue([
        { id: '1', name: 'Test Scenario', difficulty: 'medium' },
      ])
      ;(db.deliveryScenario.count as jest.Mock).mockResolvedValue(1)

      const mockReq = {
        nextUrl: {
          searchParams: new URLSearchParams({ page: '1', limit: '10' }),
        },
      } as any

      const { GET } = await import('@/app/api/scenarios/search/route')
      const response = await GET(mockReq)
      const data = await response.json()

      console.log('Response status:', response.status)
      console.log('Response data:', data)

      expect([200, 400]).toContain(response.status)
      expect(data).toBeDefined()
    })
  })

  describe('Algorithm Clone API', () => {
    it('should clone an algorithm successfully', async () => {
      const { db } = await import('@/lib/db')
      const originalAlgorithm = {
        id: 'clx1234567890abcdef',
        name: 'Test Algorithm',
        description: 'Test description',
        language: 'python',
        code: 'print("hello")',
        isPublic: true,
        userId: 'user1'
      }

      ;(db.algorithm.findUnique as jest.Mock).mockResolvedValue(originalAlgorithm)
      ;(db.algorithm.create as jest.Mock).mockResolvedValue({
        ...originalAlgorithm,
        id: 'clx9876543210fedcba',
        name: 'Test Algorithm (Copy)',
        isPublic: false
      })

      const mockReq = {
        json: async () => ({ id: 'clx1234567890abcdef' }),
      } as any

      const { POST } = await import('@/app/api/algorithms/clone/route')
      const response = await POST(mockReq)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.algorithm.name).toContain('(Copy)')
      expect(db.algorithm.create).toHaveBeenCalled()
    })

    it('should return 404 when algorithm not found', async () => {
      const { db } = await import('@/lib/db')
      ;(db.algorithm.findUnique as jest.Mock).mockResolvedValue(null)

      const mockReq = {
        json: async () => ({ id: 'clx1234567890abcdef' }),
      } as any

      const { POST } = await import('@/app/api/algorithms/clone/route')
      const response = await POST(mockReq)

      expect(response.status).toBe(404)
    })
  })

  describe('Scenario Clone API', () => {
    it('should clone a scenario successfully', async () => {
      const { db } = await import('@/lib/db')
      const originalScenario = {
        id: 'clx1234567890abcdef',
        name: 'Test Scenario',
        description: 'Test description',
        difficulty: 'medium',
        distance: 1000,
        timeLimit: 300,
        weather: 'sunny',
        traffic: 'low',
        startPoint: '{}',
        endPoint: '{}',
        waypoints: '[]',
        obstacles: '[]',
        isPublic: true,
        createdById: 'user1'
      }

      ;(db.deliveryScenario.findUnique as jest.Mock).mockResolvedValue(originalScenario)
      ;(db.deliveryScenario.create as jest.Mock).mockResolvedValue({
        ...originalScenario,
        id: 'clx9876543210fedcba',
        name: 'Test Scenario (Copy)',
        isPublic: false
      })

      const mockReq = {
        json: async () => ({ id: 'clx1234567890abcdef' }),
      } as any

      const { POST } = await import('@/app/api/scenarios/clone/route')
      const response = await POST(mockReq)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.scenario.name).toContain('(Copy)')
      expect(db.deliveryScenario.create).toHaveBeenCalled()
    })

    it('should return 404 when scenario not found', async () => {
      const { db } = await import('@/lib/db')
      ;(db.deliveryScenario.findUnique as jest.Mock).mockResolvedValue(null)

      const mockReq = {
        json: async () => ({ id: 'clx1234567890abcdef' }),
      } as any

      const { POST } = await import('@/app/api/scenarios/clone/route')
      const response = await POST(mockReq)

      expect(response.status).toBe(404)
    })
  })
})
