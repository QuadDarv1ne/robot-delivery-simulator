'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Battery, 
  MapPin, 
  Radar, 
  Wifi, 
  WifiOff, 
  Play, 
  Square, 
  RotateCcw,
  Activity,
  Navigation,
  Settings,
  Code,
  ChevronRight,
  Cpu,
  Gauge,
  CircleDot,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Package,
  BarChart3,
  Layers,
  User,
  Trophy
} from 'lucide-react'
import { 
  DeliveryScenario, 
  DeliverySession, 
  ScenarioSelector, 
  DeliveryProgress
} from '@/components/delivery-scenarios'
import { AnalyticsPanel } from '@/components/analytics-panel'
import { Leaderboard } from '@/components/leaderboard'
import { AlgorithmEditor } from '@/components/algorithm-editor'
import { User as UserType } from '@/lib/auth-context'

// Dynamic imports
const RobotMap = dynamic(
  () => import('@/components/robot-map').then(mod => mod.RobotMap),
  { ssr: false, loading: () => <div className="h-full bg-muted animate-pulse rounded-lg" /> }
)

const Lidar3DView = dynamic(
  () => import('@/components/lidar-3d').then(mod => mod.default),
  { ssr: false, loading: () => <div className="h-full bg-muted animate-pulse rounded-lg" /> }
)

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

interface SimulatorState {
  robotState: RobotState | null
  sensorData: SensorData | null
  isConnected: boolean
}

interface SimulatorContentProps {
  user: UserType | null
  onLogout: () => void
  onShowProfile: () => void
  onShowAdmin?: () => void
}

// Lidar 2D View
function LidarView({ distances, angles }: { distances: number[]; angles: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const scale = Math.min(width, height) / 50
    
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, width, height)
    
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 1
    for (let r = 5; r <= 25; r += 5) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, r * scale, 0, Math.PI * 2)
      ctx.stroke()
    }
    
    ctx.fillStyle = '#22c55e'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#3b82f6'
    distances.forEach((distance, i) => {
      const angle = (angles[i] * Math.PI) / 180
      const x = centerX + Math.cos(angle) * distance * scale
      const y = centerY - Math.sin(angle) * distance * scale
      
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [distances, angles])
  
  return (
    <canvas 
      ref={canvasRef} 
      width={200} 
      height={200} 
      className="rounded-lg border border-border"
    />
  )
}

// IMU View
function IMUView({ acceleration, gyro }: { acceleration: { x: number; y: number; z: number }; gyro: { x: number; y: number; z: number } }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-muted-foreground mb-1">Акселерометр (m/s²)</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {['X', 'Y', 'Z'].map((axis, i) => (
            <div key={axis} className="bg-muted/50 p-2 rounded text-center">
              <div className="text-muted-foreground">{axis}</div>
              <div className="font-mono font-semibold">
                {[acceleration.x, acceleration.y, acceleration.z][i].toFixed(3)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-1">Гироскоп (rad/s)</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {['X', 'Y', 'Z'].map((axis, i) => (
            <div key={axis} className="bg-muted/50 p-2 rounded text-center">
              <div className="text-muted-foreground">{axis}</div>
              <div className="font-mono font-semibold">
                {[gyro.x, gyro.y, gyro.z][i].toFixed(4)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Control Panel
function ControlPanel({ onCommand, robotState }: { onCommand: (type: string, data?: Record<string, unknown>) => void; robotState: RobotState | null }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div></div>
        <Button variant="outline" size="icon" onMouseDown={() => onCommand('move', { velocity: { x: 0, y: 0, z: 1 } })} onMouseUp={() => onCommand('stop')}>
          <ArrowUp className="h-4 w-4" />
        </Button>
        <div></div>
        <Button variant="outline" size="icon" onMouseDown={() => onCommand('move', { velocity: { x: -1, y: 0, z: 0 } })} onMouseUp={() => onCommand('stop')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => onCommand('stop')}>
          <Square className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onMouseDown={() => onCommand('move', { velocity: { x: 1, y: 0, z: 0 } })} onMouseUp={() => onCommand('stop')}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div></div>
        <Button variant="outline" size="icon" onMouseDown={() => onCommand('move', { velocity: { x: 0, y: 0, z: -1 } })} onMouseUp={() => onCommand('stop')}>
          <ArrowDown className="h-4 w-4" />
        </Button>
        <div></div>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-2 gap-2">
        <Button variant={robotState?.status === 'moving' ? 'default' : 'outline'} onClick={() => onCommand('move', { velocity: { x: 0, y: 0, z: 0.5 } })}>
          <Play className="h-4 w-4 mr-2" />Старт
        </Button>
        <Button variant="outline" onClick={() => onCommand('stop')}>
          <Square className="h-4 w-4 mr-2" />Стоп
        </Button>
      </div>
      
      <Button variant="outline" className="w-full" onClick={() => onCommand('reset')}>
        <RotateCcw className="h-4 w-4 mr-2" />Сброс позиции
      </Button>
    </div>
  )
}

// Unity WebGL Placeholder
function UnityWebGLPlayer() {
  return (
    <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden">
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

// Main Component
export default function SimulatorContent({ user, onLogout, onShowProfile, onShowAdmin }: SimulatorContentProps) {
  const [state, setState] = useState<SimulatorState>({
    robotState: null,
    sensorData: null,
    isConnected: false
  })
  
  const [selectedScenario, setSelectedScenario] = useState<DeliveryScenario | null>(null)
  const [deliverySession, setDeliverySession] = useState<DeliverySession | null>(null)
  const [activeView, setActiveView] = useState<'simulator' | 'map' | 'lidar3d' | 'leaderboard' | 'algorithms'>('simulator')
  
  const socketRef = useRef<Socket | null>(null)
  
  // WebSocket connection
  useEffect(() => {
    const socket = io('/?XTransformPort=3003', { path: '/', transports: ['websocket', 'polling'] })
    socketRef.current = socket
    
    socket.on('connect', () => {
      socket.emit('register', { type: 'viewer' })
      setState(prev => ({ ...prev, isConnected: true }))
    })
    
    socket.on('disconnect', () => setState(prev => ({ ...prev, isConnected: false })))
    
    socket.on('sensor-data', (data: { sensorData: SensorData; robotState: RobotState }) => {
      setState(prev => ({ ...prev, sensorData: data.sensorData, robotState: data.robotState }))
    })
    
    socket.on('robot-state', (robotState: RobotState) => {
      setState(prev => ({ ...prev, robotState }))
    })
    
    return () => socket.disconnect()
  }, [])
  
  const sendCommand = useCallback((type: string, data?: Record<string, unknown>) => {
    if (socketRef.current && state.isConnected) {
      socketRef.current.emit('control', { type, data: data || {} })
    }
  }, [state.isConnected])
  
  const handleSelectScenario = (scenario: DeliveryScenario) => {
    setSelectedScenario(scenario)
    setDeliverySession({
      scenarioId: scenario.id, startTime: Date.now(), status: 'preparing',
      progress: 0, currentWaypoint: 0, distanceTraveled: 0, timeElapsed: 0, collisions: 0, batteryUsed: 0
    })
  }
  
  const handleStartDelivery = () => {
    if (deliverySession) {
      setDeliverySession(prev => prev ? { ...prev, status: 'in_progress' } : null)
      sendCommand('move', { velocity: { x: 0, y: 0, z: 0.5 } })
    }
  }
  
  const handlePauseDelivery = () => {
    if (deliverySession) {
      setDeliverySession(prev => prev ? { ...prev, status: 'preparing' } : null)
      sendCommand('stop')
    }
  }
  
  const handleResetDelivery = () => {
    setDeliverySession(null)
    sendCommand('stop')
  }
  
  const handleCancelDelivery = () => {
    setDeliverySession(prev => prev ? { ...prev, status: 'cancelled' } : null)
    sendCommand('stop')
  }
  
  // Delivery progress simulation
  useEffect(() => {
    if (deliverySession?.status === 'in_progress' && selectedScenario) {
      const interval = setInterval(() => {
        setDeliverySession(prev => {
          if (!prev) return null
          const newProgress = Math.min(100, prev.progress + 0.5)
          const newDistance = Math.min(selectedScenario.distance, prev.distanceTraveled + 2)
          const newBattery = prev.batteryUsed + 0.01
          return {
            ...prev, progress: newProgress, distanceTraveled: newDistance,
            timeElapsed: prev.timeElapsed + 1, batteryUsed: newBattery,
            status: newProgress >= 100 ? 'delivered' : 'in_progress'
          }
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [deliverySession?.status, selectedScenario])
  
  const { robotState, sensorData, isConnected } = state
  const lidarPoints = sensorData?.lidar ? 
    sensorData.lidar.distances.map((d, i) => ({ distance: d, angle: sensorData.lidar.angles[i] })) : undefined
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <CircleDot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Robot Delivery Simulator</h1>
              <p className="text-xs text-muted-foreground">Unity WebGL + ROS/ROS2 Integration</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? 'default' : 'secondary'} className={isConnected ? 'bg-green-500 hover:bg-green-600' : ''}>
              {isConnected ? <><Wifi className="w-3 h-3 mr-1" />Подключено</> : <><WifiOff className="w-3 h-3 mr-1" />Отключено</>}
            </Badge>
            
            {robotState && (
              <div className="flex items-center gap-2">
                <Battery className={`w-4 h-4 ${robotState.battery > 20 ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-sm font-mono">{Math.round(robotState.battery)}%</span>
              </div>
            )}
            
            {user && (
              <Button variant="ghost" size="sm" onClick={onShowProfile} className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{user.name}</span>
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'simulator' | 'map' | 'lidar3d' | 'leaderboard' | 'algorithms')}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="simulator"><Activity className="w-4 h-4 mr-2" />Симулятор</TabsTrigger>
                <TabsTrigger value="map"><MapPin className="w-4 h-4 mr-2" />Карта</TabsTrigger>
                <TabsTrigger value="lidar3d"><Layers className="w-4 h-4 mr-2" />3D Lidar</TabsTrigger>
                <TabsTrigger value="leaderboard"><Trophy className="w-4 h-4 mr-2" />Рейтинг</TabsTrigger>
                <TabsTrigger value="algorithms"><Code className="w-4 h-4 mr-2" />Алгоритмы</TabsTrigger>
              </TabsList>
              
              <TabsContent value="simulator" className="mt-4">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" />3D Симулятор</CardTitle>
                        <CardDescription>Интерактивная симуляция робота-доставщика</CardDescription>
                      </div>
                      {robotState && (
                        <Badge variant={robotState.status === 'idle' ? 'secondary' : robotState.status === 'moving' ? 'default' : robotState.status === 'error' ? 'destructive' : 'default'}>
                          {robotState.status === 'idle' && 'Ожидание'}
                          {robotState.status === 'moving' && 'Движение'}
                          {robotState.status === 'delivering' && 'Доставка'}
                          {robotState.status === 'charging' && 'Зарядка'}
                          {robotState.status === 'error' && 'Ошибка'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <UnityWebGLPlayer />
                    {robotState && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['X', 'Y', 'Z'].map((axis, i) => (
                          <div key={axis} className="bg-muted/50 p-3 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Позиция {axis}</div>
                            <div className="font-mono text-lg">{[robotState.position.x, robotState.position.y, robotState.position.z][i].toFixed(2)}</div>
                          </div>
                        ))}
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Разворот</div>
                          <div className="font-mono text-lg">{robotState.rotation.y.toFixed(1)}°</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="map" className="mt-4">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" />Карта маршрута</CardTitle>
                    <CardDescription>OpenStreetMap с позицией робота в реальном времени</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[500px] rounded-lg overflow-hidden">
                      {sensorData ? (
                        <RobotMap
                          robotPosition={sensorData.gps}
                          robotHeading={robotState?.rotation.y || 0}
                          destination={selectedScenario?.endPoint}
                          waypoints={selectedScenario?.waypoints || []}
                          obstacles={selectedScenario?.obstacles.map(o => ({ lat: o.position.lat, lon: o.position.lon, radius: 3, type: o.type as 'pedestrian' | 'vehicle' | 'construction' })) || []}
                          lidarPoints={lidarPoints}
                        />
                      ) : (
                        <div className="h-full bg-muted animate-pulse flex items-center justify-center">
                          <span className="text-muted-foreground">Загрузка карты...</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="lidar3d" className="mt-4">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" />3D Визуализация Lidar</CardTitle>
                    <CardDescription>Point cloud с цветовой кодировкой по расстоянию</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[500px] rounded-lg overflow-hidden">
                      {sensorData?.lidar ? (
                        <Lidar3DView distances={sensorData.lidar.distances} angles={sensorData.lidar.angles} />
                      ) : (
                        <div className="h-full bg-muted animate-pulse flex items-center justify-center">
                          <span className="text-muted-foreground">Загрузка 3D модели...</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="leaderboard" className="mt-4">
                <Leaderboard currentUserId={user?.id} />
              </TabsContent>
              
              <TabsContent value="algorithms" className="mt-4">
                <AlgorithmEditor />
              </TabsContent>
            </Tabs>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Аналитика</CardTitle>
                <CardDescription>Статистика и графики производительности</CardDescription>
              </CardHeader>
              <CardContent><AnalyticsPanel /></CardContent>
            </Card>
          </div>
          
          <div className="xl:col-span-1 space-y-6">
            {robotState && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Battery className="w-4 h-4" />Батарея</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={robotState.battery} className="h-2" />
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(robotState.battery)}%</span>
                    <span>{robotState.battery > 20 ? 'Норма' : 'Низкий заряд'}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Tabs defaultValue="sensors" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="sensors" className="text-xs"><Radar className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="control" className="text-xs"><Navigation className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="delivery" className="text-xs"><Package className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="api" className="text-xs"><Code className="w-3 h-3" /></TabsTrigger>
              </TabsList>
              
              <TabsContent value="sensors">
                <Card>
                  <CardContent className="pt-4 space-y-4">
                    {sensorData ? (
                      <>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />GPS</div>
                          <div className="font-mono text-xs bg-muted/50 p-2 rounded">
                            <div>Широта: {sensorData.gps.lat.toFixed(6)}°</div>
                            <div>Долгота: {sensorData.gps.lon.toFixed(6)}°</div>
                            <div>Высота: {sensorData.gps.altitude.toFixed(1)} м</div>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Radar className="w-3 h-3" />Lidar (360°)</div>
                          <div className="flex justify-center"><LidarView distances={sensorData.lidar.distances} angles={sensorData.lidar.angles} /></div>
                        </div>
                        <Separator />
                        <IMUView acceleration={sensorData.imu.acceleration} gyro={sensorData.imu.gyro} />
                        <Separator />
                        <div>
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Gauge className="w-3 h-3" />Энкодеры</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-muted/50 p-2 rounded text-center"><div className="text-muted-foreground">Левое</div><div className="font-mono">{sensorData.encoders.leftWheel}</div></div>
                            <div className="bg-muted/50 p-2 rounded text-center"><div className="text-muted-foreground">Правое</div><div className="font-mono">{sensorData.encoders.rightWheel}</div></div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-muted-foreground text-sm py-8">Ожидание данных...</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="control">
                <Card><CardContent className="pt-4"><ControlPanel onCommand={sendCommand} robotState={robotState} /></CardContent></Card>
              </TabsContent>
              
              <TabsContent value="delivery">
                {!selectedScenario ? (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Сценарии доставки</CardTitle><CardDescription>Выберите миссию</CardDescription></CardHeader>
                    <CardContent><ScenarioSelector onSelect={handleSelectScenario} selectedId={selectedScenario?.id} /></CardContent>
                  </Card>
                ) : (
                  <DeliveryProgress session={deliverySession} scenario={selectedScenario} onPause={handlePauseDelivery} onResume={handleStartDelivery} onReset={handleResetDelivery} onCancel={handleCancelDelivery} />
                )}
              </TabsContent>
              
              <TabsContent value="api">
                <Card>
                  <CardContent className="pt-4 space-y-4">
                    <div className="text-sm text-muted-foreground">Интеграция с внешними системами управления</div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-xs font-medium">Доступные команды</div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2"><Badge variant="secondary">move</Badge><span className="text-muted-foreground">Начать движение</span></div>
                        <div className="flex items-center gap-2"><Badge variant="secondary">stop</Badge><span className="text-muted-foreground">Остановить робота</span></div>
                        <div className="flex items-center gap-2"><Badge variant="secondary">setSpeed</Badge><span className="text-muted-foreground">Установить скорость</span></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><Settings className="w-4 h-4" />ROS / ROS2</CardTitle>
                <CardDescription>Интеграция с внешними системами</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-xs font-medium">ROS Bridge</span></div>
                    <div className="text-xs text-muted-foreground">ws://localhost:9090</div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /><span className="text-xs font-medium">WebSocket</span></div>
                    <div className="text-xs text-muted-foreground">ws://localhost:3003</div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="text-xs font-medium">Топики</div>
                  <ScrollArea className="h-24">
                    <div className="space-y-1 text-xs">
                      {['/robot/gps', '/robot/lidar', '/robot/camera', '/robot/imu', '/robot/cmd_vel'].map((topic) => (
                        <div key={topic} className="flex items-center gap-2 text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                          <ChevronRight className="w-3 h-3" /><code>{topic}</code>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <footer className="border-t mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          Robot Delivery Simulator • Unity WebGL + ROS/ROS2 Integration • OpenStreetMap • Three.js
        </div>
      </footer>
    </div>
  )
}
