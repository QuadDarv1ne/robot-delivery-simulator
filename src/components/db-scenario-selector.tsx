'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  MapPin,
  Package,
  Clock,
  Zap,
  Navigation,
  Search,
  RefreshCw,
  Filter
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface DBScenario {
  id: string
  name: string
  description: string | null
  difficulty: string
  distance: number
  timeLimit: number
  weather: string
  traffic: string
  startPoint: string
  endPoint: string
  waypoints: string
  obstacles: string
  isPublic: boolean
  playsCount: number
  avgScore: number | null
  createdAt: string
  creator?: {
    id: string
    name: string | null
  }
}

export interface DeliveryScenario {
  id: string
  name: string
  description: string
  startPoint: { lat: number; lon: number; name: string }
  endPoint: { lat: number; lon: number; name: string }
  waypoints: { lat: number; lon: number; name: string }[]
  distance: number
  estimatedTime: number
  difficulty: 'easy' | 'medium' | 'hard'
  weather: 'sunny' | 'rain' | 'snow' | 'night'
  traffic: 'low' | 'medium' | 'high'
  obstacles: {
    type: 'pedestrian' | 'vehicle' | 'construction' | 'animal'
    position: { lat: number; lon: number }
    speed?: number
  }[]
  packageInfo: {
    weight: number
    fragile: boolean
    temperature?: 'cold' | 'frozen'
  }
}

interface DBScenarioSelectorProps {
  onSelect: (scenario: DeliveryScenario) => void
  selectedId?: string
}

function convertDBScenarioToDeliveryScenario(dbScenario: DBScenario): DeliveryScenario {
  try {
    const startPoint = JSON.parse(dbScenario.startPoint)
    const endPoint = JSON.parse(dbScenario.endPoint)
    const waypoints = JSON.parse(dbScenario.waypoints || '[]')
    const obstacles = JSON.parse(dbScenario.obstacles || '[]')

    return {
      id: dbScenario.id,
      name: dbScenario.name,
      description: dbScenario.description || '',
      startPoint: {
        lat: startPoint.lat || 55.7558,
        lon: startPoint.lon || 37.6173,
        name: startPoint.name || 'Старт'
      },
      endPoint: {
        lat: endPoint.lat || 55.7558,
        lon: endPoint.lon || 37.6173,
        name: endPoint.name || 'Финиш'
      },
      waypoints: Array.isArray(waypoints) ? waypoints.map((wp: any) => ({
        lat: wp.lat || 0,
        lon: wp.lon || 0,
        name: wp.name || ''
      })) : [],
      distance: dbScenario.distance,
      estimatedTime: dbScenario.timeLimit,
      difficulty: dbScenario.difficulty as 'easy' | 'medium' | 'hard',
      weather: dbScenario.weather as 'sunny' | 'rain' | 'snow' | 'night',
      traffic: dbScenario.traffic as 'low' | 'medium' | 'high',
      obstacles: Array.isArray(obstacles) ? obstacles.map((obs: any) => ({
        type: obs.type || 'pedestrian',
        position: {
          lat: obs.position?.lat || 0,
          lon: obs.position?.lon || 0
        },
        speed: obs.speed
      })) : [],
      packageInfo: {
        weight: 2,
        fragile: false
      }
    }
  } catch (error) {
    console.error('Error parsing scenario:', error)
    return {
      id: dbScenario.id,
      name: dbScenario.name,
      description: dbScenario.description || '',
      startPoint: { lat: 55.7558, lon: 37.6173, name: 'Старт' },
      endPoint: { lat: 55.7558, lon: 37.6173, name: 'Финиш' },
      waypoints: [],
      distance: dbScenario.distance,
      estimatedTime: dbScenario.timeLimit,
      difficulty: dbScenario.difficulty as 'easy' | 'medium' | 'hard',
      weather: dbScenario.weather as 'sunny' | 'rain' | 'snow' | 'night',
      traffic: dbScenario.traffic as 'low' | 'medium' | 'high',
      obstacles: [],
      packageInfo: { weight: 2, fragile: false }
    }
  }
}

export function DBScenarioSelector({ onSelect, selectedId }: DBScenarioSelectorProps) {
  const [scenarios, setScenarios] = useState<DBScenario[]>([])
  const [filteredScenarios, setFilteredScenarios] = useState<DBScenario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [filterWeather, setFilterWeather] = useState('')

  useEffect(() => {
    fetchScenarios()
  }, [])

  useEffect(() => {
    filterScenarios()
  }, [scenarios, searchQuery, filterDifficulty, filterWeather])

  const fetchScenarios = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/scenarios?public=true')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setScenarios(data.scenarios || data || [])
    } catch (error) {
      console.error('Failed to fetch scenarios:', error)
      setScenarios([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterScenarios = () => {
    let filtered = scenarios.filter(s => s.isPublic)

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
      )
    }

    if (filterDifficulty) {
      filtered = filtered.filter(s => s.difficulty === filterDifficulty)
    }

    if (filterWeather) {
      filtered = filtered.filter(s => s.weather === filterWeather)
    }

    setFilteredScenarios(filtered)
  }

  const handleSelect = (dbScenario: DBScenario) => {
    const deliveryScenario = convertDBScenarioToDeliveryScenario(dbScenario)
    onSelect(deliveryScenario)
  }

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
      case 'rainy': return '🌧️'
      case 'snowy': return '❄️'
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

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilterDifficulty('')
    setFilterWeather('')
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Загрузка сценариев...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Сценарии доставки</CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchScenarios}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>Выберите сценарий для начала доставки</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Поиск и фильтры */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск сценариев..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Сложность" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все</SelectItem>
                <SelectItem value="easy">Лёгкий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="hard">Сложный</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterWeather} onValueChange={setFilterWeather}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Погода" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все</SelectItem>
                <SelectItem value="sunny">☀️ Солнечно</SelectItem>
                <SelectItem value="rainy">🌧️ Дождь</SelectItem>
                <SelectItem value="snowy">❄️ Снег</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchQuery || filterDifficulty || filterWeather) && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8"
              onClick={handleClearFilters}
            >
              <Filter className="w-3 h-3 mr-1" />
              Сбросить фильтры
            </Button>
          )}
        </div>

        {/* Список сценариев */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-4">
            {filteredScenarios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {searchQuery || filterDifficulty || filterWeather
                    ? 'Ничего не найдено'
                    : 'Нет доступных сценариев'}
                </p>
              </div>
            ) : (
              filteredScenarios.map((scenario) => (
                <Card
                  key={scenario.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedId === scenario.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleSelect(scenario)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{scenario.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span>{getWeatherIcon(scenario.weather)}</span>
                        <Badge
                          variant="outline"
                          className={`${getDifficultyColor(scenario.difficulty)} text-white text-xs`}
                        >
                          {scenario.difficulty === 'easy' ? 'Легко' : scenario.difficulty === 'medium' ? 'Средне' : 'Сложно'}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      {scenario.description || 'Без описания'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {scenario.distance} м
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{Math.round(scenario.timeLimit / 60)} мин
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {scenario.playsCount} запусков
                      </div>
                      <div className={`flex items-center gap-1 ${getTrafficColor(scenario.traffic)}`}>
                        <Zap className="w-3 h-3" />
                        Трафик: {scenario.traffic === 'low' ? 'низкий' : scenario.traffic === 'medium' ? 'средний' : 'высокий'}
                      </div>
                    </div>

                    {scenario.creator && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Автор: {scenario.creator.name || 'Аноним'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
