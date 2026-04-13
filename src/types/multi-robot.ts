import { z } from 'zod'

export const robotIdSchema = z.string().cuid('Invalid robot ID')

export const robotCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  model: z.string().max(50).default('delivery-v1'),
  color: z.string().max(7).default('#3b82f6'),
  startPosition: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
})

export const robotUpdateSchema = robotCreateSchema.partial().extend({
  id: robotIdSchema,
})

export const multiRobotCommandSchema = z.object({
  robotIds: z.array(robotIdSchema).min(1),
  command: z.enum(['start', 'stop', 'pause', 'resume', 'reset', 'return_to_base']),
  scenarioId: z.string().cuid().optional(),
})

export type RobotCreate = z.infer<typeof robotCreateSchema>
export type RobotUpdate = z.infer<typeof robotUpdateSchema>
export type MultiRobotCommand = z.infer<typeof multiRobotCommandSchema>

export interface Robot {
  id: string
  name: string
  model: string
  color: string
  startPosition: {
    lat: number
    lon: number
  }
  createdAt: string
  isActive: boolean
}

export interface RobotState {
  id: string
  name: string
  color: string
  position: {
    lat: number
    lon: number
  }
  battery: number
  speed: number
  status: 'idle' | 'moving' | 'paused' | 'error' | 'charging'
  currentTask?: string
  progress: number
}

export interface MultiRobotSession {
  id: string
  scenarioId: string
  robots: RobotState[]
  startTime: number
  status: 'preparing' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  progress: number
}
