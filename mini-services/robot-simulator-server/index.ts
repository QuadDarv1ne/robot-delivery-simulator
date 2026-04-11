import { createServer, IncomingMessage, ServerResponse } from 'http'
import { Server } from 'socket.io'
import { io as ioClient, Socket as IOClientSocket } from 'socket.io-client'

const LOG_PREFIX = '[RobotSimulator]'

function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  logFn(`${LOG_PREFIX} [${level.toUpperCase()}] ${timestamp} - ${message}`, data || '')
}

// Health check HTTP server
const healthServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
      clients: clients.size
    }))
  } else if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Robot Simulator WebSocket Server is running\n')
  } else {
    res.writeHead(404)
    res.end('Not Found\n')
  }
})

const io = new Server(healthServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000,
})

// Types
interface RobotState {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  battery: number
  status: 'idle' | 'moving' | 'delivering' | 'charging' | 'error'
}

interface SensorData {
  gps: { lat: number; lon: number; altitude: number; accuracy: number }
  lidar: { distances: number[]; angles: number[]; timestamp: number }
  cameras: { front: string; back: string; left: string; right: string }
  encoders: { leftWheel: number; rightWheel: number }
  imu: { acceleration: { x: number; y: number; z: number }; gyro: { x: number; y: number; z: number } }
}

interface ControlCommand {
  type: 'move' | 'stop' | 'setSpeed' | 'setDestination' | 'getBattery' | 'getLocation' | 'resetPosition' | 'getSensors' | 'setSensors' | 'addObstacle' | 'removeObstacle' | 'clearObstacles' | 'sdrCommand'
  data: Record<string, unknown>
}

// Simulated obstacles
const obstacles = new Map<string, { type: 'pedestrian' | 'vehicle' | 'construction'; position: { x: number; y: number; z: number }; radius: number }>()

// Simulated robot state
let robotState: RobotState = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  battery: 85,
  status: 'idle'
}

// Generate simulated sensor data
function generateSensorData(): SensorData {
  const now = Date.now()
  
  // Simulate GPS data
  const gps = {
    lat: 55.7558 + Math.sin(now / 10000) * 0.001,
    lon: 37.6173 + Math.cos(now / 10000) * 0.001,
    altitude: 150 + Math.random() * 5,
    accuracy: 2 + Math.random() * 3
  }
  
  // Simulate Lidar data (360 degrees scan)
  const lidarDistances: number[] = []
  const lidarAngles: number[] = []
  for (let i = 0; i < 360; i += 5) {
    lidarAngles.push(i)
    lidarDistances.push(5 + Math.random() * 20)
  }
  const lidar = { distances: lidarDistances, angles: lidarAngles, timestamp: now }
  
  // Camera feeds (placeholder URLs)
  const cameras = {
    front: `/api/camera/front?t=${now}`,
    back: `/api/camera/back?t=${now}`,
    left: `/api/camera/left?t=${now}`,
    right: `/api/camera/right?t=${now}`
  }
  
  // Wheel encoders
  const encoders = {
    leftWheel: Math.floor(now / 100) % 10000,
    rightWheel: Math.floor(now / 100 + Math.random() * 100) % 10000
  }
  
  // IMU data
  const imu = {
    acceleration: {
      x: Math.sin(now / 1000) * 0.1,
      y: Math.cos(now / 1000) * 0.1,
      z: 9.81 + Math.random() * 0.1
    },
    gyro: {
      x: Math.sin(now / 2000) * 0.05,
      y: Math.cos(now / 2000) * 0.05,
      z: Math.sin(now / 3000) * 0.02
    }
  }
  
  return { gps, lidar, cameras, encoders, imu }
}

// Update robot state
function updateRobotState() {
  const now = Date.now()

  if (robotState.status === 'moving') {
    robotState.position.x += Math.sin(now / 1000) * 0.1
    robotState.position.z += Math.cos(now / 1000) * 0.1
    robotState.rotation.y = (now / 1000) % 360

    // Check for collisions with obstacles
    for (const [id, obstacle] of obstacles.entries()) {
      const dx = robotState.position.x - obstacle.position.x
      const dz = robotState.position.z - obstacle.position.z
      const distance = Math.sqrt(dx * dx + dz * dz)
      
      if (distance < obstacle.radius + 1) {
        // Collision detected
        robotState.status = 'error'
        robotState.velocity = { x: 0, y: 0, z: 0 }
        io.emit('collision', { obstacleId: id, position: robotState.position })
        log('warn', `Collision detected with obstacle ${id}`)
        break
      }
    }
  }

  // Simulate battery drain
  if (robotState.status !== 'charging') {
    robotState.battery = Math.max(0, robotState.battery - 0.001)
  } else {
    robotState.battery = Math.min(100, robotState.battery + 0.1)
  }
}

// Store connected clients
const clients = new Map<string, { id: string; type: 'simulator' | 'controller' | 'viewer' }>()

// SDR Server connection
let sdrSocket: IOClientSocket | null = null
let sdrContacts: Array<{
  id: string
  lat: number
  lon: number
  type: 'ads-b' | 'ais' | 'aprs'
  rssi: number
  timestamp: number
  [key: string]: unknown
}> = []

let sdrSpectrumData: {
  frequencies: number[]
  amplitudes: number[]
  timestamp: number
  centerFrequency: number
  sampleRate: number
} | null = null

let sdrStats: {
  totalDetections: number
  adsBCount: number
  aisCount: number
  aprsCount: number
  peakFrequency: number
  averageRSSI: number
} | null = null

let sdrState: {
  enabled: boolean
  mode: string
  centerFrequency: number
  sampleRate: number
  gain: number
} | null = null

function connectToSDRServer() {
  const SDR_SERVER_URL = process.env.SDR_SERVER_URL || 'http://localhost:3004'
  
  sdrSocket = ioClient(SDR_SERVER_URL, {
    path: '/',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000
  })

  sdrSocket.on('connect', () => {
    log('info', `Connected to SDR server at ${SDR_SERVER_URL}`)
  })

  sdrSocket.on('sdr-data', (data: any) => {
    sdrContacts = data.contacts || []
    sdrSpectrumData = data.spectrumData || null
    sdrStats = data.stats || null
    sdrState = data.state || null
    // Forward SDR data to all connected clients
    io.emit('sdr-data', data)
  })

  sdrSocket.on('disconnect', () => {
    log('warn', 'Disconnected from SDR server')
  })

  sdrSocket.on('connect_error', (error: Error) => {
    log('error', `Error connecting to SDR server: ${error.message}`)
  })
}

// Connect to SDR server on startup
connectToSDRServer()

// Broadcast sensor data periodically
const broadcastInterval = setInterval(() => {
  try {
    updateRobotState()
    const sensorData = generateSensorData()
    io.emit('sensor-data', { sensorData, robotState, timestamp: Date.now() })
  } catch (error) {
    log('error', 'Error broadcasting sensor data', error)
  }
}, 100) // 10 Hz update rate

io.on('connection', (socket) => {
  log('info', `Client connected: ${socket.id}`)

  // Register client
  socket.on('register', (data: { type: 'simulator' | 'controller' | 'viewer' }) => {
    clients.set(socket.id, { id: socket.id, type: data.type })
    log('info', `Client ${socket.id} registered as ${data.type}`)

    // Send initial state
    socket.emit('robot-state', robotState)
    socket.emit('sensor-data', { sensorData: generateSensorData(), robotState, timestamp: Date.now() })
  })

  // Handle connection errors
  socket.on('error', (error: Error) => {
    log('error', `Socket error (${socket.id})`, error)
  })

  socket.on('connect_error', (error: Error) => {
    log('error', `Connection error (${socket.id})`, error)
  })

  // Control commands from external systems
  socket.on('control', (command: ControlCommand) => {
    log('info', 'Control command received', command)

    try {
      switch (command.type) {
        case 'move':
          robotState.status = 'moving'
          robotState.velocity = command.data.velocity as { x: number; y: number; z: number }
          break
        case 'stop':
          robotState.status = 'idle'
          robotState.velocity = { x: 0, y: 0, z: 0 }
          break
        case 'setSpeed':
          // Update speed settings
          break
        case 'setDestination':
          robotState.status = 'moving'
          break
        case 'getBattery':
          socket.emit('battery-status', { battery: robotState.battery, status: robotState.status })
          break
        case 'getLocation':
          socket.emit('location', { 
            position: robotState.position, 
            rotation: robotState.rotation,
            gps: generateSensorData().gps
          })
          break
        case 'resetPosition':
          robotState.position = { x: 0, y: 0, z: 0 }
          robotState.rotation = { x: 0, y: 0, z: 0 }
          robotState.velocity = { x: 0, y: 0, z: 0 }
          socket.emit('robot-state', robotState)
          break
        case 'getSensors':
          socket.emit('sensor-data', { sensorData: generateSensorData(), robotState, timestamp: Date.now() })
          break
        case 'setSensors':
          // Override sensor data for testing
          log('info', 'Sensor override received', command.data)
          break
        case 'addObstacle':
          const obstacleId = command.data.id as string || `obs-${Date.now()}`
          obstacles.set(obstacleId, {
            type: (command.data.type as 'pedestrian' | 'vehicle' | 'construction') || 'construction',
            position: command.data.position as { x: number; y: number; z: number } || { x: 5, y: 0, z: 5 },
            radius: (command.data.radius as number) || 1
          })
          io.emit('obstacles-update', { obstacles: Array.from(obstacles.entries()) })
          log('info', `Obstacle added: ${obstacleId}`)
          break
        case 'removeObstacle':
          const removeId = command.data.id as string
          if (removeId && obstacles.has(removeId)) {
            obstacles.delete(removeId)
            io.emit('obstacles-update', { obstacles: Array.from(obstacles.entries()) })
            log('info', `Obstacle removed: ${removeId}`)
          }
          break
        case 'clearObstacles':
          obstacles.clear()
          io.emit('obstacles-update', { obstacles: [] })
          log('info', 'All obstacles cleared')
          break

        // SDR commands
        case 'sdrCommand':
          if (sdrSocket && sdrSocket.connected) {
            sdrSocket.emit('sdr-command', command.data)
            log('info', 'SDR command forwarded', command.data)
          } else {
            log('warn', 'SDR server not connected')
          }
          break
        default:
          log('warn', `Unknown control command type: ${command.type}`)
      }

      // Broadcast updated state
      io.emit('robot-state', robotState)
    } catch (error) {
      log('error', 'Error processing control command', error)
      socket.emit('error', { message: 'Failed to process control command' })
    }
  })

  // ROS Bridge protocol
  socket.on('ros-topic', (data: { topic: string; message: unknown }) => {
    // Forward ROS messages to simulator
    io.emit('ros-message', data)
  })

  // Unity WebGL events
  socket.on('unity-event', (data: { event: string; payload: unknown }) => {
    log('info', `Unity event: ${data.event}`)
    io.emit('unity-event', data)
  })
  
  // API commands
  socket.on('api-command', async (data: { command: string; params: Record<string, unknown> }) => {
    const response = { success: true, data: null as unknown, error: null as string | null }

    try {
      switch (data.command) {
        case 'getStatus':
          response.data = robotState
          break
        case 'getSensors':
          response.data = generateSensorData()
          break
        case 'setMode':
          robotState.status = data.params.mode as RobotState['status']
          response.data = robotState
          break
        case 'reset':
          robotState = {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            battery: 100,
            status: 'idle'
          }
          response.data = robotState
          break
        default:
          response.success = false
          response.error = `Unknown command: ${data.command}`
      }
    } catch (error) {
      response.success = false
      response.error = error instanceof Error ? error.message : 'Unknown error'
      log('error', 'API command error', error)
    }

    socket.emit('api-response', { requestId: data.params.requestId, ...response })
  })

  socket.on('disconnect', () => {
    clients.delete(socket.id)
    log('info', `Client disconnected: ${socket.id}`)
  })
})

const PORT = 3003
healthServer.listen(PORT, () => {
  log('info', `Robot Simulator WebSocket server running on port ${PORT}`)
  log('info', `Health check endpoint: http://localhost:${PORT}/health`)
})

// Graceful shutdown
function gracefulShutdown(signal: string) {
  log('info', `Received ${signal} signal, shutting down server...`)

  // Clear broadcast interval
  if (broadcastInterval) {
    clearInterval(broadcastInterval)
  }

  // Disconnect from SDR server
  if (sdrSocket) {
    sdrSocket.disconnect()
    log('info', 'Disconnected from SDR server')
  }

  // Disconnect all clients
  io.sockets.sockets.forEach((socket) => {
    socket.disconnect(true)
  })

  healthServer.close(() => {
    log('info', 'WebSocket server closed')
    process.exit(0)
  })

  // Force exit after timeout
  setTimeout(() => {
    log('error', 'Forcing exit after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log('error', 'Uncaught Exception', error)
  gracefulShutdown('uncaughtException')
})

process.on('unhandledRejection', (reason, promise) => {
  log('error', `Unhandled Rejection at: ${promise}`, reason)
})
