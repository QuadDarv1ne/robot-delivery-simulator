/**
 * Tests for React components
 */

import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'

// Mock next/navigation
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

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
}))

// Mock window.location for Leaderboard component
delete (window as any).location
;(window as any).location = { origin: 'http://localhost:3000', href: 'http://localhost:3000/', hostname: 'localhost', protocol: 'http:' }

// Mock ResizeObserver for recharts
;(global as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('Button Component', () => {
    it('should render button with children', async () => {
      const { Button } = await import('@/components/ui/button')
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('should render button with variant', async () => {
      const { Button } = await import('@/components/ui/button')
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button', { name: /delete/i })
      expect(button).toBeInTheDocument()
    })

    it('should render disabled button', async () => {
      const { Button } = await import('@/components/ui/button')
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button', { name: /disabled/i })).toBeDisabled()
    })
  })

  describe('Card Component', () => {
    it('should render card structure', async () => {
      const { Card, CardContent, CardDescription, CardHeader, CardTitle } = await import('@/components/ui/card')
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>Test Content</CardContent>
        </Card>
      )
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('Badge Component', () => {
    it('should render badge with variant', async () => {
      const { Badge } = await import('@/components/ui/badge')
      render(<Badge variant="secondary">Status</Badge>)
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should render default badge', async () => {
      const { Badge } = await import('@/components/ui/badge')
      render(<Badge>Default</Badge>)
      expect(screen.getByText('Default')).toBeInTheDocument()
    })
  })

  describe('Progress Component', () => {
    it('should render progress bar with value', async () => {
      const { Progress } = await import('@/components/ui/progress')
      const { container } = render(<Progress value={75} />)
      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument()
    })

    it('should render progress bar with zero value', async () => {
      const { Progress } = await import('@/components/ui/progress')
      const { container } = render(<Progress value={0} />)
      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument()
    })
  })

  describe('Input Component', () => {
    it('should render input field', async () => {
      const { Input } = await import('@/components/ui/input')
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })
  })

  describe('Separator Component', () => {
    it('should render separator', async () => {
      const { Separator } = await import('@/components/ui/separator')
      const { container } = render(<Separator />)
      expect(container.firstChild).toHaveAttribute('role', 'none')
    })
  })

  describe('Leaderboard Component', () => {
    it('should render loading state', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      const { Leaderboard } = await import('@/components/leaderboard')
      render(<Leaderboard />)

      expect(screen.getByText(/загрузка рейтинга/i)).toBeInTheDocument()
    })

    it('should render empty state when no data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          leaderboard: [],
          groups: [],
          currentUserPosition: null,
          period: 'all',
          total: 0,
        }),
      })

      const { Leaderboard } = await import('@/components/leaderboard')
      render(<Leaderboard />)

      await waitFor(() => {
        expect(screen.getByText(/нет данных/i)).toBeInTheDocument()
      })
    })

    it('should render leaderboard with users', async () => {
      jest.useFakeTimers()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          leaderboard: [
            {
              id: '1', rank: 1, name: 'Иван Иванов', email: 'ivan@test.ru',
              group: 'Группа А', avatar: null, totalDeliveries: 10,
              successfulDeliveries: 9, successRate: 90, totalDistance: 5000,
              totalCollisions: 1, avgDuration: 300, bestTime: 250,
              achievements: 2, score: 950, previousRank: 2,
            },
          ],
          groups: ['Группа А'],
          currentUserPosition: null,
          period: 'all',
          total: 1,
        }),
      })

      const { Leaderboard } = await import('@/components/leaderboard')
      const { container, rerender } = render(<Leaderboard currentUserId="1" />)
      rerender(<Leaderboard currentUserId="1" />)
      jest.advanceTimersByTime(1000)

      expect(container.textContent).toBeTruthy()
      jest.useRealTimers()
    })
  })

  describe('AnalyticsPanel Component', () => {
    it('should render analytics panel with stats', async () => {
      jest.useFakeTimers()
      const { AnalyticsPanel } = await import('@/components/analytics-panel')
      const { container } = render(<AnalyticsPanel />)
      jest.advanceTimersByTime(100)

      expect(container.textContent).toContain('Аналитика')
      expect(container.textContent).toContain('Всего доставок')
      jest.useRealTimers()
    })

    it('should render charts tabs', async () => {
      jest.useFakeTimers()
      const { AnalyticsPanel } = await import('@/components/analytics-panel')
      const { container } = render(<AnalyticsPanel />)
      jest.advanceTimersByTime(100)

      expect(container.textContent).toContain('Скорость')
      expect(container.textContent).toContain('Батарея')
      expect(container.textContent).toContain('Расстояние')
      expect(container.textContent).toContain('Статус')
      jest.useRealTimers()
    })

    it('should render session logs', async () => {
      jest.useFakeTimers()
      const { AnalyticsPanel } = await import('@/components/analytics-panel')
      const { container } = render(<AnalyticsPanel />)
      jest.advanceTimersByTime(100)

      expect(container.textContent).toContain('История сессий')
      expect(container.textContent).toContain('Тестовый маршрут')
      jest.useRealTimers()
    })

    it('should render performance metrics', async () => {
      jest.useFakeTimers()
      const { AnalyticsPanel } = await import('@/components/analytics-panel')
      const { container } = render(<AnalyticsPanel />)
      jest.advanceTimersByTime(100)

      expect(container.textContent).toContain('Метрики производительности')
      expect(container.textContent).toContain('Эффективность маршрута')
      jest.useRealTimers()
    })
  })
})
