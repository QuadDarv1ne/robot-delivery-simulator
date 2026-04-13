# Unity WebGL Integration Guide

## Настройка Unity проекта

### 1. Требования
- Unity 2022.3 LTS или новее
- WebGL модуль (установлен через Unity Hub)
- WebGL 2.0 поддержка

### 2. Настройка проекта

#### Build Settings
1. Перейдите в `File > Build Settings`
2. Выберите платформу `WebGL`
3. Нажмите `Switch Platform`
4. Откройте `Player Settings` и настройте:
   - **Resolution and Presentation**:
     - Run In Background: ✓
     - WebGL Template: BetterTemplate или Minimal
   - **Other Settings**:
     - Color Space: Linear
     - Graphics API: WebGL 2.0

### 3. Структура билда

После билда вы получите папку со следующей структурой:
```
Build/
  ├── <ProjectName>.data.gz
  ├── <ProjectName>.framework.js.gz
  ├── <ProjectName>.loader.js
  └── <ProjectName>.wasm.gz
StreamingAssets/
index.html
```

### 4. Размещение в проекте

Скопируйте всю папку билда в:
```
public/unity-build/
```

## Интеграция с React

### JavaScript библиотека для Unity

Создайте файл `Assets/Plugins/WebGL/ReactBridge.jslib`:

```javascript
var ReactBridge = {
  // Отправка данных в React
  SendToReact: function(commandPtr, dataPtr) {
    var command = UTF8ToString(commandPtr);
    var data = UTF8ToString(dataPtr);
    
    // Отправляем кастомное событие
    window.dispatchEvent(new CustomEvent('unity-command', {
      detail: {
        command: command,
        data: JSON.parse(data)
      }
    }));
  },

  // Получение данных из React
  RegisterListener: function(eventNamePtr) {
    var eventName = UTF8ToString(eventNamePtr);
    
    window.addEventListener(eventName, function(e) {
      // Вызываем метод в Unity
      SendMessage('ReactBridge', 'OnDataReceived', JSON.stringify(e.detail));
    });
  }
};

mergeInto(LibraryManager.library, ReactBridge);
```

### C# скрипт для Unity

Создайте файл `Assets/Scripts/ReactBridge.cs`:

```csharp
using UnityEngine;
using System.Runtime.InteropServices;

public class ReactBridge : MonoBehaviour
{
    public static ReactBridge Instance { get; private set; }

    [DllImport("__Internal")]
    private static extern void SendToReact(string command, string data);

    [DllImport("__Internal")]
    private static extern void RegisterListener(string eventName);

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            // Регистрируем слушатели событий
            RegisterListener("unity-ready");
        }
        else
        {
            Destroy(gameObject);
        }
    }

    // Отправка данных в React
    public void SendToReactApp(string command, object data)
    {
        string jsonData = JsonUtility.ToJson(data);
        SendToReact(command, jsonData);
    }

    // Получение данных из React
    public void OnDataReceived(string jsonData)
    {
        var message = JsonUtility.FromJson<UnityMessage>(jsonData);
        HandleMessage(message);
    }

    private void HandleMessage(UnityMessage message)
    {
        switch (message.method)
        {
            case "UpdateRobotState":
                RobotController.Instance?.UpdateState(message.data);
                break;
            case "UpdateSensors":
                SensorManager.Instance?.UpdateSensors(message.data);
                break;
            case "StartSimulation":
                SimulationManager.Instance?.StartSimulation();
                break;
            case "InitializeConnection":
                NetworkManager.Instance?.Initialize();
                break;
        }
    }

    [System.Serializable]
    public class UnityMessage
    {
        public string method;
        public string data;
    }
}
```

### Контроллер робота

Создайте `Assets/Scripts/RobotController.cs`:

```csharp
using UnityEngine;

public class RobotController : MonoBehaviour
{
    public static RobotController Instance { get; private set; }

    [Header("Robot Settings")]
    public float movementSpeed = 5f;
    public float rotationSpeed = 90f;

    private RobotState currentState;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
    }

    public void UpdateState(string stateJson)
    {
        currentState = JsonUtility.FromJson<RobotState>(stateJson);
        
        // Обновляем позицию и вращение
        if (currentState.position != null)
        {
            transform.position = new Vector3(
                currentState.position.x,
                currentState.position.y,
                currentState.position.z
            );
        }

        if (currentState.rotation != null)
        {
            transform.rotation = Quaternion.Euler(
                currentState.rotation.x,
                currentState.rotation.y,
                currentState.rotation.z
            );
        }

        // Обновляем визуализацию батареи
        UpdateBatteryVisual(currentState.battery);
    }

    private void UpdateBatteryVisual(float batteryLevel)
    {
        // Логика визуализации уровня батареи
        // Можно менять цвет или показывать индикатор
    }

    // Отправка команды движения в React
    public void MoveToDestination(Vector3 target)
    {
        var data = new { x = target.x, y = target.y, z = target.z };
        ReactBridge.Instance.SendToReactApp("move", data);
    }

    public void Stop()
    {
        ReactBridge.Instance.SendToReactApp("stop", null);
    }

    [System.Serializable]
    public class RobotState
    {
        public PositionData position;
        public RotationData rotation;
        public float battery;
        public string status;
    }

    [System.Serializable]
    public class PositionData
    {
        public float x;
        public float y;
        public float z;
    }

    [System.Serializable]
    public class RotationData
    {
        public float x;
        public float y;
        public float z;
    }
}
```

### Менеджер сенсоров

Создайте `Assets/Scripts/SensorManager.cs`:

```csharp
using UnityEngine;

public class SensorManager : MonoBehaviour
{
    public static SensorManager Instance { get; private set; }

    [Header("Sensors")]
    public LidarSensor lidarSensor;
    public GPSSensor gpsSensor;
    public IMUSensor imuSensor;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
    }

    public void UpdateSensors(string sensorDataJson)
    {
        var sensorData = JsonUtility.FromJson<SensorData>(sensorDataJson);
        
        // Обновляем данные сенсоров
        if (lidarSensor != null)
        {
            lidarSensor.UpdateData(sensorData.lidar);
        }

        if (gpsSensor != null)
        {
            gpsSensor.UpdateData(sensorData.gps);
        }

        if (imuSensor != null)
        {
            imuSensor.UpdateData(sensorData.imu);
        }
    }

    // Отправка данных сенсоров в React
    public void SendSensorData()
    {
        var data = new
        {
            gps = gpsSensor?.GetData(),
            lidar = lidarSensor?.GetData(),
            imu = imuSensor?.GetData()
        };

        ReactBridge.Instance.SendToReactApp("sensor-update", data);
    }

    [System.Serializable]
    public class SensorData
    {
        public GPSData gps;
        public LidarData lidar;
        public IMUData imu;
    }
}
```

### Менеджер симуляции

Создайте `Assets/Scripts/SimulationManager.cs`:

```csharp
using UnityEngine;
using System.Collections;

public class SimulationManager : MonoBehaviour
{
    public static SimulationManager Instance { get; private set; }

    [Header("Simulation Settings")]
    public bool isRunning = false;
    public float simulationSpeed = 1f;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
    }

    public void StartSimulation()
    {
        if (!isRunning)
        {
            isRunning = true;
            StartCoroutine(SimulationLoop());
            
            ReactBridge.Instance.SendToReactApp("simulation-started", new { timestamp = Time.time });
        }
    }

    public void StopSimulation()
    {
        isRunning = false;
        StopAllCoroutines();
        
        ReactBridge.Instance.SendToReactApp("simulation-stopped", null);
    }

    private IEnumerator SimulationLoop()
    {
        while (isRunning)
        {
            // Обновляем симуляцию
            UpdateSimulation();
            
            // Отправляем данные в React
            SendStateToReact();

            yield return new WaitForSeconds(0.02f * simulationSpeed);
        }
    }

    private void UpdateSimulation()
    {
        // Логика обновления симуляции
        // - Физика
        // - Сенсоры
        // - Навигация
    }

    private void SendStateToReact()
    {
        var state = new
        {
            position = new { x = transform.position.x, y = transform.position.y, z = transform.position.z },
            rotation = new { x = transform.rotation.eulerAngles.x, y = transform.rotation.eulerAngles.y, z = transform.rotation.eulerAngles.z },
            battery = GetBatteryLevel(),
            status = isRunning ? "running" : "stopped"
        };

        ReactBridge.Instance.SendToReactApp("state-update", state);
    }

    private float GetBatteryLevel()
    {
        // Возвращаем текущий уровень батареи
        return 100f;
    }
}
```

## Деплой

### 1. Сборка Unity
```bash
# В Unity Editor: File > Build Settings > Build
# Или через командную строку:
/Applications/Unity/Hub/Editor/2022.3.x/Unity.app/Contents/MacOS/Unity \
  -batchmode \
  -quit \
  -buildWebGLPlayer \
  -projectPath /path/to/project \
  -buildTarget WebGL \
  -executeMethod BuildScript.BuildWebGL
```

### 2. Размещение в Next.js
```bash
# Скопируйте билд в public папку
cp -r Build /path/to/robot-delivery-simulator/public/unity-build/
cp -r StreamingAssets /path/to/robot-delivery-simulator/public/unity-build/
```

### 3. Проверка
Запустите приложение:
```bash
npm run dev
```

Перейдите на страницу симулятора - Unity должен загрузиться автоматически.

## Устранение проблем

### Билд не загружается
1. Проверьте консоль браузера на ошибки
2. Убедитесь, что все файлы билда присутствуют
3. Проверьте CORS настройки если билд на другом домене

### Ошибки WebSocket
1. Убедитесь, что сервер запущен на порту 3003
2. Проверьте сетевые запросы в DevTools
3. Включите логи в сервере симулятора

### Производительность
- Уменьшите качество текстур для WebGL
- Используйте LOD (Level of Detail) для моделей
- Оптимизируйте количество draw calls
- Включите сжатие билда (gzip)

## API Reference

### Unity → React события

| Команда | Описание | Данные |
|---------|----------|--------|
| `move` | Движение к точке | `{x, y, z}` |
| `stop` | Остановка | - |
| `reset` | Сброс позиции | - |
| `setSpeed` | Установка скорости | `{speed: number}` |
| `setDestination` | Установка пункта назначения | `{lat, lon}` |

### React → Unity методы

| Метод | Описание | Параметры |
|-------|----------|-----------|
| `SendMessage` | Отправка данных в Unity | `(gameObject, method, value)` |
| `UpdateRobotState` | Обновление состояния робота | `{position, rotation, battery, status}` |
| `UpdateSensors` | Обновление данных сенсоров | `{gps, lidar, imu}` |
| `StartSimulation` | Запуск симуляции | - |
| `InitializeConnection` | Инициализация соединения | - |

## Примеры

Полные примеры скриптов доступны в:
- `docs/unity/Scripts/` - все C# скрипты
- `docs/unity/Plugins/` - JavaScript библиотека
- `public/unity-build/` - пример билда
