'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Battery, 
  Clock, 
  Navigation,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Download
} from 'lucide-react'
import { ExportReportButton } from './export-report-button'

// Types
interface TelemetryData {
  timestamp: number
  speed: number
  battery: number
  distance: number
  heading: number
  obstacles: number
}

interface DeliveryStats {
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  totalDistance: number
  totalDistanceKm: number
  averageTime: number
  averageBatteryUsage: number
  totalCollisions: number
  averageSpeed: number
  bestTime: number
  worstTime: number
}

interface SessionLog {
  id: string
  scenarioName: string
  startTime: number
  endTime: number
  status: 'success' | 'failed' | 'cancelled'
  distance: number
  batteryUsed: number
  collisions: number
}

// Sample data
const generateTelemetryData = (): TelemetryData[] => {
  const data: TelemetryData[] = []
  const now = Date.now()
  
  for (let i = 0; i < 60; i++) {
    data.push({
      timestamp: now - (60 - i) * 1000,
      speed: 1 + Math.random() * 2,
      battery: 100 - i * 0.5 - Math.random() * 0.5,
      distance: i * 5 + Math.random() * 2,
      heading: (i * 6) % 360,
      obstacles: Math.floor(Math.random() * 5)
    })
  }
  
  return data
}

const sampleSessionLogs: SessionLog[] = [
  {
    id: '1',
    scenarioName: 'Тестовый маршрут',
    startTime: Date.now() - 3600000,
    endTime: Date.now() - 3570000,
    status: 'success',
    distance: 250,
    batteryUsed: 3.2,
    collisions: 0
  },
  {
    id: '2',
    scenarioName: 'Доставка в центр города',
    startTime: Date.now() - 3000000,
    endTime: Date.now() - 2950000,
    status: 'success',
    distance: 500,
    batteryUsed: 7.5,
    collisions: 1
  },
  {
    id: '3',
    scenarioName: 'Сложная доставка',
    startTime: Date.now() - 2400000,
    endTime: Date.now() - 2330000,
    status: 'failed',
    distance: 350,
    batteryUsed: 12.3,
    collisions: 3
  },
  {
    id: '4',
    scenarioName: 'Тестовый маршрут',
    startTime: Date.now() - 1800000,
    endTime: Date.now() - 1775000,
    status: 'success',
    distance: 250,
    batteryUsed: 2.8,
    collisions: 0
  },
  {
    id: '5',
    scenarioName: 'Ночная доставка',
    startTime: Date.now() - 1200000,
    endTime: Date.now() - 1140000,
    status: 'success',
    distance: 450,
    batteryUsed: 8.1,
    collisions: 0
  }
]

const COLORS = ['#22c55e', '#ef4444', '#f59e0b']

// Stats Cards
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = 'text-primary'
}: { 
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  color?: string
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-muted ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Speed Chart
function SpeedChart({ data }: { data: TelemetryData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data.map(d => ({ ...d, time: new Date(d.timestamp).toLocaleTimeString() }))}>
        <defs>
          <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#64748b" />
        <YAxis tick={{ fontSize: 10 }} stroke="#64748b" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Area 
          type="monotone" 
          dataKey="speed" 
          stroke="#3b82f6" 
          fill="url(#speedGradient)" 
          name="Скорость (м/с)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Battery Chart
function BatteryChart({ data }: { data: TelemetryData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data.map(d => ({ ...d, time: new Date(d.timestamp).toLocaleTimeString() }))}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#64748b" />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#64748b" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Line 
          type="monotone" 
          dataKey="battery" 
          stroke="#22c55e" 
          strokeWidth={2}
          dot={false}
          name="Батарея (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Distance Chart
function DistanceChart({ logs }: { logs: SessionLog[] }) {
  const data = logs.map(log => ({
    name: log.scenarioName.slice(0, 10) + '...',
    distance: log.distance,
    status: log.status
  }))
  
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" />
        <YAxis tick={{ fontSize: 10 }} stroke="#64748b" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Bar dataKey="distance" name="Расстояние (м)">
          {data.map((entry, index) => (
            <Cell 
              key={index} 
              fill={entry.status === 'success' ? '#22c55e' : '#ef4444'} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Delivery Status Pie Chart
function StatusPieChart({ stats }: { stats: DeliveryStats }) {
  const data = [
    { name: 'Успешно', value: stats.successfulDeliveries, color: '#22c55e' },
    { name: 'Неудачно', value: stats.failedDeliveries, color: '#ef4444' },
    { name: 'Отменено', value: stats.totalDeliveries - stats.successfulDeliveries - stats.failedDeliveries, color: '#f59e0b' }
  ].filter(d => d.value > 0)
  
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Session Log Item
function SessionLogItem({ log }: { log: SessionLog }) {
  const duration = Math.round((log.endTime - log.startTime) / 1000)
  
  return (
    <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
      <div className={`p-1.5 rounded-full ${
        log.status === 'success' ? 'bg-green-500/20' : 
        log.status === 'failed' ? 'bg-red-500/20' : 'bg-yellow-500/20'
      }`}>
        {log.status === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : log.status === 'failed' ? (
          <XCircle className="w-4 h-4 text-red-500" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{log.scenarioName}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(log.startTime).toLocaleString('ru-RU')}
        </p>
      </div>
      
      <div className="text-right text-xs">
        <div className="font-mono">{log.distance} м</div>
        <div className="text-muted-foreground">{duration} сек</div>
      </div>
      
      <div className="text-right text-xs">
        <div className="font-mono">{log.batteryUsed.toFixed(1)}%</div>
        <div className={`font-mono ${log.collisions > 0 ? 'text-red-500' : 'text-green-500'}`}>
          {log.collisions} столкновений
        </div>
      </div>
    </div>
  )
}

// Main Analytics Component
export function AnalyticsPanel() {
  const [sessionLogs] = useState<SessionLog[]>(sampleSessionLogs)
  
  // Calculate stats
  const stats: DeliveryStats = {
    totalDeliveries: sessionLogs.length,
    successfulDeliveries: sessionLogs.filter(l => l.status === 'success').length,
    failedDeliveries: sessionLogs.filter(l => l.status === 'failed').length,
    totalDistance: sessionLogs.reduce((sum, l) => sum + l.distance, 0),
    totalDistanceKm: sessionLogs.reduce((sum, l) => sum + l.distance, 0) / 1000,
    averageTime: sessionLogs.reduce((sum, l) => sum + (l.endTime - l.startTime), 0) / sessionLogs.length / 1000,
    averageBatteryUsage: sessionLogs.reduce((sum, l) => sum + l.batteryUsed, 0) / sessionLogs.length,
    totalCollisions: sessionLogs.reduce((sum, l) => sum + l.collisions, 0),
    averageSpeed: 1.5,
    bestTime: Math.min(...sessionLogs.map(l => l.endTime - l.startTime)) / 1000,
    worstTime: Math.max(...sessionLogs.map(l => l.endTime - l.startTime)) / 1000
  }
  
  // Initialize telemetry data
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>(() => generateTelemetryData())
  
  // Update telemetry data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryData(prev => {
        const newPoint: TelemetryData = {
          timestamp: Date.now(),
          speed: 1 + Math.random() * 2,
          battery: Math.max(0, (prev[prev.length - 1]?.battery || 100) - 0.5 - Math.random() * 0.5),
          distance: (prev[prev.length - 1]?.distance || 0) + 5,
          heading: Math.random() * 360,
          obstacles: Math.floor(Math.random() * 5)
        }
        
        return [...prev.slice(1), newPoint]
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="space-y-4">
      {/* Export Button Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Аналитика</h3>
        <ExportReportButton size="sm" />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Всего доставок"
          value={stats.totalDeliveries}
          subtitle={`${stats.successfulDeliveries} успешно`}
          icon={Activity}
          color="text-blue-500"
        />
        <StatCard
          title="Пройдено"
          value={`${stats.totalDistanceKm.toFixed(2)} км`}
          subtitle={`${stats.totalDistance} м`}
          icon={Navigation}
          color="text-green-500"
        />
        <StatCard
          title="Среднее время"
          value={`${Math.round(stats.averageTime)} сек`}
          subtitle={`Лучшее: ${Math.round(stats.bestTime)} сек`}
          icon={Clock}
          color="text-purple-500"
        />
        <StatCard
          title="Столкновения"
          value={stats.totalCollisions}
          subtitle={stats.totalCollisions === 0 ? 'Отлично!' : 'Требует внимания'}
          icon={AlertTriangle}
          color={stats.totalCollisions === 0 ? 'text-green-500' : 'text-red-500'}
        />
      </div>
      
      {/* Charts Tabs */}
      <Tabs defaultValue="speed">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="speed" className="text-xs">Скорость</TabsTrigger>
          <TabsTrigger value="battery" className="text-xs">Батарея</TabsTrigger>
          <TabsTrigger value="distance" className="text-xs">Расстояние</TabsTrigger>
          <TabsTrigger value="status" className="text-xs">Статус</TabsTrigger>
        </TabsList>
        
        <TabsContent value="speed">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Скорость робота</CardTitle>
              <CardDescription>м/с в реальном времени</CardDescription>
            </CardHeader>
            <CardContent>
              <SpeedChart data={telemetryData} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="battery">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Уровень батареи</CardTitle>
              <CardDescription>% заряда</CardDescription>
            </CardHeader>
            <CardContent>
              <BatteryChart data={telemetryData} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distance">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Пройденное расстояние</CardTitle>
              <CardDescription>по сессиям</CardDescription>
            </CardHeader>
            <CardContent>
              <DistanceChart logs={sessionLogs} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="status">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Статистика доставок</CardTitle>
              <CardDescription>успешность выполнения</CardDescription>
            </CardHeader>
            <CardContent>
              <StatusPieChart stats={stats} />
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Успешно ({stats.successfulDeliveries})</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Неудачно ({stats.failedDeliveries})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Session Logs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">История сессий</CardTitle>
          <CardDescription>последние доставки</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 pr-2">
              {sessionLogs.map(log => (
                <SessionLogItem key={log.id} log={log} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Performance Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Метрики производительности
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Эффективность маршрута</span>
              <span className="font-mono">87%</span>
            </div>
            <Progress value={87} className="h-1" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Точность навигации</span>
              <span className="font-mono">94%</span>
            </div>
            <Progress value={94} className="h-1" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Энергопотребление</span>
              <span className="font-mono">72%</span>
            </div>
            <Progress value={72} className="h-1" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Безопасность</span>
              <span className="font-mono">91%</span>
            </div>
            <Progress value={91} className="h-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsPanel
