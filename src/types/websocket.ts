/**
 * Shared types for WebSocket communication between client and server
 */

// ─── Server → Client Events ──────────────────────────────────────────────

export interface GPSData {
  lat: number
  lon: number
  altitude: number
  accuracy: number
}

export interface LidarData {
  distances: number[]
  angles: number[]
  timestamp: number
}

export interface IMUData {
  acceleration: { x: number; y: number; z: number }
  gyro: { x: number; y: number; z: number }
}

export interface EncodersData {
  leftWheel: number
  rightWheel: number
}

export interface SensorData {
  gps: GPSData
  lidar: LidarData
  cameras: { front: string; back: string; left: string; right: string }
  encoders: EncodersData
  imu: IMUData
}

export interface RobotState {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  battery: number
  status: 'idle' | 'moving' | 'delivering' | 'charging' | 'error'
}

export interface SensorDataEvent {
  sensorData: SensorData
  robotState: RobotState
}

export interface BatteryStatusEvent {
  battery: number
  status: string
}

export interface LocationEvent {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  gps: GPSData
}

export interface ObstacleInfo {
  type: 'pedestrian' | 'vehicle' | 'construction'
  position: { x: number; y: number; z: number }
  radius: number
}

export interface ObstaclesUpdateEvent {
  obstacles: Array<[string, ObstacleInfo]>
}

export interface CollisionEvent {
  obstacleId: string
  position: { x: number; y: number; z: number }
}

export interface DeliveryUpdateEvent {
  missionId: string
  progress: number
  status: 'started' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
}

export interface SimulatorState {
  robotState: RobotState | null
  sensorData: SensorData | null
  isConnected: boolean
}

// ─── Client → Server Events ──────────────────────────────────────────────

export type ControlCommandType =
  | 'move'
  | 'stop'
  | 'reset'
  | 'setSpeed'
  | 'setDestination'
  | 'getBattery'
  | 'getLocation'
  | 'resetPosition'
  | 'getSensors'
  | 'setSensors'
  | 'addObstacle'
  | 'removeObstacle'
  | 'clearObstacles'

export interface ControlCommand {
  type: ControlCommandType
  data: Record<string, unknown>
}

export interface RegisterPayload {
  type: 'viewer' | 'controller' | 'simulator'
}

// ─── Server-to-Client Event Map ──────────────────────────────────────────

export interface ServerToClientEvents {
  'sensor-data': (data: SensorDataEvent) => void
  'robot-state': (state: RobotState) => void
  'battery-status': (data: BatteryStatusEvent) => void
  'location': (data: LocationEvent) => void
  'obstacles-update': (data: ObstaclesUpdateEvent) => void
  'collision': (data: CollisionEvent) => void
  'delivery-update': (data: DeliveryUpdateEvent) => void
  'error': (error: { message: string; code?: string }) => void
}

// ─── Client-to-Server Event Map ──────────────────────────────────────────

export interface ClientToServerEvents {
  'register': (payload: RegisterPayload) => void
  'control': (command: ControlCommand) => void
  'start_mission': (data: { scenarioId: string; algorithmId?: string }) => void
  'stop_mission': () => void
  'update_route': (waypoints: Array<{ lat: number; lon: number }>) => void
}
