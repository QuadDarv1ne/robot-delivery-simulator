# Roadmap — Robot Delivery Simulator + RTL-SDR Geoanalytics

## Robot Delivery Simulator

### ✅ Завершено
- Поиск алгоритмов по названию и языку (Python/JavaScript)
- Клонирование алгоритмов
- Поиск сценариев с фильтрами (сложность, погода)
- Клонирование сценариев
- API endpoints (algorithms, scenarios, auth, admin, leaderboard)
- Документация (docs/API.md, docs/API-EXAMPLES.md, docs/DEVELOPMENT-TIPS.md)
- Zod валидация для всех API endpoints
- Toast уведомления для UX
- Monaco Editor с автодополнением кода (Python/JavaScript)
- Оптимизация сборки (turbopack, chunk splitting)
- Рефакторинг simulator-content.tsx (вынесены компоненты: LidarView, IMUView, ControlPanel, UnityWebGLPlayer)
- Создан хук useSimulator для управления состоянием WebSocket
- Покрытие тестами: 42 теста проходят (API, Components, Hooks, Utils)
- Jest конфигурация разделена на 4 проекта для правильной среды тестирования
- Типизация WebSocket событий (shared types, type-safe socket)
- Rate limiting для auth и admin endpoints

### ⚠️ Проблемы качества (решено)
- [x] Тесты hooks failing — `window is not defined` (исправлено: projects config в jest.config.ts)
- [x] console.error в health check тесте (исправлено: mock console.error)
- [x] simulator-content.tsx — 814 строк (рефакторинг: вынесены компоненты)

### 📋 План работ

#### Улучшения
- [ ] Продолжить оптимизацию размера сборки
- [x] Рефакторинг simulator-content.tsx на меньшие компоненты
- [x] Покрыть тестами компоненты (Button, Card, Badge, Progress, Input, Separator)
- [x] Покрыть тестами Leaderboard и AnalyticsPanel (49 тестов всего)
- [x] Улучшить типизацию WebSocket событий (shared types, type-safe socket)
- [x] Добавить rate limiting к чувствительным endpoints (forgot-password, reset-password, admin/users)
- [x] Добавить e2e тесты для критических путей
- [x] Добавить обработку ошибок в API endpoints (algorithms: GET/POST/PUT/DELETE)
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

## RTL-SDR Geoanalytics

### ✅ Завершено
| Компонент | Статус |
|-----------|--------|
| SDR сервер (эмуляция) | ✅ Готово |
| SDR панель (спектр, waterfall) | ✅ Готово |
| Геоаналитика (карта, heatmap) | ✅ Готово |
| Навигация (предупреждения) | ✅ Готово |
| TypeScript компиляция | ✅ Без ошибок |

### 📋 План работ

#### Этап 1: Оптимизация и стабилизация
- [ ] Оптимизация Canvas рендеринга спектра (requestAnimationFrame, throttling)
- [ ] Оптимизация waterfall-диаграммы (ограничение буфера, WebGL при необходимости)
- [ ] Уменьшение трафика WebSocket (отправка дельт вместо полных данных)

#### Этап 2: Backend и хранение данных
- [ ] Prisma модель `sdr_detection` (тип, координаты, RSSI, timestamp, позывной)
- [ ] `GET /api/sdr/history` — история обнаружений
- [ ] `GET /api/sdr/stats` — статистика за период
- [ ] `GET /api/sdr/heatmap` — данные для heatmap
- [ ] Автосохранение обнаружений каждые 30 секунд

#### Этап 3: Интеграция с доставкой
- [ ] SDR-помехи как фактор в сценариях доставки
- [ ] Алгоритм обхода помех на основе SDR-данных
- [ ] Оценка качества связи (RSSI как индикатор радиошума)
- [ ] Новые метрики: `sdrInterferenceScore`, `signalQuality`

#### Этап 4: Тесты
- [ ] Unit-тесты SDR генераторов данных
- [ ] Тесты хука `useSDRForNavigation`
- [ ] Интеграционные тесты WebSocket коммуникации
- [ ] E2E тесты вкладок SDR и Геоаналитика

#### Этап 5: Подключение реального RTL-SDR
- [ ] Установка rtl-sdr драйверов (Windows/Linux/macOS)
- [ ] Интеграция с `rtl_tcp`
- [ ] Подключение `dump1090` / `readsb` (ADS-B)
- [ ] Подключение `aisdecoder` / `gpsd` (AIS)
- [ ] Подключение `direwolf` / `multimon-ng` (APRS)
- [ ] Замена эмуляции на реальный ввод в sdr-server/index.ts

---

*Обновлено: 2026-04-12*
