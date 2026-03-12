'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, PerspectiveCamera, Line, Text } from '@react-three/drei'
import * as THREE from 'three'

interface PointCloudProps {
  distances: number[]
  angles: number[]
  colorByDistance?: boolean
  pointSize?: number
}

// Single lidar point
function LidarPoint({ 
  position, 
  distance, 
  maxDistance 
}: { 
  position: [number, number, number]
  distance: number
  maxDistance: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Color based on distance
  const color = useMemo(() => {
    const ratio = distance / maxDistance
    if (ratio < 0.3) return '#ef4444' // Red - close
    if (ratio < 0.6) return '#f59e0b' // Orange - medium
    return '#22c55e' // Green - far
  }, [distance, maxDistance])
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

// Lidar scanner visualization
function LidarScanner({ rotation }: { rotation: number }) {
  return (
    <group rotation={[0, rotation, 0]}>
      {/* Scanner head */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
      
      {/* Laser beam */}
      <Line
        points={[[0, 0.1, 0], [0, 0.1, 25]]}
        color="#ef4444"
        lineWidth={1}
        transparent
        opacity={0.5}
      />
    </group>
  )
}

// Robot model
function RobotModel({ rotation }: { rotation: number }) {
  return (
    <group rotation={[0, rotation, 0]}>
      {/* Robot body */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.8, 0.5, 1.2]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      
      {/* Robot top */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.6, 0.1, 0.8]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      
      {/* Lidar sensor */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      
      {/* Wheels */}
      {[
        [-0.45, 0.1, 0.4],
        [0.45, 0.1, 0.4],
        [-0.45, 0.1, -0.4],
        [0.45, 0.1, -0.4],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      ))}
      
      {/* Camera */}
      <mesh position={[0, 0.4, 0.65]}>
        <boxGeometry args={[0.2, 0.1, 0.05]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
    </group>
  )
}

// Ground plane with grid
function Ground() {
  return (
    <group>
      <Grid
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1e293b"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#334155"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        position={[0, -0.01, 0]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  )
}

// Obstacle visualization
function Obstacle({ position, size }: { position: [number, number, number]; size: number }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[size, size * 2, size]} />
      <meshStandardMaterial color="#64748b" transparent opacity={0.7} />
    </mesh>
  )
}

// Main point cloud component
function PointCloud({ distances, angles, colorByDistance = true, pointSize = 0.05 }: PointCloudProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  const maxDistance = Math.max(...distances, 1)
  
  // Convert polar to cartesian coordinates
  const points = useMemo(() => {
    return distances.map((distance, i) => {
      const angle = (angles[i] * Math.PI) / 180
      const x = distance * Math.cos(angle)
      const z = distance * Math.sin(angle)
      return { position: [x, 0.5, z] as [number, number, number], distance }
    })
  }, [distances, angles])
  
  // Animate rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })
  
  return (
    <group ref={groupRef}>
      {points.slice(0, 200).map((point, i) => (
        <LidarPoint
          key={i}
          position={point.position}
          distance={point.distance}
          maxDistance={maxDistance}
        />
      ))}
    </group>
  )
}

// Scene with ambient elements
function Scene({ distances, angles }: { distances: number[]; angles: number[] }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#3b82f6" />
      
      <Ground />
      
      <RobotModel rotation={0} />
      
      <PointCloud distances={distances} angles={angles} />
      
      {/* Sample obstacles */}
      <Obstacle position={[5, 1, 3]} size={1} />
      <Obstacle position={[-4, 1, 6]} size={1.5} />
      <Obstacle position={[8, 1, -5]} size={0.8} />
      
      {/* Coordinate axes */}
      <group position={[0, 0.01, 0]}>
        <Line points={[[0, 0, 0], [3, 0, 0]]} color="#ef4444" lineWidth={2} />
        <Line points={[[0, 0, 0], [0, 3, 0]]} color="#22c55e" lineWidth={2} />
        <Line points={[[0, 0, 0], [0, 0, 3]]} color="#3b82f6" lineWidth={2} />
      </group>
      
      {/* Labels */}
      <Text position={[3.5, 0.2, 0]} fontSize={0.3} color="#ef4444">X</Text>
      <Text position={[0, 3.5, 0]} fontSize={0.3} color="#22c55e">Y</Text>
      <Text position={[0, 0.2, 3.5]} fontSize={0.3} color="#3b82f6">Z</Text>
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  )
}

export function Lidar3DView({ distances, angles }: PointCloudProps) {
  return (
    <div className="w-full h-full min-h-[300px] bg-slate-900 rounded-lg">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
        <Scene distances={distances} angles={angles} />
      </Canvas>
    </div>
  )
}

export default Lidar3DView
