interface IMUViewProps {
  acceleration: { x: number; y: number; z: number }
  gyro: { x: number; y: number; z: number }
}

export function IMUView({ acceleration, gyro }: IMUViewProps) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-muted-foreground mb-1">Акселерометр (m/s²)</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {['X', 'Y', 'Z'].map((axis, i) => (
            <div key={axis} className="bg-muted/50 p-2 rounded text-center">
              <div className="text-muted-foreground">{axis}</div>
              <div className="font-mono font-semibold">
                {[acceleration.x, acceleration.y, acceleration.z][i].toFixed(3)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-1">Гироскоп (rad/s)</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {['X', 'Y', 'Z'].map((axis, i) => (
            <div key={axis} className="bg-muted/50 p-2 rounded text-center">
              <div className="text-muted-foreground">{axis}</div>
              <div className="font-mono font-semibold">
                {[gyro.x, gyro.y, gyro.z][i].toFixed(4)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
