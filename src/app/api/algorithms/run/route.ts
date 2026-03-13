import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { algorithmRunSchema } from '@/lib/validators'

interface SimulationResult {
  success: boolean
  distanceTraveled: number
  timeElapsed: number
  collisions: number
  pathEfficiency: number
  logs: string[]
  batteryUsed: number
  averageSpeed: number
  error?: string
}

// Simulate algorithm execution
function simulateAlgorithm(code: string): SimulationResult {
  const logs: string[] = []
  let success = true
  let distanceTraveled = 0
  let timeElapsed = 0
  let collisions = 0
  let pathEfficiency = 100
  let batteryUsed = 0
  let averageSpeed = 0

  try {
    logs.push('🚀 Инициализация алгоритма...')

    // Check for common algorithm patterns
    const hasObstacleDetection = code.includes('obstacle') || code.includes('detect') || code.includes('sensor') || code.includes('lidar')
    const hasPathPlanning = code.includes('path') || code.includes('route') || code.includes('navigate') || code.includes('destination')
    const hasSpeedControl = code.includes('speed') || code.includes('velocity') || code.includes('move')
    const hasEmergencyStop = code.includes('stop') || code.includes('emergency') || code.includes('brake')
    const hasGPS = code.includes('gps') || code.includes('position') || code.includes('location')
    const hasIMU = code.includes('imu') || code.includes('gyro') || code.includes('acceleration')
    const hasLoop = code.includes('while') || code.includes('for') || code.includes('loop')
    const hasFunction = code.includes('def ') || code.includes('function') || code.includes('async')

    logs.push('📊 Анализ кода алгоритма...')

    // Score based on algorithm completeness
    let codeQuality = 0

    if (hasObstacleDetection) {
      logs.push('✅ Обнаружена логика избегания препятствий')
      collisions = Math.floor(Math.random() * 2)
      codeQuality += 15
    } else {
      logs.push('⚠️ Логика избегания препятствий не найдена')
      collisions = Math.floor(Math.random() * 5) + 2
    }

    if (hasPathPlanning) {
      logs.push('✅ Обнаружена логика планирования пути')
      pathEfficiency = 85 + Math.random() * 15
      codeQuality += 15
    } else {
      logs.push('⚠️ Логика планирования пути не найдена')
      pathEfficiency = 50 + Math.random() * 30
    }

    if (hasSpeedControl) {
      logs.push('✅ Обнаружена логика контроля скорости')
      timeElapsed = 120 + Math.floor(Math.random() * 60)
      averageSpeed = 0.4 + Math.random() * 0.2
      codeQuality += 10
    } else {
      logs.push('⚠️ Логика контроля скорости не найдена')
      timeElapsed = 180 + Math.floor(Math.random() * 120)
      averageSpeed = 0.2 + Math.random() * 0.2
    }

    if (hasEmergencyStop) {
      logs.push('✅ Обнаружена логика экстренной остановки')
      codeQuality += 10
    } else {
      logs.push('⚠️ Логика экстренной остановки не найдена')
      if (Math.random() > 0.7) {
        collisions += 1
      }
    }

    if (hasGPS) {
      logs.push('✅ Используется GPS навигация')
      codeQuality += 10
    }

    if (hasIMU) {
      logs.push('✅ Используется IMU сенсор')
      codeQuality += 5
    }

    if (hasLoop) {
      logs.push('✅ Обнаружен основной цикл')
      codeQuality += 10
    }

    if (hasFunction) {
      logs.push('✅ Обнаружены функции')
      codeQuality += 5
    }

    // Simulate execution
    logs.push('🤖 Запуск симуляции...')

    // Calculate results
    distanceTraveled = Math.floor(500 + Math.random() * 500)
    
    // Battery calculation based on distance and collisions
    batteryUsed = Math.round((distanceTraveled / 100) * 2 + collisions * 5)
    
    // Adjust based on code quality
    if (code.length < 100) {
      logs.push('⚠️ Алгоритм слишком короткий')
      success = false
      codeQuality -= 20
    } else if (code.length > 5000) {
      logs.push('⚠️ Алгоритм слишком длинный, возможны проблемы производительности')
    }

    // Check for syntax-like patterns
    const syntaxErrors = ['import os', 'import sys', 'exec(', 'eval(', 'subprocess']
    for (const pattern of syntaxErrors) {
      if (code.includes(pattern)) {
        logs.push(`❌ Обнаружен запрещённый код: ${pattern}`)
        success = false
      }
    }

    if (collisions > 3) {
      success = false
      logs.push('❌ Слишком много столкновений')
    }

    // Final efficiency based on quality
    pathEfficiency = Math.min(100, pathEfficiency + (codeQuality / 10))

    logs.push('🏁 Финиш!')
    logs.push(success ? '✅ Симуляция завершена успешно!' : '❌ Симуляция завершилась с ошибками')
    logs.push(`📏 Пройдено: ${distanceTraveled}м`)
    logs.push(`⏱️ Время: ${timeElapsed}с`)
    logs.push(`💥 Столкновений: ${collisions}`)
    logs.push(`📈 Эффективность: ${pathEfficiency.toFixed(1)}%`)
    logs.push(`🔋 Батарея: ${batteryUsed}%`)
    logs.push(`⚡ Средняя скорость: ${averageSpeed.toFixed(2)} м/с`)

  } catch (error) {
    success = false
    logs.push(`❌ Ошибка выполнения: ${error}`)
  }

  return {
    success,
    distanceTraveled,
    timeElapsed,
    collisions,
    pathEfficiency: Math.round(pathEfficiency),
    logs,
    batteryUsed,
    averageSpeed: Math.round(averageSpeed * 100) / 100
  }
}

// POST - Run algorithm simulation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const body = await request.json()
    const validation = algorithmRunSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      return NextResponse.json(
        { error: 'Ошибка валидации', details: errors },
        { status: 400 }
      )
    }

    const { algorithmId, code } = validation.data
    const scenarioId = body.scenarioId as string | undefined

    // Get algorithm if ID provided
    let algorithmCode = code
    if (algorithmId && !code) {
      const algorithm = await db.algorithm.findUnique({
        where: { id: algorithmId }
      })
      if (!algorithm) {
        return NextResponse.json({ error: 'Алгоритм не найден' }, { status: 404 })
      }
      algorithmCode = algorithm.code
    }

    if (!algorithmCode) {
      return NextResponse.json({ error: 'Код алгоритма обязателен' }, { status: 400 })
    }

    // Run simulation
    const result = simulateAlgorithm(algorithmCode)

    // Save result to database
    const deliveryResult = await db.deliveryResult.create({
      data: {
        status: result.success ? 'success' : 'failed',
        distance: result.distanceTraveled,
        batteryUsed: result.batteryUsed,
        duration: result.timeElapsed,
        collisions: result.collisions,
        efficiencyScore: result.pathEfficiency,
        safetyScore: Math.max(0, 100 - result.collisions * 20),
        speedScore: Math.round(result.averageSpeed * 100),
        scenarioId: scenarioId || 'simulation',
        userId: user.id,
        algorithmId: algorithmId || null,
      }
    })

    // Update algorithm stats
    if (algorithmId) {
      await db.algorithm.update({
        where: { id: algorithmId },
        data: {
          runsCount: { increment: 1 },
          avgScore: { increment: result.pathEfficiency }
        }
      })
    }

    // Update user stats
    await db.user.update({
      where: { id: user.id },
      data: {
        totalDeliveries: { increment: 1 },
        totalDistance: { increment: result.distanceTraveled },
        totalCollisions: { increment: result.collisions },
        bestTime: result.success ? { decrement: result.timeElapsed } : undefined
      }
    })

    return NextResponse.json({
      result: {
        ...result,
        deliveryResultId: deliveryResult.id
      }
    })

  } catch (error) {
    console.error('Algorithm run error:', error)
    return NextResponse.json(
      { error: 'Ошибка выполнения алгоритма' },
      { status: 500 }
    )
  }
}
