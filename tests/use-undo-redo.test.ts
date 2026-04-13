import { renderHook, act } from '@testing-library/react'
import { useUndoRedo } from '@/hooks/use-undo-redo'

describe('useUndoRedo Hook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useUndoRedo(0))
    
    expect(result.current.state).toBe(0)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('should update state and track history', () => {
    const { result } = renderHook(() => useUndoRedo(0))
    
    act(() => {
      result.current.setState(1)
    })
    
    expect(result.current.state).toBe(1)
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('should undo state changes', () => {
    const { result } = renderHook(() => useUndoRedo(0))
    
    act(() => {
      result.current.setState(1)
      result.current.setState(2)
    })
    
    expect(result.current.state).toBe(2)
    
    act(() => {
      result.current.undo()
    })
    
    expect(result.current.state).toBe(1)
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(true)
  })

  it('should redo state changes', () => {
    const { result } = renderHook(() => useUndoRedo(0))
    
    act(() => {
      result.current.setState(1)
      result.current.setState(2)
      result.current.undo()
    })
    
    // После undo можем сделать redo
    expect(result.current.canRedo).toBe(true)
    
    act(() => {
      result.current.redo()
    })
    
    expect(result.current.state).toBe(2)
  })

  it('should clear future when new change is made', () => {
    const { result } = renderHook(() => useUndoRedo(0))
    
    act(() => {
      result.current.setState(1)
      result.current.setState(2)
      result.current.undo()
    })
    
    expect(result.current.canRedo).toBe(true)
    
    act(() => {
      result.current.setState(3)
    })
    
    expect(result.current.state).toBe(3)
    expect(result.current.canRedo).toBe(false)
  })

  it('should respect maxHistory limit', () => {
    const maxHistory = 3
    const { result } = renderHook(() => useUndoRedo(0, maxHistory))
    
    act(() => {
      result.current.setState(1)
      result.current.setState(2)
      result.current.setState(3)
      result.current.setState(4)
    })
    
    // После 4 изменений, история должна быть ограничена 3
    // Отменяем 3 раза
    act(() => {
      result.current.undo()
      result.current.undo()
      result.current.undo()
    })
    
    // Должны дойти до 1 (так как 0 уже удалён из истории)
    expect(result.current.state).toBe(1)
  })

  it('should clear history', () => {
    const { result } = renderHook(() => useUndoRedo(0))
    
    act(() => {
      result.current.setState(1)
      result.current.setState(2)
    })
    
    // После clearHistory undo/redo недоступны
    act(() => {
      result.current.clearHistory()
    })
    
    expect(result.current.canRedo).toBe(false)
  })

  it('should handle function updates', () => {
    const { result } = renderHook(() => useUndoRedo({ count: 0 }))
    
    act(() => {
      result.current.setState((prev) => ({ count: prev.count + 1 }))
    })
    
    expect(result.current.state).toEqual({ count: 1 })
    
    act(() => {
      result.current.undo()
    })
    
    expect(result.current.state).toEqual({ count: 0 })
  })

  it('should not add to history if state is the same', () => {
    const { result } = renderHook(() => useUndoRedo(0))
    
    act(() => {
      result.current.setState(0)
    })
    
    expect(result.current.canUndo).toBe(false)
  })
})
