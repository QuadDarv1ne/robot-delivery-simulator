'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import {
  Plane,
  Ship,
  Radio,
  Activity,
  Settings,
  Wifi,
  WifiOff,
  Signal,
  TrendingUp,
  BarChart3,
  MapPin
} from 'lucide-react'
import type { SDRData, SDRContact, SDRState } from './types'
import { io, Socket } from 'socket.io-client'
import { SDRAudioNotifications } from './sdr-notifications'

// Spectrum visualizer component
function SpectrumVisualizer({ spectrumData }: { spectrumData: SDRData['spectrumData'] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const waterfallRef = useRef<HTMLCanvasElement>(null)
  const historyRef = useRef<number[][]>([])

  useEffect(() => {
    if (!spectrumData || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, width, height)

    const { frequencies, amplitudes, centerFrequency, sampleRate } = spectrumData
    const numPoints = amplitudes.length

    // Draw grid
    ctx.strokeStyle = '#1a1a3a'
    ctx.lineWidth = 1

    // Horizontal grid lines (dBm)
    for (let db = -100; db <= -20; db += 20) {
      const y = height - ((db + 100) / 80) * height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()

      ctx.fillStyle = '#4a4a6a'
      ctx.font = '10px monospace'
      ctx.fillText(`${db} dBm`, 5, y - 2)
    }

    // Vertical grid lines (frequency)
    const startFreq = centerFrequency - sampleRate / 2
    const endFreq = centerFrequency + sampleRate / 2
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width
      const freq = startFreq + (i / 10) * (endFreq - startFreq)
      const freqMHz = (freq / 1e6).toFixed(2)

      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()

      ctx.fillStyle = '#4a4a6a'
      ctx.fillText(`${freqMHz} MHz`, x + 2, height - 5)
    }

    // Draw spectrum
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#00ff00')
    gradient.addColorStop(0.5, '#ffff00')
    gradient.addColorStop(1, '#ff0000')

    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 2
    ctx.beginPath()

    for (let i = 0; i < numPoints; i++) {
      const x = (i / numPoints) * width
      const amplitude = amplitudes[i]
      const y = height - ((amplitude + 100) / 80) * height

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.stroke()

    // Fill under curve
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()

    const fillGradient = ctx.createLinearGradient(0, 0, 0, height)
    fillGradient.addColorStop(0, 'rgba(0, 255, 136, 0.3)')
    fillGradient.addColorStop(1, 'rgba(0, 255, 136, 0.05)')
    ctx.fillStyle = fillGradient
    ctx.fill()

    // Add to waterfall history
    historyRef.current.push([...amplitudes])
    if (historyRef.current.length > 200) {
      historyRef.current.shift()
    }

    // Draw waterfall
    if (waterfallRef.current) {
      const wCtx = waterfallRef.current.getContext('2d')
      if (wCtx) {
        const wWidth = waterfallRef.current.width
        const wHeight = waterfallRef.current.height

        // Shift existing data up
        const imageData = wCtx.getImageData(0, 1, wWidth, wHeight - 1)
        wCtx.putImageData(imageData, 0, 0)

        // Draw new line at bottom
        for (let i = 0; i < numPoints && i < wWidth; i++) {
          const amplitude = amplitudes[i]
          const normalized = Math.max(0, Math.min(1, (amplitude + 100) / 80))

          // Color based on amplitude
          let r, g, b
          if (normalized < 0.33) {
            r = 0
            g = Math.floor(normalized * 3 * 255)
            b = 255
          } else if (normalized < 0.66) {
            r = Math.floor((normalized - 0.33) * 3 * 255)
            g = 255
            b = Math.floor((0.66 - normalized) * 3 * 255)
          } else {
            r = 255
            g = Math.floor((1 - normalized) * 3 * 255)
            b = 0
          }

          wCtx.fillStyle = `rgb(${r}, ${g}, ${b})`
          wCtx.fillRect(i, wHeight - 1, 1, 1)
        }
      }
    }
  }, [spectrumData])

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="w-full rounded-lg border border-border"
      />
      <canvas
        ref={waterfallRef}
        width={800}
        height={150}
        className="w-full rounded-lg border border-border"
      />
    </div>
  )
}

// Contact list item component
function ContactItem({ contact }: { contact: SDRContact }) {
  const getIcon = () => {
    switch (contact.type) {
      case 'ads-b':
        return <Plane className="w-4 h-4 text-blue-500" />
      case 'ais':
        return <Ship className="w-4 h-4 text-cyan-500" />
      case 'aprs':
        return <Radio className="w-4 h-4 text-green-500" />
    }
  }

  const getLabel = () => {
    switch (contact.type) {
      case 'ads-b':
        return contact.callsign || contact.id
      case 'ais':
        return contact.name || contact.mmsi || contact.id
      case 'aprs':
        return contact.callsign || contact.id
    }
  }

  const getDetails = () => {
    switch (contact.type) {
      case 'ads-b':
        return `ALT: ${contact.altitude?.toFixed(0)}ft | SPD: ${contact.speed?.toFixed(0)}kts | HDG: ${contact.heading?.toFixed(0)}°`
      case 'ais':
        return `SPD: ${contact.speed?.toFixed(1)}kts | HDG: ${contact.heading?.toFixed(0)}°`
      case 'aprs':
        return contact.comment || 'APRS Beacon'
    }
  }

  const getRSSIColor = () => {
    if (contact.rssi > -30) return 'text-green-500'
    if (contact.rssi > -50) return 'text-yellow-500'
    return 'text-red-500'
  }

  const timeAgo = Math.floor((Date.now() - contact.timestamp) / 1000)

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      {getIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold truncate">{getLabel()}</span>
          <Badge variant="secondary" className="text-xs">
            {contact.type.toUpperCase()}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {getDetails()}
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs">
          <span className={getRSSIColor()}>
            <Signal className="w-3 h-3 inline mr-1" />
            {contact.rssi.toFixed(1)} dBm
          </span>
          <span className="text-muted-foreground">
            <MapPin className="w-3 h-3 inline mr-1" />
            {contact.lat.toFixed(4)}, {contact.lon.toFixed(4)}
          </span>
          <span className="text-muted-foreground">
            {timeAgo}s ago
          </span>
        </div>
      </div>
    </div>
  )
}

// Stats display component
function StatsDisplay({ stats }: { stats: SDRData['stats'] }) {
  if (!stats) return null

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-xs text-muted-foreground">ADS-B</div>
              <div className="text-2xl font-bold">{stats.adsBCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-cyan-500/10 border-cyan-500/30">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-cyan-500" />
            <div>
              <div className="text-xs text-muted-foreground">AIS</div>
              <div className="text-2xl font-bold">{stats.aisCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-500/10 border-green-500/30">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-xs text-muted-foreground">APRS</div>
              <div className="text-2xl font-bold">{stats.aprsCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-purple-500/10 border-purple-500/30">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-xs text-muted-foreground">Avg RSSI</div>
              <div className="text-2xl font-bold">{stats.averageRSSI.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">dBm</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-green-500/10 border-border">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Total Detections</div>
              <div className="text-3xl font-bold">{stats.totalDetections}</div>
            </div>
            <BarChart3 className="w-12 h-12 text-muted-foreground opacity-50" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Mode selector component
function ModeSelector({
  currentMode,
  onModeChange
}: {
  currentMode: SDRState['mode']
  onModeChange: (mode: SDRState['mode']) => void
}) {
  const modes: SDRState['mode'][] = ['ALL', 'ADS-B', 'AIS', 'APRS', 'SPECTRUM']

  return (
    <Tabs value={currentMode} onValueChange={(v) => onModeChange(v as SDRState['mode'])}>
      <TabsList className="grid w-full grid-cols-5">
        {modes.map(mode => (
          <TabsTrigger key={mode} value={mode} className="text-xs">
            {mode}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

// Main SDR Panel
export function SDRPanel() {
  const [sdrData, setSDRData] = useState<SDRData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Connect to main server (which forwards SDR data)
    const socket = io('http://localhost:3003', {
      path: '/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[SDR] Connected to server')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.warn('[SDR] Disconnected from server')
      setIsConnected(false)
    })

    socket.on('sdr-data', (data: SDRData) => {
      setSDRData(data)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const handleModeChange = useCallback((mode: SDRState['mode']) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('control', {
        type: 'sdrCommand',
        data: {
          type: 'SET_MODE',
          mode
        }
      })
    }
  }, [])

  const handleGainChange = useCallback((gain: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('control', {
        type: 'sdrCommand',
        data: {
          type: 'SET_GAIN',
          gain
        }
      })
    }
  }, [])

  const handleFrequencyChange = useCallback((frequency: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('control', {
        type: 'sdrCommand',
        data: {
          type: 'SET_FREQUENCY',
          frequency
        }
      })
    }
  }, [])

  if (!sdrData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            RTL-SDR Geoanalytics
          </CardTitle>
          <CardDescription>Подключение к SDR-серверу...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] flex items-center justify-center">
            <span className="text-muted-foreground">Загрузка...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <SDRAudioNotifications contacts={sdrData.contacts} />
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                RTL-SDR Geoanalytics
              </CardTitle>
              <CardDescription>
                Мониторинг радиосигналов: ADS-B, AIS, APRS
              </CardDescription>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'} className={isConnected ? 'bg-green-500' : ''}>
              {isConnected ? <><Wifi className="w-3 h-3 mr-1" />Online</> : <><WifiOff className="w-3 h-3 mr-1" />Offline</>}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">Центр. частота</div>
              <div className="font-mono text-lg">{sdrData.state ? (sdrData.state.centerFrequency / 1e6).toFixed(2) : '—'} MHz</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">Sample Rate</div>
              <div className="font-mono text-lg">{sdrData.state ? (sdrData.state.sampleRate / 1e6).toFixed(2) : '—'} MSps</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">Gain</div>
              <div className="font-mono text-lg">{sdrData.state?.gain ?? '—'} dB</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">Контакты</div>
              <div className="font-mono text-lg">{sdrData.contacts.length}</div>
            </div>
          </div>

          <ModeSelector currentMode={sdrData.state?.mode || 'ALL'} onModeChange={handleModeChange} />
        </CardContent>
      </Card>

      {/* Spectrum and Waterfall */}
      {sdrData.spectrumData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Спектральный анализ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SpectrumVisualizer spectrumData={sdrData.spectrumData} />
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {sdrData.stats && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Статистика
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatsDisplay stats={sdrData.stats} />
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Управление
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Gain: {sdrData.state?.gain} dB</label>
            <Slider
              value={[sdrData.state?.gain || 40]}
              min={0}
              max={50}
              step={1}
              onValueChange={([value]) => handleGainChange(value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Частота: {sdrData.state ? (sdrData.state.centerFrequency / 1e6).toFixed(3) : '—'} MHz
            </label>
            <Slider
              value={[sdrData.state?.centerFrequency || 1090e6]}
              min={100e6}
              max={1200e6}
              step={1e6}
              onValueChange={([value]) => handleFrequencyChange(value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Radio className="w-4 h-4" />
            Обнаруженные сигналы
          </CardTitle>
          <CardDescription>
            {sdrData.contacts.length} активных контактов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {sdrData.contacts.map(contact => (
                <ContactItem key={contact.id} contact={contact} />
              ))}
              {sdrData.contacts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Нет обнаруженных сигналов
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
