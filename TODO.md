# 📝 TODO — Robot Delivery Simulator

**Последнее обновление:** 2026-03-12  
**Статус:** v1.0.0 опубликован

---

## ✅ Выполнено

- [x] Публикация репозитория на GitHub
- [x] Обновление README (русский основной, английский отдельно)
- [x] Настройка `.env` для локальной разработки
- [x] Исправление ошибок TypeScript в core модулях
- [x] Настройка GitHub Pages workflow
- [x] Создание шаблонов Issues (русские + английские)
- [x] Создание тега v1.0.0
- [x] Настройка `.gitignore` для IDE
- [x] Включение GitHub Insights (Issues, Projects)

---

## 🔥 Приоритетные задачи

### 1. Проверка работы после исправлений
- [ ] Протестировать авторизацию (login/register)
- [ ] Проверить работу WebSocket подключения
- [ ] Проверить отображение симулятора
- [ ] Проверить карту Leaflet
- [ ] Проверить 3D Lidar визуализацию
- [ ] Проверить панель аналитики
- [ ] Проверить экспорт отчётов (PDF)

### 2. GitHub Actions CI/CD
- [ ] Проверить workflow `ci.yml`
- [ ] Настроить автозапуск тестов при PR
- [ ] Добавить проверку type-check в CI
- [ ] Настроить автодеплой на Vercel/Railway

### 3. Production релиз v1.0.0
- [ ] Обновить CHANGELOG.md с последними изменениями
- [ ] Создать релиз на GitHub из тега v1.0.0
- [ ] Добавить release notes с описанием функций
- [ ] Прикрепить скриншоты/гифки

---

## 📈 Улучшения качества

### Тестирование
- [ ] Настроить Jest для unit-тестов
- [ ] Настроить Playwright для E2E тестов
- [ ] Добавить тесты для API endpoints:
  - [ ] `/api/auth/login`
  - [ ] `/api/auth/register`
  - [ ] `/api/user/me`
  - [ ] `/api/leaderboard`
- [ ] Покрытие тестами > 70%

### Производительность
- [ ] Проверить размер бандла (`npm run build`)
- [ ] Оптимизировать загрузку Three.js
- [ ] Lazy loading для тяжёлых компонентов
- [ ] Code splitting для роутов

### Безопасность
- [ ] Проверить валидацию всех API endpoints
- [ ] Добавить rate limiting
- [ ] Проверить обработку ошибок
- [ ] Audit зависимостей (`npm audit`)

---

## 🐛 Известные проблемы

### Критические
- [ ] WebSocket сервер требует отдельного запуска
- [ ] PDF экспорт зависит от Python + reportlab

### Средние
- [ ] next-auth не совместим с Next.js 16 без peer deps warning
- [ ] Некоторые типы в Prisma требуют ручной типизации

### Мелкие
- [ ] Предупреждения о CRLF/LF в git
- [ ] Примеры в `examples/` и `skills/` имеют ошибки типов (не критично)

---

## 🎯 Долгосрочные цели

### Функционал
- [ ] Unity WebGL полная интеграция
- [ ] ROS2 bridge поддержка
- [ ] Мульти-роботная симуляция
- [ ] Редактор пользовательских сценариев
- [ ] Система лидерборда в реальном времени
- [ ] Мобильное приложение-компаньон

### Инфраструктура
- [ ] Docker образ для production
- [ ] Helm chart для Kubernetes
- [ ] Мониторинг (Prometheus + Grafana)
- [ ] Логирование (ELK stack)

### Документация
- [ ] API документация (OpenAPI/Swagger)
- [ ] Видео-туториалы
- [ ] Примеры алгоритмов для студентов
- [ ] Руководство по развёртыванию

---

## 📊 Метрики проекта

```
Файлов:        ~370
Строк кода:    ~68,000
Зависимостей:  940+
API endpoints: 20+
Компонентов:   17+
```

---

## 🔗 Полезные ссылки

- **Репозиторий:** https://github.com/QuadDarv1ne/robot-delivery-simulator
- **GitHub Projects:** https://github.com/QuadDarv1ne/robot-delivery-simulator/projects
- **GitHub Issues:** https://github.com/QuadDarv1ne/robot-delivery-simulator/issues
- **GitHub Actions:** https://github.com/QuadDarv1ne/robot-delivery-simulator/actions

---

## 📝 Заметки

### Команды для разработки
```bash
# Установка зависимостей
npm install --legacy-peer-deps

# Генерация Prisma
npx prisma generate
npx prisma db push

# Запуск dev сервера
npm run dev

# Проверка типов
npm run type-check

# Сборка
npm run build

# Тесты
npm run test
npm run test:e2e
```

### Ветки
- `main` — стабильная версия
- `dev` — разработка
- `feature/*` — новые функции

### Деплой
- Vercel: автодеплой из `main`
- Railway: через Docker
- Docker: `docker-compose up -d`
