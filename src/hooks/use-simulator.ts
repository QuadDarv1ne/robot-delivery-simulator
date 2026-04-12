import { useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import { useOnlineStatus } from '@/hooks/use-online-status'
import type {
  RobotState,
  SensorData,
  SimulatorState,
  SensorDataEvent,
  ControlCommandType,
  ServerToClientEvents,
  ClientToServerEvents,
} from '@/types/websocket'

export type { RobotState, SensorData, SimulatorState } from '@/types/websocket'

export function useSimulator() {
  const isOnline = useOnlineStatus()
  const [state, setState] = useState<SimulatorState>({
    robotState: null,
    sensorData: null,
    isConnected: false
  })

  const socketRef = useRef<ReturnType<typeof io<ServerToClientEvents, ClientToServerEvents>> | null>(null)

  const handleSensorData = useCallback((data: SensorDataEvent) => {
    setState(prev => ({ ...prev, sensorData: data.sensorData, robotState: data.robotState }))
  }, [])

  const handleRobotState = useCallback((robotState: RobotState) => {
    setState(prev => ({ ...prev, robotState }))
  }, [])

  useEffect(() => {
    const socket = io<ServerToClientEvents, ClientToServerEvents>('http://localhost:3003', {
      path: '/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    })
    socketRef.current = socket

    const handleConnect = () => {
      socket.emit('register', { type: 'viewer' })
      setState(prev => ({ ...prev, isConnected: true }))
    }

    const handleDisconnect = (reason: string) => {
      setState(prev => ({ ...prev, isConnected: false }))
      if (reason === 'io server disconnect') {
        toast.error('Сервер симуляции отключён')
      }
    }

    const handleConnectError = () => {
      setState(prev => ({ ...prev, isConnected: false }))
      toast.error('Не удалось подключиться к серверу симуляции')
    }

    const handleError = (error: { message: string; code?: string }) => {
      toast.error(error.message || 'Ошибка соединения')
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('error', handleError)
    socket.on('sensor-data', handleSensorData)
    socket.on('robot-state', handleRobotState)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('error', handleError)
      socket.off('sensor-data', handleSensorData)
      socket.off('robot-state', handleRobotState)
      socket.disconnect()
      socketRef.current = null
    }
  }, [handleSensorData, handleRobotState])

  const sendCommand = useCallback((type: ControlCommandType, data?: Record<string, unknown>) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('control', { type, data: data || {} })
    }
  }, [])

  return {
    state,
    isOnline,
    sendCommand,
    socketRef
  }
}
