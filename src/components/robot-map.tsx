'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Next.js
const robotIcon = L.divIcon({
  className: 'robot-marker',
  html: `
    <div style="
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="white" stroke-width="2"/>
      </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

const deliveryIcon = L.divIcon({
  className: 'delivery-marker',
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const obstacleIcon = L.divIcon({
  className: 'obstacle-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

interface Waypoint {
  lat: number
  lon: number
  name?: string
}

interface Obstacle {
  lat: number
  lon: number
  radius: number
  type: 'pedestrian' | 'vehicle' | 'construction'
}

interface RobotMapProps {
  robotPosition: { lat: number; lon: number }
  robotHeading?: number
  destination?: { lat: number; lon: number }
  waypoints?: Waypoint[]
  obstacles?: Obstacle[]
  path?: { lat: number; lon: number }[]
  lidarPoints?: { distance: number; angle: number }[]
}

// Component to update map view when robot moves
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  
  useEffect(() => {
    map.panTo(center, { animate: true, duration: 0.5 })
  }, [center, map])
  
  return null
}

// Lidar visualization on map
function LidarLayer({ 
  robotPosition, 
  lidarPoints 
}: { 
  robotPosition: { lat: number; lon: number }
  lidarPoints?: { distance: number; angle: number }[]
}) {
  if (!lidarPoints || lidarPoints.length === 0) return null
  
  // Convert lidar points to map coordinates
  const points = lidarPoints.map(point => {
    const latOffset = (point.distance * Math.cos(point.angle * Math.PI / 180)) / 111000
    const lonOffset = (point.distance * Math.sin(point.angle * Math.PI / 180)) / (111000 * Math.cos(robotPosition.lat * Math.PI / 180))
    
    return {
      lat: robotPosition.lat + latOffset,
      lon: robotPosition.lon + lonOffset,
      distance: point.distance
    }
  })
  
  return (
    <>
      {points.slice(0, 50).map((point, index) => (
        <Circle
          key={index}
          center={[point.lat, point.lon]}
          radius={1}
          pathOptions={{
            color: point.distance < 10 ? '#ef4444' : point.distance < 20 ? '#f59e0b' : '#22c55e',
            fillOpacity: 0.8
          }}
        />
      ))}
    </>
  )
}

export function RobotMap({ 
  robotPosition, 
  robotHeading = 0,
  destination,
  waypoints = [],
  obstacles = [],
  path = [],
  lidarPoints
}: RobotMapProps) {
  const center: [number, number] = useMemo(() => [
    robotPosition.lat,
    robotPosition.lon
  ], [robotPosition.lat, robotPosition.lon])
  
  // Generate path from robot to destination
  const fullPath = useMemo(() => {
    const points: [number, number][] = [[robotPosition.lat, robotPosition.lon]]
    
    waypoints.forEach(wp => {
      points.push([wp.lat, wp.lon])
    })
    
    if (destination) {
      points.push([destination.lat, destination.lon])
    }
    
    return points
  }, [robotPosition, waypoints, destination])
  
  // Lidar range circle
  const lidarRange = 25 // meters
  
  return (
    <MapContainer
      center={center}
      zoom={17}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapUpdater center={center} />
      
      {/* Lidar range circle */}
      <Circle
        center={center}
        radius={lidarRange}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.05,
          weight: 1,
          dashArray: '5, 5'
        }}
      />
      
      {/* Lidar points on map */}
      <LidarLayer robotPosition={robotPosition} lidarPoints={lidarPoints} />
      
      {/* Path polyline */}
      {fullPath.length > 1 && (
        <Polyline
          positions={fullPath}
          pathOptions={{
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 10'
          }}
        />
      )}
      
      {/* Custom path if provided */}
      {path.length > 0 && (
        <Polyline
          positions={path.map(p => [p.lat, p.lon])}
          pathOptions={{
            color: '#22c55e',
            weight: 3,
            opacity: 0.6
          }}
        />
      )}
      
      {/* Obstacles */}
      {obstacles.map((obstacle, index) => (
        <Circle
          key={`obstacle-${index}`}
          center={[obstacle.lat, obstacle.lon]}
          radius={obstacle.radius}
          pathOptions={{
            color: obstacle.type === 'pedestrian' ? '#f59e0b' : 
                   obstacle.type === 'vehicle' ? '#ef4444' : '#6b7280',
            fillColor: obstacle.type === 'pedestrian' ? '#f59e0b' : 
                       obstacle.type === 'vehicle' ? '#ef4444' : '#6b7280',
            fillOpacity: 0.3
          }}
        />
      ))}
      
      {/* Waypoints */}
      {waypoints.map((wp, index) => (
        <Marker
          key={`wp-${index}`}
          position={[wp.lat, wp.lon]}
          icon={L.divIcon({
            className: 'waypoint-marker',
            html: `
              <div style="
                width: 24px;
                height: 24px;
                background: #f59e0b;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
                color: white;
              ">${index + 1}</div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}
        >
          <Popup>{wp.name || `Точка ${index + 1}`}</Popup>
        </Marker>
      ))}
      
      {/* Destination marker */}
      {destination && (
        <Marker position={[destination.lat, destination.lon]} icon={deliveryIcon}>
          <Popup>
            <div className="text-center">
              <strong>📦 Точка доставки</strong>
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* Robot marker */}
      <Marker position={center} icon={robotIcon}>
        <Popup>
          <div className="text-center">
            <strong>🤖 Робот</strong>
            <div className="text-xs text-muted-foreground mt-1">
              {robotPosition.lat.toFixed(6)}, {robotPosition.lon.toFixed(6)}
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
