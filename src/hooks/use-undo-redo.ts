import { useState, useCallback } from 'react'

interface UseUndoRedoReturn<T> {
  state: T
  setState: (newState: T | ((prev: T) => T)) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  clearHistory: () => void
}

export function useUndoRedo<T>(initialState: T, maxHistory: number = 20): UseUndoRedoReturn<T> {
  const [state, setState] = useState<T>(initialState)
  const [past, setPast] = useState<T[]>([])
  const [future, setFuture] = useState<T[]>([])

  const handleSetState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prevState => {
      const nextState = typeof newState === 'function'
        ? (newState as (prev: T) => T)(prevState)
        : newState

      // Если состояние не изменилось, ничего не делаем
      if (nextState === prevState) {
        return prevState
      }

      // Сохраняем текущее состояние в историю
      setPast(past => {
        const newHistory = [...past, prevState]
        // Ограничиваем размер истории
        return newHistory.slice(-maxHistory)
      })
      // Очищаем future при новом изменении
      setFuture([])

      return nextState
    })
  }, [maxHistory])

  const undo = useCallback(() => {
    setPast(past => {
      if (past.length === 0) return past

      const previous = past[past.length - 1]
      const newPast = past.slice(0, -1)

      setState(currentState => {
        setFuture(future => [currentState, ...future])
        return previous
      })

      return newPast
    })
  }, [])

  const redo = useCallback(() => {
    setFuture(future => {
      if (future.length === 0) return future

      const next = future[0]
      const newFuture = future.slice(1)

      setState(currentState => {
        setPast(past => [...past, currentState])
        return next
      })

      return newFuture
    })
  }, [])

  const clearHistory = useCallback(() => {
    setPast([])
    setFuture([])
  }, [])

  return {
    state,
    setState: handleSetState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clearHistory
  }
}
