// Jest Setup File
// Global test setup and mocks

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.DATABASE_URL = 'file:./test.db'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-jest-tests-only'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Global mocks for fetch
global.fetch = jest.fn()

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks()
})
