'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Bot,
  Play,
  Pause,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  Battery,
  Navigation,
  Activity,
  Layers
} from 'lucide-react'
import { useMultiRobotSimulator } from '@/hooks/use-multi-robot-simulator'
import type { RobotState } from '@/types/multi-robot'

interface MultiRobotPanelProps {
  scenarioId?: string
}

export function MultiRobotPanel({ scenarioId }: MultiRobotPanelProps) {
  const {
    robots,
    session,
    isConnected,
    startSession,
    stopSession,
    pauseRobot,
    resumeRobot,
  } = useMultiRobotSimulator()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newRobot, setNewRobot] = useState({
    name: '',
    color: '#3b82f6',
    lat: 55.7558,
    lon: 37.6173
  })
  const [robotConfigs, setRobotConfigs] = useState<Array<{
    id: string
    name: string
    color: string
    startPosition: { lat: number; lon: number }
  }>>([])

  const handleAddRobot = () => {
    if (!newRobot.name.trim()) return

    const config = {
      id: `robot-${Date.now()}`,
      name: newRobot.name,
      color: newRobot.color,
      startPosition: {
        lat: newRobot.lat,
        lon: newRobot.lon
      }
    }

    setRobotConfigs([...robotConfigs, config])
    setShowAddDialog(false)
    setNewRobot({ name: '', color: '#3b82f6', lat: 55.7558, lon: 37.6173 })
  }

  const handleRemoveRobot = (id: string) => {
    setRobotConfigs(robotConfigs.filter(config => config.id !== id))
  }

  const handleStartSession = () => {
    if (!scenarioId) {
      return
    }
    if (robotConfigs.length === 0) {
      return
    }
    startSession(scenarioId, robotConfigs)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-gray-500'
      case 'moving': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      case 'charging': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'idle': return 'Ожидание'
      case 'moving': return 'Движение'
      case 'paused': return 'Пауза'
      case 'error': return 'Ошибка'
      case 'charging': return 'Зарядка'
      default: return status
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">
            Подключение к серверу мульти-роботной симуляции...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Мульти-роботная симуляция
            </CardTitle>
            <CardDescription>
              Настройте и запустите симуляцию с несколькими роботами
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Список роботов */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Роботы для симуляции ({robotConfigs.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Добавить
                </Button>
              </div>

              {robotConfigs.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Добавьте роботов для начала симуляции
                </div>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {robotConfigs.map((config) => (
                      <Card key={config.id} className="p-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-background"
                            style={{ backgroundColor: config.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{config.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {config.startPosition.lat.toFixed(4)}, {config.startPosition.lon.toFixed(4)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleRemoveRobot(config.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <Separator />

            {/* Кнопка запуска */}
            <Button
              className="w-full"
              onClick={handleStartSession}
              disabled={robotConfigs.length === 0 || !scenarioId}
            >
              <Play className="w-4 h-4 mr-2" />
              Запустить симуляцию
            </Button>
          </CardContent>
        </Card>

        {/* Диалог добавления робота */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить робота</DialogTitle>
              <DialogDescription>
                Настройте параметры нового робота
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input
                  value={newRobot.name}
                  onChange={(e) => setNewRobot({ ...newRobot, name: e.target.value })}
                  placeholder="Робот 1"
                />
              </div>

              <div className="space-y-2">
                <Label>Цвет</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newRobot.color}
                    onChange={(e) => setNewRobot({ ...newRobot, color: e.target.value })}
                    className="w-16 h-9"
                  />
                  <Input
                    value={newRobot.color}
                    onChange={(e) => setNewRobot({ ...newRobot, color: e.target.value })}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Широта</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={newRobot.lat}
                    onChange={(e) => setNewRobot({ ...newRobot, lat: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Долгота</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={newRobot.lon}
                    onChange={(e) => setNewRobot({ ...newRobot, lon: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleAddRobot}>
                Добавить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Активная сессия
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Активная сессия
            </CardTitle>
            <Badge variant={session.status === 'in_progress' ? 'default' : 'secondary'}>
              {Math.round(session.progress)}%
            </Badge>
          </div>
          <CardDescription>
            Роботов: {robots.length} | Статус: {session.status}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={session.progress} className="h-2 mb-4" />

          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={stopSession}
              className="flex-1"
            >
              <Square className="w-4 h-4 mr-1" />
              Остановить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Список роботов */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {robots.map((robot) => (
            <Card key={robot.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center"
                    style={{ backgroundColor: robot.color }}
                  >
                    <Bot className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">{robot.name}</span>
                      <Badge className={getStatusColor(robot.status)}>
                        {getStatusLabel(robot.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Battery className="w-3 h-3" />
                        {robot.battery.toFixed(1)}%
                      </div>
                      <div className="flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {robot.speed.toFixed(1)} м/с
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Прогресс: {robot.progress}%
                      </div>
                      <div className="flex items-center gap-1">
                        📍 {robot.position.lat.toFixed(4)}, {robot.position.lon.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex gap-2">
                  {robot.status === 'moving' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pauseRobot(robot.id)}
                      className="flex-1"
                    >
                      <Pause className="w-3 h-3 mr-1" />
                      Пауза
                    </Button>
                  ) : robot.status === 'paused' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resumeRobot(robot.id)}
                      className="flex-1"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Продолжить
                    </Button>
                  ) : null}

                  <Button variant="outline" size="sm" className="flex-1">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Сброс
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
