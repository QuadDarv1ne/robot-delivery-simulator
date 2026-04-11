'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import {
  Plane,
  Ship,
  Radio,
  MapPin,
  Activity,
  BarChart3,
  Clock,
  Signal,
  TrendingUp
} from 'lucide-react'
import type { SDRContact, SDRStats } from './types'
import { useMap } from 'react-leaflet'

// Функция для расчета расстояния между двумя точками (формула гаверсинуса)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Радиус Земли в метрах
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Расстояние в метрах
}

// Dynamic imports for leaflet components
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
)
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)
const HeatmapLayer = dynamic(
  () => import('./heatmap-layer').then((mod) => mod.HeatmapLayer),
  { ssr: false }
)

// Маркеры для разных типов объектов
const getMarkerIcon = (type: 'ads-b' | 'ais' | 'aprs', rssi: number) => {
  const color = rssi > -30 ? '#22c55e' : rssi > -50 ? '#eab308' : '#ef4444'
  
  const icons = {
    'ads-b': `
      <div style="
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(59, 130, 246, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
        <div style="
          position: absolute;
          bottom: -8px;
          right: -8px;
          width: 16px;
          height: 16px;
          background: ${color};
          border-radius: 50%;
          border: 2px solid white;
        "></div>
      </div>
    `,
    'ais': `
      <div style="
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #06b6d4, #0891b2);
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(6, 182, 212, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.14.52-.05.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/>
        </svg>
        <div style="
          position: absolute;
          bottom: -8px;
          right: -8px;
          width: 16px;
          height: 16px;
          background: ${color};
          border-radius: 50%;
          border: 2px solid white;
        "></div>
      </div>
    `,
    'aprs': `
      <div style="
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(34, 197, 94, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
        <div style="
          position: absolute;
          bottom: -8px;
          right: -8px;
          width: 16px;
          height: 16px;
          background: ${color};
          border-radius: 50%;
          border: 2px solid white;
        "></div>
      </div>
    `
  }

  return L.divIcon({
    className: 'sdr-marker',
    html: icons[type],
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

// Компонент для отображения одного SDR-объекта
function SDRMarker({ contact }: { contact: SDRContact }) {
  const getLabel = () => {
    switch (contact.type) {
      case 'ads-b':
        return contact.callsign || contact.id
      case 'ais':
        return contact.name || contact.mmsi || contact.id
      case 'aprs':
        return contact.callsign || contact.id
    }
  }

  const getDetails = () => {
    switch (contact.type) {
      case 'ads-b':
        return `Высота: ${contact.altitude?.toFixed(0)}ft | Скорость: ${contact.speed?.toFixed(0)}kts | Курс: ${contact.heading?.toFixed(0)}°`
      case 'ais':
        return `Скорость: ${contact.speed?.toFixed(1)}kts | Курс: ${contact.heading?.toFixed(0)}°`
      case 'aprs':
        return contact.comment || 'APRS Beacon'
    }
  }

  const getRSSIColor = () => {
    if (contact.rssi > -30) return '#22c55e'
    if (contact.rssi > -50) return '#eab308'
    return '#ef4444'
  }

  const timeAgo = Math.floor((Date.now() - contact.timestamp) / 1000)

  return (
    <Marker position={[contact.lat, contact.lon]} icon={getMarkerIcon(contact.type, contact.rssi)}>
      <Popup>
        <div className="min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            {contact.type === 'ads-b' && <Plane className="w-4 h-4 text-blue-500" />}
            {contact.type === 'ais' && <Ship className="w-4 h-4 text-cyan-500" />}
            {contact.type === 'aprs' && <Radio className="w-4 h-4 text-green-500" />}
            <strong>{getLabel()}</strong>
            <Badge variant="secondary" className="text-xs">{contact.type.toUpperCase()}</Badge>
          </div>
          <div className="text-xs text-muted-foreground mb-2">{getDetails()}</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">RSSI:</span>
              <span style={{ color: getRSSIColor() }} className="font-mono">
                {contact.rssi.toFixed(1)} dBm
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Координаты:</span>
              <span className="font-mono">{contact.lat.toFixed(6)}, {contact.lon.toFixed(6)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Время:</span>
              <span>{timeAgo}s назад</span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// Компонент карты с SDR-объектами
function SDRCenterMarker({ center }: { center: [number, number] }) {
  const map = useMap()

  return null
}

// Основная карта с SDR данными
function SDRMap({
  contacts,
  showHeatmap = false,
  showPaths = true,
  contactHistory = {}
}: {
  contacts: SDRContact[]
  showHeatmap?: boolean
  showPaths?: boolean
  contactHistory?: Record<string, Array<{ lat: number; lon: number; timestamp: number }>>
}) {
  // Вычисляем центр карты
  const center: [number, number] = useMemo(() => {
    if (contacts.length === 0) return [55.7558, 37.6173] // Moscow center
    
    const avgLat = contacts.reduce((sum, c) => sum + c.lat, 0) / contacts.length
    const avgLon = contacts.reduce((sum, c) => sum + c.lon, 0) / contacts.length
    return [avgLat, avgLon]
  }, [contacts])

  // Конвертируем контакты в данные для heatmap
  const heatmapData = useMemo(() => {
    return contacts.map(c => ({
      lat: c.lat,
      lng: c.lon,
      intensity: Math.max(0, (c.rssi + 100) / 70) // Нормализуем RSSI в 0-1
    }))
  }, [contacts])

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <SDRCenterMarker center={center} />

      {/* Heatmap слой */}
      {showHeatmap && <HeatmapLayer points={heatmapData} />}

      {/* Маркеры объектов */}
      {contacts.map(contact => (
        <SDRMarker key={contact.id} contact={contact} />
      ))}

      {/* Круги RSSI для визуализации силы сигнала */}
      {contacts.map(contact => (
        <Circle
          key={`rssi-${contact.id}`}
          center={[contact.lat, contact.lon]}
          radius={Math.max(100, (contact.rssi + 100) * 50)}
          pathOptions={{
            color: contact.rssi > -30 ? '#22c55e' : contact.rssi > -50 ? '#eab308' : '#ef4444',
            fillColor: contact.rssi > -30 ? '#22c55e' : contact.rssi > -50 ? '#eab308' : '#ef4444',
            fillOpacity: 0.1,
            weight: 1,
            dashArray: '3, 3'
          }}
        />
      ))}

      {/* Линии пути перемещения объектов */}
      {showPaths && Object.entries(contactHistory).map(([id, positions]) => {
        if (positions.length < 2) return null
        
        const contact = contacts.find(c => c.id === id)
        if (!contact) return null

        const pathPositions = positions.map(p => [p.lat, p.lon] as [number, number])
        
        const getColor = () => {
          switch (contact.type) {
            case 'ads-b': return '#3b82f6'
            case 'ais': return '#06b6d4'
            case 'aprs': return '#22c55e'
          }
        }

        return (
          <Polyline
            key={`path-${id}`}
            positions={pathPositions}
            pathOptions={{
              color: getColor(),
              weight: 2,
              opacity: 0.6,
              dashArray: '5, 5'
            }}
          />
        )
      })}
    </MapContainer>
  )
}

// Компонент статистики SDR
function SDRStatsCard({ stats }: { stats: SDRStats | null }) {
  if (!stats) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Статистика обнаружений
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-blue-500" />
              <span className="text-sm">ADS-B</span>
            </div>
            <Badge variant="secondary">{stats.adsBCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-cyan-500" />
              <span className="text-sm">AIS</span>
            </div>
            <Badge variant="secondary">{stats.aisCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-green-500" />
              <span className="text-sm">APRS</span>
            </div>
            <Badge variant="secondary">{stats.aprsCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-sm">Всего</span>
            </div>
            <Badge>{stats.totalDetections}</Badge>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Signal className="w-4 h-4" />
              <span className="text-sm">Средний RSSI</span>
            </div>
            <span className="font-mono text-sm">{stats.averageRSSI.toFixed(1)} dBm</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Основная панель геоаналитики
export function GeoAnalyticsPanel({
  contacts,
  stats,
  contactHistory = {},
  robotPosition
}: {
  contacts: SDRContact[]
  stats: SDRStats | null
  contactHistory?: Record<string, Array<{ lat: number; lon: number; timestamp: number }>>
  robotPosition?: { lat: number; lon: number }
}) {
  const [view, setView] = useState<'map' | 'list'>('map')
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showPaths, setShowPaths] = useState(true)
  const [maxDistance, setMaxDistance] = useState<number | null>(null) // null = no filter

  // Фильтрация контактов по дальности
  const filteredContacts = useMemo(() => {
    if (!robotPosition || maxDistance === null) return contacts
    
    return contacts.filter(contact => {
      const distance = calculateDistance(
        robotPosition.lat,
        robotPosition.lon,
        contact.lat,
        contact.lon
      )
      return distance <= maxDistance
    })
  }, [contacts, robotPosition, maxDistance])

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Геоаналитика
              </CardTitle>
              <CardDescription>
                Визуализация обнаруженных объектов на карте
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {contacts.length} объектов
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={view} onValueChange={(v) => setView(v as 'map' | 'list')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="map">Карта</TabsTrigger>
              <TabsTrigger value="list">Список</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 mt-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="rounded"
              />
              Heatmap плотности
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showPaths}
                onChange={(e) => setShowPaths(e.target.checked)}
                className="rounded"
              />
              Линии пути
            </label>
          </div>

          {robotPosition && (
            <div className="mt-4 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Фильтр по дальности</span>
                <Badge variant="secondary">
                  {maxDistance ? `${(maxDistance / 1000).toFixed(1)} км` : 'Без фильтра'}
                </Badge>
              </div>
              <Slider
                value={[maxDistance || 50000]}
                min={1000}
                max={100000}
                step={1000}
                onValueChange={([value]) => setMaxDistance(value)}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>1 км</span>
                <span>100 км</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Показано: {filteredContacts.length} из {contacts.length} объектов
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Карта или список */}
      {view === 'map' ? (
        <Card>
          <CardContent className="p-0">
            <div className="h-[500px] rounded-lg overflow-hidden">
              <SDRMap contacts={filteredContacts} showHeatmap={showHeatmap} showPaths={showPaths} contactHistory={contactHistory} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredContacts.map(contact => (
                  <div key={contact.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    {contact.type === 'ads-b' && <Plane className="w-4 h-4 text-blue-500" />}
                    {contact.type === 'ais' && <Ship className="w-4 h-4 text-cyan-500" />}
                    {contact.type === 'aprs' && <Radio className="w-4 h-4 text-green-500" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm font-semibold">
                        {contact.type === 'ads-b' ? contact.callsign : contact.type === 'ais' ? contact.name : contact.callsign}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {contact.lat.toFixed(6)}, {contact.lon.toFixed(6)}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-mono">{contact.rssi.toFixed(1)} dBm</div>
                      <div className="text-muted-foreground">
                        {Math.floor((Date.now() - contact.timestamp) / 1000)}s
                      </div>
                    </div>
                  </div>
                ))}
                {filteredContacts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет обнаруженных объектов
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Статистика */}
      <SDRStatsCard stats={stats} />
    </div>
  )
}
