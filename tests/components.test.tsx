/**
 * Tests for React components
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

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

describe('Components', () => {
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
})
