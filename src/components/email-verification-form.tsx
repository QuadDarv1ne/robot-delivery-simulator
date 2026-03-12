'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  Mail,
  AlertTriangle,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'

export function EmailVerificationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'checking' | 'valid' | 'verifying' | 'success' | 'error'>('checking')
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Check token validity on mount
  useEffect(() => {
    if (token) {
      checkToken()
    } else {
      setStatus('valid') // Allow manual entry
    }
  }, [token])

  const checkToken = async () => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`)
      const data = await response.json()

      if (data.valid) {
        setEmail(data.email || '')
        setStatus('valid')
      } else {
        setError(data.error || 'Недействительный токен')
        setStatus('error')
      }
    } catch {
      setError('Ошибка проверки токена')
      setStatus('error')
    }
  }

  const handleVerify = async () => {
    setIsLoading(true)
    setError(null)
    setStatus('verifying')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/?verified=true')
        }, 3000)
      } else {
        setError(data.error || 'Ошибка подтверждения')
        setStatus('error')
      }
    } catch {
      setError('Ошибка соединения')
      setStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      
      if (data.success) {
        setError(null)
        alert('Письмо отправлено! Проверьте почту.')
      } else {
        setError(data.error || 'Ошибка отправки')
      }
    } catch {
      setError('Ошибка соединения')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'checking') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Проверка токена...</p>
        </CardContent>
      </Card>
    )
  }

  if (status === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="mb-2">Email подтверждён!</CardTitle>
          <CardDescription>
            Ваш email успешно подтверждён. Перенаправление на страницу входа...
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <CardTitle>Ошибка подтверждения</CardTitle>
              <CardDescription>Не удалось подтвердить email</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label>Запросить новое письмо</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
              <Button onClick={handleResend} disabled={isLoading || !email}>
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Отправить'}
              </Button>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться на главную
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <CardTitle>Подтверждение email</CardTitle>
            <CardDescription>Нажмите кнопку для подтверждения</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {email && (
          <p className="text-sm text-muted-foreground">
            Подтверждение email: <strong>{email}</strong>
          </p>
        )}

        <Button
          className="w-full"
          onClick={handleVerify}
          disabled={isLoading || status === 'verifying'}
        >
          {status === 'verifying' ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Подтверждение...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Подтвердить email
            </>
          )}
        </Button>

        <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Отмена
        </Button>
      </CardContent>
    </Card>
  )
}
