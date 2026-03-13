/**
 * Tests for utility functions
 */

describe('Utility Functions', () => {
  describe('formatDistance', () => {
    it('should format distance in meters', () => {
      const formatDistance = (meters: number): string => {
        if (meters >= 1000) {
          return `${(meters / 1000).toFixed(2)} km`
        }
        return `${meters.toFixed(0)} m`
      }

      expect(formatDistance(500)).toBe('500 m')
      expect(formatDistance(1500)).toBe('1.50 km')
      expect(formatDistance(2500)).toBe('2.50 km')
    })
  })

  describe('formatTime', () => {
    it('should format time in seconds to MM:SS', () => {
      const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }

      expect(formatTime(0)).toBe('00:00')
      expect(formatTime(65)).toBe('01:05')
      expect(formatTime(125)).toBe('02:05')
    })
  })

  describe('calculateEfficiencyScore', () => {
    it('should calculate efficiency score based on distance and battery', () => {
      const calculateEfficiencyScore = (
        distance: number,
        batteryUsed: number,
        maxDistance: number,
        maxBattery: number
      ): number => {
        const distanceRatio = distance / maxDistance
        const batteryRatio = 1 - (batteryUsed / maxBattery)
        return Math.round((distanceRatio * 0.6 + batteryRatio * 0.4) * 100)
      }

      expect(calculateEfficiencyScore(500, 20, 1000, 100)).toBeGreaterThanOrEqual(0)
      expect(calculateEfficiencyScore(1000, 50, 1000, 100)).toBeGreaterThanOrEqual(50)
    })
  })

  describe('validateEmail', () => {
    it('should validate email format', () => {
      const validateEmail = (email: string): boolean => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return re.test(email)
      }

      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
    })
  })

  describe('generateToken', () => {
    it('should generate a random token of specified length', () => {
      const generateToken = (length: number = 32): string => {
        return Array.from({ length }, () => 
          Math.floor(Math.random() * 36).toString(36)
        ).join('')
      }

      const token = generateToken(32)
      expect(token).toHaveLength(32)
      expect(token).toMatch(/^[a-z0-9]+$/)
    })
  })
})
