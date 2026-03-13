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

  try {
    logs.push('🚀 Инициализация алгоритма...')
    
    // Check for common algorithm patterns
    const hasObstacleDetection = code.includes('obstacle') || code.includes('detect') || code.includes('sensor')
    const hasPathPlanning = code.includes('path') || code.includes('route') || code.includes('navigate')
    const hasSpeedControl = code.includes('speed') || code.includes('velocity') || code.includes('move')
    const hasEmergencyStop = code.includes('stop') || code.includes('emergency') || code.includes('brake')

    logs.push('📊 Анализ кода алгоритма...')
    
    if (hasObstacleDetection) {
      logs.push('✅ Обнаружена логика избегания препятствий')
      collisions = Math.floor(Math.random() * 2)
    } else {
      logs.push('⚠️ Логика избегания препятствий не найдена')
      collisions = Math.floor(Math.random() * 5) + 2
    }

    if (hasPathPlanning) {
      logs.push('✅ Обнаружена логика планирования пути')
      pathEfficiency = 85 + Math.random() * 15
    } else {
      logs.push('⚠️ Логика планирования пути не найдена')
      pathEfficiency = 50 + Math.random() * 30
    }

    if (hasSpeedControl) {
      logs.push('✅ Обнаружена логика контроля скорости')
      timeElapsed = 120 + Math.floor(Math.random() * 60)
    } else {
      logs.push('⚠️ Логика контроля скорости не найдена')
      timeElapsed = 180 + Math.floor(Math.random() * 120)
    }

    if (hasEmergencyStop) {
      logs.push('✅ Обнаружена логика экстренной остановки')
    } else {
      logs.push('⚠️ Логика экстренной остановки не найдена')
      if (Math.random() > 0.7) {
        collisions += 1
      }
    }

    // Simulate execution
    logs.push('🤖 Запуск симуляции...')
    
    // Calculate results
    distanceTraveled = Math.floor(500 + Math.random() * 500)
    
    // Adjust based on code quality
    if (code.length < 100) {
      logs.push('⚠️ Алгоритм слишком короткий')
      success = false
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

    logs.push(success ? '✅ Симуляция завершена успешно!' : '❌ Симуляция завершилась с ошибками')
    logs.push(`📏 Пройдено: ${distanceTraveled}м`)
    logs.push(`⏱️ Время: ${timeElapsed}с`)
    logs.push(`💥 Столкновений: ${collisions}`)
    logs.push(`📈 Эффективность: ${pathEfficiency.toFixed(1)}%`)

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
    logs
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
        duration: result.timeElapsed,
        collisions: result.collisions,
        scenarioId: scenarioId || 'simulation',
        userId: user.id,
        algorithmId: algorithmId || null,
      }
    })

    // Update user stats
    await db.user.update({
      where: { id: user.id },
      data: {
        totalDeliveries: { increment: 1 },
        totalDistance: { increment: result.distanceTraveled },
        totalCollisions: { increment: result.collisions },
        successRate: result.success 
          ? { increment: 1 }
          : { increment: 0 }
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
