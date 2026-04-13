import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
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
  Share2,
  Navigation,
  Route,
  Shield,
  Download,
  Upload,
  Play,
  Bot
} from 'lucide-react'
import { RouteMapEditor } from '@/components/route-map-editor'
import { ScenarioTestPanel } from '@/components/scenario-test-panel'

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
  robotType: string
  robotCount: number
  cargoCapacity: number
  cargoFragile: boolean
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
  robotType: 'standard',
  robotCount: 1,
  cargoCapacity: 10.0,
  cargoFragile: false,
  startPoint: JSON.stringify({ lat: 55.7558, lon: 37.6173, name: 'Стартовая точка' }),
  endPoint: JSON.stringify({ lat: 55.7522, lon: 37.6156, name: 'Точка доставки' }),
  waypoints: '[]',
  obstacles: '[]',
  isPublic: true
}

const scenarioFormSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  description: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  distance: z.number().positive('Расстояние должно быть больше 0'),
  timeLimit: z.number().positive('Лимит времени должен быть больше 0'),
  weather: z.enum(['sunny', 'rainy', 'snowy']),
  traffic: z.enum(['low', 'medium', 'high']),
  isPublic: z.boolean()
})

export function ScenarioEditor() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [formData, setFormData] = useState(DEFAULT_SCENARIO)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isNewScenario, setIsNewScenario] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchDifficulty, setSearchDifficulty] = useState('')
  const [searchWeather, setSearchWeather] = useState('')
  const [isCloning, setIsCloning] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [showRouteEditor, setShowRouteEditor] = useState(false)
  const [waypoints, setWaypoints] = useState<Point[]>([])
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [showTestPanel, setShowTestPanel] = useState(false)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchScenarios()
  }, [])

  const fetchScenarios = async (searchParams?: { query?: string; difficulty?: string; weather?: string; page?: number }) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchParams?.query) params.set('q', searchParams.query)
      if (searchParams?.difficulty) params.set('difficulty', searchParams.difficulty)
      if (searchParams?.weather) params.set('weather', searchParams.weather)
      if (searchParams?.page) params.set('page', searchParams.page.toString())
      params.set('limit', '10')

      const url = searchParams?.query || searchParams?.difficulty || searchParams?.weather || searchParams?.page
        ? `/api/scenarios/search?${params.toString()}`
        : '/api/scenarios'

      const response = await fetch(url)
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Требуется авторизация')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setScenarios(data.scenarios || [])
      if (data.pagination) {
        setTotalPages(data.pagination.pages)
        setTotalItems(data.pagination.total)
        setPage(data.pagination.page)
      }
    } catch (error) {
      console.error('Failed to fetch scenarios:', error)
      toast.error('Ошибка загрузки сценариев')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = useCallback(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }
    searchDebounceRef.current = setTimeout(() => {
      setPage(1)
      fetchScenarios({
        query: searchQuery || undefined,
        difficulty: searchDifficulty || undefined,
        weather: searchWeather || undefined,
        page: 1
      })
    }, 300)
  }, [searchQuery, searchDifficulty, searchWeather])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchScenarios({
      query: searchQuery || undefined,
      difficulty: searchDifficulty || undefined,
      weather: searchWeather || undefined,
      page: newPage
    })
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
      robotType: scenario.robotType || 'standard',
      robotCount: scenario.robotCount || 1,
      cargoCapacity: scenario.cargoCapacity || 10.0,
      cargoFragile: scenario.cargoFragile || false,
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
    // Клиентская валидация
    const validationResult = scenarioFormSchema.safeParse({
      name: formData.name,
      description: formData.description,
      difficulty: formData.difficulty,
      distance: formData.distance,
      timeLimit: formData.timeLimit,
      weather: formData.weather,
      traffic: formData.traffic,
      isPublic: formData.isPublic
    })

    if (!validationResult.success) {
      const errors: Record<string, string> = {}
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message
        }
      })
      setFormErrors(errors)
      toast.error('Пожалуйста, исправьте ошибки в форме')
      return
    }

    // Валидация JSON полей
    try {
      JSON.parse(formData.startPoint)
      JSON.parse(formData.endPoint)
      JSON.parse(formData.waypoints)
      JSON.parse(formData.obstacles)
    } catch (error) {
      toast.error('Ошибка в JSON данных сценария')
      return
    }

    // Очистка ошибок
    setFormErrors({})

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
        toast.success(isNewScenario ? 'Сценарий создан' : 'Сценарий обновлён')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Ошибка сохранения')
      }
    } catch (error) {
      console.error('Failed to save scenario:', error)
      toast.error('Ошибка сохранения сценария')
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
        toast.success('Сценарий удалён')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Ошибка удаления')
      }
    } catch (error) {
      console.error('Failed to delete scenario:', error)
      toast.error('Ошибка удаления сценария')
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
        handleEditScenario(data.scenario)
        toast.success('Сценарий склонирован')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Ошибка клонирования')
      }
    } catch (error) {
      console.error('Failed to clone scenario:', error)
      toast.error('Ошибка клонирования сценария')
    } finally {
      setIsCloning(false)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchDifficulty('')
    setSearchWeather('')
    fetchScenarios()
  }

  const handleExport = (scenario: Scenario) => {
    try {
      const scenarioData = {
        name: scenario.name,
        description: scenario.description,
        difficulty: scenario.difficulty,
        distance: scenario.distance,
        timeLimit: scenario.timeLimit,
        weather: scenario.weather,
        traffic: scenario.traffic,
        robotType: scenario.robotType || 'standard',
        robotCount: scenario.robotCount || 1,
        cargoCapacity: scenario.cargoCapacity || 10.0,
        cargoFragile: scenario.cargoFragile || false,
        startPoint: JSON.parse(scenario.startPoint),
        endPoint: JSON.parse(scenario.endPoint),
        waypoints: JSON.parse(scenario.waypoints),
        obstacles: JSON.parse(scenario.obstacles),
        isPublic: scenario.isPublic,
        version: '1.1.0',
        exportedAt: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(scenarioData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${scenario.name.replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s-]/g, '') || 'scenario'}_export.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Сценарий экспортирован')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Ошибка экспорта сценария')
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedData = JSON.parse(content)

        // Валидация структуры
        if (!importedData.name || !importedData.difficulty) {
          toast.error('Неверный формат файла сценария')
          return
        }

        // Заполнение формы импортированными данными
        setFormData({
          name: importedData.name || '',
          description: importedData.description || '',
          difficulty: importedData.difficulty || 'medium',
          distance: importedData.distance || 1000,
          timeLimit: importedData.timeLimit || 300,
          weather: importedData.weather || 'sunny',
          traffic: importedData.traffic || 'low',
          robotType: importedData.robotType || 'standard',
          robotCount: importedData.robotCount || 1,
          cargoCapacity: importedData.cargoCapacity || 10.0,
          cargoFragile: importedData.cargoFragile || false,
          startPoint: JSON.stringify(importedData.startPoint || { lat: 55.7558, lon: 37.6173, name: 'Стартовая точка' }),
          endPoint: JSON.stringify(importedData.endPoint || { lat: 55.7522, lon: 37.6156, name: 'Точка доставки' }),
          waypoints: JSON.stringify(importedData.waypoints || []),
          obstacles: JSON.stringify(importedData.obstacles || []),
          isPublic: importedData.isPublic !== undefined ? importedData.isPublic : true
        })

        setSelectedScenario(null)
        setIsNewScenario(true)
        setShowEditDialog(true)
        toast.success('Сценарий импортирован')
      } catch (error) {
        console.error('Import error:', error)
        toast.error('Ошибка импорта: неверный формат файла')
      }
    }
    reader.readAsText(file)

    // Сброс input для повторного импорта того же файла
    event.target.value = ''
  }

  const handleLaunchInSimulator = (scenario: Scenario) => {
    try {
      // Конвертация Scenario в DeliveryScenario формат
      const deliveryScenario = {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description || '',
        difficulty: scenario.difficulty as 'easy' | 'medium' | 'hard',
        distance: scenario.distance,
        timeLimit: scenario.timeLimit,
        weather: scenario.weather as 'sunny' | 'rainy' | 'snowy',
        traffic: scenario.traffic as 'low' | 'medium' | 'high',
        robotType: scenario.robotType || 'standard',
        robotCount: scenario.robotCount || 1,
        cargoCapacity: scenario.cargoCapacity || 10.0,
        cargoFragile: scenario.cargoFragile || false,
        startPoint: JSON.parse(scenario.startPoint),
        endPoint: JSON.parse(scenario.endPoint),
        waypoints: JSON.parse(scenario.waypoints),
        obstacles: JSON.parse(scenario.obstacles),
        isPublic: scenario.isPublic,
        playsCount: scenario.playsCount,
        avgScore: scenario.avgScore,
        createdAt: scenario.createdAt,
        creator: scenario.creator
      }

      // Отправка события для simulator-content
      window.dispatchEvent(new CustomEvent('launchSimulatorScenario', {
        detail: deliveryScenario
      }))

      toast.success('Сценарий загружен в симулятор! Переключитесь на вкладку "Симулятор"')
    } catch (error) {
      console.error('Launch in simulator error:', error)
      toast.error('Ошибка запуска в симуляторе')
    }
  }

  const handleOpenRouteEditor = () => {
    try {
      const parsedWaypoints = JSON.parse(formData.waypoints || '[]')
      const parsedObstacles = JSON.parse(formData.obstacles || '[]')
      setWaypoints(Array.isArray(parsedWaypoints) ? parsedWaypoints : [])
      setObstacles(Array.isArray(parsedObstacles) ? parsedObstacles : [])
    } catch {
      setWaypoints([])
      setObstacles([])
    }
    setShowRouteEditor(true)
  }

  const handleSaveRouteEditor = (points: Point[], obstacles: Obstacle[]) => {
    setFormData({ 
      ...formData, 
      waypoints: JSON.stringify(points),
      obstacles: JSON.stringify(obstacles)
    })
    setWaypoints(points)
    setShowRouteEditor(false)
    toast.success('Маршрут и препятствия обновлены')
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
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="scenario-import"
              />
              <Button variant="ghost" size="icon" onClick={() => document.getElementById('scenario-import')?.click()}>
                <Upload className="w-4 h-4" />
              </Button>
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
                          className="h-7 w-7 text-green-600"
                          onClick={() => handleLaunchInSimulator(scenario)}
                          title="Запустить в симуляторе"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleExport(scenario)}
                          title="Экспортировать сценарий"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
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
          {totalPages > 1 && (
            <div className="p-2 border-t flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {totalItems} сценариев
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="h-7 px-2"
                >
                  ←
                </Button>
                <span className="text-xs px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="h-7 px-2"
                >
                  →
                </Button>
              </div>
            </div>
          )}
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
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' })
                  }}
                  placeholder="Миссия: Доставка в центр"
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500">{formErrors.name}</p>
                )}
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
                    onChange={(e) => {
                      setFormData({ ...formData, distance: parseInt(e.target.value) || 0 })
                      if (formErrors.distance) setFormErrors({ ...formErrors, distance: '' })
                    }}
                    className={formErrors.distance ? 'border-red-500' : ''}
                  />
                  {formErrors.distance && (
                    <p className="text-xs text-red-500">{formErrors.distance}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Лимит времени (сек)</Label>
                  <Input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => {
                      setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 0 })
                      if (formErrors.timeLimit) setFormErrors({ ...formErrors, timeLimit: '' })
                    }}
                    className={formErrors.timeLimit ? 'border-red-500' : ''}
                  />
                  {formErrors.timeLimit && (
                    <p className="text-xs text-red-500">{formErrors.timeLimit}</p>
                  )}
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

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Настройки робота
                </Label>

                <div className="space-y-2">
                  <Label>Тип робота</Label>
                  <Select
                    value={formData.robotType}
                    onValueChange={(value) => setFormData({ ...formData, robotType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">🤖 Стандартный</SelectItem>
                      <SelectItem value="heavy">🏋️ Тяжёлый (до 20 кг)</SelectItem>
                      <SelectItem value="compact">📦 Компактный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Количество</Label>
                    <Input
                      type="number"
                      value={formData.robotCount}
                      onChange={(e) => setFormData({ ...formData, robotCount: parseInt(e.target.value) || 1 })}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Грузоподъёмность (кг)</Label>
                    <Input
                      type="number"
                      value={formData.cargoCapacity}
                      onChange={(e) => setFormData({ ...formData, cargoCapacity: parseFloat(e.target.value) || 10 })}
                      min="1"
                      max="50"
                      step="0.5"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Хрупкий груз</Label>
                    <p className="text-xs text-muted-foreground">
                      Требуется аккуратная доставка
                    </p>
                  </div>
                  <Switch
                    checked={formData.cargoFragile}
                    onCheckedChange={(checked) => setFormData({ ...formData, cargoFragile: checked })}
                  />
                </div>
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

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Route className="w-4 h-4" />
                  Маршрут
                </Label>
                <Button variant="outline" className="w-full" onClick={handleOpenRouteEditor}>
                  <Navigation className="w-4 h-4 mr-2" />
                  Редактировать точки маршрута ({waypoints.length})
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowTestPanel(!showTestPanel)}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {showTestPanel ? 'Скрыть тесты' : 'Тестировать'}
                </Button>
                <Button className="w-full" onClick={handleSave} disabled={!formData.name.trim() || isSaving}>
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Сохранить
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Panel */}
      {showTestPanel && (
        <ScenarioTestPanel
          scenarioData={{
            startPoint: formData.startPoint,
            endPoint: formData.endPoint,
            waypoints: formData.waypoints,
            obstacles: formData.obstacles,
            distance: formData.distance,
            timeLimit: formData.timeLimit,
            difficulty: formData.difficulty,
            weather: formData.weather,
            traffic: formData.traffic
          }}
        />
      )}

      {/* Route Editor Dialog */}
      <Dialog open={showRouteEditor} onOpenChange={setShowRouteEditor}>
        <DialogContent className="max-w-7xl h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Визуальный редактор маршрута
            </DialogTitle>
            <DialogDescription>
              Кликните на карту для добавления точек маршрута и препятствий
            </DialogDescription>
          </DialogHeader>

          <RouteMapEditor
            initialPoints={waypoints}
            initialObstacles={obstacles}
            onSave={handleSaveRouteEditor}
            onCancel={() => setShowRouteEditor(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
