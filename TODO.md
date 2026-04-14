# TODO - Robot Delivery Simulator

## Последнее обновление: 14 апреля 2026

### 📊 Состояние проекта

**Ветки:**
- `main` — стабильная версия (текущая)
- `dev` — ветка разработки
- `feature/improvements` — фичи и улучшения

**Статус:** Проект стабилен, есть 4 ошибки линтинга для исправления

---

## Текущее состояние (14 апреля 2026)

### ✅ Завершено
- Шаблоны сценариев для быстрого создания миссий (8 шаблонов: городской, парк, кампус, склад, промышленный, зимний, дождь, ночной)
- Компонент ScenarioTemplateSelector с поиском, фильтрами и предпросмотром
- Полная интеграция Unity WebGL с двусторонней связью через WebSocket
- Компонент UnityWebGLPlayer с загрузкой, обработкой ошибок и состоянием
- Хук useUnityBridge для удобной работы с Unity ↔ React
- Примеры Unity скриптов (ReactBridge, RobotController, SensorManager, SimulationManager, NetworkManager)
- Документация по интеграции Unity (docs/UNITY-INTEGRATION.md)
- Импорт/экспорт сценариев в JSON формате
- Клиентская валидация формы с Zod схемами
- Undo/Redo для редактирования сценариев (хук useUndoRedo)
- Горячие клавиши Ctrl+Z/Ctrl+Y для отмены/повтора
- Автосохранение черновика сценария (debounce 2 сек)
- Восстановление черновика при открытии редактора
- Превью маршрута на карте до запуска
- Настройки робота (тип, количество, грузоподъёмность, хрупкий груз)
- Визуализация зон препятствий с кругами радиуса
- Кнопка быстрого запуска сценария в симуляторе
- Улучшенная обработка ошибок API (Prisma, Zod, retryable)
- Тесты для useUndoRedo хука (9 тестов)
- Drag & Drop точек маршрута на Leaflet карте
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
- Полная интеграция Unity WebGL (тестирование с реальным билдом)
- Оптимизация производительности Unity WebGL

### ⚠️ Проблемы качества
- [x] **Linting errors (4)** — исправлены:
  - `use-sdr-navigation.ts:100` — setState в useEffect (исправлено: useMemo вместо useEffect+setState)
  - `use-undo-redo.ts:19` — ref update во время render (исправлено: удалён неиспользуемый ref)
  - `use-unity-bridge.ts:8,49` — unsafe Function type (исправлено: `(data: unknown) => void`)
- [x] Тесты hooks failing — `window is not defined` (исправлено: projects config в jest.config.ts)
- [x] console.error в health check тесте — ошибка логируется при штатном тесте (исправлено: mock console.error)
- [x] simulator-content.tsx — 814 строк, слишком большой файл (рефакторинг: вынесены компоненты)
- [x] Мульти-роботная симуляция — серверная часть не поддерживала команды (исправлено: добавлены обработчики команд)
- [ ] **TypeScript error** — `mini-services/sdr-server/index.ts` не находит модуль `socket.io` (отсутствует package.json)
- [ ] **tsconfig.json** — `noImplicitAny: false` (рекомендуется включить для строгой типизации)

### 📋 План работ

#### 🔴 Критические исправления
- [ ] Добавить `package.json` в `mini-services/sdr-server/` с зависимостями (socket.io)
- [ ] Включить `noImplicitAny: true` в tsconfig.json и исправить все неявные `any`
- [ ] Покрыть тестами критические компоненты:
  - [ ] Simulator components (LidarView, IMUView, ControlPanel, UnityWebGLPlayer)
  - [ ] SDR components (sdr-panel, geoanalytics, heatmap-layer)
  - [ ] Hooks (useSimulator, useUnityBridge, useRos2Bridge, useMultiRobotSimulator, useSdrNavigation)
  - [ ] API endpoints (auth, user profile, reports export)
  - [ ] Утилиты (lib/format.ts, lib/rate-limit.ts)
- [ ] Добавить тесты для mini-services (robot-simulator-server, sdr-server, ros2-bridge)

#### 🟡 Улучшения кода
- [ ] Добавить rate limiting к API endpoints (сейчас есть только lib/rate-limit.ts без использования)
- [ ] Улучшить обработку ошибок в auth-context (сейчас базовая обработка)
- [ ] Добавить Zod валидацию для WebSocket сообщений (типизация есть, но нет валидации)
- [ ] Добавить retry logic для WebSocket соединений
- [ ] Оптимизировать re-renders в simulator-content.tsx (React.memo, useMemo)
- [ ] Добавить graceful degradation для Unity WebGL при отсутствии загрузки
- [ ] Улучшить accessibility (a11y) для всех интерактивных компонентов

#### 🟢 Фичи из roadmap
- [ ] Редактор пользовательских сценариев (UI для создания/редактирования)
- [ ] Полная интеграция Unity WebGL (тестирование с реальным билдом)
- [ ] Мобильное приложение-компаньон
- [ ] AI-уроки по обходу препятствий

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
- [x] Добавить ROS2 Bridge с поддержкой rosbridge_suite протокола

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
