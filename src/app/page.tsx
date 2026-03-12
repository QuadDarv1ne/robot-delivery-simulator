'use client'

import { useState, Suspense } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthForm } from '@/components/auth-form'
import { UserProfile } from '@/components/user-profile'
import { ForgotPasswordForm, ResetPasswordForm } from '@/components/password-reset-forms'
import { AdminPanel } from '@/components/admin-panel'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useSearchParams, useRouter } from 'next/navigation'

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

type ViewType = 'simulator' | 'profile' | 'admin' | 'forgot-password' | 'reset-password'

function PageContent() {
  const { user, isLoading, logout, isAuthenticated, refreshUser } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get URL params - use useMemo to compute initial values
  const resetParam = searchParams.get('reset')
  const adminParam = searchParams.get('admin')
  
  // Compute initial view based on URL params and auth state
  const getInitialView = (): ViewType => {
    if (resetParam) return 'reset-password'
    if (adminParam === 'true' && isAuthenticated && (user?.role === 'admin' || user?.role === 'teacher')) return 'admin'
    return 'simulator'
  }
  
  const [view, setView] = useState<ViewType>(getInitialView)
  const [resetToken] = useState(resetParam)

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const handleLoginSuccess = () => {
    refreshUser()
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  // Password reset view
  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <ForgotPasswordForm onBack={() => setView('simulator')} />
      </div>
    )
  }

  // Reset password view
  if (view === 'reset-password' && resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <ResetPasswordForm 
          token={resetToken} 
          onSuccess={() => { setView('simulator'); router.push('/') }} 
          onBack={() => { setView('simulator'); router.push('/') }}
        />
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <AuthForm 
          onSuccess={handleLoginSuccess}
          onForgotPassword={() => setView('forgot-password')}
        />
      </div>
    )
  }

  // Admin panel
  if (view === 'admin' && (user?.role === 'admin' || user?.role === 'teacher')) {
    return <AdminPanel onLogout={handleLogout} />
  }

  // Profile panel
  if (view === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-md mx-auto">
          <button 
            onClick={() => setView('simulator')}
            className="mb-4 text-sm text-muted-foreground hover:text-white"
          >
            ← Вернуться к симулятору
          </button>
          <UserProfile onLogout={handleLogout} />
          
          {/* Admin panel button for admins/teachers */}
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <button
              onClick={() => setView('admin')}
              className="mt-4 w-full text-center text-sm text-blue-400 hover:text-blue-300"
            >
              🛡️ Открыть админ-панель
            </button>
          )}
        </div>
      </div>
    )
  }

  // Show main simulator
  return (
    <RobotSimulatorContent 
      user={user} 
      onLogout={handleLogout} 
      onShowProfile={() => setView('profile')}
      onShowAdmin={() => setView('admin')}
    />
  )
}

export default function RobotSimulator() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <PageContent />
    </Suspense>
  )
}
