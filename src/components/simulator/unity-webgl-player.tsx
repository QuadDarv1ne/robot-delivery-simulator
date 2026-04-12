import { Badge } from '@/components/ui/badge'
import { Cpu, Gauge } from 'lucide-react'

export function UnityWebGLPlayer() {
  return (
    <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-20 h-20 text-blue-400">
              <rect x="25" y="40" width="50" height="40" rx="5" fill="currentColor" opacity="0.8"/>
              <rect x="30" y="20" width="40" height="25" rx="3" fill="currentColor" opacity="0.9"/>
              <circle cx="40" cy="30" r="4" fill="#1e293b"/>
              <circle cx="60" cy="30" r="4" fill="#1e293b"/>
              <circle cx="35" cy="85" r="8" fill="currentColor"/>
              <circle cx="65" cy="85" r="8" fill="currentColor"/>
              <rect x="45" y="10" width="10" height="15" rx="2" fill="currentColor"/>
              <circle cx="50" cy="10" r="5" fill="#22c55e"/>
            </svg>
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/50 animate-ping opacity-20"/>
        </div>
        <h3 className="text-xl font-semibold mb-2">Unity WebGL Симулятор</h3>
        <p className="text-sm text-slate-400 mb-4 text-center max-w-xs">Загрузите ваш Unity WebGL билд в папку public/unity-build</p>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-blue-500/50 text-blue-400"><Cpu className="w-3 h-3 mr-1" />Unity 2022.3+</Badge>
          <Badge variant="outline" className="border-green-500/50 text-green-400"><Gauge className="w-3 h-3 mr-1" />WebGL 2.0</Badge>
        </div>
      </div>
      <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px'}}/>
    </div>
  )
}
