import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { handleApiError, createErrorResponse, successResponse } from '@/lib/api-error'

const scenarioTestSchema = z.object({
  startPoint: z.string(),
  endPoint: z.string(),
  waypoints: z.string().default('[]'),
  obstacles: z.string().default('[]'),
  distance: z.number().min(10).max(10000),
  timeLimit: z.number().min(30).max(3600),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  weather: z.enum(['sunny', 'rainy', 'snowy']),
  traffic: z.enum(['low', 'medium', 'high'])
})

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

function calculateRouteDistance(points: Array<{lat: number, lon: number}>): number {
  if (points.length < 2) return 0
  
  let totalDistance = 0
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const R = 6371000
    const dLat = (curr.lat - prev.lat) * Math.PI / 180
    const dLon = (curr.lon - prev.lon) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    totalDistance += R * c
  }
  return Math.round(totalDistance)
}

function estimateTime(distance: number, difficulty: string, weather: string, traffic: string): number {
  let baseSpeed = 2 // m/s
  
  if (difficulty === 'medium') baseSpeed *= 0.9
  if (difficulty === 'hard') baseSpeed *= 0.8
  
  if (weather === 'rainy') baseSpeed *= 0.8
  if (weather === 'snowy') baseSpeed *= 0.7
  
  if (traffic === 'medium') baseSpeed *= 0.9
  if (traffic === 'high') baseSpeed *= 0.75
  
  const timeSeconds = distance / baseSpeed
  return Math.round(timeSeconds)
}

function analyzeRouteComplexity(waypoints: number, obstacles: number, difficulty: string): 'low' | 'medium' | 'high' {
  let score = waypoints * 2 + obstacles * 3
  
  if (difficulty === 'medium') score += 5
  if (difficulty === 'hard') score += 10
  
  if (score < 10) return 'low'
  if (score < 25) return 'medium'
  return 'high'
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse({
        message: 'Требуется авторизация',
        status: 401
      })
    }

    const body = await request.json()
    const validationResult = scenarioTestSchema.safeParse(body)

    if (!validationResult.success) {
      return createErrorResponse({
        message: 'Ошибка валидации',
        status: 400,
        details: validationResult.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      })
    }

    const data = validationResult.data

    let startPoint, endPoint, waypoints, obstacles
    try {
      startPoint = JSON.parse(data.startPoint)
      endPoint = JSON.parse(data.endPoint)
      waypoints = JSON.parse(data.waypoints)
      obstacles = JSON.parse(data.obstacles)
    } catch (error) {
      return createErrorResponse({
        message: 'Ошибка парсинга JSON данных',
        status: 400
      })
    }

    const warnings: string[] = []
    const errors: string[] = []
    const recommendations: string[] = []

    if (!startPoint.lat || !startPoint.lon) {
      errors.push('Не указана стартовая точка')
    }
    if (!endPoint.lat || !endPoint.lon) {
      errors.push('Не указана конечная точка')
    }

    const allPoints = [startPoint, ...waypoints, endPoint]
    const totalDistance = calculateRouteDistance(allPoints.filter(p => p.lat && p.lon))
    
    const distanceDiff = Math.abs(totalDistance - data.distance)
    if (distanceDiff > data.distance * 0.2) {
      warnings.push(`Расчётное расстояние (${totalDistance}м) отличается от указанного (${data.distance}м)`)
    }

    const estimatedTime = estimateTime(totalDistance || data.distance, data.difficulty, data.weather, data.traffic)
    
    if (estimatedTime > data.timeLimit) {
      warnings.push(`Расчётное время (${Math.round(estimatedTime / 60)} мин) превышает лимит (${Math.round(data.timeLimit / 60)} мин)`)
      recommendations.push('Увеличьте лимит времени или уменьшите расстояние')
    }

    if (obstacles.length > 0 && data.difficulty === 'easy') {
      warnings.push('Лёгкий уровень не должен содержать препятствия')
      recommendations.push('Установите сложность "Средний" или "Сложный" для сценариев с препятствиями')
    }

    if (obstacles.length > 10) {
      warnings.push('Большое количество препятствий может замедлить симуляцию')
    }

    if (waypoints.length === 0) {
      recommendations.push('Добавьте промежуточные точки для более интересного маршрута')
    }

    if (waypoints.length > 20) {
      warnings.push('Большое количество точек может усложнить навигацию')
    }

    if (data.weather === 'snowy' && data.traffic === 'high') {
      recommendations.push('Снег и высокий трафик создают экстремальные условия')
    }

    const difficultyScore = (
      (data.difficulty === 'easy' ? 1 : data.difficulty === 'medium' ? 2 : 3) +
      (data.weather === 'sunny' ? 1 : data.weather === 'rainy' ? 2 : 3) +
      (data.traffic === 'low' ? 1 : data.traffic === 'medium' ? 2 : 3) +
      Math.min(obstacles.length / 3, 3)
    ) / 12 * 100

    const routeComplexity = analyzeRouteComplexity(waypoints.length, obstacles.length, data.difficulty)

    if (totalDistance < 100) {
      recommendations.push('Маршрут очень короткий. Рекомендуется минимум 100м для полноценного тестирования')
    }

    if (data.timeLimit < 60) {
      recommendations.push('Лимит времени очень маленький. Рекомендуется минимум 60 секунд')
    }

    if (errors.length === 0 && warnings.length === 0) {
      recommendations.push('Сценарий выглядит корректно и готов к использованию')
    }

    const result: TestResult = {
      valid: errors.length === 0,
      warnings,
      errors,
      stats: {
        totalDistance: totalDistance || data.distance,
        estimatedTime,
        waypointsCount: waypoints.length,
        obstaclesCount: obstacles.length,
        difficultyScore: Math.round(difficultyScore),
        routeComplexity
      },
      recommendations
    }

    return successResponse(result)
  } catch (error) {
    return handleApiError(error, 'POST /api/scenarios/test')
  }
}
