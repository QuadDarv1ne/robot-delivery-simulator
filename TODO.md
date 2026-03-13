# TODO - Robot Delivery Simulator

## Текущее состояние (13 марта 2026)

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
- Подсветка синтаксиса в редакторе алгоритмов (react-syntax-highlighter)
- Редактор маршрута для сценариев (точки маршрута)
- Панель ручного управления роботом (вперёд/назад/повороты)
- Централизованное логирование (logger.ts, api-error.ts)
- Утилиты форматирования (format.ts)
- React hooks (useDebounce, useLocalStorage, useMediaQuery, useOnlineStatus)
- Улучшена обработка ошибок в auth-context

### 🔄 В работе
- Синхронизация dev и main завершена

### 📋 План работ

#### Критичные
- [ ] Протестировать поиск алгоритмов в UI
- [ ] Протестировать клонирование алгоритмов
- [ ] Протестировать поиск сценариев
- [ ] Протестировать клонирование сценариев
- [ ] Проверить работу всех API endpoints через Postman/cURL

#### Улучшения
- [ ] Добавить автодополнение в редакторах кода
- [ ] Реализовать недостающие WebSocket команды для симулятора
- [ ] Добавить тесты для новых hooks
- [ ] Оптимизировать размер сборки

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
