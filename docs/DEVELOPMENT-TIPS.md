# 💡 Советы по разработке

Рекомендации и лучшие практики для работы с Robot Delivery Simulator.

## 📋 Содержание

- [Быстрый старт](#быстрый-старт)
- [Советы по API](#советы-по-api)
- [Работа с алгоритмами](#работа-с-алгоритмами)
- [Отладка](#отладка)
- [Производительность](#производительность)

---

## 🚀 Быстрый старт

### Команды для разработки

```bash
# Запуск всех сервисов сразу
npm run dev:all

# Только фронтенд (быстрее)
npm run dev

# Только WebSocket сервер
npm run websocket

# Проверка типов
npm run type-check

# Линтинг с исправлением
npm run lint:fix

# Тесты в фоне
npm run test:watch
```

### Горячая перезагрузка

- **Next.js** автоматически обновляется при изменении файлов в `src/`
- **WebSocket сервер** требует ручного перезапуска

### Работа с базой данных

```bash
# Открыть визуальный редактор
npm run db:studio

# Применить изменения схемы
npx prisma db push

# Сбросить и пересоздать
npm run db:reset
```

---

## 🔌 Советы по API

### Тестирование эндпоинтов

Используйте встроенную документацию:

```bash
# Получить OpenAPI спецификацию
curl http://localhost:3000/api/docs
```

### Частые запросы

```bash
# Проверить здоровье API
curl http://localhost:3000/api/health

# Получить текущего пользователя
curl http://localhost:3000/api/user/me -b cookies.txt

# Быстрый вход (сохраняет cookies)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.ru","password":"demo123"}' \
  -c cookies.txt
```

### Обработка ошибок

Всегда проверяйте статус ответа:

```javascript
async function safeRequest(url, options) {
  const response = await fetch(url, options)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }
  
  return response.json()
}
```

---

## 🤖 Работа с алгоритмами

### Структура алгоритма

```python
# Обязательная функция main или navigate_to_destination
def main():
    """Точка входа"""
    destination = get_destination()
    
    while not arrived():
        # Получаем данные сенсоров
        gps = get_gps()
        lidar = get_lidar()
        imu = get_imu()
        
        # Проверяем препятствия
        obstacles = detect_obstacles(lidar)
        
        if obstacles:
            avoid_obstacle(obstacles)
        else:
            move_towards(gps, destination)
    
    return success()
```

### Доступные функции

| Функция | Описание | Возвращает |
|---------|----------|------------|
| `get_gps()` | Позиция робота | `{lat, lon, altitude}` |
| `get_lidar()` | Данные лидара | `[{distance, angle}, ...]` |
| `get_imu()` | Данные IMU | `{acceleration, gyro}` |
| `move(speed, direction)` | Движение | - |
| `stop()` | Остановка | - |
| `get_destination()` | Цель | `{lat, lon}` |
| `check_arrival(current, dest)` | Проверка прибытия | `bool` |

### Советы по написанию

1. **Всегда обрабатывайте исключения:**
```python
try:
    lidar_data = get_lidar()
except SensorError:
    stop()
    return False
```

2. **Ограничивайте скорость в помещении:**
```python
MAX_SPEED = 0.5  # м/с
SAFE_DISTANCE = 2.0  # м
```

3. **Используйте инерцию:**
```python
current_speed = 0
target_speed = 0.5

# Плавное ускорение
if current_speed < target_speed:
    current_speed += 0.1
move(current_speed, direction)
```

### Тестирование алгоритмов

```bash
# Запуск через API
curl -X POST http://localhost:3000/api/algorithms/run \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"code": "def main():\n    move(0.5)"}'
```

### Сохранение версий

```python
# Используйте Git для версионирования алгоритмов
git add algorithms/my_algorithm.py
git commit -m "Улучшил обход препятствий"
```

---

## 🐛 Отладка

### Логирование

```javascript
// Включите debug режим в браузере
localStorage.setItem('debug', 'true')
```

### Консоль разработчика

```javascript
// Отладка WebSocket
const socket = io('http://localhost:3003')
socket.on('connect', () => console.log('Connected!'))
socket.on('sensor_data', (data) => console.table(data))
```

### Частые проблемы

**Проблема:** WebSocket не подключается

```bash
# Проверьте, запущен ли сервер
lsof -i :3003

# Или запустите отдельно
npm run websocket
```

**Проблема:** Ошибка базы данных

```bash
# Пересоздайте БД
rm prisma/dev.db
npx prisma db push
npm run seed
```

**Проблема:** Кэш Next.js

```bash
# Очистите кэш
rm -rf .next
npm run dev
```

### Инструменты

- **React DevTools** — для инспекции компонентов
- **Redux DevTools** — для просмотра состояния
- **Network tab** — для анализа запросов

---

## ⚡ Производительность

### Оптимизация рендеринга

```javascript
// Используйте useMemo для тяжёлых вычислений
const filteredAlgorithms = useMemo(() => {
  return algorithms.filter(a => a.language === 'python')
}, [algorithms])

// Используйте useCallback для функций
const handleSave = useCallback(async () => {
  await saveAlgorithm(data)
}, [data])
```

### Работа с большими данными

```javascript
// Виртуализация списков
import { useVirtualizer } from '@tanstack/react-virtual'

// Пагинация на сервере
const algorithms = await db.algorithm.findMany({
  skip: (page - 1) * limit,
  take: limit
})
```

### Кэширование

```javascript
// React Query для кэширования
import { useQuery } from '@tanstack/react-query'

const { data } = useQuery({
  queryKey: ['algorithms'],
  queryFn: () => fetch('/api/algorithms').then(r => r.json())
})
```

### WebSocket оптимизация

```javascript
// Троттлинг событий
let lastUpdate = 0
socket.on('sensor_data', (data) => {
  const now = Date.now()
  if (now - lastUpdate > 100) { // 100ms
    updateUI(data)
    lastUpdate = now
  }
})
```

---

## 📁 Структура проекта

```
robot-delivery-simulator/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React компоненты
│   ├── hooks/           # Кастомные хуки
│   └── lib/             # Утилиты и конфиги
├── prisma/
│   └── schema.prisma    # Схема БД
├── mini-services/
│   └── robot-simulator-server/
└── docs/                # Документация
```

### Создание нового компонента

```bash
# Создайте файл
touch src/components/my-component.tsx

# Шаблон компонента
export function MyComponent() {
  return (
    <div className="my-component">
      {/* Контент */}
    </div>
  )
}
```

### Создание API эндпоинта

```typescript
// src/app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello' })
}
```

---

## 🔐 Безопасность

### Хранение токенов

- Никогда не храните токены в localStorage
- Используйте httpOnly cookies
- Обновляйте токены регулярно

### Валидация данных

```typescript
// Всегда валидируйте входные данные
const schema = z.object({
  name: z.string().min(2),
  email: z.string().email()
})

const result = schema.safeParse(input)
if (!result.success) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
}
```

### Rate limiting

```typescript
// Ограничивайте частоту запросов
const rateLimit = {
  window: 60 * 1000, // 1 минута
  max: 100 // запросов
}
```

---

## 📚 Дополнительные ресурсы

- [Документация Next.js](https://nextjs.org/docs)
- [Документация Prisma](https://www.prisma.io/docs)
- [Документация Socket.IO](https://socket.io/docs/v4/)
- [shadcn/ui компоненты](https://ui.shadcn.com)

---

**Версия:** 1.0.0  
**Последнее обновление:** 13 марта 2026
