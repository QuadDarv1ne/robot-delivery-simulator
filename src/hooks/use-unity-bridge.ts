import { useCallback, useRef } from 'react'

/**
 * Хук для двусторонней связи между Unity WebGL и React
 * Предоставляет методы для отправки и получения данных из Unity
 */
export function useUnityBridge() {
  const callbacksRef = useRef<Map<string, Function>>(new Map())

  /**
   * Отправка данных из React в Unity
   * @param gameObject Имя игрового объекта в Unity
   * @param methodName Имя метода в Unity
   * @param value Данные для передачи (будут сериализованы в JSON)
   */
  const sendToUnity = useCallback((gameObject: string, methodName: string, value: unknown) => {
    if (typeof window !== 'undefined' && window.UnityInstance) {
      try {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value)
        window.UnityInstance.SendMessage(gameObject, methodName, serialized)
      } catch (error) {
        console.error('Failed to send message to Unity:', error)
        throw error
      }
    } else {
      console.warn('Unity instance not available')
    }
  }, [])

  /**
   * Отправка команды из Unity в React
   * @param command Имя команды
   * @param data Данные команды
   */
  const sendToReact = useCallback((command: string, data?: unknown) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('unity-command', {
        detail: { command, data }
      }))
    }
  }, [])

  /**
   * Регистрация обработчика для получения данных из Unity
   * @param event Name of the custom event to listen for
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  const listenToUnity = useCallback((event: string, callback: Function) => {
    callbacksRef.current.set(event, callback)
    
    const handler = (e: CustomEvent) => {
      callback(e.detail)
    }
    
    window.addEventListener(event, handler as EventListener)
    
    return () => {
      window.removeEventListener(event, handler as EventListener)
      callbacksRef.current.delete(event)
    }
  }, [])

  /**
   * Отправка сообщения о готовности Unity
   * Вызывается из Unity при инициализации
   */
  const notifyUnityReady = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('unity-ready', {
        detail: { timestamp: Date.now() }
      }))
    }
  }, [])

  /**
   * Получение состояния готовности Unity
   */
  const isUnityReady = useCallback(() => {
    return typeof window !== 'undefined' && !!window.UnityInstance
  }, [])

  return {
    sendToUnity,
    sendToReact,
    listenToUnity,
    notifyUnityReady,
    isUnityReady
  }
}
