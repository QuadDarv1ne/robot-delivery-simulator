import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square, RotateCcw } from 'lucide-react'

interface RobotState {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  battery: number
  status: 'idle' | 'moving' | 'delivering' | 'charging' | 'error'
}

interface ControlPanelProps {
  onCommand: (type: string, data?: Record<string, unknown>) => void
  robotState: RobotState | null
}

export function ControlPanel({ onCommand, robotState }: ControlPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div></div>
        <Button variant="outline" size="icon" onMouseDown={() => onCommand('move', { velocity: { x: 0, y: 0, z: 1 } })} onMouseUp={() => onCommand('stop')}>
          <ArrowUp className="h-4 w-4" />
        </Button>
        <div></div>
        <Button variant="outline" size="icon" onMouseDown={() => onCommand('move', { velocity: { x: -1, y: 0, z: 0 } })} onMouseUp={() => onCommand('stop')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => onCommand('stop')}>
          <Square className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onMouseDown={() => onCommand('move', { velocity: { x: 1, y: 0, z: 0 } })} onMouseUp={() => onCommand('stop')}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div></div>
        <Button variant="outline" size="icon" onMouseDown={() => onCommand('move', { velocity: { x: 0, y: 0, z: -1 } })} onMouseUp={() => onCommand('stop')}>
          <ArrowDown className="h-4 w-4" />
        </Button>
        <div></div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2">
        <Button variant={robotState?.status === 'moving' ? 'default' : 'outline'} onClick={() => onCommand('move', { velocity: { x: 0, y: 0, z: 0.5 } })}>
          Старт
        </Button>
        <Button variant="outline" onClick={() => onCommand('stop')}>
          Стоп
        </Button>
      </div>

      <Button variant="outline" className="w-full" onClick={() => onCommand('reset')}>
        <RotateCcw className="h-4 w-4 mr-2" />Сброс позиции
      </Button>
    </div>
  )
}
