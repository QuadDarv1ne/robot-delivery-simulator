'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  scenarioTemplates,
  templateToScenarioData,
  type ScenarioTemplate
} from '@/lib/scenario-templates'
import {
  Search,
  X,
  Check,
  MapPin,
  Cloud,
  Car,
  Bot,
  Package,
  Clock,
  Navigation
} from 'lucide-react'

interface ScenarioTemplateSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: ScenarioTemplate) => void
}

export function ScenarioTemplateSelector({
  open,
  onOpenChange,
  onSelectTemplate
}: ScenarioTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<ScenarioTemplate | null>(null)

  // Фильтрация шаблонов
  const filteredTemplates = scenarioTemplates.filter(template => {
    const matchesSearch = searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === '' || template.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleSelect = (template: ScenarioTemplate) => {
    setSelectedTemplate(template)
  }

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate)
      onOpenChange(false)
      setSelectedTemplate(null)
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'urban': return '🏙️ Город'
      case 'park': return '🌳 Парк'
      case 'campus': return '🎓 Кампус'
      case 'warehouse': return '📦 Склад'
      case 'industrial': return '🏭 Промышленность'
      default: return category
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'hard': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Лёгкий'
      case 'medium': return 'Средний'
      case 'hard': return 'Сложный'
      default: return difficulty
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Шаблоны сценариев
          </DialogTitle>
          <DialogDescription>
            Выберите готовый шаблон для быстрого создания сценария
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Список шаблонов */}
          <div className="lg:col-span-2">
            {/* Поиск и фильтры */}
            <div className="space-y-2 mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию, описанию или тегам..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Все категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все категории</SelectItem>
                  <SelectItem value="urban">🏙️ Город</SelectItem>
                  <SelectItem value="park">🌳 Парк</SelectItem>
                  <SelectItem value="campus">🎓 Кампус</SelectItem>
                  <SelectItem value="warehouse">📦 Склад</SelectItem>
                  <SelectItem value="industrial">🏭 Промышленность</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Список шаблонов */}
            <ScrollArea className="h-[calc(100vh-350px)]">
              <div className="space-y-2">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Шаблоны не найдены</p>
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleSelect(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-3">
                            <span className="text-3xl">{template.icon}</span>
                            <div>
                              <h3 className="font-semibold text-base mb-1">{template.name}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {template.description}
                              </p>
                            </div>
                          </div>
                          {selectedTemplate?.id === template.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge className={getDifficultyColor(template.difficulty)}>
                            {getDifficultyLabel(template.difficulty)}
                          </Badge>
                          <Badge variant="outline">
                            {getCategoryLabel(template.category)}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <Navigation className="w-3 h-3" />
                            {template.distance}м
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.round(template.timeLimit / 60)} мин
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <Cloud className="w-3 h-3" />
                            {template.weather === 'sunny' ? '☀️' : template.weather === 'rainy' ? '🌧️' : '❄️'}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <Car className="w-3 h-3" />
                            {template.traffic === 'low' ? 'Низкий' : template.traffic === 'medium' ? 'Средний' : 'Высокий'}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <Bot className="w-3 h-3" />
                            {template.robotCount} {template.robotCount === 1 ? 'робот' : template.robotCount < 5 ? 'робота' : 'роботов'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Предпросмотр выбранного шаблона */}
          <div className="lg:col-span-1">
            {selectedTemplate ? (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">{selectedTemplate.icon}</span>
                      <div>
                        <h3 className="font-bold text-lg">{selectedTemplate.name}</h3>
                        <Badge className={getDifficultyColor(selectedTemplate.difficulty)}>
                          {getDifficultyLabel(selectedTemplate.difficulty)}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedTemplate.description}
                    </p>

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Маршрут:</div>
                          <div className="font-medium">
                            {selectedTemplate.startPoint.name} → {selectedTemplate.endPoint.name}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Navigation className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Расстояние:</div>
                          <div className="font-medium">{selectedTemplate.distance}м</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Лимит времени:</div>
                          <div className="font-medium">
                            {Math.floor(selectedTemplate.timeLimit / 60)}:{String(selectedTemplate.timeLimit % 60).padStart(2, '0')} мин
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Bot className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Роботы:</div>
                          <div className="font-medium">
                            {selectedTemplate.robotCount} × {selectedTemplate.robotType}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Грузоподъёмность:</div>
                          <div className="font-medium">{selectedTemplate.cargoCapacity} кг</div>
                        </div>
                      </div>

                      {selectedTemplate.cargoFragile && (
                        <Badge variant="destructive" className="w-full justify-center">
                          Хрупкий груз
                        </Badge>
                      )}
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Промежуточные точки ({selectedTemplate.waypoints.length}):</div>
                      <div className="space-y-1">
                        {selectedTemplate.waypoints.map((wp, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                            {wp.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Препятствия ({selectedTemplate.obstacles.length}):</div>
                      <div className="space-y-1">
                        {selectedTemplate.obstacles.map((obs) => (
                          <div key={obs.id} className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{obs.type === 'pedestrian' ? '🚶' : obs.type === 'vehicle' ? '🚗' : '🚧'}</span>
                            {obs.position.name}
                            <Badge variant="outline" className="text-xs ml-auto">
                              {obs.radius}м
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button className="w-full" onClick={handleConfirm}>
                  <Check className="w-4 h-4 mr-2" />
                  Использовать шаблон
                </Button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Выберите шаблон</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
