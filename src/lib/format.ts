/**
 * Utility functions for formatting dates, numbers, and other values
 */

/**
 * Format date to Russian locale
 */
export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  })
}

/**
 * Format date relative to now (e.g., "5 минут назад")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) {
    return 'только что'
  } else if (diffMin < 60) {
    return `${diffMin} ${pluralize(diffMin, 'минуту', 'минуты', 'минут')} назад`
  } else if (diffHour < 24) {
    return `${diffHour} ${pluralize(diffHour, 'час', 'часа', 'часов')} назад`
  } else if (diffDay < 7) {
    return `${diffDay} ${pluralize(diffDay, 'день', 'дня', 'дней')} назад`
  } else {
    return formatDate(d, { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
}

/**
 * Format number with spaces (e.g., 1000 -> "1 000")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ru-RU')
}

/**
 * Format distance in meters or kilometers
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} км`
  }
  return `${Math.round(meters)} м`
}

/**
 * Format time in seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format percentage with fixed decimals
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format battery percentage with icon
 */
export function formatBattery(percent: number): string {
  const level = percent >= 80 ? '🔋' : percent >= 50 ? '🔋' : percent >= 20 ? '🪫' : '🪫'
  return `${level} ${percent}%`
}

/**
 * Get plural form for Russian language
 */
export function pluralize(n: number, one: string, two: string, five: string): string {
  const n1 = n % 10
  const n10 = n % 100

  if (n1 === 1 && n10 !== 11) {
    return one
  } else if (n1 >= 2 && n1 <= 4 && (n10 < 10 || n10 >= 20)) {
    return two
  } else {
    return five
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Format score with color class
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500'
  if (score >= 50) return 'text-yellow-500'
  return 'text-red-500'
}

/**
 * Format status to Russian
 */
export function formatStatus(status: string): string {
  const statuses: Record<string, string> = {
    success: 'Успешно',
    failed: 'Не удалось',
    cancelled: 'Отменено',
    pending: 'В ожидании',
    processing: 'Обработка',
    completed: 'Завершено',
    error: 'Ошибка'
  }
  return statuses[status] || status
}
