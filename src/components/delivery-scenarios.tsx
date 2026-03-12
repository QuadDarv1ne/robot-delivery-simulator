'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  MapPin, 
  Package, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Navigation
} from 'lucide-react'

export interface DeliveryScenario {
  id: string
  name: string
  description: string
  startPoint: { lat: number; lon: number; name: string }
  endPoint: { lat: number; lon: number; name: string }
  waypoints: { lat: number; lon: number; name: string }[]
  distance: number // meters
  estimatedTime: number // seconds
  difficulty: 'easy' | 'medium' | 'hard'
  weather: 'sunny' | 'rain' | 'snow' | 'night'
  traffic: 'low' | 'medium' | 'high'
  obstacles: {
    type: 'pedestrian' | 'vehicle' | 'construction' | 'animal'
    position: { lat: number; lon: number }
    speed?: number
  }[]
  packageInfo: {
    weight: number // kg
    fragile: boolean
    temperature?: 'cold' | 'frozen'
  }
}

export interface DeliverySession {
  scenarioId: string
  startTime: number
  status: 'preparing' | 'in_progress' | 'delivered' | 'failed' | 'cancelled'
  progress: number // 0-100
  currentWaypoint: number
  distanceTraveled: number
  timeElapsed: number
  collisions: number
  batteryUsed: number
}

// Predefined scenarios
const defaultScenarios: DeliveryScenario[] = [
  {
    id: 'demo-1',
    name: 'Тестовый маршрут',
    description: 'Простой маршрут для знакомства с симулятором',
    startPoint: { lat: 55.7558, lon: 37.6173, name: 'База' },
    endPoint: { lat: 55.7578, lon: 37.6193, name: 'Точка А' },
    waypoints: [],
    distance: 250,
    estimatedTime: 180,
    difficulty: 'easy',
    weather: 'sunny',
    traffic: 'low',
    obstacles: [],
    packageInfo: { weight: 2, fragile: false }
  },
  {
    id: 'demo-2',
    name: 'Доставка в центр города',
    description: 'Маршрут через оживлённую часть города с пешеходами',
    startPoint: { lat: 55.7558, lon: 37.6173, name: 'Склад' },
    endPoint: { lat: 55.7588, lon: 37.6223, name: 'Офис клиента' },
    waypoints: [
      { lat: 55.7568, lon: 37.6193, name: 'Поворот 1' },
      { lat: 55.7578, lon: 37.6208, name: 'Поворот 2' }
    ],
    distance: 500,
    estimatedTime: 300,
    difficulty: 'medium',
    weather: 'sunny',
    traffic: 'medium',
    obstacles: [
      { type: 'pedestrian', position: { lat: 55.7563, lon: 37.6183 }, speed: 1.2 },
      { type: 'pedestrian', position: { lat: 55.7573, lon: 37.6203 }, speed: 0.8 },
      { type: 'vehicle', position: { lat: 55.7570, lon: 37.6210 }, speed: 5 }
    ],
    packageInfo: { weight: 5, fragile: true }
  },
  {
    id: 'demo-3',
    name: 'Сложная доставка',
    description: 'Доставка в плохую погоду с интенсивным движением',
    startPoint: { lat: 55.7558, lon: 37.6173, name: 'Центр логистики' },
    endPoint: { lat: 55.7618, lon: 37.6263, name: 'Удалённый район' },
    waypoints: [
      { lat: 55.7568, lon: 37.6193, name: 'Перекрёсток 1' },
      { lat: 55.7588, lon: 37.6213, name: 'Перекрёсток 2' },
      { lat: 55.7608, lon: 37.6243, name: 'Перекрёсток 3' }
    ],
    distance: 800,
    estimatedTime: 480,
    difficulty: 'hard',
    weather: 'rain',
    traffic: 'high',
    obstacles: [
      { type: 'pedestrian', position: { lat: 55.7563, lon: 37.6185 }, speed: 1.5 },
      { type: 'pedestrian', position: { lat: 55.7575, lon: 37.6205 }, speed: 1.0 },
      { type: 'vehicle', position: { lat: 55.7583, lon: 37.6218 }, speed: 8 },
      { type: 'construction', position: { lat: 55.7595, lon: 37.6230 } },
      { type: 'pedestrian', position: { lat: 55.7605, lon: 37.6250 }, speed: 1.2 },
      { type: 'vehicle', position: { lat: 55.7610, lon: 37.6255 }, speed: 4 }
    ],
    packageInfo: { weight: 3, fragile: true, temperature: 'cold' }
  },
  {
    id: 'demo-4',
    name: 'Ночная доставка',
    description: 'Доставка в ночное время с ограниченной видимостью',
    startPoint: { lat: 55.7558, lon: 37.6173, name: 'Ночной склад' },
    endPoint: { lat: 55.7598, lon: 37.6233, name: 'Клиент' },
    waypoints: [
      { lat: 55.7573, lon: 37.6203, name: 'Контрольная точка' }
    ],
    distance: 450,
    estimatedTime: 360,
    difficulty: 'hard',
    weather: 'night',
    traffic: 'low',
    obstacles: [
      { type: 'animal', position: { lat: 55.7568, lon: 37.6190 } },
      { type: 'pedestrian', position: { lat: 55.7585, lon: 37.6220 }, speed: 0.5 }
    ],
    packageInfo: { weight: 1, fragile: false }
  }
]

interface ScenarioSelectorProps {
  onSelect: (scenario: DeliveryScenario) => void
  selectedId?: string
}

export function ScenarioSelector({ onSelect, selectedId }: ScenarioSelectorProps) {
  const [scenarios] = useState<DeliveryScenario[]>(defaultScenarios)
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }
  
  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'sunny': return '☀️'
      case 'rain': return '🌧️'
      case 'snow': return '❄️'
      case 'night': return '🌙'
      default: return '🌤️'
    }
  }
  
  const getTrafficColor = (traffic: string) => {
    switch (traffic) {
      case 'low': return 'text-green-500'
      case 'medium': return 'text-yellow-500'
      case 'high': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }
  
  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 pr-4">
        {scenarios.map((scenario) => (
          <Card 
            key={scenario.id}
            className={`cursor-pointer transition-all hover:border-primary ${
              selectedId === scenario.id ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => onSelect(scenario)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{scenario.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <span>{getWeatherIcon(scenario.weather)}</span>
                  <Badge variant="outline" className={`${getDifficultyColor(scenario.difficulty)} text-white text-xs`}>
                    {scenario.difficulty === 'easy' ? 'Легко' : scenario.difficulty === 'medium' ? 'Средне' : 'Сложно'}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-xs">{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {scenario.distance} м
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{Math.round(scenario.estimatedTime / 60)} мин
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {scenario.packageInfo.weight} кг
                </div>
                <div className={`flex items-center gap-1 ${getTrafficColor(scenario.traffic)}`}>
                  <Zap className="w-3 h-3" />
                  Трафик: {scenario.traffic === 'low' ? 'низкий' : scenario.traffic === 'medium' ? 'средний' : 'высокий'}
                </div>
              </div>
              
              {scenario.obstacles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {scenario.obstacles.map((obs, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {obs.type === 'pedestrian' ? '🚶' : obs.type === 'vehicle' ? '🚗' : obs.type === 'construction' ? '🚧' : '🐾'}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}

interface DeliveryProgressProps {
  session: DeliverySession | null
  scenario: DeliveryScenario | null
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onCancel: () => void
}

export function DeliveryProgress({ 
  session, 
  scenario, 
  onPause, 
  onResume, 
  onReset, 
  onCancel 
}: DeliveryProgressProps) {
  if (!session || !scenario) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Выберите сценарий доставки</p>
        </CardContent>
      </Card>
    )
  }
  
  const getStatusIcon = () => {
    switch (session.status) {
      case 'preparing': return <Clock className="w-4 h-4 animate-spin" />
      case 'in_progress': return <Play className="w-4 h-4" />
      case 'delivered': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'cancelled': return <Pause className="w-4 h-4" />
      default: return null
    }
  }
  
  const getStatusText = () => {
    switch (session.status) {
      case 'preparing': return 'Подготовка...'
      case 'in_progress': return 'В процессе доставки'
      case 'delivered': return 'Доставлено!'
      case 'failed': return 'Доставка не удалась'
      case 'cancelled': return 'Отменено'
      default: return 'Неизвестно'
    }
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {getStatusIcon()}
            {getStatusText()}
          </CardTitle>
          <Badge variant={session.status === 'in_progress' ? 'default' : 'secondary'}>
            {Math.round(session.progress)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={session.progress} className="h-2" />
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-muted/50 p-2 rounded">
            <div className="text-muted-foreground">Пройдено</div>
            <div className="font-mono font-semibold">{session.distanceTraveled} м</div>
          </div>
          <div className="bg-muted/50 p-2 rounded">
            <div className="text-muted-foreground">Время</div>
            <div className="font-mono font-semibold">
              {Math.floor(session.timeElapsed / 60)}:{String(session.timeElapsed % 60).padStart(2, '0')}
            </div>
          </div>
          <div className="bg-muted/50 p-2 rounded">
            <div className="text-muted-foreground">Батарея</div>
            <div className="font-mono font-semibold">{session.batteryUsed.toFixed(1)}%</div>
          </div>
          <div className="bg-muted/50 p-2 rounded">
            <div className="text-muted-foreground">Столкновения</div>
            <div className={`font-mono font-semibold ${session.collisions > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {session.collisions}
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Route info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">От:</span>
            <span>{scenario.startPoint.name}</span>
          </div>
          
          {session.currentWaypoint > 0 && scenario.waypoints.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-green-500">
              <CheckCircle2 className="w-3 h-3" />
              <span>Пройдено точек: {Math.min(session.currentWaypoint, scenario.waypoints.length)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">До:</span>
            <span>{scenario.endPoint.name}</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Controls */}
        <div className="flex gap-2">
          {session.status === 'in_progress' ? (
            <Button variant="outline" size="sm" onClick={onPause} className="flex-1">
              <Pause className="w-4 h-4 mr-1" />
              Пауза
            </Button>
          ) : session.status === 'preparing' ? (
            <Button variant="default" size="sm" onClick={onResume} className="flex-1">
              <Play className="w-4 h-4 mr-1" />
              Старт
            </Button>
          ) : null}
          
          <Button variant="outline" size="sm" onClick={onReset} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-1" />
            Сброс
          </Button>
          
          {session.status === 'in_progress' && (
            <Button variant="destructive" size="sm" onClick={onCancel}>
              Отмена
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { defaultScenarios }
