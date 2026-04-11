import { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { SDRData, SDRContact } from '@/components/sdr/types'

// Функция для расчета расстояния между двумя точками
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

interface UseSDRForNavigationProps {
  robotPosition: { lat: number; lon: number } | null
  enabled?: boolean
}

interface SDRNavigationAlert {
  contact: SDRContact
  distance: number
  bearing: number
  riskLevel: 'low' | 'medium' | 'high'
  eta?: number // Estimated time of closest approach
}

export function useSDRForNavigation({ robotPosition, enabled = true }: UseSDRForNavigationProps) {
  const [sdrData, setSDRData] = useState<SDRData | null>(null)
  const [alerts, setAlerts] = useState<SDRNavigationAlert[]>([])
  const socketRef = useRef<Socket | null>(null)

  // Расчет пеленга от робота к цели
  const calculateBearing = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180)
    const x =
      Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon)
    let bearing = (Math.atan2(y, x) * 180) / Math.PI
    bearing = (bearing + 360) % 360
    return bearing
  }, [])

  // Оценка уровня риска на основе расстояния и типа объекта
  const assessRisk = useCallback((contact: SDRContact, distance: number): 'low' | 'medium' | 'high' => {
    // ADS-B самолеты на низкой высоте - высокий риск
    if (contact.type === 'ads-b' && contact.altitude && contact.altitude < 3000) {
      if (distance < 5000) return 'high'
      if (distance < 15000) return 'medium'
    }

    // AIS суда - средний риск на близких расстояниях
    if (contact.type === 'ais') {
      if (distance < 1000) return 'high'
      if (distance < 5000) return 'medium'
    }

    // APRS маяки - обычно низкий риск
    if (contact.type === 'aprs') {
      if (distance < 500) return 'medium'
    }

    return 'low'
  }, [])

  // Подключение к SDR данным
  useEffect(() => {
    if (!enabled) return

    const socket = io('http://localhost:3003', {
      path: '/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socketRef.current = socket

    socket.on('sdr-data', (data: SDRData) => {
      setSDRData(data)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled])

  // Анализ SDR-данных для навигации
  useEffect(() => {
    if (!sdrData || !robotPosition || !enabled) {
      setAlerts([])
      return
    }

    const newAlerts: SDRNavigationAlert[] = []

    sdrData.contacts.forEach(contact => {
      const distance = calculateDistance(
        robotPosition.lat,
        robotPosition.lon,
        contact.lat,
        contact.lon
      )

      const bearing = calculateBearing(
        robotPosition.lat,
        robotPosition.lon,
        contact.lat,
        contact.lon
      )

      const riskLevel = assessRisk(contact, distance)

      // Создаем алерт для объектов среднего или высокого риска
      if (riskLevel === 'medium' || riskLevel === 'high') {
        newAlerts.push({
          contact,
          distance,
          bearing,
          riskLevel
        })
      }
    })

    // Сортируем по расстоянию (ближайшие первыми)
    newAlerts.sort((a, b) => a.distance - b.distance)

    setAlerts(newAlerts)
  }, [sdrData, robotPosition, enabled, calculateBearing, assessRisk])

  // Получение ближайшего объекта определенного типа
  const getNearestContact = useCallback((type?: 'ads-b' | 'ais' | 'aprs'): SDRContact | null => {
    if (!sdrData || !robotPosition) return null

    const filtered = type ? sdrData.contacts.filter(c => c.type === type) : sdrData.contacts

    if (filtered.length === 0) return null

    return filtered.reduce((nearest, contact) => {
      const distanceToContact = calculateDistance(
        robotPosition.lat,
        robotPosition.lon,
        contact.lat,
        contact.lon
      )

      const distanceToNearest = calculateDistance(
        robotPosition.lat,
        robotPosition.lon,
        nearest.lat,
        nearest.lon
      )

      return distanceToContact < distanceToNearest ? contact : nearest
    })
  }, [sdrData, robotPosition])

  // Получение всех объектов в радиусе
  const getContactsInRadius = useCallback((radiusMeters: number): SDRContact[] => {
    if (!sdrData || !robotPosition) return []

    return sdrData.contacts.filter(contact => {
      const distance = calculateDistance(
        robotPosition.lat,
        robotPosition.lon,
        contact.lat,
        contact.lon
      )
      return distance <= radiusMeters
    })
  }, [sdrData, robotPosition])

  // Проверка наличия препятствий на маршруте
  const checkPathClearance = useCallback((
    targetLat: number,
    targetLon: number,
    safetyRadius: number = 5000
  ): boolean => {
    if (!sdrData || !robotPosition) return true

    // Проверяем, есть ли объекты на пути от робота к цели
    const dx = targetLat - robotPosition.lat
    const dy = targetLon - robotPosition.lon
    const totalDistance = Math.sqrt(dx * dx + dy * dy)

    for (const contact of sdrData.contacts) {
      // Проверяем расстояние от контакта до линии пути
      const toContactX = contact.lat - robotPosition.lat
      const toContactY = contact.lon - robotPosition.lon

      // Проекция контакта на линию пути
      const projection = ((toContactX * dx + toContactY * dy) / (totalDistance * totalDistance))
      const clampedProjection = Math.max(0, Math.min(1, projection))

      // Ближайшая точка на пути к контакту
      const closestLat = robotPosition.lat + clampedProjection * dx
      const closestLon = robotPosition.lon + clampedProjection * dy

      const distanceToPath = calculateDistance(
        contact.lat,
        contact.lon,
        closestLat,
        closestLon
      )

      if (distanceToPath < safetyRadius) {
        return false // Путь не безопасен
      }
    }

    return true // Путь безопасен
  }, [sdrData, robotPosition])

  return {
    sdrData,
    alerts,
    getNearestContact,
    getContactsInRadius,
    checkPathClearance,
    // Удобные методы для API алгоритмов
    api: {
      getNearestADSB: () => getNearestContact('ads-b'),
      getNearestAIS: () => getNearestContact('ais'),
      getNearestAPRS: () => getNearestContact('aprs'),
      isPathClear: checkPathClearance,
      getNearbyObjects: getContactsInRadius,
      getAlerts: () => alerts
    }
  }
}
