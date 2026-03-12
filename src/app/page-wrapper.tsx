'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthForm } from '@/components/auth-form'
import { UserProfile } from '@/components/user-profile'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamic import for the main simulator component
const RobotSimulatorContent = dynamic(
  () => import('./simulator-content'),
  { 
    ssr: false, 
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Загрузка симулятора...</p>
        </div>
      </div>
    )
  }
)

export default function RobotSimulator() {
  const { user, isLoading, logout, isAuthenticated } = useAuth()
  const [showProfile, setShowProfile] = useState(false)
  const [demoUserCreated, setDemoUserCreated] = useState(false)

  // Create demo user on first load
  useEffect(() => {
    fetch('/api/demo-user').then(() => setDemoUserCreated(true))
  }, [])

  // Show loading state
  if (isLoading || !demoUserCreated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <AuthForm />
      </div>
    )
  }

  // Show profile panel if requested
  if (showProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-md mx-auto">
          <button 
            onClick={() => setShowProfile(false)}
            className="mb-4 text-sm text-muted-foreground hover:text-white"
          >
            ← Вернуться к симулятору
          </button>
          <UserProfile onLogout={logout} />
        </div>
      </div>
    )
  }

  // Show main simulator
  return (
    <RobotSimulatorContent 
      user={user} 
      onLogout={logout} 
      onShowProfile={() => setShowProfile(true)}
    />
  )
}
