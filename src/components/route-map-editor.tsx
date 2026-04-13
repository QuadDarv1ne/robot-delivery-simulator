'use client'

import { useState, useCallback } from 'react'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MapPin,
  Plus,
  Trash2,
  Navigation,
  Save,
  X,
  Move
} from 'lucide-react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

// Динамический импорт Leaflet для SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Tooltip = dynamic(() => import('react-leaflet').then(mod => mod.Tooltip), { ssr: false })
const MapEvents = dynamic(() => import('react-leaflet').then(mod => {
  // Создаём компонент для обработки событий карты
  return function MapEventsComponent({ onClick }: { onClick: (e: any) => void }) {
    const map = mod.useMap()
    
    React.useEffect(() => {
      map.on('click', onClick)
      return () => {
        map.off('click', onClick)
      }
    }, [map, onClick])
    
    return null
  }
}), { ssr: false })

// Исправление иконок Leaflet для Next.js
import L from 'leaflet'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

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

interface RouteMapEditorProps {
  initialPoints?: Point[]
  initialObstacles?: Obstacle[]
  onSave: (points: Point[], obstacles: Obstacle[]) => void
  onCancel: () => void
}

const MOSCOW_CENTER: [number, number] = [55.7558, 37.6173]

export function RouteMapEditor({ 
  initialPoints = [], 
  initialObstacles = [],
  onSave, 
  onCancel 
}: RouteMapEditorProps) {
  const [waypoints, setWaypoints] = useState<Point[]>(initialPoints)
  const [obstacles, setObstacles] = useState<Obstacle[]>(initialObstacles)
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)
  const [editMode, setEditMode] = useState<'route' | 'obstacle'>('route')
  const [newObstacleType, setNewObstacleType] = useState<Obstacle['type']>('pedestrian')
  // Initialize as true only on client-side (prevents SSR mismatch)
  const [isClient] = useState(() => typeof window !== 'undefined')

  const handleMapClick = useCallback((e: any) => {
    const { lat, lng } = e.latlng
    
    if (editMode === 'route') {
      const newPoint: Point = {
        lat: parseFloat(lat.toFixed(6)),
        lon: parseFloat(lng.toFixed(6)),
        name: `Точка ${waypoints.length + 1}`
      }
      setWaypoints([...waypoints, newPoint])
    } else if (editMode === 'obstacle') {
      const newObstacle: Obstacle = {
        id: `obs-${Date.now()}`,
        type: newObstacleType,
        position: {
          lat: parseFloat(lat.toFixed(6)),
          lon: parseFloat(lng.toFixed(6)),
          name: `Препятствие ${obstacles.length + 1}`
        },
        radius: 2
      }
      setObstacles([...obstacles, newObstacle])
    }
  }, [editMode, waypoints, obstacles, newObstacleType])

  const handleUpdateWaypoint = (index: number, field: keyof Point, value: string | number) => {
    const updated = [...waypoints]
    updated[index] = {
      ...updated[index],
      [field]: field === 'lat' || field === 'lon' ? Number(value) : value
    }
    setWaypoints(updated)
  }

  const handleDeleteWaypoint = (index: number) => {
    const updated = waypoints.filter((_, i) => i !== index)
    const renamed = updated.map((point, i) => ({
      ...point,
      name: point.name.includes('Точка') ? `Точка ${i + 1}` : point.name
    }))
    setWaypoints(renamed)
    if (selectedPoint === index) setSelectedPoint(null)
  }

  const handleDeleteObstacle = (id: string) => {
    setObstacles(obstacles.filter(obs => obs.id !== id))
  }

  const handleUpdateObstacleRadius = (id: string, radius: number) => {
    setObstacles(obstacles.map(obs =>
      obs.id === id ? { ...obs, radius } : obs
    ))
  }

  const handleSave = () => {
    onSave(waypoints, obstacles)
  }

  const getObstacleIcon = (type: string) => {
    switch (type) {
      case 'pedestrian': return '🚶'
      case 'vehicle': return '🚗'
      case 'construction': return '🚧'
      default: return '⚠️'
    }
  }

  const getObstacleColor = (type: string) => {
    switch (type) {
      case 'pedestrian': return 'text-yellow-500'
      case 'vehicle': return 'text-blue-500'
      case 'construction': return 'text-orange-500'
      default: return 'text-gray-500'
    }
  }

  if (!isClient) {
    return <div className="h-[500px] flex items-center justify-center">Загрузка карты...</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Карта */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Карта маршрута
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={editMode === 'route' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEditMode('route')}
                  className="h-8"
                >
                  <Navigation className="w-3 h-3 mr-1" />
                  Маршрут
                </Button>
                <Button
                  variant={editMode === 'obstacle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEditMode('obstacle')}
                  className="h-8"
                >
                  <Move className="w-3 h-3 mr-1" />
                  Препятствия
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-[500px]">
              <MapContainer
                center={MOSCOW_CENTER}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <MapEvents onClick={handleMapClick} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                
                {/* Линии маршрута */}
                {waypoints.length > 1 && (
                  <Polyline
                    positions={waypoints.map(p => [p.lat, p.lon])}
                    color="#3b82f6"
                    weight={3}
                    opacity={0.8}
                  />
                )}

                {/* Маркеры точек маршрута */}
                {waypoints.map((point, index) => (
                  <Marker
                    key={`point-${index}`}
                    position={[point.lat, point.lon]}
                    draggable={true}
                    eventHandlers={{
                      click: (e) => {
                        L.DomEvent.stopPropagation(e)
                        setSelectedPoint(index)
                      },
                      dragend: (e) => {
                        const marker = e.target
                        const position = marker.getLatLng()
                        handleUpdateWaypoint(index, 'lat', parseFloat(position.lat.toFixed(6)))
                        handleUpdateWaypoint(index, 'lon', parseFloat(position.lng.toFixed(6)))
                      }
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]}>
                      <div className="text-sm">
                        <div className="font-semibold">{point.name}</div>
                        <div className="text-muted-foreground">
                          {point.lat.toFixed(6)}, {point.lon.toFixed(6)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          🖱️ Перетащите для перемещения
                        </div>
                        {index === 0 && <Badge className="text-xs mt-1">Старт</Badge>}
                        {index === waypoints.length - 1 && waypoints.length > 1 && (
                          <Badge className="text-xs mt-1 bg-green-500">Финиш</Badge>
                        )}
                      </div>
                    </Tooltip>
                    <Popup>
                      <div className="space-y-2">
                        <div className="font-semibold">{point.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Широта: {point.lat.toFixed(6)}<br />
                          Долгота: {point.lon.toFixed(6)}
                        </div>
                        {index === waypoints.length - 1 && waypoints.length > 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteWaypoint(index)}
                            className="w-full h-7"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Удалить точку
                          </Button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Маркеры препятствий */}
                {obstacles.map((obstacle) => (
                  <Marker
                    key={obstacle.id}
                    position={[obstacle.position.lat, obstacle.position.lon]}
                    eventHandlers={{
                      click: (e) => {
                        L.DomEvent.stopPropagation(e)
                        handleDeleteObstacle(obstacle.id)
                      }
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]}>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <span>{getObstacleIcon(obstacle.type)}</span>
                          <span className={getObstacleColor(obstacle.type)}>
                            {obstacle.type === 'pedestrian' ? 'Пешеход' :
                             obstacle.type === 'vehicle' ? 'Транспорт' : 'Строительство'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Клик для удаления
                        </div>
                      </div>
                    </Tooltip>
                  </Marker>
                ))}

                {/* Зоны препятствий (круги радиуса) */}
                {obstacles.map((obstacle) => {
                  const getZoneColor = (type: string) => {
                    switch (type) {
                      case 'pedestrian': return '#eab308'
                      case 'vehicle': return '#3b82f6'
                      case 'construction': return '#f97316'
                      default: return '#6b7280'
                    }
                  }

                  return (
                    <Circle
                      key={`zone-${obstacle.id}`}
                      center={[obstacle.position.lat, obstacle.position.lon]}
                      radius={obstacle.radius}
                      pathOptions={{
                        color: getZoneColor(obstacle.type),
                        fillColor: getZoneColor(obstacle.type),
                        fillOpacity: 0.2,
                        weight: 2,
                        dashArray: '5, 5'
                      }}
                    >
                      <Tooltip direction="top">
                        <div className="text-xs">
                          <div className="font-semibold">Зона: {
                            obstacle.type === 'pedestrian' ? 'Пешеход' :
                            obstacle.type === 'vehicle' ? 'Транспорт' : 'Строительство'
                          }</div>
                          <div>Радиус: {obstacle.radius}м</div>
                        </div>
                      </Tooltip>
                    </Circle>
                  )
                })}
              </MapContainer>

              {/* Подсказка режима */}
              <div className="absolute top-2 right-2 z-[1000]">
                <Card className="p-2 bg-background/95 backdrop-blur">
                  <p className="text-xs text-muted-foreground">
                    {editMode === 'route' 
                      ? 'Кликните на карту для добавления точки маршрута'
                      : 'Кликните на карту для добавления препятствия'}
                  </p>
                  {editMode === 'obstacle' && (
                    <div className="mt-2 flex gap-1">
                      <Button
                        variant={newObstacleType === 'pedestrian' ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setNewObstacleType('pedestrian')}
                      >
                        🚶 Пешеход
                      </Button>
                      <Button
                        variant={newObstacleType === 'vehicle' ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setNewObstacleType('vehicle')}
                      >
                        🚗 Транспорт
                      </Button>
                      <Button
                        variant={newObstacleType === 'construction' ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setNewObstacleType('construction')}
                      >
                        🚧 Стройка
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Панель управления */}
      <div className="space-y-4">
        {/* Статистика маршрута */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Статистика</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Точек маршрута:</span>
              <Badge variant="outline">{waypoints.length}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Препятствий:</span>
              <Badge variant="outline">{obstacles.length}</Badge>
            </div>
            {waypoints.length > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Расстояние:</span>
                <Badge variant="secondary">
                  ~{Math.round(
                    waypoints.reduce((acc, point, i) => {
                      if (i === 0) return 0
                      const prev = waypoints[i - 1]
                      const R = 6371000
                      const dLat = (point.lat - prev.lat) * Math.PI / 180
                      const dLon = (point.lon - prev.lon) * Math.PI / 180
                      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                Math.cos(prev.lat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
                                Math.sin(dLon / 2) * Math.sin(dLon / 2)
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                      return acc + R * c
                    }, 0)
                  )} м
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Список точек маршрута */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Точки маршрута</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {waypoints.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    Кликните на карту для добавления точек
                  </p>
                ) : (
                  waypoints.map((point, index) => (
                    <Card key={index} className={`p-2 ${selectedPoint === index ? 'border-primary' : ''}`}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {index === 0 ? 'Старт' : index === waypoints.length - 1 ? 'Финиш' : `#${index + 1}`}
                        </Badge>
                        <Input
                          value={point.name}
                          onChange={(e) => handleUpdateWaypoint(index, 'name', e.target.value)}
                          className="h-7 flex-1 text-xs"
                          placeholder="Название"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteWaypoint(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {point.lat.toFixed(6)}, {point.lon.toFixed(6)}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Список препятствий */}
        {obstacles.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Препятствия</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {obstacles.map((obstacle) => (
                    <Card key={obstacle.id} className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getObstacleIcon(obstacle.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-medium ${getObstacleColor(obstacle.type)}`}>
                            {obstacle.type === 'pedestrian' ? 'Пешеход' :
                             obstacle.type === 'vehicle' ? 'Транспорт' : 'Строительство'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {obstacle.position.lat.toFixed(6)}, {obstacle.position.lon.toFixed(6)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Label className="text-xs text-muted-foreground shrink-0">Радиус:</Label>
                            <Input
                              type="number"
                              value={obstacle.radius}
                              onChange={(e) => handleUpdateObstacleRadius(obstacle.id, parseInt(e.target.value) || 1)}
                              className="h-6 w-16 text-xs"
                              min="1"
                              max="50"
                            />
                            <span className="text-xs text-muted-foreground">м</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteObstacle(obstacle.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Кнопки действий */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            <X className="w-4 h-4 mr-1" />
            Отмена
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  )
}
