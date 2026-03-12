# 🤖 Robot Delivery Simulator v1.0.0

Первый стабильный релиз симулятора робота-доставщика!

## ✨ Что включено

### 🎮 Симуляция
- Unity WebGL интеграция
- Данные сенсоров в реальном времени (GPS, Lidar, IMU, энкодеры)
- Физически достоверное движение робота
- Обнаружение препятствий

### 🗺️ Визуализация
- OpenStreetMap с Leaflet
- 3D облако точек Lidar на Three.js
- Отслеживание робота в реальном времени
- Планирование маршрута

### 📦 Сценарии
- 4 встроенных миссии с разной сложностью
- Погодные условия (солнце, дождь, снег)
- Разный уровень трафика
- Настраиваемые препятствия

### 📊 Аналитика
- Графики производительности
- История сессий
- Метрики успешности
- Отслеживание столкновений

### 🔐 Авторизация
- Ролевой доступ (студент, преподаватель, администратор)
- Восстановление пароля
- Система достижений

### 🔌 API
- WebSocket API (порт 3003)
- REST API
- Готовность к ROS/ROS2

## 🚀 Быстрый старт

```bash
git clone https://github.com/QuadDarv1ne/robot-delivery-simulator.git
cd robot-delivery-simulator
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

### Демо-доступ
- **Email:** demo@test.ru
- **Пароль:** demo123

## 📝 Известные ограничения

- Требуется Node.js 18+
- Для установки зависимостей используйте `--legacy-peer-deps`

## 📚 Документация

- [README](./README.md) — основная документация (русский)
- [README.en.md](./README.en.md) — English documentation
- [CONTRIBUTING.ru.md](./CONTRIBUTING.ru.md) — руководство по участию

## 🐛 Проблемы

Если вы обнаружили ошибку, пожалуйста, создайте issue:
https://github.com/QuadDarv1ne/robot-delivery-simulator/issues

## 📝 Лицензия

MIT License — см. файл [LICENSE](./LICENSE)

---

**Full Changelog:** https://github.com/QuadDarv1ne/robot-delivery-simulator/commits/v1.0.0
