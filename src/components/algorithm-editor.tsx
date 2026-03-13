'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
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
  Code,
  Play,
  Save,
  Upload,
  Download,
  Trash2,
  FileCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  FolderOpen,
  Clock,
  Zap,
  Target,
  Search,
  Copy,
  Filter
} from 'lucide-react'

interface Algorithm {
  id: string
  name: string
  description: string | null
  language: string
  code: string
  isPublic: boolean
  runsCount: number
  avgScore: number
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
  }
}

interface RunResult {
  success: boolean
  distanceTraveled: number
  timeElapsed: number
  collisions: number
  pathEfficiency: number
  logs: string[]
  deliveryResultId?: string
}

const DEFAULT_PYTHON_CODE = `# Алгоритм управления роботом-доставщиком
# Доступные функции:
# - get_gps() -> {lat, lon, altitude}
# - get_lidar() -> [{distance, angle}, ...]
# - get_imu() -> {acceleration, gyro}
# - move(speed, direction)
# - stop()
# - set_destination(lat, lon)

def navigate_to_destination():
    """Основная функция навигации"""
    destination = get_destination()
    current_pos = get_gps()

    # Получаем данные лидара
    lidar_data = get_lidar()

    # Проверяем препятствия
    obstacles = detect_obstacles(lidar_data)

    if obstacles:
        # Обходим препятствие
        avoid_obstacle(obstacles)
    else:
        # Движемся к цели
        move(speed=0.5, direction=calculate_direction(current_pos, destination))

    return check_arrival(current_pos, destination)

def detect_obstacles(lidar_data):
    """Обнаружение препятствий"""
    obstacles = []
    for point in lidar_data:
        if point.distance < 2.0:  # менее 2 метров
            obstacles.append(point)
    return obstacles

def avoid_obstacle(obstacles):
    """Избегание препятствий"""
    stop()
    # Поворот в безопасном направлении
    turn_angle = calculate_safe_turn(obstacles)
    rotate(turn_angle)
    move(speed=0.3, direction='forward')

# Точка входа
while not navigate_to_destination():
    continue
`

const DEFAULT_JAVASCRIPT_CODE = `// Алгоритм управления роботом-доставщиком
// Доступные функции:
// - getGPS() -> {lat, lon, altitude}
// - getLidar() -> [{distance, angle}, ...]
// - getIMU() -> {acceleration, gyro}
// - move(speed, direction)
// - stop()
// - setDestination(lat, lon)

async function navigateToDestination() {
  const destination = getDestination();
  const currentPos = getGPS();
  const lidarData = getLidar();

  // Проверяем препятствия
  const obstacles = detectObstacles(lidarData);

  if (obstacles.length > 0) {
    await avoidObstacle(obstacles);
  } else {
    const direction = calculateDirection(currentPos, destination);
    move(0.5, direction);
  }

  return checkArrival(currentPos, destination);
}

function detectObstacles(lidarData) {
  return lidarData.filter(point => point.distance < 2.0);
}

async function avoidObstacle(obstacles) {
  stop();
  const turnAngle = calculateSafeTurn(obstacles);
  await rotate(turnAngle);
  move(0.3, 'forward');
}

// Основной цикл
(async function main() {
  while (!await navigateToDestination()) {
    await sleep(100);
  }
})();
`

export function AlgorithmEditor() {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([])
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | null>(null)
  const [code, setCode] = useState(DEFAULT_PYTHON_CODE)
  const [language, setLanguage] = useState('python')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLanguage, setSearchLanguage] = useState('')
  const [isCloning, setIsCloning] = useState(false)

  const fetchAlgorithms = useCallback(async (searchParams?: { query?: string; language?: string }) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchParams?.query) params.set('q', searchParams.query)
      if (searchParams?.language) params.set('language', searchParams.language)
      
      const url = searchParams?.query || searchParams?.language
        ? `/api/algorithms/search?${params.toString()}`
        : '/api/algorithms'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAlgorithms(data.algorithms || [])
      }
    } catch (error) {
      console.error('Failed to fetch algorithms:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlgorithms()
  }, [fetchAlgorithms])

  const handleNewAlgorithm = () => {
    setSelectedAlgorithm(null)
    setName('')
    setDescription('')
    setCode(language === 'python' ? DEFAULT_PYTHON_CODE : DEFAULT_JAVASCRIPT_CODE)
  }

  const handleSelectAlgorithm = useCallback((algorithm: Algorithm) => {
    setSelectedAlgorithm(algorithm)
    setName(algorithm.name)
    setDescription(algorithm.description || '')
    setCode(algorithm.code)
    setLanguage(algorithm.language)
  }, [])

  const handleLanguageChange = useCallback((newLang: string) => {
    setLanguage(newLang)
    setCode(newLang === 'python' ? DEFAULT_PYTHON_CODE : DEFAULT_JAVASCRIPT_CODE)
    setSelectedAlgorithm(null)
  }, [])

  const handleSave = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    try {
      const body: any = {
        name,
        description,
        code,
        language,
        isPublic: false
      }

      if (selectedAlgorithm) {
        body.id = selectedAlgorithm.id
      }

      const response = await fetch('/api/algorithms', {
        method: selectedAlgorithm ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchAlgorithms()
        setShowSaveDialog(false)
      }
    } catch (error) {
      console.error('Failed to save algorithm:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (algorithm: Algorithm, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!confirm(`Удалить алгоритм "${algorithm.name}"?`)) return

    try {
      const response = await fetch(`/api/algorithms?id=${algorithm.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchAlgorithms()
        if (selectedAlgorithm?.id === algorithm.id) {
          handleNewAlgorithm()
        }
      }
    } catch (error) {
      console.error('Failed to delete algorithm:', error)
    }
  }

  const handleRun = async () => {
    setIsRunning(true)
    setRunResult(null)

    try {
      const response = await fetch('/api/algorithms/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          algorithmId: selectedAlgorithm?.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRunResult(data.result)
        setShowResultDialog(true)
        await fetchAlgorithms()
      }
    } catch (error) {
      console.error('Failed to run algorithm:', error)
      setRunResult({
        success: false,
        distanceTraveled: 0,
        timeElapsed: 0,
        collisions: 0,
        pathEfficiency: 0,
        logs: ['❌ Ошибка соединения с сервером']
      })
      setShowResultDialog(true)
    } finally {
      setIsRunning(false)
    }
  }

  const handleExport = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name || 'algorithm'}.${language === 'python' ? 'py' : 'js'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCode(content)

      if (file.name.endsWith('.py')) {
        setLanguage('python')
      } else if (file.name.endsWith('.js') || file.name.endsWith('.ts')) {
        setLanguage('javascript')
      }

      setName(file.name.replace(/\.[^/.]+$/, ''))
    }
    reader.readAsText(file)
  }

  const handleClone = async (algorithm: Algorithm, event: React.MouseEvent) => {
    event.stopPropagation()
    setIsCloning(true)
    try {
      const response = await fetch('/api/algorithms/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: algorithm.id })
      })

      if (response.ok) {
        const data = await response.json()
        await fetchAlgorithms()
        // Select the cloned algorithm
        const cloned = data.algorithm
        handleSelectAlgorithm(cloned)
      }
    } catch (error) {
      console.error('Failed to clone algorithm:', error)
    } finally {
      setIsCloning(false)
    }
  }

  const handleSearch = useCallback(() => {
    fetchAlgorithms({
      query: searchQuery || undefined,
      language: searchLanguage || undefined
    })
  }, [searchQuery, searchLanguage, fetchAlgorithms])

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchLanguage('')
    fetchAlgorithms()
  }

  const lineNumbers = code.split('\n').map((_, i) => i + 1)

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Sidebar */}
      <Card className="w-72 flex flex-col h-full">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Алгоритмы
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNewAlgorithm}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClearSearch}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Search */}
        <div className="p-3 border-b space-y-2">
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
          <div className="flex gap-2">
            <Select value={searchLanguage} onValueChange={setSearchLanguage}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Язык" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все языки</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-9" onClick={handleSearch}>
              <Filter className="w-4 h-4 mr-1" />
              Найти
            </Button>
          </div>
        </div>

        <CardContent className="flex-1 p-2 overflow-hidden">
          <ScrollArea className="h-full pr-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin mb-2" />
                <span className="text-sm">Загрузка...</span>
              </div>
            ) : algorithms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                <FileCode className="w-8 h-8 mb-2 opacity-50" />
                {searchQuery || searchLanguage ? 'Ничего не найдено' : 'Нет алгоритмов'}
              </div>
            ) : (
              <div className="space-y-1">
                {algorithms.map((algo) => (
                  <div
                    key={algo.id}
                    className={`group p-3 rounded-lg cursor-pointer transition-all ${
                      selectedAlgorithm?.id === algo.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted border border-transparent'
                    }`}
                    onClick={() => handleSelectAlgorithm(algo)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileCode className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">{algo.name}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleClone(algo, e)}
                          disabled={isCloning}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDelete(algo, e)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs h-5">
                        {algo.language === 'python' ? '🐍' : '📜'} {algo.language}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{algo.runsCount} запусков</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Editor */}
      <Card className="flex-1 flex flex-col h-full">
        {/* Toolbar */}
        <CardHeader className="pb-3 border-b shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="w-5 h-5" />
                Редактор
              </CardTitle>
              <Separator orientation="vertical" className="h-6" />
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">🐍 Python</SelectItem>
                  <SelectItem value="javascript"> JavaScript</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
              <label>
                <input
                  type="file"
                  className="hidden"
                  accept=".py,.js,.ts"
                  onChange={handleImport}
                />
                <Button variant="outline" size="sm" className="h-9" asChild>
                  <span><Upload className="w-4 h-4 mr-1.5" />Импорт</span>
                </Button>
              </label>
              <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1.5" />Экспорт
              </Button>
              <Button variant="outline" size="sm" className="h-9" onClick={() => setShowSaveDialog(true)}>
                <Save className="w-4 h-4 mr-1.5" />Сохранить
              </Button>
              <Button size="sm" className="h-9 bg-green-600 hover:bg-green-700" onClick={handleRun} disabled={isRunning}>
                {isRunning ? (
                  <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-1.5" />
                )}
                Запуск
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Editor */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex overflow-hidden">
            {/* Line numbers */}
            <div className="bg-muted py-3 px-2 text-right text-xs text-muted-foreground font-mono select-none border-r shrink-0 overflow-hidden">
              <div className="space-y-[1.5rem]">
                {lineNumbers.map((num) => (
                  <div key={num}>{num}</div>
                ))}
              </div>
            </div>

            {/* Code area */}
            <ScrollArea className="flex-1">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-full font-mono text-sm resize-none border-0 rounded-none focus-visible:ring-0 p-3 leading-[1.5rem] bg-transparent"
                placeholder="Введите код алгоритма..."
                spellCheck={false}
              />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-t text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" />
                <strong>{language === 'python' ? 'Python 3' : 'JavaScript'}</strong>
              </span>
              <span>Строк: <strong>{code.split('\n').length}</strong></span>
              <span>Символов: <strong>{code.length.toLocaleString()}</strong></span>
            </div>
            {selectedAlgorithm && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {new Date(selectedAlgorithm.updatedAt).toLocaleString('ru-RU')}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Сохранить алгоритм
            </DialogTitle>
            <DialogDescription>
              Введите название и описание алгоритма
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Навигация к цели"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание работы алгоритма..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {runResult?.success ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              Результат симуляции
            </DialogTitle>
            <DialogDescription>
              {runResult?.success ? 'Алгоритм выполнен успешно' : 'Алгоритм завершился с ошибками'}
            </DialogDescription>
          </DialogHeader>

          {runResult && (
            <div className="space-y-4">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Target className="w-4 h-4" />
                    <span className="text-xs font-medium">Пройдено</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{runResult.distanceTraveled} м</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Время</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{runResult.timeElapsed} сек</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">Столкновения</span>
                  </div>
                  <div className={`text-2xl font-bold ${runResult.collisions > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {runResult.collisions}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-medium">Эффективность</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{runResult.pathEfficiency}%</div>
                </div>
              </div>

              <Separator />

              {/* Logs */}
              <div>
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  Лог выполнения
                </div>
                <ScrollArea className="h-48 bg-muted/50 rounded-lg border">
                  <div className="font-mono text-xs p-4 space-y-1">
                    {runResult.logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-muted-foreground select-none">{i + 1}.</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)} className="min-w-[100px]">
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
