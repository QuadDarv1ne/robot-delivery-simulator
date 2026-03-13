/**
 * Centralized logging utility
 * Prevents console.log in production and provides structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_PREFIX = '[RobotSimulator]'

function shouldLog(level: LogLevel): boolean {
  if (process.env.NODE_ENV === 'production') {
    return level !== 'debug'
  }
  return true
}

function formatMessage(level: LogLevel, message: string, context?: string): string {
  const timestamp = new Date().toISOString()
  const ctx = context ? `[${context}]` : ''
  return `${LOG_PREFIX}${ctx} [${level.toUpperCase()}] ${timestamp} - ${message}`
}

export const logger = {
  debug(message: string, context?: string, ...args: unknown[]) {
    if (!shouldLog('debug')) return
    console.debug(formatMessage('debug', message, context), ...args)
  },

  info(message: string, context?: string, ...args: unknown[]) {
    if (!shouldLog('info')) return
    console.info(formatMessage('info', message, context), ...args)
  },

  warn(message: string, context?: string, ...args: unknown[]) {
    if (!shouldLog('warn')) return
    console.warn(formatMessage('warn', message, context), ...args)
  },

  error(message: string, context?: string, error?: unknown) {
    if (!shouldLog('error')) return
    console.error(formatMessage('error', message, context), error || '')
  },
}

export function createLogger(context: string) {
  return {
    debug: (message: string, ...args: unknown[]) => logger.debug(message, context, ...args),
    info: (message: string, ...args: unknown[]) => logger.info(message, context, ...args),
    warn: (message: string, ...args: unknown[]) => logger.warn(message, context, ...args),
    error: (message: string, error?: unknown) => logger.error(message, context, error),
  }
}
