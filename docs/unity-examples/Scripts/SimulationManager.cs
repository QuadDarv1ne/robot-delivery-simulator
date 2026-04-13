using UnityEngine;
using System.Collections;

/// <summary>
/// Менеджер симуляции - управляет запуском, остановкой и обновлением симуляции
/// </summary>
public class SimulationManager : MonoBehaviour
{
    public static SimulationManager Instance { get; private set; }

    [Header("Simulation Settings")]
    public bool isRunning = false;
    public float simulationSpeed = 1f;
    public bool autoStart = false;

    [Header("Statistics")]
    public float simulationTime = 0f;
    public int frameCount = 0;
    public float fps = 0f;

    private float fpsTimer = 0f;
    private int fpsFrameCount = 0;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private void Start()
    {
        if (autoStart)
        {
            StartSimulation();
        }
    }

    private void Update()
    {
        // Подсчёт FPS
        fpsTimer += Time.deltaTime;
        fpsFrameCount++;
        
        if (fpsTimer >= 1f)
        {
            fps = fpsFrameCount / fpsTimer;
            fpsTimer = 0f;
            fpsFrameCount = 0;
        }

        // Обновление статистики
        if (isRunning)
        {
            simulationTime += Time.deltaTime * simulationSpeed;
            frameCount++;
        }
    }

    /// <summary>
    /// Запуск симуляции
    /// </summary>
    public void StartSimulation()
    {
        if (!isRunning)
        {
            isRunning = true;
            simulationTime = 0f;
            frameCount = 0;
            
            StartCoroutine(SimulationLoop());
            
            Debug.Log("[SimulationManager] Simulation started");
            ReactBridge.Instance.SendToReactApp("simulation-started", new SimulationStatus
            {
                timestamp = Time.time,
                status = "running",
                speed = simulationSpeed
            });
        }
    }

    /// <summary>
    /// Остановка симуляции
    /// </summary>
    public void StopSimulation()
    {
        if (isRunning)
        {
            isRunning = false;
            StopAllCoroutines();
            
            Debug.Log("[SimulationManager] Simulation stopped");
            ReactBridge.Instance.SendToReactApp("simulation-stopped", new SimulationStatus
            {
                timestamp = Time.time,
                status = "stopped",
                simulationTime = simulationTime
            });
        }
    }

    /// <summary>
    /// Пауза симуляции
    /// </summary>
    public void PauseSimulation()
    {
        Time.timeScale = isRunning ? 0f : 1f;
        isRunning = !isRunning;
        
        ReactBridge.Instance.SendToReactApp("simulation-paused", new SimulationStatus
        {
            timestamp = Time.time,
            status = isRunning ? "running" : "paused"
        });
    }

    /// <summary>
    /// Сброс симуляции
    /// </summary>
    public void ResetSimulation()
    {
        StopSimulation();
        simulationTime = 0f;
        frameCount = 0;
        
        // Сброс позиции робота
        if (RobotController.Instance != null)
        {
            RobotController.Instance.ResetPosition();
        }

        ReactBridge.Instance.SendToReactApp("simulation-reset", null);
    }

    /// <summary>
    /// Основной цикл симуляции
    /// </summary>
    private IEnumerator SimulationLoop()
    {
        while (isRunning)
        {
            // Обновляем симуляцию
            UpdateSimulation();
            
            // Отправляем данные в React
            SendStateToReact();

            // Ждём следующий кадр
            yield return new WaitForSeconds(0.02f * simulationSpeed); // ~50 FPS
        }
    }

    /// <summary>
    /// Обновление логики симуляции
    /// </summary>
    private void UpdateSimulation()
    {
        // Здесь можно добавить:
        // - Обновление физики
        // - Обработку сенсоров
        // - Навигацию и планирование пути
        // - Обработку препятствий
        // - Логику доставки
        // - Управление батареей
        
        // Пример: уменьшение батареи
        UpdateBattery();
    }

    /// <summary>
    /// Обновление уровня батареи
    /// </summary>
    private void UpdateBattery()
    {
        // Уменьшаем батарею со временем
        // В реальности здесь была бы более сложная логика
    }

    /// <summary>
    /// Отправка состояния в React
    /// </summary>
    private void SendStateToReact()
    {
        var state = new SimulationStatus
        {
            position = new PositionData
            {
                x = transform.position.x,
                y = transform.position.y,
                z = transform.position.z
            },
            rotation = new RotationData
            {
                x = transform.rotation.eulerAngles.x,
                y = transform.rotation.eulerAngles.y,
                z = transform.rotation.eulerAngles.z
            },
            battery = GetBatteryLevel(),
            status = isRunning ? "running" : "stopped",
            simulationTime = simulationTime,
            fps = fps
        };

        ReactBridge.Instance.SendToReactApp("state-update", state);
    }

    /// <summary>
    /// Получение текущего уровня батареи
    /// </summary>
    private float GetBatteryLevel()
    {
        // Placeholder - в реальности здесь была бы реальная логика
        return 100f - (simulationTime * 0.01f); // Уменьшается со временем
    }

    [System.Serializable]
    public class SimulationStatus
    {
        public PositionData position;
        public RotationData rotation;
        public float battery;
        public string status;
        public float simulationTime;
        public float timestamp;
        public float speed;
        public float fps;
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
