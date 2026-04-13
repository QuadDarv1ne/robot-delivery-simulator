/**
 * Шаблоны сценариев для быстрого создания миссий
 * Каждый шаблон содержит предопределённые параметры для типичных ситуаций
 */

export interface ScenarioTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: 'urban' | 'park' | 'campus' | 'warehouse' | 'industrial' | 'custom'
  difficulty: 'easy' | 'medium' | 'hard'
  distance: number
  timeLimit: number
  weather: 'sunny' | 'rainy' | 'snowy'
  traffic: 'low' | 'medium' | 'high'
  robotType: 'standard' | 'heavy' | 'compact'
  robotCount: number
  cargoCapacity: number
  cargoFragile: boolean
  startPoint: { lat: number; lon: number; name: string }
  endPoint: { lat: number; lon: number; name: string }
  waypoints: Array<{ lat: number; lon: number; name: string }>
  obstacles: Array<{
    id: string
    type: 'pedestrian' | 'vehicle' | 'construction'
    position: { lat: number; lon: number; name: string }
    radius: number
  }>
  tags: string[]
  isPublic: boolean
}

// Москва центр (базовые координаты)
const MOSCOW_CENTER = { lat: 55.7558, lon: 37.6173 }

export const scenarioTemplates: ScenarioTemplate[] = [
  {
    id: 'urban-delivery',
    name: 'Городская доставка',
    description: 'Типичный сценарий доставки в городских условиях с умеренным трафиком и несколькими промежуточными точками',
    icon: '🏙️',
    category: 'urban',
    difficulty: 'medium',
    distance: 1500,
    timeLimit: 600,
    weather: 'sunny',
    traffic: 'medium',
    robotType: 'standard',
    robotCount: 1,
    cargoCapacity: 10.0,
    cargoFragile: false,
    startPoint: {
      lat: 55.7558,
      lon: 37.6173,
      name: 'Склад (Кремль)'
    },
    endPoint: {
      lat: 55.7622,
      lon: 37.6256,
      name: 'Пункт назначения (Парк Горького)'
    },
    waypoints: [
      { lat: 55.7578, lon: 37.6193, name: 'Точка 1 (ул. Тверская)' },
      { lat: 55.7598, lon: 37.6213, name: 'Точка 2 (Пушкинская пл.)' },
      { lat: 55.7612, lon: 37.6236, name: 'Точка 3 (Пречистенская наб.)' }
    ],
    obstacles: [
      {
        id: 'obs-1',
        type: 'pedestrian',
        position: { lat: 55.7588, lon: 37.6203, name: 'Пешеход 1' },
        radius: 3
      },
      {
        id: 'obs-2',
        type: 'vehicle',
        position: { lat: 55.7608, lon: 37.6226, name: 'Транспорт 1' },
        radius: 4
      }
    ],
    tags: ['город', 'доставка', 'средний'],
    isPublic: true
  },
  {
    id: 'park-route',
    name: 'Маршрут в парке',
    description: 'Сценарий навигации в парковой зоне с пешеходами и минимальным трафиком',
    icon: '🌳',
    category: 'park',
    difficulty: 'easy',
    distance: 800,
    timeLimit: 400,
    weather: 'sunny',
    traffic: 'low',
    robotType: 'standard',
    robotCount: 1,
    cargoCapacity: 5.0,
    cargoFragile: false,
    startPoint: {
      lat: 55.7312,
      lon: 37.6013,
      name: 'Вход в парк (Главный вход)'
    },
    endPoint: {
      lat: 55.7352,
      lon: 37.6053,
      name: 'Пруд (Конечная точка)'
    },
    waypoints: [
      { lat: 55.7322, lon: 37.6023, name: 'Аллея 1' },
      { lat: 55.7332, lon: 37.6033, name: 'Мостик' },
      { lat: 55.7342, lon: 37.6043, name: 'Беседка' }
    ],
    obstacles: [
      {
        id: 'obs-1',
        type: 'pedestrian',
        position: { lat: 55.7327, lon: 37.6028, name: 'Пешеход' },
        radius: 2
      },
      {
        id: 'obs-2',
        type: 'pedestrian',
        position: { lat: 55.7337, lon: 37.6038, name: 'Велосипедист' },
        radius: 3
      }
    ],
    tags: ['парк', 'прогулка', 'лёгкий'],
    isPublic: true
  },
  {
    id: 'campus-delivery',
    name: 'Доставка в кампусе',
    description: 'Сценарий доставки в университетском кампусе с ограниченной скоростью и студентами',
    icon: '🎓',
    category: 'campus',
    difficulty: 'easy',
    distance: 600,
    timeLimit: 300,
    weather: 'sunny',
    traffic: 'low',
    robotType: 'compact',
    robotCount: 1,
    cargoCapacity: 3.0,
    cargoFragile: true,
    startPoint: {
      lat: 55.7015,
      lon: 37.5295,
      name: 'Библиотека (Старт)'
    },
    endPoint: {
      lat: 55.7035,
      lon: 37.5315,
      name: 'Столовая (Финиш)'
    },
    waypoints: [
      { lat: 55.7020, lon: 37.5300, name: 'Корпус А' },
      { lat: 55.7025, lon: 37.5305, name: 'Корпус Б' },
      { lat: 55.7030, lon: 37.5310, name: 'Общежитие' }
    ],
    obstacles: [
      {
        id: 'obs-1',
        type: 'pedestrian',
        position: { lat: 55.7022, lon: 37.5302, name: 'Студент 1' },
        radius: 2
      },
      {
        id: 'obs-2',
        type: 'pedestrian',
        position: { lat: 55.7028, lon: 37.5308, name: 'Студент 2' },
        radius: 2
      },
      {
        id: 'obs-3',
        type: 'pedestrian',
        position: { lat: 55.7032, lon: 37.5312, name: 'Студент 3' },
        radius: 2
      }
    ],
    tags: ['кампус', 'университет', 'хрупкий груз'],
    isPublic: true
  },
  {
    id: 'warehouse-logistics',
    name: 'Складская логистика',
    description: 'Сценарий перемещения товаров на складе с тяжёлым роботом и хрупким грузом',
    icon: '📦',
    category: 'warehouse',
    difficulty: 'medium',
    distance: 400,
    timeLimit: 240,
    weather: 'sunny',
    traffic: 'low',
    robotType: 'heavy',
    robotCount: 2,
    cargoCapacity: 20.0,
    cargoFragile: true,
    startPoint: {
      lat: 55.7800,
      lon: 37.6500,
      name: 'Зона разгрузки'
    },
    endPoint: {
      lat: 55.7820,
      lon: 37.6520,
      name: 'Зона хранения'
    },
    waypoints: [
      { lat: 55.7805, lon: 37.6505, name: 'Стеллаж A1' },
      { lat: 55.7810, lon: 37.6510, name: 'Стеллаж B2' },
      { lat: 55.7815, lon: 37.6515, name: 'Стеллаж C3' }
    ],
    obstacles: [
      {
        id: 'obs-1',
        type: 'construction',
        position: { lat: 55.7808, lon: 37.6508, name: 'Погрузчик' },
        radius: 5
      },
      {
        id: 'obs-2',
        type: 'vehicle',
        position: { lat: 55.7812, lon: 37.6512, name: 'Грузовик' },
        radius: 6
      }
    ],
    tags: ['склад', 'логистика', 'тяжёлый робот'],
    isPublic: true
  },
  {
    id: 'snowy-challenge',
    name: 'Зимний вызов',
    description: 'Сложный сценарий в зимних условиях с снегом и ограниченной видимостью',
    icon: '❄️',
    category: 'urban',
    difficulty: 'hard',
    distance: 2000,
    timeLimit: 900,
    weather: 'snowy',
    traffic: 'medium',
    robotType: 'standard',
    robotCount: 1,
    cargoCapacity: 8.0,
    cargoFragile: false,
    startPoint: {
      lat: 55.7458,
      lon: 37.6073,
      name: 'Депо (Зимнее)'
    },
    endPoint: {
      lat: 55.7658,
      lon: 37.6273,
      name: 'Доставка (Снежная)'
    },
    waypoints: [
      { lat: 55.7498, lon: 37.6113, name: 'Контрольная точка 1' },
      { lat: 55.7538, lon: 37.6153, name: 'Контрольная точка 2' },
      { lat: 55.7578, lon: 37.6193, name: 'Контрольная точка 3' },
      { lat: 55.7618, lon: 37.6233, name: 'Контрольная точка 4' }
    ],
    obstacles: [
      {
        id: 'obs-1',
        type: 'construction',
        position: { lat: 55.7518, lon: 37.6133, name: 'Снежный занос' },
        radius: 4
      },
      {
        id: 'obs-2',
        type: 'pedestrian',
        position: { lat: 55.7558, lon: 37.6173, name: 'Пешеход' },
        radius: 3
      },
      {
        id: 'obs-3',
        type: 'vehicle',
        position: { lat: 55.7598, lon: 37.6213, name: 'Снежный плуг' },
        radius: 5
      },
      {
        id: 'obs-4',
        type: 'construction',
        position: { lat: 55.7638, lon: 37.6253, name: 'Обледенение' },
        radius: 6
      }
    ],
    tags: ['зима', 'снег', 'сложный', 'вызов'],
    isPublic: true
  },
  {
    id: 'industrial-complex',
    name: 'Промышленный комплекс',
    description: 'Сложный сценарий на промышленной территории с множеством препятствий',
    icon: '🏭',
    category: 'industrial',
    difficulty: 'hard',
    distance: 2500,
    timeLimit: 1200,
    weather: 'rainy',
    traffic: 'high',
    robotType: 'heavy',
    robotCount: 2,
    cargoCapacity: 15.0,
    cargoFragile: false,
    startPoint: {
      lat: 55.7700,
      lon: 37.6400,
      name: 'КПП (Вход)'
    },
    endPoint: {
      lat: 55.7750,
      lon: 37.6450,
      name: 'Цех №5 (Финиш)'
    },
    waypoints: [
      { lat: 55.7710, lon: 37.6410, name: 'Склад сырья' },
      { lat: 55.7720, lon: 37.6420, name: 'Административное здание' },
      { lat: 55.7730, lon: 37.6430, name: 'Котельная' },
      { lat: 55.7740, lon: 37.6440, name: 'Трансформаторная' }
    ],
    obstacles: [
      {
        id: 'obs-1',
        type: 'vehicle',
        position: { lat: 55.7705, lon: 37.6405, name: 'Грузовик 1' },
        radius: 6
      },
      {
        id: 'obs-2',
        type: 'vehicle',
        position: { lat: 55.7715, lon: 37.6415, name: 'Погрузчик' },
        radius: 5
      },
      {
        id: 'obs-3',
        type: 'construction',
        position: { lat: 55.7725, lon: 37.6425, name: 'Ремонт дороги' },
        radius: 8
      },
      {
        id: 'obs-4',
        type: 'pedestrian',
        position: { lat: 55.7735, lon: 37.6435, name: 'Рабочий' },
        radius: 3
      },
      {
        id: 'obs-5',
        type: 'construction',
        position: { lat: 55.7745, lon: 37.6445, name: 'Строительная зона' },
        radius: 7
      }
    ],
    tags: ['промышленность', 'завод', 'сложный', 'множество препятствий'],
    isPublic: true
  },
  {
    id: 'rainy-emergency',
    name: 'Экстренная доставка в дождь',
    description: 'Срочная доставка в условиях сильного дождя и высокого трафика',
    icon: '🌧️',
    category: 'urban',
    difficulty: 'hard',
    distance: 1800,
    timeLimit: 480,
    weather: 'rainy',
    traffic: 'high',
    robotType: 'standard',
    robotCount: 1,
    cargoCapacity: 7.0,
    cargoFragile: true,
    startPoint: {
      lat: 55.7488,
      lon: 37.6103,
      name: 'Аптека (Старт)'
    },
    endPoint: {
      lat: 55.7588,
      lon: 37.6203,
      name: 'Больница (Финиш)'
    },
    waypoints: [
      { lat: 55.7518, lon: 37.6133, name: 'Перекрёсток 1' },
      { lat: 55.7548, lon: 37.6163, name: 'Перекрёсток 2' },
      { lat: 55.7578, lon: 37.6193, name: 'Перекрёсток 3' }
    ],
    obstacles: [
      {
        id: 'obs-1',
        type: 'vehicle',
        position: { lat: 55.7528, lon: 37.6143, name: 'Пробка' },
        radius: 5
      },
      {
        id: 'obs-2',
        type: 'pedestrian',
        position: { lat: 55.7558, lon: 37.6173, name: 'Пешеходы' },
        radius: 4
      },
      {
        id: 'obs-3',
        type: 'construction',
        position: { lat: 55.7568, lon: 37.6183, name: 'Затопление' },
        radius: 6
      }
    ],
    tags: ['дождь', 'экстренный', 'срочный', 'хрупкий груз'],
    isPublic: true
  },
  {
    id: 'night-patrol',
    name: 'Ночной патруль',
    description: 'Сценарий ночного патрулирования территории с несколькими роботами',
    icon: '🌙',
    category: 'park',
    difficulty: 'medium',
    distance: 3000,
    timeLimit: 1800,
    weather: 'sunny',
    traffic: 'low',
    robotType: 'standard',
    robotCount: 3,
    cargoCapacity: 5.0,
    cargoFragile: false,
    startPoint: {
      lat: 55.7350,
      lon: 37.5950,
      name: 'База (Ночная)'
    },
    endPoint: {
      lat: 55.7450,
      lon: 37.6050,
      name: 'Контрольная точка (Финиш)'
    },
    waypoints: [
      { lat: 55.7370, lon: 37.5970, name: 'Патруль 1' },
      { lat: 55.7390, lon: 37.5990, name: 'Патруль 2' },
      { lat: 55.7410, lon: 37.6010, name: 'Патруль 3' },
      { lat: 55.7430, lon: 37.6030, name: 'Патруль 4' }
    ],
    obstacles: [
      {
        id: 'obs-1',
        type: 'pedestrian',
        position: { lat: 55.7380, lon: 37.5980, name: 'Ночной посетитель' },
        radius: 3
      },
      {
        id: 'obs-2',
        type: 'vehicle',
        position: { lat: 55.7420, lon: 37.6020, name: 'Охрана' },
        radius: 4
      }
    ],
    tags: ['ночь', 'патруль', 'мульти-робот'],
    isPublic: true
  }
]

// Функция для получения шаблона по ID
export function getTemplateById(id: string): ScenarioTemplate | undefined {
  return scenarioTemplates.find(t => t.id === id)
}

// Функция для получения шаблонов по категории
export function getTemplatesByCategory(category: ScenarioTemplate['category']): ScenarioTemplate[] {
  return scenarioTemplates.filter(t => t.category === category)
}

// Функция для получения шаблонов по тегам
export function getTemplatesByTags(...tags: string[]): ScenarioTemplate[] {
  return scenarioTemplates.filter(t =>
    tags.some(tag => t.tags.includes(tag))
  )
}

// Функция для конвертации шаблона в формат сценария
export function templateToScenarioData(template: ScenarioTemplate) {
  return {
    name: template.name,
    description: template.description,
    difficulty: template.difficulty,
    distance: template.distance,
    timeLimit: template.timeLimit,
    weather: template.weather,
    traffic: template.traffic,
    robotType: template.robotType,
    robotCount: template.robotCount,
    cargoCapacity: template.cargoCapacity,
    cargoFragile: template.cargoFragile,
    startPoint: JSON.stringify(template.startPoint),
    endPoint: JSON.stringify(template.endPoint),
    waypoints: JSON.stringify(template.waypoints),
    obstacles: JSON.stringify(template.obstacles),
    isPublic: template.isPublic
  }
}
