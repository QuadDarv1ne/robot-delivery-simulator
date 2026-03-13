import { z } from 'zod'

export const algorithmCreateSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  description: z.string().optional(),
  code: z.string()
    .min(10, 'Код алгоритма слишком короткий')
    .max(100000, 'Код алгоритма слишком длинный (макс. 100KB)'),
  language: z.enum(['python', 'javascript', 'c#']).default('python'),
  isPublic: z.boolean().default(false)
})

export const algorithmUpdateSchema = z.object({
  id: z.string().cuid('Невалидный ID алгоритма'),
  name: z.string().min(2, 'Название должно содержать минимум 2 символа').optional(),
  description: z.string().optional(),
  code: z.string()
    .min(10, 'Код алгоритма слишком короткий')
    .max(100000, 'Код алгоритма слишком длинный (макс. 100KB)').optional(),
  language: z.enum(['python', 'javascript', 'c#']).optional(),
  isPublic: z.boolean().optional()
})

export const algorithmIdSchema = z.object({
  id: z.string().cuid('Невалидный ID алгоритма')
})

export const algorithmCloneSchema = z.object({
  id: z.string().cuid('Невалидный ID алгоритма')
})

export const algorithmSearchSchema = z.object({
  q: z.string().optional(),
  language: z.enum(['python', 'javascript', 'c#']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
})

export const scenarioCreateSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  description: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  distance: z.number().positive().default(1000),
  timeLimit: z.number().positive().default(300),
  weather: z.enum(['sunny', 'rainy', 'snowy']).default('sunny'),
  traffic: z.enum(['low', 'medium', 'high']).default('low'),
  startPoint: z.string(),
  endPoint: z.string(),
  waypoints: z.union([z.string(), z.array(z.any())]).transform(val => 
    typeof val === 'string' ? val : JSON.stringify(val)
  ).default('[]'),
  obstacles: z.union([z.string(), z.array(z.any())]).transform(val => 
    typeof val === 'string' ? val : JSON.stringify(val)
  ).default('[]'),
  isPublic: z.boolean().default(true)
})

export const scenarioUpdateSchema = z.object({
  id: z.string().cuid('Невалидный ID сценария'),
  name: z.string().min(2, 'Название должно содержать минимум 2 символа').optional(),
  description: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  distance: z.number().positive().optional(),
  timeLimit: z.number().positive().optional(),
  weather: z.enum(['sunny', 'rainy', 'snowy']).optional(),
  traffic: z.enum(['low', 'medium', 'high']).optional(),
  startPoint: z.string().optional(),
  endPoint: z.string().optional(),
  waypoints: z.union([z.string(), z.array(z.any())]).transform(val => 
    typeof val === 'string' ? val : JSON.stringify(val)
  ).optional(),
  obstacles: z.union([z.string(), z.array(z.any())]).transform(val => 
    typeof val === 'string' ? val : JSON.stringify(val)
  ).optional(),
  isPublic: z.boolean().optional()
})

export const scenarioIdSchema = z.object({
  id: z.string().cuid('Невалидный ID сценария')
})

export const scenarioCloneSchema = z.object({
  id: z.string().cuid('Невалидный ID сценария')
})

export const scenarioSearchSchema = z.object({
  q: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  weather: z.enum(['sunny', 'rainy', 'snowy']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
})

export const algorithmRunSchema = z.object({
  code: z.string().min(10, 'Код алгоритма слишком короткий'),
  algorithmId: z.string().cuid().optional()
})
