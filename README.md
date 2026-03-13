# 🤖 Симулятор Робота-Доставщика

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748?logo=prisma)](https://www.prisma.io/)

Комплексный 3D симулятор робота-доставщика с интеграцией Unity WebGL, поддержкой ROS/ROS2 и визуализацией сенсоров в реальном времени. Идеально подходит для образовательных целей, исследований в области робототехники и разработки алгоритмов.

![Превью симулятора](./docs/images/simulator-preview.png)

## 📖 Документация

- [English Documentation](./README.en.md)
- [Документация на русском](./README.md) (текущая)

## ✨ Возможности

### 🎮 Симуляция
- **Интеграция Unity WebGL** — Встроенная 3D среда симуляции
- **Данные сенсоров в реальном времени** — GPS, Lidar, IMU, энкодеры с частотой 10 Гц
- **Физически достоверное движение** — Реалистичная динамика робота
- **Обнаружение препятствий** — Тестирование системы обхода препятствий

### 🗺️ Визуализация
- **Интеграция OpenStreetMap** — Отображение реальных карт с помощью Leaflet
- **3D облако точек Lidar** — Визуализация на Three.js с цветовой кодировкой по расстоянию
- **Отслеживание робота в реальном времени** — Отображение позиции и траектории
- **Планирование маршрута** — Визуальная система путей и контрольных точек

### 📦 Сценарии доставки
- **4 встроенных миссии** — Различные уровни сложности
- **Погодные условия** — Солнце, дождь, снег
- **Трафик** — Низкий, средний, высокий
- **Сложность препятствий** — Настраиваемая плотность

### 📊 Аналитика
- **Графики производительности** — Отслеживание скорости, батареи, расстояния
- **История сессий** — Детальные записи доставок
- **Метрики успешности** — Статистика производительности пользователя
- **Отслеживание столкновений** — Анализ безопасности

### 🔐 Авторизация и управление
- **Ролевой доступ** — Студент, Преподаватель, Администратор
- **Восстановление пароля** — Безопасный процесс сброса
- **Управление пользователями** — Полноценная админ-панель
- **Система достижений** — Геймификация для студентов

### 🔌 Интеграция
- **WebSocket API** — Потоковая передача данных в реальном времени (порт 3003)
- **REST API** — Полные CRUD операции
- **Готовность к ROS/ROS2** — Поддержка внешних систем управления
- **Тестирование алгоритмов** — Загрузка и тестирование пользовательских алгоритмов
- **Редактор кода** — Встроенный редактор для Python и JavaScript с подсветкой синтаксиса

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- npm или bun
- SQLite (встроено)

### 📋 Пошаговая инструкция по запуску

#### Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/QuadDarv1ne/robot-delivery-simulator.git
cd robot-delivery-simulator
```

#### Шаг 2: Настройка переменных окружения

```bash
# Скопируйте пример переменных окружения
cp .env.example .env
```

> **Важно:** В файле `.env` измените `NEXTAUTH_SECRET` на случайную строку.  
> Для генерации используйте: `openssl rand -base64 32`

#### Шаг 3: Установка зависимостей

```bash
npm install
```

#### Шаг 4: Настройка базы данных

```bash
# Сгенерируйте Prisma клиент
npx prisma generate

# Создайте базу данных (примените схему)
npx prisma db push
```

#### Шаг 5: Создание демо-пользователя

```bash
# Заполните базу тестовыми данными
npm run seed
```

#### Шаг 6: Запуск приложения

**Вариант A — Одна команда (оба сервера):**
```bash
npm run dev:all
```

**Вариант B — В двух терминалах отдельно:**

*Терминал 1 — Next.js приложение (порт 3000):*
```bash
npm run dev
```

*Терминал 2 — WebSocket сервер (порт 3003):*
```bash
npm run websocket
```

#### Шаг 7: Открыть в браузере

Перейдите на **http://localhost:3000**

### 🔑 Демо-доступ

| Поле | Значение |
|------|----------|
| **Email** | `demo@test.ru` |
| **Пароль** | `demo123` |

### ⚠️ Решение проблем

**Ошибка подключения к WebSocket:**
- Убедитесь, что сервер на порту 3003 запущен
- Проверьте, нет ли конфликта портов

**Ошибка базы данных:**
```bash
# Удалите старую БД и создайте заново
rm prisma/dev.db
npx prisma db push
npm run seed
```

**Проблемы с зависимостями:**
```bash
# Очистите кэш и переустановите
rm -rf node_modules package-lock.json
npm install
```

## 🛠️ Доступные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск Next.js приложения (порт 3000) |
| `npm run websocket` | Запуск WebSocket сервера (порт 3003) |
| `npm run dev:all` | Запуск обоих серверов одновременно |
| `npm run build` | Сборка для продакшена |
| `npm run start` | Запуск продакшен-сервера |
| `npm run lint` | Проверка кода линтером |
| `npm run lint:fix` | Исправление ошибок линтера |
| `npm run type-check` | Проверка типов TypeScript |
| `npm run test` | Запуск unit-тестов |
| `npm run test:watch` | Тесты в режиме наблюдения |
| `npm run test:e2e` | Запуск e2e тестов Playwright |
| `npm run test:coverage` | Тесты с покрытием кода |
| `npm run db:push` | Применить схему БД |
| `npm run db:generate` | Генерация Prisma клиента |
| `npm run db:migrate` | Создание миграции БД |
| `npm run db:reset` | Сброс базы данных |
| `npm run db:studio` | Открыть Prisma Studio |
| `npm run seed` | Заполнение БД тестовыми данными |
| `npm run docker:build` | Сборка Docker образа |
| `npm run docker:run` | Запуск Docker контейнера |

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Симулятор │  │   Карта  │  │ 3D Lidar │  │Аналитика │   │
│  │          │  │          │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│                  API слой (REST + WebSocket)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth сервис │  │ User сервис  │  │ Data сервис  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                   База данных (SQLite + Prisma)              │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Структура проекта

```
robot-delivery-simulator/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API маршруты
│   │   │   ├── admin/          # Админ-эндпоинты
│   │   │   ├── auth/           # Авторизация
│   │   │   └── user/           # Управление пользователями
│   │   ├── page.tsx            # Главная страница
│   │   └── simulator-content.tsx
│   ├── components/
│   │   ├── ui/                 # Компоненты shadcn/ui
│   │   ├── admin-panel.tsx     # Панель администратора
│   │   ├── analytics-panel.tsx # Графики аналитики
│   │   ├── auth-form.tsx       # Вход/Регистрация
│   │   ├── delivery-scenarios.tsx
│   │   ├── lidar-3d.tsx        # Визуализация Three.js
│   │   ├── robot-map.tsx       # Карта Leaflet
│   │   └── user-profile.tsx
│   └── lib/
│       ├── auth.ts             # Конфигурация NextAuth
│       ├── auth-context.tsx    # Провайдер авторизации
│       └── prisma.ts           # Клиент базы данных
├── prisma/
│   └── schema.prisma           # Схема базы данных
├── mini-services/
│   └── robot-simulator-server/ # WebSocket сервер
├── public/
│   └── images/
├── docs/
│   └── images/
├── docker/                     # Конфигурации Docker
├── .github/                    # GitHub workflows
└── scripts/                    # Служебные скрипты
```

## 🔧 Конфигурация

### Переменные окружения

Создайте файл `.env` в корневой директории:

```env
# База данных
DATABASE_URL="file:./dev.db"

# Авторизация
NEXTAUTH_SECRET="ваш-секретный-ключ"
NEXTAUTH_URL="http://localhost:3000"

# Опционально: Внешние сервисы
ROS_BRIDGE_URL="ws://localhost:9090"
UNITY_WEBGL_URL="http://localhost:8080"
```

### Схема базы данных

Приложение использует Prisma с SQLite. Основные модели:

- **User** — Учётные записи пользователей с ролями (student/teacher/admin)
- **UserSession** — Управление сессиями
- **DeliveryResult** — Записи о доставках
- **Algorithm** — Хранение пользовательских алгоритмов
- **Achievement** — Достижения пользователей

## 🌐 API Справочник

Полная документация API доступна в файле [docs/API.md](./docs/API.md).

Примеры использования с кодом на JavaScript и Python: [docs/API-EXAMPLES.md](./docs/API-EXAMPLES.md).

### Авторизация

```http
POST /api/auth/login          # Вход
POST /api/auth/register       # Регистрация
POST /api/auth/logout         # Выход
POST /api/auth/forgot-password # Забыли пароль
POST /api/auth/reset-password  # Сброс пароля
```

### Управление пользователем

```http
GET  /api/user/me             # Текущий пользователь
PATCH /api/user/profile       # Обновить профиль
```

### Алгоритмы

```http
GET  /api/algorithms          # Список алгоритмов
GET  /api/algorithms?id={id}  # Алгоритм по ID
POST /api/algorithms          # Создать алгоритм
PUT  /api/algorithms          # Обновить алгоритм
DELETE /api/algorithms?id={id}# Удалить алгоритм
POST /api/algorithms/clone    # Клонировать алгоритм
GET  /api/algorithms/search   # Поиск алгоритмов
POST /api/algorithms/run      # Запуск симуляции
```

### Админ-эндпоинты

```http
GET  /api/admin/stats         # Статистика
GET  /api/admin/users         # Список пользователей
PATCH /api/admin/users        # Редактировать пользователя
DELETE /api/admin/users       # Удалить пользователя
```

### WebSocket события

Подключение к `ws://localhost:3003`

```javascript
// Получаемые события
'sensor_data'      // GPS, Lidar, IMU, энкодеры
'delivery_update'  // Прогресс миссии
'robot_status'     // Батарея, скорость, состояние

// Отправляемые события
'start_mission'    // Начать доставку
'stop_mission'     // Завершить миссию
'update_route'     // Изменить маршрут
```

## 🐳 Docker развертывание

```bash
# Сборка и запуск через Docker Compose
docker-compose up -d

# Или ручная сборка
docker build -t robot-simulator .
docker run -p 3000:3000 -p 3003:3003 robot-simulator
```

## ☁️ Облачное развертывание

### Vercel

[![Развернуть на Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/QuadDarv1ne/robot-delivery-simulator)

```bash
# Установка Vercel CLI
npm i -g vercel

# Развертывание
vercel
```

### Railway

[![Развернуть на Railway](https://railway.app/button.svg)](https://railway.app/template/robot-simulator)

### Собственный сервер

См. [руководство по развертыванию](./docs/deployment.ru.md) для подробных инструкций.

## 🧪 Тестирование

```bash
# Запуск unit-тестов
npm run test

# Запуск e2e тестов
npm run test:e2e

# Запуск с покрытием
npm run test:coverage
```

## 🤝 Участие в разработке

Мы приветствуем вклад в развитие проекта! Пожалуйста, ознакомьтесь с [Руководством по участию](./CONTRIBUTING.ru.md).

1. Сделайте форк репозитория
2. Создайте ветку функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📝 Лицензия

Этот проект лицензирован под лицензией MIT — см. файл [LICENSE](./LICENSE) для подробностей.

## 🙏 Благодарности

- [Next.js](https://nextjs.org/) — React Framework
- [Three.js](https://threejs.org/) — 3D графика
- [Leaflet](https://leafletjs.com/) — Карты
- [shadcn/ui](https://ui.shadcn.com/) — UI компоненты
- [Prisma](https://www.prisma.io/) — ORM для базы данных
- [ROS](https://www.ros.org/) — Robot Operating System

## 📞 Поддержка

- 📧 Email: support@robotsimulator.dev
- 💬 Discord: [Присоединяйтесь к сообществу](https://discord.gg/robotsimulator)
- 📖 Документация: [docs.robotsimulator.dev](https://docs.robotsimulator.dev)
- 🐛 Проблемы: [GitHub Issues](https://github.com/QuadDarv1ne/robot-delivery-simulator/issues)

## 🗺️ Дорожная карта

- [ ] Полная интеграция Unity WebGL
- [ ] Поддержка ROS2 bridge
- [ ] Мульти-роботная симуляция
- [ ] Редактор пользовательских сценариев
- [ ] Система лидерборда
- [ ] Мобильное приложение-компаньон
- [ ] AI-уроки по обходу препятствий

---

Сделано с ❤️ командой Robot Simulator
