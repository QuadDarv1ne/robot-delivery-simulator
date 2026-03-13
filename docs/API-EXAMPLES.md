# 🚀 Примеры использования API

Коллекция примеров для тестирования API Robot Delivery Simulator.

## 📋 Содержание

- [cURL примеры](#curl-примеры)
- [JavaScript/Fetch примеры](#javascriptfetch-примеры)
- [Python примеры](#python-примеры)

---

## 🔧 cURL примеры

### Авторизация

```bash
# Вход в систему
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.ru","password":"demo123"}' \
  -c cookies.txt

# Выход
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

### Получение пользователя

```bash
# Текущий пользователь
curl http://localhost:3000/api/user/me \
  -b cookies.txt
```

### Алгоритмы

```bash
# Список алгоритмов
curl http://localhost:3000/api/algorithms \
  -b cookies.txt

# Получить алгоритм по ID
curl "http://localhost:3000/api/algorithms?id=algo-id" \
  -b cookies.txt

# Создать алгоритм
curl -X POST http://localhost:3000/api/algorithms \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Мой алгоритм",
    "description": "Описание",
    "language": "python",
    "code": "def main():\n    print(\"Hello\")",
    "isPublic": false
  }'

# Обновить алгоритм
curl -X PUT http://localhost:3000/api/algorithms \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "id": "algo-id",
    "name": "Обновлённое название"
  }'

# Удалить алгоритм
curl -X DELETE "http://localhost:3000/api/algorithms?id=algo-id" \
  -b cookies.txt

# Клонировать алгоритм
curl -X POST http://localhost:3000/api/algorithms/clone \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"id": "algo-id"}'

# Поиск алгоритмов
curl "http://localhost:3000/api/algorithms/search?q=навигация&language=python&page=1&limit=10" \
  -b cookies.txt

# Запустить симуляцию
curl -X POST http://localhost:3000/api/algorithms/run \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "code": "def main():\n    move(0.5)",
    "algorithmId": "algo-id"
  }'
```

### Рейтинг

```bash
# Получить рейтинг
curl "http://localhost:3000/api/leaderboard?period=week" \
  -b cookies.txt
```

### Админ-панель

```bash
# Статистика
curl http://localhost:3000/api/admin/stats \
  -b cookies.txt

# Список пользователей
curl "http://localhost:3000/api/admin/users?search=ivan&role=student" \
  -b cookies.txt
```

---

## 🌐 JavaScript/Fetch примеры

### Базовый клиент

```javascript
const API_BASE = 'http://localhost:3000/api'

class RobotSimulatorAPI {
  async request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Request failed')
    }
    
    return response.json()
  }

  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' })
  }

  async getCurrentUser() {
    return this.request('/user/me')
  }

  // Algorithms
  async getAlgorithms(userId = null) {
    const params = userId ? `?userId=${userId}` : ''
    return this.request(`/algorithms${params}`)
  }

  async getAlgorithmById(id) {
    return this.request(`/algorithms?id=${id}`)
  }

  async createAlgorithm(data) {
    return this.request('/algorithms', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateAlgorithm(data) {
    return this.request('/algorithms', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteAlgorithm(id) {
    return this.request(`/algorithms?id=${id}`, { method: 'DELETE' })
  }

  async cloneAlgorithm(id) {
    return this.request('/algorithms/clone', {
      method: 'POST',
      body: JSON.stringify({ id })
    })
  }

  async searchAlgorithms(query, language = '', page = 1, limit = 10) {
    const params = new URLSearchParams({ q: query, language, page: String(page), limit: String(limit) })
    return this.request(`/algorithms/search?${params}`)
  }

  async runAlgorithm(code, algorithmId = null) {
    return this.request('/algorithms/run', {
      method: 'POST',
      body: JSON.stringify({ code, algorithmId })
    })
  }

  // Leaderboard
  async getLeaderboard(period = 'all', group = '') {
    const params = new URLSearchParams({ period, group })
    return this.request(`/leaderboard?${params}`)
  }
}

// Использование
const api = new RobotSimulatorAPI()

async function main() {
  try {
    // Вход
    const user = await api.login('demo@test.ru', 'demo123')
    console.log('Вход выполнен:', user)

    // Получить алгоритмы
    const algorithms = await api.getAlgorithms()
    console.log('Алгоритмы:', algorithms)

    // Создать алгоритм
    const newAlgo = await api.createAlgorithm({
      name: 'Тестовый алгоритм',
      description: 'Создано через API',
      language: 'python',
      code: 'def main():\n    print("Test")',
      isPublic: false
    })
    console.log('Создан:', newAlgo)

    // Запустить симуляцию
    const result = await api.runAlgorithm('def main():\n    move(0.5)')
    console.log('Результат:', result)

  } catch (error) {
    console.error('Ошибка:', error.message)
  }
}

main()
```

### React Hook пример

```javascript
import { useState, useEffect } from 'react'

export function useAlgorithms() {
  const [algorithms, setAlgorithms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAlgorithms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/algorithms', {
        credentials: 'include'
      })
      const data = await response.json()
      setAlgorithms(data.algorithms)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createAlgorithm = async (data) => {
    const response = await fetch('/api/algorithms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    })
    return response.json()
  }

  const deleteAlgorithm = async (id) => {
    await fetch(`/api/algorithms?id=${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    fetchAlgorithms()
  }

  useEffect(() => {
    fetchAlgorithms()
  }, [])

  return { algorithms, loading, error, refetch: fetchAlgorithms, createAlgorithm, deleteAlgorithm }
}

// Использование в компоненте
function AlgorithmList() {
  const { algorithms, loading, error, deleteAlgorithm } = useAlgorithms()

  if (loading) return <div>Загрузка...</div>
  if (error) return <div>Ошибка: {error}</div>

  return (
    <ul>
      {algorithms.map(algo => (
        <li key={algo.id}>
          {algo.name}
          <button onClick={() => deleteAlgorithm(algo.id)}>Удалить</button>
        </li>
      ))}
    </ul>
  )
}
```

---

## 🐍 Python примеры

### Базовый клиент

```python
import requests
import json

class RobotSimulatorAPI:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
        self.session = requests.Session()
    
    def login(self, email, password):
        response = self.session.post(
            f'{self.base_url}/auth/login',
            json={'email': email, 'password': password}
        )
        return response.json()
    
    def logout(self):
        response = self.session.post(f'{self.base_url}/auth/logout')
        return response.json()
    
    def get_current_user(self):
        response = self.session.get(f'{self.base_url}/user/me')
        return response.json()
    
    def get_algorithms(self, user_id=None):
        params = {'userId': user_id} if user_id else {}
        response = self.session.get(f'{self.base_url}/algorithms', params=params)
        return response.json()
    
    def get_algorithm_by_id(self, algorithm_id):
        response = self.session.get(f'{self.base_url}/algorithms', params={'id': algorithm_id})
        return response.json()
    
    def create_algorithm(self, name, code, language='python', description='', is_public=False):
        data = {
            'name': name,
            'description': description,
            'language': language,
            'code': code,
            'isPublic': is_public
        }
        response = self.session.post(f'{self.base_url}/algorithms', json=data)
        return response.json()
    
    def update_algorithm(self, algorithm_id, **kwargs):
        data = {'id': algorithm_id, **kwargs}
        response = self.session.put(f'{self.base_url}/algorithms', json=data)
        return response.json()
    
    def delete_algorithm(self, algorithm_id):
        response = self.session.delete(f'{self.base_url}/algorithms', params={'id': algorithm_id})
        return response.json()
    
    def clone_algorithm(self, algorithm_id):
        response = self.session.post(
            f'{self.base_url}/algorithms/clone',
            json={'id': algorithm_id}
        )
        return response.json()
    
    def search_algorithms(self, query='', language='', page=1, limit=10):
        params = {'q': query, 'language': language, 'page': page, 'limit': limit}
        response = self.session.get(f'{self.base_url}/algorithms/search', params=params)
        return response.json()
    
    def run_algorithm(self, code, algorithm_id=None):
        data = {'code': code, 'algorithmId': algorithm_id}
        response = self.session.post(f'{self.base_url}/algorithms/run', json=data)
        return response.json()
    
    def get_leaderboard(self, period='all', group=''):
        params = {'period': period, 'group': group}
        response = self.session.get(f'{self.base_url}/leaderboard', params=params)
        return response.json()


# Пример использования
def main():
    api = RobotSimulatorAPI()
    
    # Вход
    print("Вход в систему...")
    user = api.login('demo@test.ru', 'demo123')
    print(f"Пользователь: {user['user']['name']}")
    
    # Получить алгоритмы
    print("\nПолучение алгоритмов...")
    algorithms = api.get_algorithms()
    for algo in algorithms['algorithms']:
        print(f"  - {algo['name']} ({algo['language']})")
    
    # Создать алгоритм
    print("\nСоздание алгоритма...")
    code = """
def navigate_to_destination():
    destination = get_destination()
    current_pos = get_gps()
    
    while not check_arrival(current_pos, destination):
        lidar_data = get_lidar()
        obstacles = detect_obstacles(lidar_data)
        
        if obstacles:
            avoid_obstacle(obstacles)
        else:
            move(speed=0.5, direction=calculate_direction(current_pos, destination))
        
        current_pos = get_gps()
    
    return True
"""
    new_algo = api.create_algorithm(
        name='Умная навигация',
        description='Алгоритм с обходом препятствий',
        language='python',
        code=code,
        is_public=False
    )
    print(f"Создан: {new_algo['algorithm']['name']}")
    
    # Запустить симуляцию
    print("\nЗапуск симуляции...")
    result = api.run_algorithm(code)
    print(f"Результат: {result['result']}")
    
    # Поиск алгоритмов
    print("\nПоиск алгоритмов...")
    search_results = api.search_algorithms(query='навигация', language='python')
    print(f"Найдено: {search_results['pagination']['total']}")
    
    # Рейтинг
    print("\nРейтинг за неделю...")
    leaderboard = api.get_leaderboard(period='week')
    for i, entry in enumerate(leaderboard['leaderboard'][:5], 1):
        print(f"  {i}. {entry['user']['name']} - {entry['stats']['successRate']}%")

if __name__ == '__main__':
    main()
```

### Пример с asyncio (асинхронный)

```python
import asyncio
import aiohttp

class AsyncRobotSimulatorAPI:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.session.close()
    
    async def login(self, email, password):
        async with self.session.post(
            f'{self.base_url}/auth/login',
            json={'email': email, 'password': password}
        ) as resp:
            return await resp.json()
    
    async def get_algorithms(self):
        async with self.session.get(f'{self.base_url}/algorithms') as resp:
            return await resp.json()
    
    async def create_algorithm(self, name, code, **kwargs):
        data = {'name': name, 'code': code, **kwargs}
        async with self.session.post(f'{self.base_url}/algorithms', json=data) as resp:
            return await resp.json()
    
    async def run_algorithm(self, code):
        async with self.session.post(
            f'{self.base_url}/algorithms/run',
            json={'code': code}
        ) as resp:
            return await resp.json()


async def main():
    async with AsyncRobotSimulatorAPI() as api:
        # Вход
        await api.login('demo@test.ru', 'demo123')
        
        # Получить алгоритмы
        algorithms = await api.get_algorithms()
        print(f"Всего алгоритмов: {len(algorithms['algorithms'])}")
        
        # Создать и запустить
        code = "def main():\n    move(0.5)"
        result = await api.run_algorithm(code)
        print(f"Симуляция: {'успешна' if result['result']['success'] else 'неудачна'}")

asyncio.run(main())
```

---

## 📊 Примеры ответов API

### Успешный ответ

```json
{
  "algorithm": {
    "id": "algo-123",
    "name": "Навигация к цели",
    "description": "Алгоритм обхода препятствий",
    "language": "python",
    "code": "def navigate()...",
    "isPublic": false,
    "runsCount": 5,
    "avgScore": 85.5,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-02T15:30:00Z",
    "user": {
      "id": "user-456",
      "name": "Демо Студент",
      "email": "demo@test.ru",
      "group": "ИВТ-2024"
    }
  }
}
```

### Ошибка

```json
{
  "error": "Название должно содержать минимум 2 символа"
}
```

### Ошибка авторизации

```json
{
  "error": "Не авторизован"
}
```

---

## 🔌 WebSocket примеры

### JavaScript

```javascript
const socket = io('http://localhost:3003', {
  path: '/',
  transports: ['websocket']
})

socket.on('connect', () => {
  console.log('Подключено к WebSocket')
  socket.emit('register', { type: 'viewer' })
})

socket.on('sensor_data', (data) => {
  console.log('GPS:', data.gps)
  console.log('Lidar:', data.lidar)
  console.log('IMU:', data.imu)
})

socket.on('robot_status', (status) => {
  console.log('Батарея:', status.battery)
  console.log('Статус:', status.status)
})

// Отправка команды
function sendCommand(type, data) {
  socket.emit('control', { type, data })
}

// Пример: движение вперёд
sendCommand('move', { velocity: { x: 0, y: 0, z: 0.5 } })

// Пример: остановка
sendCommand('stop')
```

### Python

```python
import socketio

sio = socketio.Client()

@sio.event
def connect():
    print('Подключено к WebSocket')
    sio.emit('register', {'type': 'viewer'})

@sio.event
def sensor_data(data):
    print(f'GPS: {data["gps"]}')
    print(f'Lidar: {data["lidar"]}')

@sio.event
def robot_status(status):
    print(f'Батарея: {status["battery"]}%')

sio.connect('http://localhost:3003', socketio_path='/')
sio.wait()
```

---

**Версия:** 1.0.0  
**Последнее обновление:** 13 марта 2026
