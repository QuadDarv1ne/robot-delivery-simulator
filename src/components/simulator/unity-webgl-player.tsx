'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Cpu, Gauge, Loader2, AlertCircle, Play, RotateCcw } from 'lucide-react'
import { useSimulator } from '@/hooks/use-simulator'
import { toast } from 'sonner'

interface UnityInstance {
  SendMessage: (gameObject: string, methodName: string, value: string) => void
  SetFullscreen: (fullscreen: boolean) => void
}

declare global {
  interface Window {
    UnityInstance?: UnityInstance
    createUnityInstance?: (
      canvas: HTMLCanvasElement,
      config: Record<string, string>,
      onProgress?: (progress: number) => void
    ) => Promise<UnityInstance>
  }
}

interface UnityWebGLPlayerProps {
  buildUrl?: string
  className?: string
}

export function UnityWebGLPlayer({ buildUrl = '/unity-build', className = '' }: UnityWebGLPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const unityInstanceRef = useRef<UnityInstance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { state, sendCommand } = useSimulator()
  const retryCountRef = useRef(0)

  // Отправка данных из React в Unity
  const sendToUnity = useCallback((gameObject: string, method: string, value: string) => {
    if (unityInstanceRef.current) {
      try {
        unityInstanceRef.current.SendMessage(gameObject, method, value)
      } catch (err) {
        console.error('Failed to send message to Unity:', err)
      }
    }
  }, [])

  // Обновление состояния робота в Unity
  useEffect(() => {
    if (isReady && state.robotState) {
      const robotData = {
        position: JSON.stringify(state.robotState.position),
        rotation: JSON.stringify(state.robotState.rotation),
        battery: state.robotState.battery.toString(),
        status: state.robotState.status
      }

      sendToUnity('RobotController', 'UpdateRobotState', JSON.stringify(robotData))
    }
  }, [state.robotState, isReady, sendToUnity])

  // Обработка сенсорных данных
  useEffect(() => {
    if (isReady && state.sensorData) {
      sendToUnity('SensorManager', 'UpdateSensors', JSON.stringify(state.sensorData))
    }
  }, [state.sensorData, isReady, sendToUnity])

  // Загрузка Unity WebGL
  const loadUnity = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setLoadProgress(0)

    try {
      // Проверяем, существует ли билд
      const loaderUrl = `${buildUrl}/Build/${buildUrl.split('/').pop()}.loader.js`
      const response = await fetch(loaderUrl, { method: 'HEAD' })
      
      if (!response.ok) {
        throw new Error('Unity WebGL билд не найден. Поместите билд в public/unity-build')
      }

      // Загружаем Unity билд
      const scriptUrl = `${buildUrl}/Build/${buildUrl.split('/').pop()}.framework.js.gz`
      const config = {
        dataUrl: `${buildUrl}/Build/${buildUrl.split('/').pop()}.data.gz`,
        frameworkUrl: `${buildUrl}/Build/${buildUrl.split('/').pop()}.framework.js.gz`,
        codeUrl: `${buildUrl}/Build/${buildUrl.split('/').pop()}.wasm.gz`,
        streamingAssetsUrl: `${buildUrl}/StreamingAssets`,
      }

      if (!window.createUnityInstance) {
        // Динамически загружаем loader.js
        const loaderScript = document.createElement('script')
        loaderScript.src = `${buildUrl}/Build/${buildUrl.split('/').pop()}.loader.js`
        loaderScript.async = true
        
        await new Promise<void>((resolve, reject) => {
          loaderScript.onload = () => resolve()
          loaderScript.onerror = () => reject(new Error('Failed to load Unity loader'))
          document.head.appendChild(loaderScript)
        })
      }

      if (!canvasRef.current || !window.createUnityInstance) {
        throw new Error('Canvas not ready or Unity not loaded')
      }

      const unityInstance = await window.createUnityInstance(
        canvasRef.current,
        config,
        (progress) => {
          setLoadProgress(Math.round(progress * 100))
        }
      )

      unityInstanceRef.current = unityInstance
      window.UnityInstance = unityInstance
      setIsReady(true)
      setIsLoading(false)
      retryCountRef.current = 0
      
      toast.success('Unity WebGL загружен')
      
      // Инициализируем связь с WebSocket
      if (state.isConnected) {
        sendToUnity('NetworkManager', 'InitializeConnection', 'ready')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setIsLoading(false)
      setIsReady(false)
      
      if (retryCountRef.current < 2) {
        retryCountRef.current++
        toast.info(`Повторная попытка загрузки (${retryCountRef.current}/2)`)
        setTimeout(() => loadUnity(), 2000)
      } else {
        toast.error('Не удалось загрузить Unity WebGL')
      }
    }
  }, [buildUrl, state.isConnected, sendToUnity])

  // Загрузка при монтировании
  useEffect(() => {
    loadUnity()
    
    return () => {
      if (unityInstanceRef.current) {
        unityInstanceRef.current = null
      }
    }
  }, [loadUnity])

  // Обработка команд из симулятора
  useEffect(() => {
    const handleUnityCommand = (event: CustomEvent) => {
      const { command, data } = event.detail
      
      switch (command) {
        case 'move':
          sendCommand('move', data)
          break
        case 'stop':
          sendCommand('stop')
          break
        case 'reset':
          sendCommand('reset')
          break
        case 'setSpeed':
          sendCommand('setSpeed', data)
          break
        case 'setDestination':
          sendCommand('setDestination', data)
          break
        default:
          console.warn('Unknown Unity command:', command)
      }
    }

    window.addEventListener('unity-command', handleUnityCommand as EventListener)
    
    return () => {
      window.removeEventListener('unity-command', handleUnityCommand as EventListener)
    }
  }, [sendCommand])

  // Полноэкранный режим
  const toggleFullscreen = useCallback(() => {
    if (unityInstanceRef.current) {
      unityInstanceRef.current.SetFullscreen(!isFullscreen)
      setIsFullscreen(!isFullscreen)
    }
  }, [isFullscreen])

  // Перезагрузка
  const handleReload = useCallback(() => {
    if (unityInstanceRef.current) {
      unityInstanceRef.current = null
    }
    setIsReady(false)
    loadUnity()
  }, [loadUnity])

  // Запуск симуляции
  const handleStartSimulation = useCallback(() => {
    if (isReady) {
      sendToUnity('SimulationManager', 'StartSimulation', '')
      toast.info('Симуляция запущена')
    }
  }, [isReady, sendToUnity])

  // Показываем заглушку, если Unity не загружен
  if (!isReady && !isLoading && error) {
    return (
      <div className={`relative w-full h-full min-h-[400px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ошибка загрузки Unity</h3>
          <p className="text-sm text-slate-400 mb-4 text-center max-w-md">{error}</p>
          <div className="flex gap-2">
            <Button onClick={handleReload} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Повторить
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px'}}/>
      </div>
    )
  }

  if (!isReady && !isLoading) {
    return (
      <div className={`relative w-full h-full min-h-[400px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-20 h-20 text-blue-400">
                <rect x="25" y="40" width="50" height="40" rx="5" fill="currentColor" opacity="0.8"/>
                <rect x="30" y="20" width="40" height="25" rx="3" fill="currentColor" opacity="0.9"/>
                <circle cx="40" cy="30" r="4" fill="#1e293b"/>
                <circle cx="60" cy="30" r="4" fill="#1e293b"/>
                <circle cx="35" cy="85" r="8" fill="currentColor"/>
                <circle cx="65" cy="85" r="8" fill="currentColor"/>
                <rect x="45" y="10" width="10" height="15" rx="2" fill="currentColor"/>
                <circle cx="50" cy="10" r="5" fill="#22c55e"/>
              </svg>
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/50 animate-ping opacity-20"/>
          </div>
          <h3 className="text-xl font-semibold mb-2">Unity WebGL Симулятор</h3>
          <p className="text-sm text-slate-400 mb-4 text-center max-w-xs">Загрузите ваш Unity WebGL билд в папку public/unity-build</p>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-blue-500/50 text-blue-400"><Cpu className="w-3 h-3 mr-1" />Unity 2022.3+</Badge>
            <Badge variant="outline" className="border-green-500/50 text-green-400"><Gauge className="w-3 h-3 mr-1" />WebGL 2.0</Badge>
          </div>
        </div>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px'}}/>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Canvas для Unity */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Загрузка Unity WebGL</h3>
          <p className="text-sm text-slate-400 mb-4">{loadProgress}%</p>
          <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Оверлей управления */}
      {isReady && (
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            onClick={handleStartSimulation}
            size="sm"
            variant="secondary"
            className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
          >
            <Play className="w-4 h-4 mr-2" />
            Запуск
          </Button>
          <Button
            onClick={toggleFullscreen}
            size="sm"
            variant="secondary"
            className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
          >
            {isFullscreen ? '⛶' : '⛶'}
          </Button>
          <Button
            onClick={handleReload}
            size="sm"
            variant="secondary"
            className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Статус соединения */}
      {isReady && (
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Badge 
            variant="outline" 
            className={`
              ${state.isConnected ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-red-500/50 text-red-400 bg-red-500/10'}
              backdrop-blur-sm
            `}
          >
            <Gauge className="w-3 h-3 mr-1" />
            {state.isConnected ? 'WebSocket: Подключено' : 'WebSocket: Отключено'}
          </Badge>
          {state.robotState && (
            <Badge 
              variant="outline" 
              className="border-blue-500/50 text-blue-400 bg-blue-500/10 backdrop-blur-sm"
            >
              <Cpu className="w-3 h-3 mr-1" />
              Батарея: {state.robotState.battery.toFixed(0)}%
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
