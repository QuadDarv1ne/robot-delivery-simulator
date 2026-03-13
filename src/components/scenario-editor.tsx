'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  MapPin,
  Plus,
  Trash2,
  Edit,
  Save,
  Eye,
  Users,
  Clock,
  Cloud,
  Car,
  Mountain,
  RefreshCw,
  CheckCircle2,
  X,
  Search,
  Copy,
  Filter,
  Share2
} from 'lucide-react'

interface Point {
  lat: number
  lon: number
  name: string
}

interface Obstacle {
  id: string
  type: 'pedestrian' | 'vehicle' | 'construction'
  position: Point
  radius: number
}

interface Scenario {
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
  avgScore: number
  createdAt: string
  creator?: {
    id: string
    name: string
  }
}

const DEFAULT_SCENARIO = {
  name: '',
  description: '',
  difficulty: 'medium',
  distance: 1000,
  timeLimit: 300,
  weather: 'sunny',
  traffic: 'low',
  startPoint: JSON.stringify({ lat: 55.7558, lon: 37.6173, name: 'Стартовая точка' }),
  endPoint: JSON.stringify({ lat: 55.7522, lon: 37.6156, name: 'Точка доставки' }),
  waypoints: '[]',
  obstacles: '[]',
  isPublic: true
}

export function ScenarioEditor() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [formData, setFormData] = useState(DEFAULT_SCENARIO)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isNewScenario, setIsNewScenario] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchDifficulty, setSearchDifficulty] = useState('')
  const [searchWeather, setSearchWeather] = useState('')
  const [isCloning, setIsCloning] = useState(false)

  useEffect(() => {
    fetchScenarios()
  }, [])

  const fetchScenarios = async (searchParams?: { query?: string; difficulty?: string; weather?: string }) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchParams?.query) params.set('q', searchParams.query)
      if (searchParams?.difficulty) params.set('difficulty', searchParams.difficulty)
      if (searchParams?.weather) params.set('weather', searchParams.weather)
      
      const url = searchParams?.query || searchParams?.difficulty || searchParams?.weather
        ? `/api/scenarios/search?${params.toString()}`
        : '/api/scenarios'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setScenarios(data.scenarios || [])
      }
    } catch (error) {
      console.error('Failed to fetch scenarios:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewScenario = () => {
    setSelectedScenario(null)
    setFormData(DEFAULT_SCENARIO)
    setIsNewScenario(true)
    setShowEditDialog(true)
  }

  const handleEditScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario)
    setFormData({
      name: scenario.name,
      description: scenario.description || '',
      difficulty: scenario.difficulty,
      distance: scenario.distance,
      timeLimit: scenario.timeLimit,
      weather: scenario.weather,
      traffic: scenario.traffic,
      startPoint: scenario.startPoint,
      endPoint: scenario.endPoint,
      waypoints: scenario.waypoints,
      obstacles: scenario.obstacles,
      isPublic: scenario.isPublic
    })
    setIsNewScenario(false)
    setShowEditDialog(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return

    setIsSaving(true)
    try {
      const url = '/api/scenarios'
      const method = isNewScenario ? 'POST' : 'PUT'
      const body = isNewScenario 
        ? formData 
        : { id: selectedScenario?.id, ...formData }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchScenarios()
        setShowEditDialog(false)
      }
    } catch (error) {
      console.error('Failed to save scenario:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (scenario: Scenario) => {
    if (!confirm(`Удалить сценарий "${scenario.name}"?`)) return

    try {
      const response = await fetch(`/api/scenarios?id=${scenario.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchScenarios()
      }
    } catch (error) {
      console.error('Failed to delete scenario:', error)
    }
  }

  const handleClone = async (scenario: Scenario) => {
    setIsCloning(true)
    try {
      const response = await fetch('/api/scenarios/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scenario.id })
      })

      if (response.ok) {
        const data = await response.json()
        await fetchScenarios()
        // Edit the cloned scenario
        handleEditScenario(data.scenario)
      }
    } catch (error) {
      console.error('Failed to clone scenario:', error)
    } finally {
      setIsCloning(false)
    }
  }

  const handleSearch = useCallback(() => {
    fetchScenarios({
      query: searchQuery || undefined,
      difficulty: searchDifficulty || undefined,
      weather: searchWeather || undefined
    })
  }, [searchQuery, searchDifficulty, searchWeather])

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchDifficulty('')
    setSearchWeather('')
    fetchScenarios()
  }

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-500',
      medium: 'bg-yellow-500',
      hard: 'bg-red-500'
    }
    const labels = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' }
    return <Badge className={colors[difficulty as keyof typeof colors]}>{labels[difficulty as keyof typeof labels]}</Badge>
  }

  const getWeatherBadge = (weather: string) => {
    const icons = { sunny: '☀️', rainy: '🌧️', snowy: '❄️' }
    const labels = { sunny: 'Солнечно', rainy: 'Дождь', snowy: 'Снег' }
    return <span>{icons[weather as keyof typeof icons]} {labels[weather as keyof typeof labels]}</span>
  }

  const getTrafficBadge = (traffic: string) => {
    const colors = { low: 'text-green-500', medium: 'text-yellow-500', high: 'text-red-500' }
    const labels = { low: 'Низкий', medium: 'Средний', high: 'Высокий' }
    return <span className={colors[traffic as keyof typeof colors]}>🚗 {labels[traffic as keyof typeof labels]}</span>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Scenario List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Сценарии доставки
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={handleNewScenario}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClearSearch}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Search */}
        <div className="p-3 border-t border-b space-y-2 bg-muted/30">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-8 h-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={searchDifficulty} onValueChange={setSearchDifficulty}>
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
            <Select value={searchWeather} onValueChange={setSearchWeather}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Погода" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все</SelectItem>
                <SelectItem value="sunny">☀️</SelectItem>
                <SelectItem value="rainy">🌧️</SelectItem>
                <SelectItem value="snowy">❄️</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="w-full" onClick={handleSearch}>
            <Filter className="w-4 h-4 mr-1" />
            Найти
          </Button>
        </div>

        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-400px)]">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                Загрузка...
              </div>
            ) : scenarios.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                {searchQuery || searchDifficulty || searchWeather ? 'Ничего не найдено' : 'Нет созданных сценариев'}
              </div>
            ) : (
              <div className="divide-y">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium truncate">{scenario.name}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleClone(scenario)}
                          disabled={isCloning}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditScenario(scenario)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(scenario)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {getDifficultyBadge(scenario.difficulty)}
                      <span>{scenario.distance}м</span>
                      <span>•</span>
                      <span>{scenario.playsCount} запусков</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {getWeatherBadge(scenario.weather)}
                      {getTrafficBadge(scenario.traffic)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Editor Form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Редактор сценария
          </CardTitle>
          <CardDescription>
            Создавайте и редактируйте миссии доставки для студентов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Название *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Миссия: Доставка в центр"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Описание миссии..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Сложность</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Лёгкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="hard">Сложный</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Расстояние (м)</Label>
                  <Input
                    type="number"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Лимит времени (сек)</Label>
                  <Input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* Environment */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  Погодные условия
                </Label>
                <Select
                  value={formData.weather}
                  onValueChange={(value) => setFormData({ ...formData, weather: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunny">☀️ Солнечно</SelectItem>
                    <SelectItem value="rainy">🌧️ Дождь</SelectItem>
                    <SelectItem value="snowy">❄️ Снег</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Интенсивность трафика
                </Label>
                <Select
                  value={formData.traffic}
                  onValueChange={(value) => setFormData({ ...formData, traffic: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Публичный сценарий</Label>
                  <p className="text-xs text-muted-foreground">
                    Доступен всем студентам
                  </p>
                </div>
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                />
              </div>

              <Separator />

              <Button className="w-full" onClick={handleSave} disabled={!formData.name.trim() || isSaving}>
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Сохранить сценарий
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
