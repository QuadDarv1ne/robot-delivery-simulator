/**
 * Tests for custom hooks
 */

import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/use-debounce'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { useOnlineStatus } from '@/hooks/use-online-status'

// Mock window.localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Custom Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
  })

  describe('useDebounce', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    it('should return the initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('test', 300))
      expect(result.current).toBe('test')
    })

    it('should debounce the value', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 300 } }
      )

      expect(result.current).toBe('initial')

      rerender({ value: 'updated', delay: 300 })
      expect(result.current).toBe('initial')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      expect(result.current).toBe('updated')
    })

    it('should reset timer when value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'first', delay: 300 } }
      )

      rerender({ value: 'second', delay: 300 })
      rerender({ value: 'third', delay: 300 })

      act(() => {
        jest.advanceTimersByTime(200)
      })

      expect(result.current).toBe('first')

      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(result.current).toBe('third')
    })
  })

  describe('useLocalStorage', () => {
    it('should return initial value when localStorage is empty', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value')
      )

      expect(result.current[0]).toBe('initial-value')
    })

    it('should return value from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify('stored-value'))

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value')
      )

      expect(result.current[0]).toBe('stored-value')
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key')
    })

    it('should set value in localStorage', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value')
      )

      act(() => {
        result.current[1]('new-value')
      })

      expect(result.current[0]).toBe('new-value')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify('new-value')
      )
    })

    it('should set value using function', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(0))
      
      const { result } = renderHook(() =>
        useLocalStorage('count', 0)
      )

      act(() => {
        result.current[1]((prev: number) => prev + 1)
      })

      expect(result.current[0]).toBe(1)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('count', '1')
    })

    it('should remove value from localStorage', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value')
      )

      act(() => {
        result.current[2]()
      })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key')
      expect(result.current[0]).toBe('initial-value')
    })

    it('should handle JSON parse error gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json')
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'default-value')
      )

      expect(result.current[0]).toBe('default-value')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('useOnlineStatus', () => {
    it('should return initial online status', () => {
      const { result } = renderHook(() => useOnlineStatus())
      expect(typeof result.current).toBe('boolean')
    })

    it('should handle online event', () => {
      const { result } = renderHook(() => useOnlineStatus())

      act(() => {
        window.dispatchEvent(new Event('offline'))
      })

      expect(result.current).toBe(false)

      act(() => {
        window.dispatchEvent(new Event('online'))
      })

      expect(result.current).toBe(true)
    })

    it('should handle offline event', () => {
      const { result } = renderHook(() => useOnlineStatus())

      act(() => {
        window.dispatchEvent(new Event('offline'))
      })

      expect(result.current).toBe(false)
    })

    it('should clean up event listeners on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useOnlineStatus())

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })
})
