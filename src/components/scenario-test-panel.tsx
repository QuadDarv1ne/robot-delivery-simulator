'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  BarChart3,
  Loader2,
  Play,
  Navigation,
  Clock,
  MapPin,
  Shield
} from 'lucide-react'

interface TestResult {
  valid: boolean
  warnings: string[]
  errors: string[]
  stats: {
    totalDistance: number
    estimatedTime: number
    waypointsCount: number
    obstaclesCount: number
    difficultyScore: number
    routeComplexity: 'low' | 'medium' | 'high'
  }
  recommendations: string[]
}

interface ScenarioTestData {
  startPoint: string
  endPoint: string
  waypoints: string
  obstacles: string
  distance: number
  timeLimit: number
  difficulty: string
  weather: string
  traffic: string
}

interface ScenarioTestPanelProps {
  scenarioData: ScenarioTestData
  onTestComplete?: (result: TestResult) => void
}

export function ScenarioTestPanel({ scenarioData, onTestComplete }: ScenarioTestPanelProps) {
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/scenarios/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenarioData)
      })

      const data = await response.json()
      
      if (response.ok) {
        setTestResult(data)
        onTestComplete?.(data)
      } else {
        setTestResult({
          valid: false,
          warnings: [],
          errors: [data.error || 'Ошибка тестирования'],
          stats: {
            totalDistance: 0,
            estimatedTime: 0,
            waypointsCount: 0,
            obstaclesCount: 0,
            difficultyScore: 0,
            routeComplexity: 'low'
          },
          recommendations: []
        })
      }
    } catch (error) {
      console.error('Test failed:', error)
      setTestResult({
        valid: false,
        warnings: [],
        errors: ['Ошибка подключения к серверу'],
        stats: {
          totalDistance: 0,
          estimatedTime: 0,
          waypointsCount: 0,
          obstaclesCount: 0,
          difficultyScore: 0,
          routeComplexity: 'low'
        },
        recommendations: []
      })
    } finally {
      setIsTesting(false)
    }
  }

  const getComplexityLabel = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'Низкая'
      case 'medium': return 'Средняя'
      case 'high': return 'Высокая'
      default: return complexity
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-500'
      case 'medium': return 'text-yellow-500'
      case 'high': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  if (isTesting) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium mb-2">Тестирование сценария</p>
          <p className="text-sm text-muted-foreground">
            Анализируем маршрут, препятствия и параметры...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!testResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Тестирование сценария
          </CardTitle>
          <CardDescription>
            Проверьте корректность сценария перед сохранением
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleTest} className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Запустить тестирование
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Результаты тестирования
          </CardTitle>
          <Badge variant={testResult.valid ? 'default' : 'destructive'}>
            {testResult.valid ? (
              <><CheckCircle2 className="w-3 h-3 mr-1" /> Корректен</>
            ) : (
              <><XCircle className="w-3 h-3 mr-1" /> Есть ошибки</>
            )}
          </Badge>
        </div>
        <CardDescription>
          Анализ маршрута и рекомендаций
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ошибки */}
        {testResult.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Ошибки ({testResult.errors.length})
            </h4>
            <ScrollArea className="h-[80px]">
              <div className="space-y-1">
                {testResult.errors.map((error, i) => (
                  <div key={i} className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                    {error}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Предупреждения */}
        {testResult.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Предупреждения ({testResult.warnings.length})
            </h4>
            <ScrollArea className="h-[100px]">
              <div className="space-y-1">
                {testResult.warnings.map((warning, i) => (
                  <div key={i} className="text-xs text-yellow-600 bg-yellow-500/10 p-2 rounded">
                    {warning}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Статистика */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Статистика маршрута
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 p-3 rounded">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                Расстояние
              </div>
              <div className="font-mono font-semibold text-lg">{testResult.stats.totalDistance} м</div>
            </div>
            <div className="bg-muted/50 p-3 rounded">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Расчётное время
              </div>
              <div className="font-mono font-semibold text-lg">
                {Math.floor(testResult.stats.estimatedTime / 60)}:{String(testResult.stats.estimatedTime % 60).padStart(2, '0')}
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Точек маршрута
              </div>
              <div className="font-mono font-semibold text-lg">{testResult.stats.waypointsCount}</div>
            </div>
            <div className="bg-muted/50 p-3 rounded">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Препятствий
              </div>
              <div className="font-mono font-semibold text-lg">{testResult.stats.obstaclesCount}</div>
            </div>
          </div>
        </div>

        {/* Сложность маршрута */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Сложность маршрута:</span>
            <span className={`font-semibold ${getComplexityColor(testResult.stats.routeComplexity)}`}>
              {getComplexityLabel(testResult.stats.routeComplexity)}
            </span>
          </div>
          <Progress value={testResult.stats.difficultyScore} className="h-2" />
          <div className="text-xs text-muted-foreground text-right">
            {testResult.stats.difficultyScore}%
          </div>
        </div>

        <Separator />

        {/* Рекомендации */}
        {testResult.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Рекомендации
            </h4>
            <ScrollArea className="h-[120px]">
              <div className="space-y-1">
                {testResult.recommendations.map((rec, i) => (
                  <div key={i} className="text-xs bg-blue-500/10 p-2 rounded">
                    {rec}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Separator />

        {/* Кнопки */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTestResult(null)} className="flex-1">
            Тестировать снова
          </Button>
          {testResult.valid && (
            <Button className="flex-1">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Сохранить сценарий
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
