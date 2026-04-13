using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// Менеджер сети - управляет WebSocket соединением с сервером симуляции
/// </summary>
public class NetworkManager : MonoBehaviour
{
    public static NetworkManager Instance { get; private set; }

    [Header("Network Settings")]
    public string serverUrl = "http://localhost:3003";
    public bool isConnected = false;
    public float reconnectInterval = 5f;

    [Header("Statistics")]
    public int messagesSent = 0;
    public int messagesReceived = 0;
    public float lastMessageTime = 0f;

    private Queue<object> messageQueue = new Queue<object>();
    private bool isInitialized = false;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private void Update()
    {
        // Обработка очереди сообщений
        if (messageQueue.Count > 0 && isConnected)
        {
            var message = messageQueue.Dequeue();
            ProcessMessage(message);
        }
    }

    /// <summary>
    /// Инициализация соединения
    /// </summary>
    public void Initialize()
    {
        if (!isInitialized)
        {
            isInitialized = true;
            ConnectToServer();
            
            Debug.Log("[NetworkManager] Initialized");
        }
    }

    /// <summary>
    /// Подключение к серверу
    /// </summary>
    private void ConnectToServer()
    {
        // В WebGL Unity не может напрямую подключиться к WebSocket
        // Поэтому мы используем JavaScript плагин для соединения
        
#if UNITY_WEBGL && !UNITY_EDITOR
        // Вызов JavaScript для создания WebSocket соединения
        Application.ExternalCall("initWebSocket", serverUrl);
#else
        Debug.Log($"[NetworkManager] Would connect to {serverUrl} in WebGL build");
#endif
    }

    /// <summary>
    /// Отправка сообщения на сервер
    /// </summary>
    public void SendMessage(string eventName, object data)
    {
        if (!isConnected)
        {
            Debug.LogWarning("[NetworkManager] Not connected, queuing message");
            messageQueue.Enqueue(new { eventName, data });
            return;
        }

#if UNITY_WEBGL && !UNITY_EDITOR
        string jsonData = JsonUtility.ToJson(data);
        Application.ExternalCall("sendWebSocketMessage", eventName, jsonData);
        messagesSent++;
        lastMessageTime = Time.time;
#else
        Debug.Log($"[NetworkManager] Send: {eventName} = {JsonUtility.ToJson(data)}");
        messagesSent++;
#endif
    }

    /// <summary>
    /// Получение сообщения от сервера (вызывается из JavaScript)
    /// </summary>
    public void OnMessageReceived(string jsonData)
    {
        try
        {
            var message = JsonUtility.FromJson<NetworkMessage>(jsonData);
            HandleMessage(message);
            messagesReceived++;
            lastMessageTime = Time.time;
        }
        catch (System.Exception e)
        {
            Debug.LogError($"[NetworkManager] Failed to parse message: {e.Message}");
        }
    }

    /// <summary>
    /// Обработка входящих сообщений
    /// </summary>
    private void HandleMessage(NetworkMessage message)
    {
        switch (message.eventName)
        {
            case "sensor-data":
                if (SensorManager.Instance != null)
                {
                    SensorManager.Instance.UpdateSensors(message.data);
                }
                break;

            case "robot-state":
                if (RobotController.Instance != null)
                {
                    RobotController.Instance.UpdateState(message.data);
                }
                break;

            case "simulation-command":
                HandleSimulationCommand(message.data);
                break;

            default:
                Debug.LogWarning($"[NetworkManager] Unknown event: {message.eventName}");
                break;
        }
    }

    /// <summary>
    /// Обработка команд симуляции
    /// </summary>
    private void HandleSimulationCommand(string dataJson)
    {
        var command = JsonUtility.FromJson<SimulationCommand>(dataJson);
        
        switch (command.command)
        {
            case "start":
                SimulationManager.Instance?.StartSimulation();
                break;
            case "stop":
                SimulationManager.Instance?.StopSimulation();
                break;
            case "pause":
                SimulationManager.Instance?.PauseSimulation();
                break;
            case "reset":
                SimulationManager.Instance?.ResetSimulation();
                break;
            case "speed":
                if (SimulationManager.Instance != null)
                {
                    SimulationManager.Instance.simulationSpeed = command.speed;
                }
                break;
        }
    }

    /// <summary>
    /// Обработка сообщения из очереди
    /// </summary>
    private void ProcessMessage(object message)
    {
        // В реальной реализации здесь была бы отправка на сервер
    }

    /// <summary>
    /// Вызывается из JavaScript при подключении
    /// </summary>
    public void OnConnected()
    {
        isConnected = true;
        Debug.Log("[NetworkManager] Connected to server");
        
        ReactBridge.Instance.SendToReactApp("network-connected", new { url = serverUrl });
    }

    /// <summary>
    /// Вызывается из JavaScript при отключении
    /// </summary>
    public void OnDisconnected(string reason)
    {
        isConnected = false;
        Debug.Log($"[NetworkManager] Disconnected: {reason}");
        
        // Автоматическое переподключение
        Invoke(nameof(ConnectToServer), reconnectInterval);
    }

    [System.Serializable]
    public class NetworkMessage
    {
        public string eventName;
        public string data;
    }

    [System.Serializable]
    public class SimulationCommand
    {
        public string command;
        public float speed;
    }
}
