'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Plane,
  Ship,
  Radio,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Navigation,
  MapPin,
  X
} from 'lucide-react'
import type { SDRContact } from '@/components/sdr/types'
import { useSDRForNavigation } from '@/hooks/use-sdr-navigation'

interface SDRNavigationPanelProps {
  robotPosition: { lat: number; lon: number } | null
}

export function SDRNavigationPanel({ robotPosition }: SDRNavigationPanelProps) {
  const {
    alerts,
    getNearestContact,
    getContactsInRadius,
    checkPathClearance,
    api
  } = useSDRForNavigation({ robotPosition })

  const getRiskIcon = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'high':
        return <ShieldAlert className="w-4 h-4 text-red-500" />
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'low':
        return <ShieldCheck className="w-4 h-4 text-green-500" />
    }
  }

  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'high':
        return 'text-red-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-green-500'
    }
  }

  const getContactIcon = (type: 'ads-b' | 'ais' | 'aprs') => {
    switch (type) {
      case 'ads-b':
        return <Plane className="w-4 h-4 text-blue-500" />
      case 'ais':
        return <Ship className="w-4 h-4 text-cyan-500" />
      case 'aprs':
        return <Radio className="w-4 h-4 text-green-500" />
    }
  }

  const getContactName = (contact: SDRContact) => {
    switch (contact.type) {
      case 'ads-b':
        return contact.callsign || 'Неизвестный'
      case 'ais':
        return contact.name || contact.mmsi || 'Неизвестный'
      case 'aprs':
        return contact.callsign || 'Неизвестный'
    }
  }

  const handleCheckNearby = () => {
    const nearby = getContactsInRadius(10000) // 10 км
    console.log('[SDR] Nearby objects:', nearby)
  }

  const handleCheckPath = () => {
    if (!robotPosition) return
    // Проверяем путь на 1 км вперед
    const isClear = checkPathClearance(robotPosition.lat + 0.01, robotPosition.lon + 0.01)
    console.log('[SDR] Path clearance:', isClear ? 'Clear' : 'Obstructed')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Navigation className="w-4 h-4" />
              SDR Навигация
            </CardTitle>
            <CardDescription className="text-xs">
              Анализ окружающей обстановки
            </CardDescription>
          </div>
          <Badge variant={alerts.length > 0 ? 'destructive' : 'secondary'}>
            {alerts.length} тревог
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Быстрые действия */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckNearby}
            className="text-xs"
          >
            <MapPin className="w-3 h-3 mr-1" />
            Ближайшие
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckPath}
            className="text-xs"
          >
            <Shield className="w-3 h-3 mr-1" />
            Проверить путь
          </Button>
        </div>

        {/* Ближайшие объекты по типам */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Ближайшие объекты:</div>
          <div className="grid grid-cols-3 gap-2">
            {(() => {
              const nearestADS_B = api.getNearestADSB()
              return (
                <div className="bg-muted/30 p-2 rounded text-center">
                  <Plane className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <div className="text-xs font-mono">
                    {nearestADS_B ? `${nearestADS_B.callsign || '???'}` : '—'}
                  </div>
                </div>
              )
            })()}
            {(() => {
              const nearestAIS = api.getNearestAIS()
              return (
                <div className="bg-muted/30 p-2 rounded text-center">
                  <Ship className="w-4 h-4 mx-auto mb-1 text-cyan-500" />
                  <div className="text-xs font-mono">
                    {nearestAIS ? `${nearestAIS.name || '???'}` : '—'}
                  </div>
                </div>
              )
            })()}
            {(() => {
              const nearestAPRS = api.getNearestAPRS()
              return (
                <div className="bg-muted/30 p-2 rounded text-center">
                  <Radio className="w-4 h-4 mx-auto mb-1 text-green-500" />
                  <div className="text-xs font-mono">
                    {nearestAPRS ? `${nearestAPRS.callsign || '???'}` : '—'}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Предупреждения */}
        {alerts.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Предупреждения:</div>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {alerts.slice(0, 5).map((alert, index) => (
                  <Alert key={`${alert.contact.id}-${index}`} variant={alert.riskLevel === 'high' ? 'destructive' : 'default'}>
                    <div className="flex items-start gap-2">
                      {getRiskIcon(alert.riskLevel)}
                      <div className="flex-1">
                        <AlertTitle className="text-xs font-semibold">
                          {getContactName(alert.contact)}
                        </AlertTitle>
                        <AlertDescription className="text-xs">
                          <div className="flex items-center justify-between mt-1">
                            <span>Дистанция: {(alert.distance / 1000).toFixed(1)} км</span>
                            <span>Пеленг: {alert.bearing.toFixed(0)}°</span>
                          </div>
                          <div className={`text-xs ${getRiskColor(alert.riskLevel)} mt-1`}>
                            Риск: {alert.riskLevel.toUpperCase()}
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Статус безопасности */}
        <div className="p-3 rounded-lg bg-muted/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Общий статус:</span>
            {alerts.length === 0 ? (
              <span className="text-green-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Безопасно
              </span>
            ) : alerts.some(a => a.riskLevel === 'high') ? (
              <span className="text-red-500 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Опасность
              </span>
            ) : (
              <span className="text-yellow-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Внимание
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
