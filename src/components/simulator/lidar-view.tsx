'use client'

import { useRef, useEffect } from 'react'

interface LidarViewProps {
  distances: number[]
  angles: number[]
}

export function LidarView({ distances, angles }: LidarViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const scale = Math.min(width, height) / 50

    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 1
    for (let r = 5; r <= 25; r += 5) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, r * scale, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.fillStyle = '#22c55e'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#3b82f6'
    distances.forEach((distance, i) => {
      const angle = (angles[i] * Math.PI) / 180
      const x = centerX + Math.cos(angle) * distance * scale
      const y = centerY - Math.sin(angle) * distance * scale

      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [distances, angles])

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className="rounded-lg border border-border"
    />
  )
}
