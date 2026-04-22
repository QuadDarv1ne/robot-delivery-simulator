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
- API endpoints (поиск, клонирование, избранное, история, запуск)
- Документация (docs/API.md, docs/API-EXAMPLES.md, docs/DEVELOPMENT-TIPS.md)
- Zod валидация для всех API endpoints
- Toast уведомления для UX
- Пагинация на клиенте (алгоритмы, сценарии)
- Сортировка результатов поиска
- Debouncing для поиска
- WebSocket error handling
- Тесты для API endpoints (Jest)
- Подсветка синтаксиса в редакторах алгоритмов
- Редактор маршрута для сценариев
- Панель ручного управления роботом
- Централизованное логирование (logger.ts, api-error.ts)
- Утилиты форматирования (format.ts)
- React hooks (useDebounce, useLocalStorage, useMediaQuery, useOnlineStatus)
- Улучшена обработка ошибок в auth-context
- Тесты для кастомных хуков
- Тесты для API endpoints клонирования
- WebSocket команды для симулятора
- Monaco Editor с автодополнением кода
- Оптимизация сборки (turbopack, chunk splitting)
- Рефакторинг simulator-content.tsx (вынесены компоненты)
- Создан хук useSimulator для управления состоянием WebSocket
- Покрытие тестами: 49 тестов проходят
- Jest конфигурация разделена на 4 проекта
- E2E тесты для критических путей (Playwright)
- CI/CD pipeline (GitHub Actions)
- TypeScript компиляция проходит без ошибок

### 🔄 В работе
- Полная интеграция Unity WebGL (тестирование с реальным билдом)
- Оптимизация производительности Unity WebGL

### ⚠️ Проблемы качества

#### 🔴 КРИТИЧЕСКИЕ (требуют исправления)
- [x] **CRITICAL: Report export — hardcoded Linux paths + execSync**
  - `src/app/api/reports/export/route.ts`: пути `/home/z/my-project/download`, `/usr/share/fonts/...`
  - `execSync` с пользовательскими данными — риск command injection
  - Не работает на Windows и большинстве серверов
- [x] **CRITICAL: Auth secret fallback к захардкоженному значению**
  - `src/lib/auth.ts`: `secret: process.env.NEXTAUTH_SECRET || "robot-simulator-secret-key-2024"`
  - Если переменная не задана — сессии можно подделать
- [ ] **CRITICAL: Algorithm simulation — фейковая симуляция с Math.random()**
  - `src/app/api/algorithms/run/route.ts`: не выполняет код, использует regex + random
  - Результаты недетерминированы для одного и той же входных данных
- [ ] **CRITICAL: In-memory rate limiting — не работает в production**
  - `src/lib/rate-limit.ts`: данные в Map, теряются при рестарте
  - Не работает при нескольких инстансах (Vercel, Railway)

#### 🟡 ВЫСОКИЙ ПРИОРИТЕТ
- [x] **WebSocket URL захардкожен к localhost**
  - `use-simulator.ts:36`, `use-multi-robot-simulator.ts:27`
  - Нет поддержки environment variable
- [x] **Несогласованный формат ошибок в API**
  - Некоторые endpoint'ы используют `createErrorResponse`, другие — ручной `NextResponse.json({ error })`
- [x] **updateUser silently fails**
  - `auth-context.tsx:99`: ошибка проглатывается без уведомления
- [ ] **Email verification не функционален**
  - Модель есть, routes есть, но SMTP не настроен (закомментирован в .env.example)
- [ ] **Password reset tokens возвращаются в response (demo mode)**
  - `forgot-password/route.ts:57`: токен виден в ответе API
- [x] **Flawed bestTime calculation**
  - `algorithms/run/route.ts`: `bestTime: result.success ? { decrement: result.timeElapsed }` — логика неверна
- [ ] **Leaderboard x-user-id header не устанавливается**
  - Фронтенд не отправляет этот header
- [ ] **CORS origin: '*' на WebSocket серверах**
  - Разрешает любые origin
- [ ] **Memory leak risk в rate limiter**
  - Map может расти при постоянном трафике

### 📋 План работ

#### 🔴 Критические исправления (в процессе)
- [x] Исправить report export — убрать hardcoded пути, execSync, добавить кроссплатформенность
- [x] Убрать fallback auth secret — требовать NEXTAUTH_SECRET в production
- [ ] Реализовать настоящую симуляцию алгоритмов или честно помечать как "демо"
- [ ] Rate limiting — добавить опцию Redis или至少 persistent storage

#### 🟡 Улучшения кода
- [x] Добавить env variable поддержку для WebSocket URL
- [x] Унифицировать формат ошибок во всех API endpoints
- [x] Добавить proper error handling в updateUser
- [x] Исправить bestTime calculation logic
- [ ] Добавить retry logic для WebSocket соединений
- [ ] Оптимизировать re-renders (React.memo, useMemo)
- [ ] Добавить graceful degradation для Unity WebGL
- [ ] Улучшить accessibility (a11y) для интерактивных компонентов
- [ ] Добавить Zod валидацию для WebSocket сообщений
- [ ] Добавить пагинацию на GET /api/algorithms

#### 🟢 Фичи из roadmap
- [ ] Полная интеграция Unity WebGL (тестирование с реальным билдом)
- [ ] Мульти-роботная симуляция
- [ ] Редактор пользовательских сценариев
- [ ] Система лидерборда
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
