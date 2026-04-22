'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export interface User {
  id: string
  email: string
  name: string
  role: string
  group?: string
  avatar?: string
  totalDeliveries?: number
  successRate?: number
  totalDistance?: number
  totalCollisions?: number
  averageTime?: number
  bestTime?: number | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string, group?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateUser: (data: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/user/me', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else if (response.status === 401) {
        setUser(null)
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Network error during session check')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [checkSession])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const data = await response.json()
        return { success: false, error: data.error || 'Ошибка входа' }
      }

      const data = await response.json()
      setUser(data.user)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Ошибка соединения' }
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name: string, group?: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, group })
      })

      if (!response.ok) {
        const data = await response.json()
        return { success: false, error: data.error || 'Ошибка регистрации' }
      }

      const data = await response.json()
      setUser(data.user)
      return { success: true }
    } catch (error) {
      console.error('Register error:', error)
      return { success: false, error: 'Ошибка соединения' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.refresh()
    }
  }, [router])

  const updateUser = useCallback(async (data: Partial<User>) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Ошибка обновления профиля'
        toast.error(errorMessage)
        throw new Error(errorMessage)
      }

      const updated = await response.json()
      setUser(prev => prev ? { ...prev, ...updated.user } : null)
      toast.success('Профиль обновлён')
    } catch (error) {
      // Error is already handled with toast above
      if (!(error instanceof Error && error.message.includes('Ошибка'))) {
        console.error('Update user error:', error)
      }
      throw error
    }
  }, [])

  const refreshUser = useCallback(async () => {
    await checkSession()
  }, [checkSession])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
