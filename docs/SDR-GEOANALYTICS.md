# RTL-SDR Geoanalytics для Robot Delivery Simulator

Модуль геоаналитики на основе RTL-SDR для мониторинга радиосигналов и отслеживания объектов в реальном времени.

## Возможности

### Поддерживаемые протоколы

- **ADS-B** (1090 МГц) — отслеживание воздушных судов
  - Позывной, координаты, высота, скорость, курс
  - RSSI (уровень сигнала)
  - Реалистичная эмуляция трафика в Москве

- **AIS** (161.975/162.025 МГц) — отслеживание судов
  - MMSI, название, координаты, скорость, курс
  - Эмуляция движения по Москве-реке

- **APRS** (144.800 МГц) — любительские радиомаяки
  - Позывной, координаты, комментарии
  - Статусные сообщения

### Компоненты

1. **SDR Server** (`mini-services/sdr-server/index.ts`)
   - WebSocket сервер на порту 3004
   - Эмуляция RTL-SDR данных (гибридный режим)
   - Генерация спектральных данных (FFT 1024 точки)
   - Автоматическая генерация контактов на основе реальных моделей движения

2. **SDR Panel** (`src/components/sdr/sdr-panel.tsx`)
   - Спектральный анализатор с waterfall-диаграммой
   - Список обнаруженных сигналов с детализацией
   - Управление: режим, частота, усиление
   - Статистика обнаружений

3. **Geo Analytics** (`src/components/sdr/geoanalytics.tsx`)
   - Карта Leaflet с маркерами объектов
   - Heatmap плотности сигналов
   - Фильтрация по типам
   - RSSI-визуализация (круги силы сигнала)

4. **Интеграция с основным сервером**
   - Ретрансляция SDR-данных через порт 3003
   - Команды управления SDR через основной WebSocket
   - Автоматическое переподключение

## Запуск

### Быстрый старт

```bash
# Запуск всех сервисов concurrently
npm run dev:all

# Или отдельно:
npm run dev           # Next.js фронтенд (порт 3000)
npm run websocket     # Основной WebSocket сервер (порт 3003)
npm run sdr           # SDR сервер (порт 3004)
```

### Переменные окружения

```env
# SDR Server
SDR_SERVER_URL=http://localhost:3004
```

## API

### WebSocket события

#### Сервер → Клиент
- `sdr-data` — основные данные SDR
  ```typescript
  {
    contacts: SDRContact[]
    spectrumData: {
      frequencies: number[]
      amplitudes: number[]
      timestamp: number
      centerFrequency: number
      sampleRate: number
    }
    stats: {
      totalDetections: number
      adsBCount: number
      aisCount: number
      aprsCount: number
      peakFrequency: number
      averageRSSI: number
    }
    state: {
      enabled: boolean
      mode: 'ADS-B' | 'AIS' | 'APRS' | 'SPECTRUM' | 'ALL'
      centerFrequency: number
      sampleRate: number
      gain: number
    }
  }
  ```

#### Клиент → Сервер (SDR команды)
```typescript
{
  type: 'sdrCommand',
  data: {
    type: 'SET_MODE' | 'SET_FREQUENCY' | 'SET_GAIN' | 'SET_SAMPLE_RATE' | 'ENABLE' | 'DISABLE' | 'GET_STATS' | 'CLEAR_HISTORY',
    // ... параметры команды
  }
}
```

### Примеры команд

```javascript
// Переключить режим
socket.emit('control', {
  type: 'sdrCommand',
  data: { type: 'SET_MODE', mode: 'ADS-B' }
})

// Установить частоту
socket.emit('control', {
  type: 'sdrCommand',
  data: { type: 'SET_FREQUENCY', frequency: 1090e6 }
})

// Установить усиление
socket.emit('control', {
  type: 'sdrCommand',
  data: { type: 'SET_GAIN', gain: 40 }
})
```

## Интерфейс

### Вкладка "SDR"
- Спектральный анализатор (1024 точки FFT)
- Waterfall-диаграмма (история 200 срезов)
- Статистика по типам сигналов
- Управление параметрами SDR
- Список активных контактов

### Вкладка "Геоаналитика"
- Карта с маркерами объектов (ADS-B, AIS, APRS)
- Heatmap плотности сигналов
- Фильтры отображения
- Статистика обнаружений

### Боковая панель
- Статус SDR (online/offline)
- Текущая частота и режим
- Количество объектов по типам

### Нижний статус-бар
- SDR статус в реальном времени
- Быстрая сводка по объектам

## Подключение реального RTL-SDR устройства

Для подключения реального RTL-SDR-v4 устройства:

1. Установите `rtl-sdr` драйверы:
   ```bash
   # Windows: Zadig + USB drivers
   # Linux: apt install rtl-sdr
   # macOS: brew install rtl-sdr
   ```

2. Замените эмуляцию в `sdr-server/index.ts` на вызовы к реальному устройству:
   ```bash
   rtl_tcp -a 127.0.0.1 -p 1234
   ```

3. Используйте библиотеки для декодирования:
   - ADS-B: `dump1090` или `readsb`
   - AIS: `gpsd` или `aisdecoder`
   - APRS: `direwolf` или `multimon-ng`

## Структура файлов

```
mini-services/
  sdr-server/
    index.ts                 # SDR WebSocket сервер

src/
  components/
    sdr/
      types.ts               # Типы данных SDR
      sdr-panel.tsx          # Основная SDR панель
      geoanalytics.tsx       # Карта с geoаналитикой
      heatmap-layer.tsx      # Heatmap слой для Leaflet

src/
  app/
    simulator-content.tsx    # Интеграция SDR вкладок
```

## Технические детали

### Генерация спектральных данных
- 1024 точки FFT
- Пики сигналов на реальных частотах (ADS-B: 1090 МГц, AIS: 162 МГц, APRS: 144.8 МГц)
- Gaussian модель для сигналов + случайный шум

### Модель движения объектов
- Самолёты: 5-12 объектов с реальными маршрутами
- Суда: 2-5 объектов на Москве-реке
- APRS: 3-7 маяков с комментариями

### Heatmap визуализация
- Нормализация RSSI в 0-1 диапазон
- Градиент: blue → cyan → lime → yellow → red
- Radius: 25px, Blur: 15px

## Зависимости

- `socket.io` — WebSocket сервер
- `socket.io-client` — WebSocket клиент
- `leaflet` — карта
- `leaflet.heat` — heatmap слой
- `lucide-react` — иконки

## Расширение

Для добавления новых протоколов:

1. Добавьте тип в `types.ts`
2. Создайте генератор данных в `sdr-server/index.ts`
3. Добавьте режим в `ModeSelector`
4. Обновите статистику и UI

## Лицензия

MIT — как и основной проект
