'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import type { RobotState, MultiRobotSession } from '@/types/multi-robot'

export function useMultiRobotSimulator() {
  const [robots, setRobots] = useState<RobotState[]>([])
  const [session, setSession] = useState<MultiRobotSession | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<ReturnType<typeof io> | null>(null)

  const handleRobotsUpdate = useCallback((updatedRobots: RobotState[]) => {
    setRobots(updatedRobots)
  }, [])

  const handleSessionUpdate = useCallback((updatedSession: MultiRobotSession) => {
    setSession(updatedSession)
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
      socket.emit('register', { type: 'multi-robot-viewer' })
      setIsConnected(true)
    }

    const handleDisconnect = (reason: string) => {
      setIsConnected(false)
      if (reason === 'io server disconnect') {
        toast.error('Сервер мульти-роботной симуляции отключён')
      }
    }

    const handleConnectError = () => {
      setIsConnected(false)
      toast.error('Не удалось подключиться к серверу')
    }

    const handleError = (error: { message: string; code?: string }) => {
      toast.error(error.message || 'Ошибка соединения')
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('error', handleError)
    socket.on('multi-robot-update', handleRobotsUpdate)
    socket.on('multi-session-update', handleSessionUpdate)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('error', handleError)
      socket.off('multi-robot-update', handleRobotsUpdate)
      socket.off('multi-session-update', handleSessionUpdate)
      socket.disconnect()
    }
  }, [])

  const startSession = useCallback(async (scenarioId: string, robotConfigs: Array<{
    id: string
    name: string
    color: string
    startPosition: { lat: number; lon: number }
  }>) => {
    if (!socketRef.current) {
      toast.error('WebSocket не инициализирован')
      return
    }

    try {
      socketRef.current.emit('multi-robot-start', {
        scenarioId,
        robots: robotConfigs
      })
      toast.success('Мульти-роботная сессия начата')
    } catch (error) {
      toast.error('Ошибка запуска мульти-роботной сессии')
    }
  }, [])

  const sendCommand = useCallback(async (robotId: string, command: string, data?: any) => {
    if (!socketRef.current) {
      toast.error('WebSocket не инициализирован')
      return
    }

    try {
      socketRef.current.emit('multi-robot-command', {
        robotId,
        command,
        data
      })
    } catch (error) {
      toast.error(`Ошибка отправки команды роботу ${robotId}`)
    }
  }, [])

  const sendBroadcastCommand = useCallback(async (command: string, data?: any) => {
    if (!socketRef.current) {
      toast.error('WebSocket не инициализирован')
      return
    }

    try {
      socketRef.current.emit('multi-broadcast-command', {
        command,
        data
      })
    } catch (error) {
      toast.error('Ошибка отправки широковещательной команды')
    }
  }, [])

  const stopSession = useCallback(async () => {
    if (!socketRef.current || !session) {
      toast.error('Нет активной сессии')
      return
    }

    try {
      socketRef.current.emit('multi-robot-stop', {
        sessionId: session.id
      })
      setSession(null)
      setRobots([])
      toast.success('Мульти-роботная сессия остановлена')
    } catch (error) {
      toast.error('Ошибка остановки мульти-роботной сессии')
    }
  }, [session])

  const pauseRobot = useCallback(async (robotId: string) => {
    await sendCommand(robotId, 'pause')
  }, [sendCommand])

  const resumeRobot = useCallback(async (robotId: string) => {
    await sendCommand(robotId, 'resume')
  }, [sendCommand])

  return {
    robots,
    session,
    isConnected,
    startSession,
    stopSession,
    sendCommand,
    sendBroadcastCommand,
    pauseRobot,
    resumeRobot,
  }
}
