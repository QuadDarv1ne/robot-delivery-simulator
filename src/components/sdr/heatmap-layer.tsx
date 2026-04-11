'use client'

import { useEffect, useRef } from 'react'
import { useLeafletContext } from '@react-leaflet/core'
import 'leaflet.heat'

interface HeatmapPoint {
  lat: number
  lng: number
  intensity: number
}

interface HeatmapLayerProps {
  points: HeatmapPoint[]
  radius?: number
  blur?: number
  maxZoom?: number
  max?: number
  gradient?: Record<number, string>
}

export function HeatmapLayer({
  points,
  radius = 25,
  blur = 15,
  maxZoom = 18,
  max = 1.0,
  gradient = {
    0.0: 'blue',
    0.3: 'cyan',
    0.5: 'lime',
    0.7: 'yellow',
    1.0: 'red'
  }
}: HeatmapLayerProps) {
  const context = useLeafletContext()
  const layerRef = useRef<any>(null)

  useEffect(() => {
    if (!context || !points.length) return

    const map = context.map
    if (!map) return

    // Создаем heatmap слой
    if (!layerRef.current) {
      // @ts-ignore - leaflet.heat types may not be available
      layerRef.current = (window as any).L.heatLayer([], {
        radius,
        blur,
        max,
        maxZoom,
        gradient
      }).addTo(map)
    }

    // Обновляем данные
    const heatData = points.map(p => [p.lat, p.lng, p.intensity])
    layerRef.current.setLatLngs(heatData)

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [context, points, radius, blur, max, maxZoom, gradient])

  return null
}
