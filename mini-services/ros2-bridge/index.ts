import { createServer, IncomingMessage, ServerResponse } from 'http'
import { Server } from 'socket.io'
import { WebSocketServer, WebSocket } from 'ws'

const LOG_PREFIX = '[ROS2Bridge]'

function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  logFn(`${LOG_PREFIX} [${level.toUpperCase()}] ${timestamp} - ${message}`, data || '')
}

// ROS2 topic registry
interface TopicRegistry {
  [topicName: string]: {
    type: string
    publishers: Set<string>
    subscribers: Set<string>
    lastMessage?: unknown
  }
}

// Service registry
interface ServiceRegistry {
  [serviceName: string]: {
    type: string
    providers: Set<string>
    clients: Set<string>
  }
}

// Parameter registry
interface ParameterRegistry {
  [paramName: string]: {
    value: unknown
    type: string
  }
}

const topicRegistry: TopicRegistry = {}
const serviceRegistry: ServiceRegistry = {}
const parameterRegistry: ParameterRegistry = {}

// Health check HTTP server
const healthServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
      topics: Object.keys(topicRegistry).length,
      services: Object.keys(serviceRegistry).length,
      parameters: Object.keys(parameterRegistry).length
    }))
  } else if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('ROS2 Bridge WebSocket Server is running\n')
  } else {
    res.writeHead(404)
    res.end('Not Found\n')
  }
})

// ROS2 Bridge WebSocket server (rosbridge_suite compatible)
const wss = new WebSocketServer({ server: healthServer, path: '/ros2' })

// Also create Socket.IO server for internal simulator communication
const io = new Server(healthServer, {
  path: '/simulator',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Track connected clients
const rosClients = new Map<string, WebSocket>()
const simulatorClients = new Set<string>()

// Process ROS2 bridge protocol messages
function processROS2Message(ws: WebSocket, message: string, clientId: string) {
  try {
    const msg = JSON.parse(message)
    log('info', `Message from ${clientId}: ${msg.op}`, msg)

    switch (msg.op) {
      case 'advertise':
        // Register publisher
        if (!topicRegistry[msg.topic]) {
          topicRegistry[msg.topic] = {
            type: msg.type,
            publishers: new Set(),
            subscribers: new Set()
          }
        }
        topicRegistry[msg.topic].publishers.add(clientId)
        sendToClient(ws, {
          op: 'status',
          level: 'info',
          msg: `Advertised topic: ${msg.topic}`
        })
        log('info', `Topic advertised: ${msg.topic} (${msg.type})`)
        break

      case 'unadvertise':
        // Remove publisher
        if (topicRegistry[msg.topic]) {
          topicRegistry[msg.topic].publishers.delete(clientId)
          if (topicRegistry[msg.topic].publishers.size === 0 && topicRegistry[msg.topic].subscribers.size === 0) {
            delete topicRegistry[msg.topic]
          }
        }
        log('info', `Topic unadvertised: ${msg.topic}`)
        break

      case 'subscribe':
        // Register subscriber
        if (!topicRegistry[msg.topic]) {
          topicRegistry[msg.topic] = {
            type: msg.type || 'std_msgs/String',
            publishers: new Set(),
            subscribers: new Set()
          }
        }
        topicRegistry[msg.topic].subscribers.add(clientId)
        
        // Send last message if available
        if (topicRegistry[msg.topic].lastMessage) {
          sendToClient(ws, {
            op: 'publish',
            topic: msg.topic,
            msg: topicRegistry[msg.topic].lastMessage
          })
        }
        log('info', `Subscription added: ${msg.topic}`)
        break

      case 'unsubscribe':
        // Remove subscriber
        if (topicRegistry[msg.topic]) {
          topicRegistry[msg.topic].subscribers.delete(clientId)
          if (topicRegistry[msg.topic].publishers.size === 0 && topicRegistry[msg.topic].subscribers.size === 0) {
            delete topicRegistry[msg.topic]
          }
        }
        log('info', `Subscription removed: ${msg.topic}`)
        break

      case 'publish':
        // Publish message to topic
        if (!topicRegistry[msg.topic]) {
          topicRegistry[msg.topic] = {
            type: msg.type || 'std_msgs/String',
            publishers: new Set([clientId]),
            subscribers: new Set(),
            lastMessage: msg.msg
          }
        } else {
          topicRegistry[msg.topic].lastMessage = msg.msg
        }

        // Forward to all subscribers
        broadcastToTopic(msg.topic, {
          op: 'publish',
          topic: msg.topic,
          msg: msg.msg
        }, clientId)

        // Also forward to simulator clients
        io.emit('ros-message', {
          topic: msg.topic,
          message: msg.msg,
          timestamp: Date.now()
        })

        log('info', `Published to topic: ${msg.topic}`)
        break

      case 'advertiseService':
        // Register service provider
        if (!serviceRegistry[msg.service]) {
          serviceRegistry[msg.service] = {
            type: msg.type,
            providers: new Set(),
            clients: new Set()
          }
        }
        serviceRegistry[msg.service].providers.add(clientId)
        sendToClient(ws, {
          op: 'status',
          level: 'info',
          msg: `Advertised service: ${msg.service}`
        })
        log('info', `Service advertised: ${msg.service}`)
        break

      case 'unadvertiseService':
        // Remove service provider
        if (serviceRegistry[msg.service]) {
          serviceRegistry[msg.service].providers.delete(clientId)
          if (serviceRegistry[msg.service].providers.size === 0 && serviceRegistry[msg.service].clients.size === 0) {
            delete serviceRegistry[msg.service]
          }
        }
        log('info', `Service unadvertised: ${msg.service}`)
        break

      case 'callService':
        // Call service (forward to providers)
        const serviceId = `service-call-${Date.now()}-${Math.random()}`
        if (serviceRegistry[msg.service]) {
          serviceRegistry[msg.service].clients.add(clientId)
          
          // Forward to service providers
          serviceRegistry[msg.service].providers.forEach(providerId => {
            const providerWs = rosClients.get(providerId)
            if (providerWs && providerWs.readyState === WebSocket.OPEN) {
              providerWs.send(JSON.stringify({
                op: 'service_request',
                id: serviceId,
                service: msg.service,
                args: msg.args
              }))
            }
          })
          
          // Store client info for response routing
          pendingServiceCalls[serviceId] = { ws, clientId }
        } else {
          sendToClient(ws, {
            op: 'service_response',
            id: serviceId,
            service: msg.service,
            result: false,
            values: { error: 'Service not found' }
          })
        }
        log('info', `Service called: ${msg.service}`)
        break

      case 'setParam':
        // Set parameter
        parameterRegistry[msg.name] = {
          value: msg.value,
          type: typeof msg.value
        }
        sendToClient(ws, {
          op: 'status',
          level: 'info',
          msg: `Parameter set: ${msg.name}`
        })
        log('info', `Parameter set: ${msg.name}`)
        break

      case 'getParam':
        // Get parameter
        const param = parameterRegistry[msg.name]
        sendToClient(ws, {
          op: 'param',
          name: msg.name,
          value: param ? param.value : null
        })
        log('info', `Parameter get: ${msg.name}`)
        break

      case 'deleteParam':
        // Delete parameter
        delete parameterRegistry[msg.name]
        sendToClient(ws, {
          op: 'status',
          level: 'info',
          msg: `Parameter deleted: ${msg.name}`
        })
        log('info', `Parameter deleted: ${msg.name}`)
        break

      case 'call_action':
        // Action calls (simplified implementation)
        sendToClient(ws, {
          op: 'status',
          level: 'warn',
          msg: 'Actions not fully supported yet'
        })
        log('warn', 'Action call attempted (not implemented)')
        break

      default:
        log('warn', `Unknown operation: ${msg.op}`)
        sendToClient(ws, {
          op: 'status',
          level: 'error',
          msg: `Unknown operation: ${msg.op}`
        })
    }
  } catch (error) {
    log('error', 'Error processing message', error)
    sendToClient(ws, {
      op: 'status',
      level: 'error',
      msg: 'Failed to parse message'
    })
  }
}

// Pending service calls for response routing
const pendingServiceCalls: Record<string, { ws: WebSocket; clientId: string }> = {}

// Send message to specific client
function sendToClient(ws: WebSocket, message: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  }
}

// Broadcast message to all subscribers of a topic
function broadcastToTopic(topic: string, message: object, excludeClientId?: string) {
  if (topicRegistry[topic]) {
    topicRegistry[topic].subscribers.forEach(clientId => {
      if (clientId !== excludeClientId) {
        const ws = rosClients.get(clientId)
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message))
        }
      }
    })
  }
}

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const clientId = `ros-client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  rosClients.set(clientId, ws)
  log('info', `ROS client connected: ${clientId}`)

  // Send welcome message
  ws.send(JSON.stringify({
    op: 'set_status_level',
    level: 'info'
  }))

  // Handle incoming messages
  ws.on('message', (data: WebSocket.Data) => {
    const message = data.toString()
    processROS2Message(ws, message, clientId)
  })

  // Handle service responses from providers
  ws.on('service_response', (response: { id: string; service: string; values: unknown; result: boolean }) => {
    const pendingCall = pendingServiceCalls[response.id]
    if (pendingCall) {
      sendToClient(pendingCall.ws, {
        op: 'service_response',
        id: response.id,
        service: response.service,
        values: response.values,
        result: response.result
      })
      delete pendingServiceCalls[response.id]
    }
  })

  // Handle disconnection
  ws.on('close', () => {
    rosClients.delete(clientId)
    
    // Clean up topic registry
    Object.keys(topicRegistry).forEach(topic => {
      topicRegistry[topic].publishers.delete(clientId)
      topicRegistry[topic].subscribers.delete(clientId)
      
      if (topicRegistry[topic].publishers.size === 0 && topicRegistry[topic].subscribers.size === 0) {
        delete topicRegistry[topic]
      }
    })

    // Clean up service registry
    Object.keys(serviceRegistry).forEach(service => {
      serviceRegistry[service].providers.delete(clientId)
      serviceRegistry[service].clients.delete(clientId)
      
      if (serviceRegistry[service].providers.size === 0 && serviceRegistry[service].clients.size === 0) {
        delete serviceRegistry[service]
      }
    })

    log('info', `ROS client disconnected: ${clientId}`)
  })

  ws.on('error', (error: Error) => {
    log('error', `WebSocket error (${clientId})`, error)
  })
})

// Socket.IO connections (simulator communication)
io.on('connection', (socket) => {
  simulatorClients.add(socket.id)
  log('info', `Simulator client connected: ${socket.id}`)

  // Forward simulator commands to ROS clients
  socket.on('ros-publish', (data: { topic: string; message: unknown }) => {
    broadcastToTopic(data.topic, {
      op: 'publish',
      topic: data.topic,
      msg: data.message
    })
    log('info', `Simulator published to ROS: ${data.topic}`)
  })

  // Subscribe simulator to ROS topics
  socket.on('ros-subscribe', (data: { topic: string }) => {
    if (!topicRegistry[data.topic]) {
      topicRegistry[data.topic] = {
        type: 'std_msgs/String',
        publishers: new Set(),
        subscribers: new Set()
      }
    }
    topicRegistry[data.topic].subscribers.add(`simulator-${socket.id}`)
    log('info', `Simulator subscribed to ROS topic: ${data.topic}`)
  })

  socket.on('disconnect', () => {
    simulatorClients.delete(socket.id)
    log('info', `Simulator client disconnected: ${socket.id}`)
  })
})

// Periodic topic status broadcast
const broadcastInterval = setInterval(() => {
  if (rosClients.size > 0) {
    const topicList = Object.keys(topicRegistry).map(topic => ({
      topic,
      type: topicRegistry[topic].type,
      publishers: topicRegistry[topic].publishers.size,
      subscribers: topicRegistry[topic].subscribers.size
    }))

    rosClients.forEach((ws, clientId) => {
      sendToClient(ws, {
        op: 'topics',
        topics: topicList,
        timestamp: Date.now()
      })
    })
  }
}, 5000) // Every 5 seconds

const PORT = 9090
healthServer.listen(PORT, () => {
  log('info', `ROS2 Bridge WebSocket server running on port ${PORT}`)
  log('info', `Health check endpoint: http://localhost:${PORT}/health`)
  log('info', `ROS2 Bridge endpoint: ws://localhost:${PORT}/ros2`)
  log('info', `Simulator Socket.IO endpoint: ws://localhost:${PORT}/simulator`)
})

// Graceful shutdown
function gracefulShutdown(signal: string) {
  log('info', `Received ${signal} signal, shutting down ROS2 bridge...`)

  if (broadcastInterval) {
    clearInterval(broadcastInterval)
  }

  // Close all WebSocket connections
  rosClients.forEach((ws) => {
    ws.close(1000, 'Server shutting down')
  })

  io.sockets.sockets.forEach((socket) => {
    socket.disconnect(true)
  })

  healthServer.close(() => {
    log('info', 'ROS2 Bridge server closed')
    process.exit(0)
  })

  setTimeout(() => {
    log('error', 'Forcing exit after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

process.on('uncaughtException', (error) => {
  log('error', 'Uncaught Exception', error)
  gracefulShutdown('uncaughtException')
})

process.on('unhandledRejection', (reason, promise) => {
  log('error', `Unhandled Rejection at: ${promise}`, reason)
})
