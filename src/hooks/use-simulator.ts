import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { useOnlineStatus } from '@/hooks/use-online-status'

export interface RobotState {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  battery: number
  status: 'idle' | 'moving' | 'delivering' | 'charging' | 'error'
}

export interface SensorData {
  gps: { lat: number; lon: number; altitude: number; accuracy: number }
  lidar: { distances: number[]; angles: number[]; timestamp: number }
  cameras: { front: string; back: string; left: string; right: string }
  encoders: { leftWheel: number; rightWheel: number }
  imu: { acceleration: { x: number; y: number; z: number }; gyro: { x: number; y: number; z: number } }
}

export interface SimulatorState {
  robotState: RobotState | null
  sensorData: SensorData | null
  isConnected: boolean
}

export function useSimulator() {
  const isOnline = useOnlineStatus()
  const [state, setState] = useState<SimulatorState>({
    robotState: null,
    sensorData: null,
    isConnected: false
  })

  const socketRef = useRef<Socket | null>(null)

  const handleSensorData = useCallback((data: { sensorData: SensorData; robotState: RobotState }) => {
    setState(prev => ({ ...prev, sensorData: data.sensorData, robotState: data.robotState }))
  }, [])

  const handleRobotState = useCallback((robotState: RobotState) => {
    setState(prev => ({ ...prev, robotState }))
  }, [])

  useEffect(() => {
    const socket = io('http://localhost:3003', {
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

    const handleError = () => {
      toast.error('Ошибка соединения')
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

  const sendCommand = useCallback((type: string, data?: Record<string, unknown>) => {
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
