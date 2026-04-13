'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

interface RosTopic {
  topic: string
  type: string
  publishers: number
  subscribers: number
}

interface RosMessage {
  topic: string
  message: unknown
  timestamp: number
}

interface UseROS2BridgeOptions {
  url?: string
  autoConnect?: boolean
}

export function useROS2Bridge({
  url = 'ws://localhost:9090/ros2',
  autoConnect = true
}: UseROS2BridgeOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [topics, setTopics] = useState<RosTopic[]>([])
  const [messages, setMessages] = useState<RosMessage[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const messageHandlersRef = useRef<Map<string, Array<(msg: unknown) => void>>>(new Map())
  const connectRef = useRef<(() => void) | null>(null)

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        toast.success('ROS2 Bridge подключён')
      }

      ws.onclose = () => {
        setIsConnected(false)
        toast.error('ROS2 Bridge отключён')

        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            connectRef.current?.()
          }
        }, 3000)
      }

      ws.onerror = () => {
        setIsConnected(false)
        toast.error('Ошибка подключения к ROS2 Bridge')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle topic list updates
          if (data.op === 'topics') {
            setTopics(data.topics || [])
          }

          // Handle published messages
          if (data.op === 'publish') {
            const newMessage: RosMessage = {
              topic: data.topic,
              message: data.msg,
              timestamp: Date.now()
            }
            setMessages(prev => [...prev.slice(-100), newMessage])

            // Call registered handlers
            const handlers = messageHandlersRef.current.get(data.topic)
            if (handlers) {
              handlers.forEach(handler => handler(data.msg))
            }
          }

          // Handle status messages
          if (data.op === 'status') {
            if (data.level === 'error') {
              toast.error(data.msg)
            } else if (data.level === 'warn') {
              toast.warning(data.msg)
            }
          }
        } catch (error) {
          console.error('Failed to parse ROS2 message:', error)
        }
      }
    } catch (error) {
      console.error('Failed to connect to ROS2 Bridge:', error)
      toast.error('Ошибка подключения к ROS2 Bridge')
    }
  }, [url])

  // Store connect function in ref for auto-reconnect
  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [connect, disconnect, autoConnect])

  // Advertise a topic (register as publisher)
  const advertise = useCallback((topic: string, type: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('ROS2 Bridge не подключён')
      return
    }

    wsRef.current.send(JSON.stringify({
      op: 'advertise',
      topic,
      type
    }))
  }, [])

  // Unadvertise a topic
  const unadvertise = useCallback((topic: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({
      op: 'unadvertise',
      topic
    }))
  }, [])

  // Subscribe to a topic
  const subscribe = useCallback((topic: string, type: string, handler: (msg: unknown) => void) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('ROS2 Bridge не подключён')
      return
    }

    // Register handler
    const handlers = messageHandlersRef.current.get(topic) || []
    handlers.push(handler)
    messageHandlersRef.current.set(topic, handlers)

    // Send subscribe message
    wsRef.current.send(JSON.stringify({
      op: 'subscribe',
      topic,
      type
    }))

    // Return unsubscribe function
    return () => {
      const topicHandlers = messageHandlersRef.current.get(topic) || []
      messageHandlersRef.current.set(
        topic,
        topicHandlers.filter(h => h !== handler)
      )

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          op: 'unsubscribe',
          topic
        }))
      }
    }
  }, [])

  // Publish a message
  const publish = useCallback((topic: string, type: string, message: unknown) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('ROS2 Bridge не подключён')
      return
    }

    wsRef.current.send(JSON.stringify({
      op: 'publish',
      topic,
      type,
      msg: message
    }))
  }, [])

  // Call a service
  const callService = useCallback(async (service: string, args: Record<string, unknown> = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('ROS2 Bridge не подключён')
      return null
    }

    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          if (data.op === 'service_response' && data.service === service) {
            wsRef.current?.removeEventListener('message', handler)
            resolve(data.values)
          }
        } catch (error) {
          console.error('Failed to parse service response:', error)
          resolve(null)
        }
      }

      wsRef.current?.addEventListener('message', handler)

      wsRef.current?.send(JSON.stringify({
        op: 'callService',
        service,
        args
      }))
    })
  }, [])

  // Set parameter
  const setParam = useCallback((name: string, value: unknown) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('ROS2 Bridge не подключён')
      return
    }

    wsRef.current.send(JSON.stringify({
      op: 'setParam',
      name,
      value
    }))
  }, [])

  // Get parameter
  const getParam = useCallback(async (name: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('ROS2 Bridge не подключён')
      return null
    }

    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          if (data.op === 'param' && data.name === name) {
            wsRef.current?.removeEventListener('message', handler)
            resolve(data.value)
          }
        } catch (error) {
          console.error('Failed to parse parameter response:', error)
          resolve(null)
        }
      }

      wsRef.current?.addEventListener('message', handler)

      wsRef.current?.send(JSON.stringify({
        op: 'getParam',
        name
      }))
    })
  }, [])

  // Get messages for a specific topic
  const getMessagesForTopic = useCallback((topic: string) => {
    return messages.filter(m => m.topic === topic)
  }, [messages])

  return {
    isConnected,
    topics,
    messages,
    connect,
    disconnect,
    advertise,
    unadvertise,
    subscribe,
    publish,
    callService,
    setParam,
    getParam,
    getMessagesForTopic,
  }
}
