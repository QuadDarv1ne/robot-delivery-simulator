using UnityEngine;
using System.Runtime.InteropServices;

/// <summary>
/// Мост для двусторонней связи между Unity WebGL и React приложением
/// Singleton компонент - должен быть на сцене в единственном экземпляре
/// </summary>
public class ReactBridge : MonoBehaviour
{
    public static ReactBridge Instance { get; private set; }

    [DllImport("__Internal")]
    private static extern void SendToReact(string command, string data);

    [DllImport("__Internal")]
    private static extern void RegisterListener(string eventName);

    [DllImport("__Internal")]
    private static extern void NotifyUnityReady();

    private void Awake()
    {
        // Singleton паттерн
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            // Регистрируем слушатели событий из React
            InitializeListeners();
            
            // Уведомляем React что Unity готов
            NotifyUnityReady();
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private void InitializeListeners()
    {
        // Регистрируем слушатели для событий из React
        RegisterListener("unity-ready");
    }

    /// <summary>
    /// Отправка данных в React приложение
    /// </summary>
    /// <param name="command">Имя команды</param>
    /// <param name="data">Данные (будут сериализованы в JSON)</param>
    public void SendToReactApp(string command, object data)
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        string jsonData = JsonUtility.ToJson(data);
        SendToReact(command, jsonData);
#else
        Debug.Log($"[ReactBridge] SendToReact: {command} = {JsonUtility.ToJson(data)}");
#endif
    }

    /// <summary>
    /// Вызывается из JavaScript при получении данных из React
    /// </summary>
    /// <param name="jsonData">JSON данные из React</param>
    public void OnDataReceived(string jsonData)
    {
        try
        {
            var message = JsonUtility.FromJson<UnityMessage>(jsonData);
            HandleMessage(message);
        }
        catch (System.Exception e)
        {
            Debug.LogError($"[ReactBridge] Failed to parse message: {e.Message}");
            Debug.LogError($"[ReactBridge] Raw data: {jsonData}");
        }
    }

    /// <summary>
    /// Обработка входящих сообщений из React
    /// </summary>
    private void HandleMessage(UnityMessage message)
    {
        Debug.Log($"[ReactBridge] Received: {message.method}");

        switch (message.method)
        {
            case "UpdateRobotState":
                if (RobotController.Instance != null)
                {
                    RobotController.Instance.UpdateState(message.data);
                }
                break;

            case "UpdateSensors":
                if (SensorManager.Instance != null)
                {
                    SensorManager.Instance.UpdateSensors(message.data);
                }
                break;

            case "StartSimulation":
                if (SimulationManager.Instance != null)
                {
                    SimulationManager.Instance.StartSimulation();
                }
                break;

            case "InitializeConnection":
                if (NetworkManager.Instance != null)
                {
                    NetworkManager.Instance.Initialize();
                }
                break;

            default:
                Debug.LogWarning($"[ReactBridge] Unknown method: {message.method}");
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
