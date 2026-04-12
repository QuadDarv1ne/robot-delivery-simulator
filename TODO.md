# TODO - Robot Delivery Simulator

## Текущее состояние (12 апреля 2026)

### ✅ Завершено
- Поиск алгоритмов по названию и языку (Python/JavaScript)
- Клонирование алгоритмов
- Поиск сценариев с фильтрами (сложность, погода)
- Клонирование сценариев
- API endpoints:
  - `GET /api/algorithms/search` — поиск алгоритмов
  - `GET /api/algorithms/[id]` — получение алгоритма по ID
  - `POST /api/algorithms/clone` — клонирование алгоритма
  - `GET /api/scenarios/search` — поиск сценариев
  - `POST /api/scenarios/clone` — клонирование сценария
  - `GET /api/scenarios/[id]` — получение сценария по ID
  - `GET /api/algorithms/favorite` — список избранного
  - `POST /api/algorithms/favorite` — добавить в избранное
  - `DELETE /api/algorithms/favorite` — удалить из избранного
  - `GET /api/algorithms/history` — история запусков
  - `GET /api/algorithms/run` — запуск симуляции с деталями (батарея, скорость)
- Документация (docs/API.md, docs/API-EXAMPLES.md, docs/DEVELOPMENT-TIPS.md)
- Изображение релиза (img/2026-03-13-v1.png)
- Сборка проходит успешно
- Zod валидация для всех API endpoints
- Toast уведомления для UX
- Пагинация на клиенте (алгоритмы, сценарии)
- Сортировка результатов поиска
- Debouncing для поиска
- WebSocket error handling
- Тесты для API endpoints (Jest)
- Подсветка синтаксиса в редакторах алгоритмов (react-syntax-highlighter)
- Редактор маршрута для сценариев (точки маршрута)
- Панель ручного управления роботом (вперёд/назад/повороты)
- Централизованное логирование (logger.ts, api-error.ts)
- Утилиты форматирования (format.ts)
- React hooks (useDebounce, useLocalStorage, useMediaQuery, useOnlineStatus)
- Улучшена обработка ошибок в auth-context
- Тесты для кастомных хуков (useDebounce, useLocalStorage, useOnlineStatus)
- Тесты для API endpoints клонирования
- WebSocket команды для симулятора:
  - getBattery, getLocation, resetPosition
  - getSensors, setSensors
  - addObstacle, removeObstacle, clearObstacles
  - Collision detection с препятствиями
- Monaco Editor с автодополнением кода (Python/JavaScript)
- Оптимизация сборки (turbopack, chunk splitting)
- Рефакторинг simulator-content.tsx (вынесены компоненты: LidarView, IMUView, ControlPanel, UnityWebGLPlayer)
- Создан хук useSimulator для управления состоянием WebSocket
- Покрытие тестами: 49 тестов проходят (API, Components, Hooks, Utils)
- Jest конфигурация разделена на 4 проекта для правильной среды тестирования
- E2E тесты для критических путей (Playwright)
- CI/CD pipeline (GitHub Actions: lint, build, test, e2e, security)
- TypeScript компиляция проходит без ошибок (tsc --noEmit: 0 ошибок)

### 🔄 В работе

### ⚠️ Проблемы качества
- [x] Тесты hooks failing — `window is not defined` (исправлено: projects config в jest.config.ts)
- [x] console.error в health check тесте — ошибка логируется при штатном тесте (исправлено: mock console.error)
- [x] simulator-content.tsx — 814 строк, слишком большой файл (рефакторинг: вынесены компоненты)

### 📋 План работ

#### Улучшения
- [x] Продолжить оптимизацию размера сборки (удалены 8 неиспользуемых зависимостей)
- [x] Рефакторинг simulator-content.tsx на меньшие компоненты
- [x] Покрыть тестами компоненты (Button, Card, Badge, Progress, Input, Separator)
- [x] Покрыть тестами Leaderboard и AnalyticsPanel (49 тестов всего)
- [x] Улучшить типизацию WebSocket событий (shared types, type-safe socket)
- [x] Добавить rate limiting к чувствительным endpoints (forgot-password, reset-password, admin/users)
- [x] Добавить e2e тесты для критических путей
- [x] Добавить обработку ошибок в API endpoints (algorithms, scenarios, user/profile, scenarios/[id])
- [x] Настроить CI pipeline для автотестов (lint, build, test, e2e, security)

#### Фичи из roadmap
- [x] Система лидерборда (пагинация, skeleton loading, toast errors)
- [ ] Редактор пользовательских сценариев
- [ ] Мульти-роботная симуляция
- [ ] Поддержка ROS2 bridge
- [ ] Полная интеграция Unity WebGL
- [ ] Мобильное приложение-компаньон
- [ ] AI-уроки по обходу препятствий

---

## Правила проекта
1. Не создавать документацию без запроса — только код и исправления
2. Дело не в количестве, а в качестве
3. Улучшать в dev → проверять → отправлять в main
4. Всегда синхронизировать изменения между ветками

## Команды
```bash
# Запуск разработки
npm run dev

# Сборка
npm run build

# Тесты
npm test

# Линтинг
npm run lint
```

## Структура API
```
/api/algorithms
  ├── route.ts (GET, POST)
  ├── run/route.ts (POST)
  ├── search/route.ts (GET)
  ├── clone/route.ts (POST)
  ├── [id]/route.ts (GET)
  ├── favorite/route.ts (GET, POST, DELETE)
  └── history/route.ts (GET)

/api/scenarios
  ├── route.ts (GET, POST, PUT, DELETE)
  ├── search/route.ts (GET)
  ├── clone/route.ts (POST)
  └── [id]/route.ts (GET)
```
