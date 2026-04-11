import { createServer } from 'http'
import { Server } from 'socket.io'
import crypto from 'crypto'

const LOG_PREFIX = '[SDRServer]'
const PORT = 3004

function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  logFn(`${LOG_PREFIX} [${level.toUpperCase()}] ${timestamp} - ${message}`, data || '')
}

// Types
interface SDRSpectrumData {
  frequencies: number[]
  amplitudes: number[]
  timestamp: number
  centerFrequency: number
  sampleRate: number
}

interface ADSBContact {
  id: string
  callsign: string
  lat: number
  lon: number
  altitude: number
  speed: number
  heading: number
  rssi: number
  timestamp: number
  type: 'ads-b'
}

interface AISContact {
  id: string
  mmsi: string
  name: string
  lat: number
  lon: number
  speed: number
  heading: number
  rssi: number
  timestamp: number
  type: 'ais'
}

interface APRSContact {
  id: string
  callsign: string
  lat: number
  lon: number
  comment: string
  rssi: number
  timestamp: number
  type: 'aprs'
}

type SDRContact = ADSBContact | AISContact | APRSContact

interface SDRState {
  enabled: boolean
  centerFrequency: number
  sampleRate: number
  gain: number
  mode: 'ADS-B' | 'AIS' | 'APRS' | 'SPECTRUM' | 'ALL'
  contacts: SDRContact[]
  spectrumData: SDRSpectrumData | null
  signalStats: {
    totalDetections: number
    adsBCount: number
    aisCount: number
    aprsCount: number
    peakFrequency: number
    averageRSSI: number
  }
  // Tracking history for path visualization
  contactHistory: Map<string, Array<{ lat: number; lon: number; timestamp: number }>>
}

// Moscow center coordinates
const MOSCOW_LAT = 55.7558
const MOSCOW_LON = 37.6173

// Generate realistic ADS-B aircraft data
function generateADSBAircraft(now: number): ADSBContact[] {
  const aircraft: ADSBContact[] = []
  const numAircraft = 5 + Math.floor(Math.random() * 8)

  const airlines = ['AFL', 'SBI', 'SVR', 'TAM', 'BRU', 'DLH', 'KLM', 'BAW', 'AFR', 'THY']
  const routes = [
    { bearing: 45, distance: 0.05 },
    { bearing: 120, distance: 0.08 },
    { bearing: 200, distance: 0.03 },
    { bearing: 280, distance: 0.06 },
    { bearing: 310, distance: 0.07 },
  ]

  for (let i = 0; i < numAircraft; i++) {
    const route = routes[i % routes.length]
    const timeOffset = now / 10000 + (i * 0.7)
    const latOffset = Math.sin(timeOffset + route.bearing) * route.distance
    const lonOffset = Math.cos(timeOffset + route.bearing * 0.8) * route.distance * 0.6

    const airline = airlines[Math.floor(Math.random() * airlines.length)]
    const flightNum = Math.floor(Math.random() * 9000) + 1000

    aircraft.push({
      id: `adsb-${i}`,
      callsign: `${airline}${flightNum}`,
      lat: MOSCOW_LAT + latOffset,
      lon: MOSCOW_LON + lonOffset,
      altitude: 3000 + Math.random() * 10000,
      speed: 200 + Math.random() * 400,
      heading: (timeOffset * 50 + i * 60) % 360,
      rssi: -20 - Math.random() * 30,
      timestamp: now,
      type: 'ads-b'
    })
  }

  return aircraft
}

// Generate realistic AIS vessel data (simulating nearby waterways)
function generateAISVessels(now: number): AISContact[] {
  const vessels: AISContact[] = []
  const numVessels = 2 + Math.floor(Math.random() * 4)

  const vesselNames = ['ВОЛГА', 'ДОН', 'НЕВА', 'ОКА', 'КАМА', 'АМУР', 'ЛЕНА', 'ЕНИСЕЙ']
  const vesselTypes = ['Cargo', 'Tanker', 'Passenger', 'Tug']

  for (let i = 0; i < numVessels; i++) {
    const timeOffset = now / 15000 + (i * 1.2)
    // Moscow River coordinates
    const baseLat = 55.74 + (i * 0.005)
    const baseLon = 37.60 + (i * 0.008)

    const latOffset = Math.sin(timeOffset) * 0.003
    const lonOffset = Math.cos(timeOffset * 0.7) * 0.004

    const mmsi = `273${Math.floor(Math.random() * 900000 + 100000)}`
    const name = vesselNames[i % vesselNames.length]

    vessels.push({
      id: `ais-${i}`,
      mmsi,
      name,
      lat: baseLat + latOffset,
      lon: baseLon + lonOffset,
      speed: 5 + Math.random() * 15,
      heading: (timeOffset * 30 + i * 90) % 360,
      rssi: -25 - Math.random() * 25,
      timestamp: now,
      type: 'ais'
    })
  }

  return vessels
}

// Generate APRS beacon data
function generateAPRSBeacons(now: number): APRSContact[] {
  const beacons: APRSContact[] = []
  const numBeacons = 3 + Math.floor(Math.random() * 5)

  const callsigns = ['RK3DWL', 'UA3DJX', 'R3ABC', 'UA3AAB', 'RK3ZR', 'UA3LMC', 'R3FQ', 'UA3MME']
  const comments = ['QTH Moscow', '144.800 MHz', 'Running mobile', 'Digital repeater', 'Temp: 22C', 'Battery: 85%']

  for (let i = 0; i < numBeacons; i++) {
    const timeOffset = now / 20000 + (i * 0.5)
    const latOffset = Math.sin(timeOffset + i) * 0.02
    const lonOffset = Math.cos(timeOffset + i * 0.6) * 0.025

    beacons.push({
      id: `aprs-${i}`,
      callsign: callsigns[i % callsigns.length],
      lat: MOSCOW_LAT + latOffset,
      lon: MOSCOW_LON + lonOffset,
      comment: comments[i % comments.length],
      rssi: -15 - Math.random() * 35,
      timestamp: now,
      type: 'aprs'
    })
  }

  return beacons
}

// Generate spectrum data (simulated FFT)
function generateSpectrumData(now: number, centerFreq: number, sampleRate: number): SDRSpectrumData {
  const numPoints = 1024
  const frequencies: number[] = []
  const amplitudes: number[] = []

  const startFreq = centerFreq - sampleRate / 2
  const freqStep = sampleRate / numPoints

  for (let i = 0; i < numPoints; i++) {
    const freq = startFreq + (i * freqStep)
    frequencies.push(freq)

    // Base noise floor
    let amplitude = -90 + Math.random() * 10

    // Add simulated signals at specific frequencies
    const adsbFreq = 1090e6
    const aisFreqA = 161.975e6
    const aisFreqB = 162.025e6
    const aprsFreq = 144.8e6

    // ADS-B signal peak
    if (Math.abs(freq - adsbFreq) < 1e6) {
      amplitude += 40 * Math.exp(-Math.pow((freq - adsbFreq) / 200000, 2))
    }

    // AIS signal peaks
    if (Math.abs(freq - aisFreqA) < 50000) {
      amplitude += 35 * Math.exp(-Math.pow((freq - aisFreqA) / 10000, 2))
    }
    if (Math.abs(freq - aisFreqB) < 50000) {
      amplitude += 35 * Math.exp(-Math.pow((freq - aisFreqB) / 10000, 2))
    }

    // APRS signal peak
    if (Math.abs(freq - aprsFreq) < 50000) {
      amplitude += 30 * Math.exp(-Math.pow((freq - aprsFreq) / 10000, 2))
    }

    // Random intermittent signals
    if (Math.random() < 0.01) {
      amplitude += 20 + Math.random() * 20
    }

    amplitudes.push(amplitude)
  }

  return {
    frequencies,
    amplitudes,
    timestamp: now,
    centerFrequency: centerFreq,
    sampleRate
  }
}

// SDR State
let sdrState: SDRState = {
  enabled: true,
  centerFrequency: 1090e6, // ADS-B frequency
  sampleRate: 2.4e6,
  gain: 40,
  mode: 'ALL',
  contacts: [],
  spectrumData: null,
  signalStats: {
    totalDetections: 0,
    adsBCount: 0,
    aisCount: 0,
    aprsCount: 0,
    peakFrequency: 1090e6,
    averageRSSI: -50
  },
  contactHistory: new Map()
}

// HTTP health check server
const healthServer = createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
      mode: sdrState.mode,
      contacts: sdrState.contacts.length
    }))
  } else if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('RTL-SDR Geoanalytics WebSocket Server is running\n')
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
  pingInterval: 25000
})

// Generate and broadcast SDR data
function generateSDRData() {
  const now = Date.now()

  // Generate contacts based on mode
  const contacts: SDRContact[] = []

  if (sdrState.mode === 'ALL' || sdrState.mode === 'ADS-B') {
    contacts.push(...generateADSBAircraft(now))
  }

  if (sdrState.mode === 'ALL' || sdrState.mode === 'AIS') {
    contacts.push(...generateAISVessels(now))
  }

  if (sdrState.mode === 'ALL' || sdrState.mode === 'APRS') {
    contacts.push(...generateAPRSBeacons(now))
  }

  // Generate spectrum data
  const spectrumData = generateSpectrumData(now, sdrState.centerFrequency, sdrState.sampleRate)

  // Update stats
  const adsBContacts = contacts.filter(c => c.type === 'ads-b')
  const aisContacts = contacts.filter(c => c.type === 'ais')
  const aprsContacts = contacts.filter(c => c.type === 'aprs')

  const totalRSSI = contacts.reduce((sum, c) => sum + c.rssi, 0)
  sdrState.signalStats = {
    totalDetections: sdrState.signalStats.totalDetections + contacts.length,
    adsBCount: adsBContacts.length,
    aisCount: aisContacts.length,
    aprsCount: aprsContacts.length,
    peakFrequency: sdrState.centerFrequency,
    averageRSSI: contacts.length > 0 ? totalRSSI / contacts.length : -50
  }

  sdrState.contacts = contacts
  sdrState.spectrumData = spectrumData

  // Update contact history for path tracking
  contacts.forEach(contact => {
    if (!sdrState.contactHistory.has(contact.id)) {
      sdrState.contactHistory.set(contact.id, [])
    }
    const history = sdrState.contactHistory.get(contact.id)!
    history.push({ lat: contact.lat, lon: contact.lon, timestamp: now })
    
    // Keep only last 50 positions
    if (history.length > 50) {
      history.shift()
    }
  })

  return {
    contacts,
    spectrumData,
    stats: sdrState.signalStats,
    state: {
      enabled: sdrState.enabled,
      mode: sdrState.mode,
      centerFrequency: sdrState.centerFrequency,
      sampleRate: sdrState.sampleRate,
      gain: sdrState.gain
    },
    contactHistory: Object.fromEntries(sdrState.contactHistory)
  }
}

// Broadcast SDR data at 5 Hz
const broadcastInterval = setInterval(() => {
  try {
    const data = generateSDRData()
    io.emit('sdr-data', data)
  } catch (error) {
    log('error', 'Error broadcasting SDR data', error)
  }
}, 200) // 5 Hz

io.on('connection', (socket) => {
  log('info', `Client connected: ${socket.id}`)

  // Send initial state immediately
  socket.emit('sdr-data', generateSDRData())

  socket.on('sdr-command', (command: { type: string; data: Record<string, unknown> }) => {
    try {
      switch (command.type) {
        case 'SET_MODE':
          const mode = command.data.mode as SDRState['mode']
          if (['ADS-B', 'AIS', 'APRS', 'SPECTRUM', 'ALL'].includes(mode)) {
            sdrState.mode = mode
            log('info', `SDR mode changed to ${mode}`)
            socket.emit('sdr-state', { mode: sdrState.mode })
          }
          break

        case 'SET_FREQUENCY':
          const freq = command.data.frequency as number
          if (freq >= 24e6 && freq <= 1766e6) {
            sdrState.centerFrequency = freq
            log('info', `Center frequency set to ${(freq / 1e6).toFixed(2)} MHz`)
          }
          break

        case 'SET_GAIN':
          const gain = command.data.gain as number
          if (gain >= 0 && gain <= 50) {
            sdrState.gain = gain
            log('info', `Gain set to ${gain} dB`)
          }
          break

        case 'SET_SAMPLE_RATE':
          const rate = command.data.sampleRate as number
          if ([250e3, 1024e3, 1536e3, 1792e3, 1920e3, 2048e3, 2160e3, 2400e3, 2560e3, 2880e3, 3200e3].includes(rate)) {
            sdrState.sampleRate = rate
            log('info', `Sample rate set to ${(rate / 1e6).toFixed(2)} MSps`)
          }
          break

        case 'ENABLE':
          sdrState.enabled = true
          log('info', 'SDR enabled')
          break

        case 'DISABLE':
          sdrState.enabled = false
          log('info', 'SDR disabled')
          break

        case 'GET_STATS':
          socket.emit('sdr-stats', sdrState.signalStats)
          break

        case 'CLEAR_HISTORY':
          sdrState.signalStats.totalDetections = 0
          log('info', 'SDR history cleared')
          break

        default:
          log('warn', `Unknown SDR command: ${command.type}`)
      }

      // Broadcast updated data
      io.emit('sdr-data', generateSDRData())
    } catch (error) {
      log('error', 'Error processing SDR command', error)
      socket.emit('sdr-error', { message: 'Failed to process SDR command' })
    }
  })

  socket.on('disconnect', () => {
    log('info', `Client disconnected: ${socket.id}`)
  })
})

healthServer.listen(PORT, () => {
  log('info', `RTL-SDR Geoanalytics server running on port ${PORT}`)
  log('info', `Health check: http://localhost:${PORT}/health`)
  log('info', `Mode: ${sdrState.mode}`)
  log('info', `Center Frequency: ${(sdrState.centerFrequency / 1e6).toFixed(2)} MHz`)
})

// Graceful shutdown
function gracefulShutdown(signal: string) {
  log('info', `Received ${signal} signal, shutting down SDR server...`)

  if (broadcastInterval) {
    clearInterval(broadcastInterval)
  }

  io.sockets.sockets.forEach((socket) => {
    socket.disconnect(true)
  })

  healthServer.close(() => {
    log('info', 'SDR server closed')
    process.exit(0)
  })

  setTimeout(() => {
    log('error', 'Forcing exit after timeout')
    process.exit(1)
  }, 5000)
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
