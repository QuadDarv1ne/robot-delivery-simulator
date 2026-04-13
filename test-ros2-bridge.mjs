// Тест ROS2 Bridge WebSocket соединения
import WebSocket from 'ws'

const WS_URL = 'ws://localhost:9090/ros2'

console.log('🔌 Подключение к ROS2 Bridge...')
const ws = new WebSocket(WS_URL)

ws.on('open', () => {
  console.log('✅ WebSocket подключён')
  
  // Тест 1: Подписка на топик
  console.log('\n📡 Тест 1: Подписка на /robot/lidar')
  ws.send(JSON.stringify({
    op: 'subscribe',
    topic: '/robot/lidar',
    type: 'sensor_msgs/LaserScan'
  }))

  // Тест 2: Публикация сообщения
  setTimeout(() => {
    console.log('\n📤 Тест 2: Публикация в /robot/cmd_vel')
    ws.send(JSON.stringify({
      op: 'publish',
      topic: '/robot/cmd_vel',
      type: 'geometry_msgs/Twist',
      msg: {
        linear: { x: 0.5, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: 0 }
      }
    }))
  }, 1000)

  // Тест 3: Установка параметра
  setTimeout(() => {
    console.log('\n⚙️ Тест 3: Установка параметра')
    ws.send(JSON.stringify({
      op: 'setParam',
      name: '/robot/max_speed',
      value: 1.5
    }))
  }, 2000)

  // Тест 4: Получение параметра
  setTimeout(() => {
    console.log('\n🔍 Тест 4: Получение параметра')
    ws.send(JSON.stringify({
      op: 'getParam',
      name: '/robot/max_speed'
    }))
  }, 3000)

  // Тест 5: Адвертайз топика
  setTimeout(() => {
    console.log('\n📢 Тест 5: Адвертайз топика /robot/gps')
    ws.send(JSON.stringify({
      op: 'advertise',
      topic: '/robot/gps',
      type: 'sensor_msgs/NavSatFix'
    }))
  }, 4000)
})

ws.on('message', (data) => {
  const message = JSON.parse(data.toString())
  console.log('📨 Получено сообщение:', JSON.stringify(message, null, 2))
})

ws.on('error', (error) => {
  console.error('❌ Ошибка WebSocket:', error.message)
})

ws.on('close', () => {
  console.log('🔌 Соединение закрыто')
  process.exit(0)
})

// Закрыть соединение через 5 секунд
setTimeout(() => {
  console.log('\n✅ Все тесты завершены')
  ws.close()
}, 5000)
