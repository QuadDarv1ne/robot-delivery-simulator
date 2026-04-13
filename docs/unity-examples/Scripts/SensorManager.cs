using UnityEngine;

/// <summary>
/// Менеджер сенсоров - управляет данными GPS, LiDAR, IMU и камер
/// </summary>
public class SensorManager : MonoBehaviour
{
    public static SensorManager Instance { get; private set; }

    [Header("Sensors")]
    public LidarSensor lidarSensor;
    public GPSSensor gpsSensor;
    public IMUSensor imuSensor;
    public CameraSensor[] cameraSensors;

    [Header("Update Settings")]
    public float sensorUpdateRate = 10f; // Hz
    private float nextSensorUpdate = 0f;

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
        // Обновляем сенсоры с заданной частотой
        if (Time.time >= nextSensorUpdate)
        {
            UpdateAllSensors();
            SendSensorDataToReact();
            nextSensorUpdate = Time.time + (1f / sensorUpdateRate);
        }
    }

    /// <summary>
    /// Обновление данных сенсоров из React
    /// </summary>
    public void UpdateSensors(string sensorDataJson)
    {
        try
        {
            var sensorData = JsonUtility.FromJson<SensorDataWrapper>(sensorDataJson);
            
            // Обновляем GPS
            if (gpsSensor != null && sensorData.gps != null)
            {
                gpsSensor.UpdateData(sensorData.gps);
            }

            // Обновляем LiDAR
            if (lidarSensor != null && sensorData.lidar != null)
            {
                lidarSensor.UpdateData(sensorData.lidar);
            }

            // Обновляем IMU
            if (imuSensor != null && sensorData.imu != null)
            {
                imuSensor.UpdateData(sensorData.imu);
            }

            Debug.Log("[SensorManager] Sensors updated from React");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"[SensorManager] Failed to update sensors: {e.Message}");
        }
    }

    /// <summary>
    /// Обновление всех сенсоров
    /// </summary>
    private void UpdateAllSensors()
    {
        if (gpsSensor != null)
        {
            gpsSensor.Update();
        }

        if (lidarSensor != null)
        {
            lidarSensor.Update();
        }

        if (imuSensor != null)
        {
            imuSensor.Update();
        }

        if (cameraSensors != null)
        {
            foreach (var camera in cameraSensors)
            {
                camera.Update();
            }
        }
    }

    /// <summary>
    /// Отправка данных сенсоров в React
    /// </summary>
    private void SendSensorDataToReact()
    {
        var data = new SensorData
        {
            gps = gpsSensor?.GetData(),
            lidar = lidarSensor?.GetData(),
            imu = imuSensor?.GetData(),
            cameras = GetCameraData()
        };

        ReactBridge.Instance.SendToReactApp("sensor-update", data);
    }

    /// <summary>
    /// Получение данных со всех камер
    /// </summary>
    private CameraData[] GetCameraData()
    {
        if (cameraSensors == null) return new CameraData[0];
        
        var cameras = new CameraData[cameraSensors.Length];
        for (int i = 0; i < cameraSensors.Length; i++)
        {
            cameras[i] = cameraSensors[i].GetData();
        }
        return cameras;
    }

    [System.Serializable]
    public class SensorDataWrapper
    {
        public GPSData gps;
        public LidarData lidar;
        public IMUData imu;
    }

    [System.Serializable]
    public class SensorData
    {
        public GPSData gps;
        public LidarData lidar;
        public IMUData imu;
        public CameraData[] cameras;
    }
}

/// <summary>
/// Базовый класс для GPS сенсора
/// </summary>
[System.Serializable]
public class GPSData
{
    public float lat;
    public float lon;
    public float altitude;
    public float accuracy;
}

public class GPSSensor : MonoBehaviour
{
    [Header("GPS Settings")]
    public float latitude = 55.7558f; // Moscow
    public float longitude = 37.6173f;
    public float altitude = 150f;
    public float accuracy = 5f;

    public void Update()
    {
        // Симуляция GPS данных
        // В реальности здесь был бы запрос к GPS API
    }

    public void UpdateData(GPSData data)
    {
        latitude = data.lat;
        longitude = data.lon;
        altitude = data.altitude;
        accuracy = data.accuracy;
    }

    public GPSData GetData()
    {
        return new GPSData
        {
            lat = latitude,
            lon = longitude,
            altitude = altitude,
            accuracy = accuracy
        };
    }
}

/// <summary>
/// Базовый класс для LiDAR сенсора
/// </summary>
[System.Serializable]
public class LidarData
{
    public float[] distances;
    public float[] angles;
    public long timestamp;
}

public class LidarSensor : MonoBehaviour
{
    [Header("LiDAR Settings")]
    public int rayCount = 360;
    public float maxDistance = 50f;
    public float angleStep = 1f;

    private float[] distances;
    private float[] angles;

    private void Start()
    {
        distances = new float[rayCount];
        angles = new float[rayCount];
        
        for (int i = 0; i < rayCount; i++)
        {
            angles[i] = i * angleStep;
        }
    }

    public void Update()
    {
        // Симуляция LiDAR данных
        // В реальности здесь был бы Raycast
        for (int i = 0; i < rayCount; i++)
        {
            distances[i] = maxDistance; // Placeholder
        }
    }

    public void UpdateData(LidarData data)
    {
        if (data.distances != null)
        {
            distances = data.distances;
        }
        if (data.angles != null)
        {
            angles = data.angles;
        }
    }

    public LidarData GetData()
    {
        return new LidarData
        {
            distances = distances,
            angles = angles,
            timestamp = System.DateTimeOffset.UtcNow.ToUnixTimeSeconds()
        };
    }

    // Визуализация LiDAR точек
    private void OnDrawGizmos()
    {
        if (distances == null) return;

        Gizmos.color = Color.red;
        for (int i = 0; i < distances.Length; i++)
        {
            if (distances[i] < maxDistance)
            {
                float angle = angles[i] * Mathf.Deg2Rad;
                Vector3 direction = new Vector3(Mathf.Cos(angle), 0, Mathf.Sin(angle));
                Gizmos.DrawSphere(transform.position + direction * distances[i], 0.1f);
            }
        }
    }
}

/// <summary>
/// Базовый класс для IMU сенсора
/// </summary>
[System.Serializable]
public class IMUData
{
    public Vector3Data acceleration;
    public Vector3Data gyro;
}

[System.Serializable]
public class Vector3Data
{
    public float x;
    public float y;
    public float z;
}

public class IMUSensor : MonoBehaviour
{
    [Header("IMU Settings")]
    public Vector3 acceleration;
    public Vector3 gyro;

    public void Update()
    {
        // Симуляция IMU данных
        acceleration = transform.InverseTransformDirection(GetComponent<Rigidbody>()?.velocity ?? Vector3.zero);
        gyro = transform.rotation.eulerAngles;
    }

    public void UpdateData(IMUData data)
    {
        if (data.acceleration != null)
        {
            acceleration = new Vector3(data.acceleration.x, data.acceleration.y, data.acceleration.z);
        }
        if (data.gyro != null)
        {
            gyro = new Vector3(data.gyro.x, data.gyro.y, data.gyro.z);
        }
    }

    public IMUData GetData()
    {
        return new IMUData
        {
            acceleration = new Vector3Data { x = acceleration.x, y = acceleration.y, z = acceleration.z },
            gyro = new Vector3Data { x = gyro.x, y = gyro.y, z = gyro.z }
        };
    }
}

/// <summary>
/// Базовый класс для камер
/// </summary>
[System.Serializable]
public class CameraData
{
    public string name;
    public string image; // Base64 encoded image
    public float timestamp;
}

public class CameraSensor : MonoBehaviour
{
    [Header("Camera Settings")]
    public string cameraName = "front";
    public int width = 640;
    public int height = 480;

    private Camera cam;
    private RenderTexture renderTexture;

    private void Start()
    {
        cam = GetComponent<Camera>();
        if (cam != null)
        {
            renderTexture = new RenderTexture(width, height, 24);
            cam.targetTexture = renderTexture;
        }
    }

    public void Update()
    {
        // Обновление камеры не требуется каждый кадр
        // Данные отправляются по запросу
    }

    public CameraData GetData()
    {
        // Получение снимка с камеры
        // В WebGL это может быть ограничено
        return new CameraData
        {
            name = cameraName,
            image = "", // Placeholder - в реальности здесь был бы EncodeToPNG
            timestamp = Time.time
        };
    }
}
