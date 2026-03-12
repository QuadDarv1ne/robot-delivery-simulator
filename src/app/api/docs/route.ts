import { NextResponse } from 'next/server'

export async function GET() {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Robot Delivery Simulator API',
      description: 'API документация для симулятора робота-доставщика',
      version: '1.0.0',
      contact: {
        name: 'Robot Simulator Team',
        email: 'support@robotsimulator.dev'
      }
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development server' }
    ],
    tags: [
      { name: 'auth', description: 'Аутентификация и авторизация' },
      { name: 'users', description: 'Управление пользователями' },
      { name: 'admin', description: 'Администрирование' },
      { name: 'algorithms', description: 'Алгоритмы управления' },
      { name: 'leaderboard', description: 'Рейтинг пользователей' },
      { name: 'reports', description: 'Отчёты и экспорт' }
    ],
    paths: {
      '/api/auth/login': {
        post: {
          tags: ['auth'],
          summary: 'Авторизация пользователя',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginInput' }
              }
            }
          },
          responses: {
            '200': { description: 'Успешная авторизация' },
            '401': { description: 'Неверные учётные данные' }
          }
        }
      },
      '/api/auth/register': {
        post: {
          tags: ['auth'],
          summary: 'Регистрация нового пользователя',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterInput' }
              }
            }
          },
          responses: {
            '201': { description: 'Пользователь создан' },
            '400': { description: 'Пользователь уже существует' }
          }
        }
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['auth'],
          summary: 'Запрос на восстановление пароля',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: { email: { type: 'string', format: 'email' } }
                }
              }
            }
          },
          responses: { '200': { description: 'Письмо отправлено' } }
        }
      },
      '/api/user/me': {
        get: {
          tags: ['users'],
          summary: 'Получить текущего пользователя',
          responses: {
            '200': {
              description: 'Данные пользователя',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            '401': { description: 'Не авторизован' }
          }
        }
      },
      '/api/admin/stats': {
        get: {
          tags: ['admin'],
          summary: 'Статистика системы',
          responses: {
            '200': { description: 'Статистические данные' }
          }
        }
      },
      '/api/admin/users': {
        get: {
          tags: ['admin'],
          summary: 'Список пользователей',
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'role', in: 'query', schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'Список пользователей' } }
        }
      },
      '/api/algorithms': {
        get: {
          tags: ['algorithms'],
          summary: 'Список алгоритмов пользователя',
          responses: { '200': { description: 'Список алгоритмов' } }
        },
        post: {
          tags: ['algorithms'],
          summary: 'Создать новый алгоритм',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AlgorithmInput' }
              }
            }
          },
          responses: { '201': { description: 'Алгоритм создан' } }
        }
      },
      '/api/algorithms/run': {
        post: {
          tags: ['algorithms'],
          summary: 'Запуск симуляции алгоритма',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    algorithmId: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Результат симуляции',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SimulationResult' }
                }
              }
            }
          }
        }
      },
      '/api/leaderboard': {
        get: {
          tags: ['leaderboard'],
          summary: 'Рейтинг пользователей',
          parameters: [
            { name: 'period', in: 'query', schema: { type: 'string' } },
            { name: 'group', in: 'query', schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'Рейтинг' } }
        }
      },
      '/api/reports/export': {
        get: {
          tags: ['reports'],
          summary: 'Экспорт отчёта в PDF',
          parameters: [
            { name: 'type', in: 'query', schema: { type: 'string' } },
            { name: 'period', in: 'query', schema: { type: 'string' } }
          ],
          responses: {
            '200': {
              description: 'PDF файл',
              content: {
                'application/pdf': {
                  schema: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['student', 'teacher', 'admin'] },
            group: { type: 'string' },
            totalDeliveries: { type: 'integer' },
            successRate: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 }
          }
        },
        RegisterInput: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            name: { type: 'string' },
            group: { type: 'string' }
          }
        },
        AlgorithmInput: {
          type: 'object',
          required: ['name', 'code'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            language: { type: 'string', enum: ['python', 'javascript'] },
            code: { type: 'string' },
            isPublic: { type: 'boolean' }
          }
        },
        SimulationResult: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            distanceTraveled: { type: 'number' },
            timeElapsed: { type: 'integer' },
            collisions: { type: 'integer' },
            pathEfficiency: { type: 'number' },
            logs: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session'
        }
      }
    }
  }

  return NextResponse.json(openApiSpec)
}
