# 📝 Changelog

Все заметные изменения в проекте.

## [1.1.0] - 13 марта 2026

### ✨ Новое

#### UI Компоненты
- **Поиск алгоритмов** — Добавлена панель поиска с фильтрами по названию и языку
- **Клонирование алгоритмов** — Кнопка быстрого клонирования для создания копий алгоритмов
- **Вкладка "Сценарии"** — Новая вкладка в главном интерфейсе симулятора
- **Поиск сценариев** — Фильтрация по названию, сложности и погоде
- **Клонирование сценариев** — Быстрое создание копий сценариев

#### API Эндпоинты
- `GET /api/algorithms/search` — Поиск алгоритмов с пагинацией
- `GET /api/algorithms/[id]` — Получение алгоритма по ID с историей запусков
- `POST /api/algorithms/clone` — Клонирование алгоритма
- `GET /api/scenarios/search` — Поиск сценариев с фильтрами
- `POST /api/scenarios/clone` — Клонирование сценария

#### Документация
- `docs/API.md` — Полная документация всех API эндпоинтов
- `docs/API-EXAMPLES.md` — Примеры кода на cURL, JavaScript, Python
- `docs/DEVELOPMENT-TIPS.md` — Советы по разработке и отладке
- `CHANGELOG.md` — История изменений проекта

### 🔧 Улучшения

#### Algorithm Editor
- Добавлена панель поиска с фильтрами (название, язык)
- Добавлена кнопка сброса поиска
- Добавлена кнопка клонирования для каждого алгоритма
- Улучшена адаптивность toolbar — кнопки переносятся на новую строку
- Статус "Ничего не найдено" при пустых результатах поиска

#### Scenario Editor
- Добавлена панель поиска с фильтрами (название, сложность, погода)
- Добавлена кнопка клонирования для каждого сценария
- Добавлена кнопка сброса фильтров
- Улучшена компоновка элементов управления

#### Simulator Content
- Добавлена новая вкладка "Сценарии" в главное меню
- Интегрирован компонент ScenarioEditor
- Обновлена навигация между вкладками

### 📚 Документация

#### Обновления README.md
- Добавлена таблица доступных npm команд (21 команда)
- Расширена секция API с новыми эндпоинтами
- Добавлены ссылки на новую документацию
- Улучшена структура и читаемость

#### Обновления README.en.md
- Добавлена таблица available commands
- Расширена API секция
- Добавлены troubleshooting советы

### 🐛 Исправления

#### Algorithm Editor
- **Исправлен баг** — кнопки toolbar больше не выходят за пределы контейнера
- **Исправлен баг** — некорректное отображение при малой ширине экрана

### 🔒 Безопасность

- Все новые API эндпоинты требуют аутентификации
- Проверка прав доступа для операций клонирования
- Валидация входных данных на сервере

### 📦 Технические изменения

#### Новые зависимости
- `lucide-react` — новые иконки: Search, Copy, Filter, Share2

#### Изменения в файлах
```
src/
├── app/
│   ├── api/
│   │   ├── algorithms/
│   │   │   ├── [id]/route.ts          ← Новый
│   │   │   ├── clone/route.ts         ← Новый
│   │   │   └── search/route.ts        ← Новый
│   │   └── scenarios/
│   │       ├── clone/route.ts         ← Новый
│   │       └── search/route.ts        ← Новый
│   └── simulator-content.tsx          ← Обновлён
├── components/
│   ├── algorithm-editor.tsx           ← Обновлён
│   └── scenario-editor.tsx            ← Обновлён
docs/
├── API.md                             ← Новый
├── API-EXAMPLES.md                    ← Новый
├── DEVELOPMENT-TIPS.md                ← Новый
└── CHANGELOG.md                       ← Новый
```

### 🎯 Примеры использования

#### Поиск алгоритмов
```javascript
// GET /api/algorithms/search?q=навигация&language=python
const response = await fetch('/api/algorithms/search?q=навигация&language=python');
const data = await response.json();
```

#### Клонирование алгоритма
```javascript
// POST /api/algorithms/clone
const response = await fetch('/api/algorithms/clone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 'algo-id' })
});
```

#### Поиск сценариев
```javascript
// GET /api/scenarios/search?difficulty=medium&weather=sunny
const response = await fetch('/api/scenarios/search?difficulty=medium&weather=sunny');
const data = await response.json();
```

---

## [1.0.0] - 1 марта 2026

### ✨ Начальный релиз

- Базовая функциональность симулятора
- Редактор алгоритмов (Python/JavaScript)
- Редактор сценариев
- Интеграция с WebSocket для данных сенсоров
- Система авторизации и ролей
- Рейтинг пользователей
- Аналитика и статистика

---

**Формат:** Проект следует [Semantic Versioning](https://semver.org/lang/ru/)
**Стиль:** На основе [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/)
