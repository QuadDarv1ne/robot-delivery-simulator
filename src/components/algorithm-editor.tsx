'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Target
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

  useEffect(() => {
    fetchAlgorithms()
  }, [])

  const fetchAlgorithms = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/algorithms')
      if (response.ok) {
        const data = await response.json()
        setAlgorithms(data.algorithms || [])
      }
    } catch (error) {
      console.error('Failed to fetch algorithms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewAlgorithm = () => {
    setSelectedAlgorithm(null)
    setName('')
    setDescription('')
    setCode(language === 'python' ? DEFAULT_PYTHON_CODE : DEFAULT_JAVASCRIPT_CODE)
  }

  const handleSelectAlgorithm = (algorithm: Algorithm) => {
    setSelectedAlgorithm(algorithm)
    setName(algorithm.name)
    setDescription(algorithm.description || '')
    setCode(algorithm.code)
    setLanguage(algorithm.language)
  }

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    if (!selectedAlgorithm) {
      setCode(newLang === 'python' ? DEFAULT_PYTHON_CODE : DEFAULT_JAVASCRIPT_CODE)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      return
    }

    setIsSaving(true)
    try {
      const url = selectedAlgorithm ? '/api/algorithms' : '/api/algorithms'
      const method = selectedAlgorithm ? 'PUT' : 'POST'
      
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

      const response = await fetch(url, {
        method,
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

  const handleDelete = async (algorithm: Algorithm) => {
    if (!confirm(`Удалить алгоритм "${algorithm.name}"?`)) {
      return
    }

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
        
        // Update runs count
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
      
      // Detect language from extension
      if (file.name.endsWith('.py')) {
        setLanguage('python')
      } else if (file.name.endsWith('.js') || file.name.endsWith('.ts')) {
        setLanguage('javascript')
      }
      
      setName(file.name.replace(/\.[^/.]+$/, ''))
    }
    reader.readAsText(file)
  }

  const lineNumbers = code.split('\n').map((_, i) => i + 1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
      {/* Sidebar - Algorithm List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Мои алгоритмы
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleNewAlgorithm}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-350px)]">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                Загрузка...
              </div>
            ) : algorithms.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Нет сохранённых алгоритмов
              </div>
            ) : (
              <div className="divide-y">
                {algorithms.map((algo) => (
                  <div
                    key={algo.id}
                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedAlgorithm?.id === algo.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleSelectAlgorithm(algo)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{algo.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(algo)
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {algo.language}
                      </Badge>
                      <span>{algo.runsCount} запусков</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Editor */}
      <Card className="lg:col-span-3 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Редактор алгоритмов
              </CardTitle>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".py,.js,.ts"
                  onChange={handleImport}
                />
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="w-4 h-4 mr-2" />Импорт</span>
                </Button>
              </label>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />Экспорт
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                <Save className="w-4 h-4 mr-2" />Сохранить
              </Button>
              <Button size="sm" onClick={handleRun} disabled={isRunning}>
                {isRunning ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Запустить
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Code Editor */}
          <div className="flex-1 flex overflow-hidden border-t">
            {/* Line numbers */}
            <div className="bg-muted/50 py-4 px-2 text-right text-xs text-muted-foreground font-mono select-none border-r">
              {lineNumbers.map((num) => (
                <div key={num} className="leading-6">{num}</div>
              ))}
            </div>
            
            {/* Code area */}
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 font-mono text-sm resize-none border-0 rounded-none focus-visible:ring-0 p-4 leading-6"
              placeholder="Введите код алгоритма..."
              spellCheck={false}
            />
          </div>
          
          {/* Status bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Язык: {language === 'python' ? 'Python 3' : 'JavaScript'}</span>
              <span>Строк: {code.split('\n').length}</span>
              <span>Символов: {code.length}</span>
            </div>
            {selectedAlgorithm && (
              <span>Последнее изменение: {new Date(selectedAlgorithm.updatedAt).toLocaleString('ru-RU')}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сохранить алгоритм</DialogTitle>
            <DialogDescription>
              Введите название и описание для вашего алгоритма
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Мой алгоритм навигации"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание работы алгоритма..."
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {runResult?.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              Результат симуляции
            </DialogTitle>
            <DialogDescription>
              {runResult?.success 
                ? 'Алгоритм успешно выполнен!' 
                : 'Алгоритм завершился с ошибками'}
            </DialogDescription>
          </DialogHeader>
          
          {runResult && (
            <div className="space-y-4 py-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs">Пройдено</span>
                  </div>
                  <div className="text-xl font-bold">{runResult.distanceTraveled} м</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Время</span>
                  </div>
                  <div className="text-xl font-bold">{runResult.timeElapsed} сек</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">Столкновений</span>
                  </div>
                  <div className={`text-xl font-bold ${runResult.collisions > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {runResult.collisions}
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs">Эффективность</span>
                  </div>
                  <div className="text-xl font-bold">{runResult.pathEfficiency}%</div>
                </div>
              </div>

              <Separator />

              {/* Logs */}
              <div>
                <div className="text-sm font-medium mb-2">Лог выполнения</div>
                <ScrollArea className="h-40 bg-muted/30 rounded-lg p-3">
                  <div className="font-mono text-xs space-y-1">
                    {runResult.logs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
