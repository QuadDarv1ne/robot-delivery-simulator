# ROS2 Bridge Service

WebSocket сервер, совместимый с протоколом rosbridge_suite, для интеграции симулятора с ROS2.

## Возможности

- ✅ **Публикация/подписка на топики** - стандартный ROS pub/sub паттерн
- ✅ **Сервисы** - вызов сервисов и обработка ответов
- ✅ **Параметры** - управление параметрами (get/set/delete)
- ✅ **Совместимость с rosbridge_suite** - работает с существующими ROS инструментами
- ✅ **Двунаправленная связь** - связь между симулятором и ROS2

## Запуск

```bash
# Установка зависимостей
bun install

# Запуск сервера
bun run dev
```

Сервер запускается на порту **9090**:
- ROS2 Bridge WebSocket: `ws://localhost:9090/ros2`
- Simulator Socket.IO: `ws://localhost:9090/simulator`
- Health check: `http://localhost:9090/health`

## Протокол

### Публикация сообщения

```json
{
  "op": "publish",
  "topic": "/robot/cmd_vel",
  "msg": {
    "linear": { "x": 0.5, "y": 0, "z": 0 },
    "angular": { "x": 0, "y": 0, "z": 0 }
  }
}
```

### Подписка на топик

```json
{
  "op": "subscribe",
  "topic": "/robot/gps"
}
```

### Вызов сервиса

```json
{
  "op": "callService",
  "service": "/robot/reset",
  "args": {}
}
```

### Управление параметрами

```json
{
  "op": "setParam",
  "name": "/robot/max_speed",
  "value": 2.5
}
```

## Интеграция с симулятором

Симулятор подключается через Socket.IO и может:
- Публиковать сообщения в ROS топики
- Подписываться на ROS топики
- Получать команды от ROS2 контроллеров

## Примеры использования

### JavaScript (roslibjs)

```javascript
const ROSLIB = require('roslib');

const ros = new ROSLIB.Ros({
  url: 'ws://localhost:9090'
});

// Подписка на GPS
const gpsTopic = new ROSLIB.Topic({
  ros: ros,
  name: '/robot/gps',
  messageType: 'sensor_msgs/NavSatFix'
});

gpsTopic.subscribe(function(message) {
  console.log('GPS:', message);
});

// Публикация команды скорости
const cmdVel = new ROSLIB.Topic({
  ros: ros,
  name: '/robot/cmd_vel',
  messageType: 'geometry_msgs/Twist'
});

cmdVel.publish({
  linear: { x: 0.5, y: 0, z: 0 },
  angular: { x: 0, y: 0, z: 0 }
});
```

### Python (roslibpy)

```python
import roslibpy

client = roslibpy.Ros(host='localhost', port=9090)
client.run()

# Подписка на GPS
gps = roslibpy.Topic(client, '/robot/gps', 'sensor_msgs/NavSatFix')
gps.subscribe(lambda msg: print('GPS:', msg))
gps.advertise()

# Публикация команды
cmd_vel = roslibpy.Topic(client, '/robot/cmd_vel', 'geometry_msgs/Twist')
cmd_vel.advertise()
cmd_vel.publish({
    'linear': {'x': 0.5, 'y': 0, 'z': 0},
    'angular': {'x': 0, 'y': 0, 'z': 0}
})
```

## Архитектура

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   ROS2      │◄───────►│  ROS2 Bridge │◄───────►│ Симулятор   │
│   Node      │ ws:9090 │  Server      │ Socket.IO│             │
└─────────────┘ /ros2   └──────────────┘ /simulator└─────────────┘
```

## Топики по умолчанию

- `/robot/cmd_vel` - Команды скорости (geometry_msgs/Twist)
- `/robot/gps` - GPS данные (sensor_msgs/NavSatFix)
- `/robot/lidar` - Lidar данные (sensor_msgs/LaserScan)
- `/robot/imu` - IMU данные (sensor_msgs/Imu)
- `/robot/odom` - Одометрия (nav_msgs/Odometry)
- `/robot/battery` - Статус батареи (std_msgs/Float32)

## Сервисы

- `/robot/reset` - Сброс позиции робота
- `/robot/get_status` - Получение статуса
- `/robot/set_mode` - Установка режима работы
