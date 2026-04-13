using UnityEngine;

/// <summary>
/// Контроллер робота - управляет движением и визуализацией робота
/// Получает данные из React и отправляет команды обратно
/// </summary>
public class RobotController : MonoBehaviour
{
    public static RobotController Instance { get; private set; }

    [Header("Robot Settings")]
    public float movementSpeed = 5f;
    public float rotationSpeed = 90f;
    
    [Header("Visual")]
    public GameObject robotModel;
    public Material batteryIndicatorMaterial;
    
    private RobotState currentState;
    private Vector3 targetPosition;
    private bool hasTarget = false;

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

    private void Update()
    {
        // Плавное движение к целевой позиции
        if (hasTarget && currentState != null)
        {
            transform.position = Vector3.MoveTowards(
                transform.position, 
                targetPosition, 
                movementSpeed * Time.deltaTime
            );

            // Проверка достижения цели
            if (Vector3.Distance(transform.position, targetPosition) < 0.1f)
            {
                hasTarget = false;
            }
        }
    }

    /// <summary>
    /// Обновление состояния робота из React
    /// </summary>
    public void UpdateState(string stateJson)
    {
        try
        {
            currentState = JsonUtility.FromJson<RobotState>(stateJson);
            
            // Обновляем позицию
            if (currentState.position != null)
            {
                targetPosition = new Vector3(
                    currentState.position.x,
                    currentState.position.y,
                    currentState.position.z
                );
                hasTarget = true;
            }

            // Обновляем вращение
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
            
            Debug.Log($"[RobotController] State updated: {currentState.status}");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"[RobotController] Failed to update state: {e.Message}");
        }
    }

    /// <summary>
    /// Визуализация уровня батареи
    /// </summary>
    private void UpdateBatteryVisual(float batteryLevel)
    {
        if (batteryIndicatorMaterial != null)
        {
            // Меняем цвет в зависимости от уровня заряда
            Color color;
            if (batteryLevel > 60)
            {
                color = Color.green;
            }
            else if (batteryLevel > 30)
            {
                color = Color.yellow;
            }
            else
            {
                color = Color.red;
            }
            
            batteryIndicatorMaterial.SetColor("_EmissionColor", color * 0.5f);
        }
    }

    /// <summary>
    /// Отправка команды движения в React
    /// </summary>
    public void MoveToDestination(Vector3 target)
    {
        var data = new MoveData { x = target.x, y = target.y, z = target.z };
        ReactBridge.Instance.SendToReactApp("move", data);
    }

    /// <summary>
    /// Остановка робота
    /// </summary>
    public void Stop()
    {
        hasTarget = false;
        ReactBridge.Instance.SendToReactApp("stop", null);
    }

    /// <summary>
    /// Сброс позиции
    /// </summary>
    public void ResetPosition()
    {
        transform.position = Vector3.zero;
        transform.rotation = Quaternion.identity;
        ReactBridge.Instance.SendToReactApp("reset", null);
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

    [System.Serializable]
    public class MoveData
    {
        public float x;
        public float y;
        public float z;
    }
}
