# 📚 API Документация

Полная документация API для Robot Delivery Simulator.

## 📋 Содержание

- [Аутентификация](#аутентификация)
- [Пользователи](#пользователи)
- [Алгоритмы](#алгоритмы)
- [Сценарии](#сценарии)
- [Рейтинг](#рейтинг)
- [Отчёты](#отчёты)
- [Админ-панель](#админ-панель)

---

## 🔐 Аутентификация

### POST `/api/auth/login`

Вход в систему.

**Тело запроса:**
```json
{
  "email": "demo@test.ru",
  "password": "demo123"
}
```

**Ответ:**
```json
{
  "user": {
    "id": "user-id",
    "email": "demo@test.ru",
    "name": "Демо Студент",
    "role": "student"
  }
}
```

---

### POST `/api/auth/register`

Регистрация нового пользователя.

**Тело запроса:**
```json
{
  "email": "student@example.com",
  "password": "password123",
  "name": "Иван Иванов",
  "group": "ИВТ-2024"
}
```

**Ответ:**
```json
{
  "user": {
    "id": "new-user-id",
    "email": "student@example.com",
    "name": "Иван Иванов",
    "role": "student"
  }
}
```

---

### POST `/api/auth/logout`

Выход из системы.

**Ответ:**
```json
{
  "success": true
}
```

---

### POST `/api/auth/forgot-password`

Запрос на восстановление пароля.

**Тело запроса:**
```json
{
  "email": "student@example.com"
}
```

**Ответ:**
```json
{
  "message": "Письмо с инструкциями отправлено на email"
}
```

---

### POST `/api/auth/reset-password`

Сброс пароля по токену.

**Тело запроса:**
```json
{
  "token": "reset-token-from-email",
  "password": "newpassword123"
}
```

---

## 👤 Пользователи

### GET `/api/user/me`

Получение данных текущего пользователя.

**Ответ:**
```json
{
  "user": {
    "id": "user-id",
    "email": "demo@test.ru",
    "name": "Демо Студент",
    "role": "student",
    "group": "ИВТ-2024",
    "totalDeliveries": 15,
    "successRate": 87.5,
    "achievements": [
      { "id": "ach-1", "name": "Первая доставка", "icon": "🎉" }
    ]
  }
}
```

---

### PATCH `/api/user/profile`

Обновление профиля пользователя.

**Тело запроса:**
```json
{
  "name": "Новое Имя",
  "group": "ИВТ-2025"
}
```

**Ответ:**
```json
{
  "user": {
    "id": "user-id",
    "name": "Новое Имя",
    "group": "ИВТ-2025"
  }
}
```

---

## 🤖 Алгоритмы

### GET `/api/algorithms`

Получение списка алгоритмов пользователя.

**Параметры запроса:**
- `userId` (опционально) — ID пользователя (для преподавателей)

**Ответ:**
```json
{
  "algorithms": [
    {
      "id": "algo-id",
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
        "id": "user-id",
        "name": "Демо Студент",
        "email": "demo@test.ru"
      }
    }
  ]
}
```

---

### GET `/api/algorithms?id={id}`

Получение алгоритма по ID.

**Параметры запроса:**
- `id` (обязательно) — ID алгоритма

**Ответ:**
```json
{
  "algorithm": {
    "id": "algo-id",
    "name": "Навигация к цели",
    "description": "Алгоритм обхода препятствий",
    "language": "python",
    "code": "def navigate()...",
    "isPublic": false,
    "runsCount": 5,
    "avgScore": 85.5,
    "user": {
      "id": "user-id",
      "name": "Демо Студент"
    },
    "deliveryResults": [
      {
        "id": "result-id",
        "success": true,
        "distanceTraveled": 150.5,
        "timeElapsed": 45,
        "collisions": 0,
        "pathEfficiency": 92.3,
        "createdAt": "2024-01-02T15:30:00Z"
      }
    ]
  }
}
```

---

### POST `/api/algorithms`

Создание нового алгоритма.

**Тело запроса:**
```json
{
  "name": "Новый алгоритм",
  "description": "Описание алгоритма",
  "language": "python",
  "code": "def main():\n    print('Hello, Robot!')",
  "isPublic": false
}
```

**Ответ:**
```json
{
  "algorithm": {
    "id": "new-algo-id",
    "name": "Новый алгоритм",
    "language": "python"
  }
}
```

---

### PUT `/api/algorithms`

Обновление существующего алгоритма.

**Тело запроса:**
```json
{
  "id": "algo-id",
  "name": "Обновлённый алгоритм",
  "description": "Новое описание",
  "code": "def main():\n    print('Updated!')"
}
```

**Ответ:**
```json
{
  "algorithm": {
    "id": "algo-id",
    "name": "Обновлённый алгоритм"
  }
}
```

---

### DELETE `/api/algorithms?id={id}`

Удаление алгоритма.

**Параметры запроса:**
- `id` (обязательно) — ID алгоритма

**Ответ:**
```json
{
  "success": true
}
```

---

### POST `/api/algorithms/clone`

Клонирование алгоритма.

**Тело запроса:**
```json
{
  "id": "algo-id"
}
```

**Ответ:**
```json
{
  "algorithm": {
    "id": "cloned-algo-id",
    "name": "Навигация к цели (Копия)",
    "language": "python"
  }
}
```

---

### GET `/api/algorithms/search?q={query}&language={lang}&page={n}&limit={n}`

Поиск алгоритмов.

**Параметры запроса:**
- `q` (опционально) — Поисковый запрос
- `language` (опционально) — Язык (python/javascript)
- `page` (опционально) — Номер страницы (по умолчанию 1)
- `limit` (опционально) — Количество результатов (по умолчанию 10)

**Ответ:**
```json
{
  "algorithms": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### POST `/api/algorithms/run`

Запуск симуляции алгоритма.

**Тело запроса:**
```json
{
  "code": "def main():\n    move(0.5)",
  "algorithmId": "algo-id"
}
```

**Ответ:**
```json
{
  "result": {
    "success": true,
    "distanceTraveled": 150.5,
    "timeElapsed": 45,
    "collisions": 0,
    "pathEfficiency": 92.3,
    "logs": [
      "✓ Алгоритм запущен",
      "✓ Движение начато",
      "✓ Препятствие обнаружено",
      "✓ Цель достигнута"
    ]
  }
}
```

---

## 📦 Сценарии

### GET `/api/scenarios`

Получение списка сценариев доставки.

**Ответ:**
```json
{
  "scenarios": [
    {
      "id": "scenario-id",
      "name": "Доставка в офис",
      "description": "Простой маршрут без препятствий",
      "difficulty": "easy",
      "distance": 500,
      "startPoint": { "lat": 55.7558, "lon": 37.6173 },
      "endPoint": { "lat": 55.7608, "lon": 37.6203 },
      "waypoints": [...],
      "obstacles": [...]
    }
  ]
}
```

---

### GET `/api/scenarios/search?q={query}&difficulty={diff}&weather={weather}&page={n}&limit={n}`

Поиск сценариев.

**Параметры запроса:**
- `q` (опционально) — Поисковый запрос
- `difficulty` (опционально) — Сложность (easy/medium/hard)
- `weather` (опционально) — Погода (sunny/rainy/snowy)
- `page` (опционально) — Номер страницы (по умолчанию 1)
- `limit` (опционально) — Количество результатов (по умолчанию 10)

**Ответ:**
```json
{
  "scenarios": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### POST `/api/scenarios`

Создание нового сценария.

**Тело запроса:**
```json
{
  "name": "Новый сценарий",
  "description": "Описание сценария",
  "difficulty": "medium",
  "distance": 1000,
  "timeLimit": 300,
  "weather": "sunny",
  "traffic": "low",
  "startPoint": {"lat": 55.7558, "lon": 37.6173, "name": "Старт"},
  "endPoint": {"lat": 55.7608, "lon": 37.6203, "name": "Финиш"},
  "waypoints": [],
  "obstacles": [],
  "isPublic": true
}
```

**Ответ:**
```json
{
  "scenario": {
    "id": "new-scenario-id",
    "name": "Новый сценарий"
  }
}
```

---

### PUT `/api/scenarios`

Обновление существующего сценария.

**Тело запроса:**
```json
{
  "id": "scenario-id",
  "name": "Обновлённое название",
  "difficulty": "hard",
  "weather": "rainy"
}
```

---

### DELETE `/api/scenarios?id={id}`

Удаление сценария.

**Параметры запроса:**
- `id` (обязательно) — ID сценария

**Ответ:**
```json
{
  "success": true
}
```

---

### POST `/api/scenarios/clone`

Клонирование сценария.

**Тело запроса:**
```json
{
  "id": "scenario-id"
}
```

**Ответ:**
```json
{
  "scenario": {
    "id": "cloned-scenario-id",
    "name": "Доставка в офис (Копия)"
  }
}
```

---

## 🏆 Рейтинг

### GET `/api/leaderboard`

Получение рейтинга пользователей.

**Параметры запроса:**
- `period` (опционально) — Период (day/week/month/all)
- `group` (опционально) — Группа

**Ответ:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user": {
        "id": "user-id",
        "name": "Демо Студент",
        "group": "ИВТ-2024"
      },
      "stats": {
        "totalDeliveries": 50,
        "successRate": 95.5,
        "avgTime": 42.3,
        "avgEfficiency": 88.7
      }
    }
  ]
}
```

---

## 📊 Отчёты

### GET `/api/reports/export?type={type}&period={period}`

Экспорт отчёта в PDF.

**Параметры запроса:**
- `type` (обязательно) — Тип отчёта (user/group/all)
- `period` (опционально) — Период (week/month/year)

**Ответ:** PDF файл

---

## 🛡️ Админ-панель

### GET `/api/admin/stats`

Получение статистики системы.

**Ответ:**
```json
{
  "stats": {
    "totalUsers": 150,
    "totalDeliveries": 1250,
    "successRate": 87.5,
    "activeAlgorithms": 45,
    "avgSessionTime": 25.5
  }
}
```

---

### GET `/api/admin/users?search={query}&role={role}`

Список пользователей с фильтрацией.

**Параметры запроса:**
- `search` (опционально) — Поиск по имени/email
- `role` (опционально) — Фильтр по роли

**Ответ:**
```json
{
  "users": [
    {
      "id": "user-id",
      "email": "demo@test.ru",
      "name": "Демо Студент",
      "role": "student",
      "group": "ИВТ-2024",
      "totalDeliveries": 15,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

---

### PATCH `/api/admin/users`

Редактирование пользователя (администратор).

**Тело запроса:**
```json
{
  "userId": "user-id",
  "name": "Новое имя",
  "role": "teacher",
  "group": "ИВТ-2025"
}
```

---

### DELETE `/api/admin/users?id={id}`

Удаление пользователя (администратор).

**Параметры запроса:**
- `id` (обязательно) — ID пользователя

**Ответ:**
```json
{
  "success": true
}
```

---

## 🔌 WebSocket API

Подключение: `ws://localhost:3003`

### События от сервера

| Событие | Описание | Данные |
|---------|----------|--------|
| `sensor_data` | Данные сенсоров | GPS, Lidar, IMU, Encoders |
| `delivery_update` | Обновление доставки | Прогресс миссии |
| `robot_status` | Статус робота | Батарея, скорость, состояние |

### События к серверу

| Событие | Описание | Данные |
|---------|----------|--------|
| `start_mission` | Начать доставку | `{ scenarioId: string }` |
| `stop_mission` | Завершить миссию | `{}` |
| `update_route` | Изменить маршрут | `{ waypoints: [] }` |
| `control` | Управление роботом | `{ type: string, data: object }` |

**Пример подключения:**

```javascript
const socket = io('http://localhost:3003', {
  path: '/',
  transports: ['websocket']
})

// Подписка на данные сенсоров
socket.on('sensor_data', (data) => {
  console.log('GPS:', data.gps)
  console.log('Lidar:', data.lidar)
})

// Отправка команды
socket.emit('control', {
  type: 'move',
  data: { velocity: { x: 0, y: 0, z: 0.5 } }
})
```

---

## 📝 Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Неверный запрос |
| 401 | Не авторизован |
| 403 | Нет прав доступа |
| 404 | Ресурс не найден |
| 500 | Внутренняя ошибка сервера |

---

## 🔒 Безопасность

- Все API запросы требуют аутентификации через session cookie
- Пароли хешируются с помощью bcrypt
- CSRF защита включена по умолчанию
- Rate limiting: 100 запросов в минуту на IP

---

**Версия API:** 1.0.0  
**Последнее обновление:** 13 марта 2026
