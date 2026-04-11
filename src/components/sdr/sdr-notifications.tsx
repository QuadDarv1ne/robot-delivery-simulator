'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Plane, Ship, Radio, Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import type { SDRContact } from './types'

interface SDRAudioNotificationsProps {
  contacts: SDRContact[]
  enabled?: boolean
}

export function SDRAudioNotifications({ contacts, enabled = true }: SDRAudioNotificationsProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(enabled)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const previousContactsRef = useRef<Set<string>>(new Set())
  const audioContextRef = useRef<AudioContext | null>(null)

  // Функция для воспроизведения звука
  const playNotificationSound = useCallback((type: 'ads-b' | 'ais' | 'aprs') => {
    if (!soundEnabled || !notificationsEnabled) return

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      // Разные частоты для разных типов
      switch (type) {
        case 'ads-b':
          oscillator.frequency.value = 800 // Высокий тон для самолетов
          break
        case 'ais':
          oscillator.frequency.value = 600 // Средний тон для судов
          break
        case 'aprs':
          oscillator.frequency.value = 440 // Низкий тон для APRS
          break
      }

      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.5)
    } catch (error) {
      console.error('[SDR] Error playing notification sound:', error)
    }
  }, [soundEnabled, notificationsEnabled])

  // Отслеживание новых контактов
  useEffect(() => {
    if (!notificationsEnabled) return

    const previousContacts = previousContactsRef.current
    const currentContacts = new Set(contacts.map(c => c.id))

    // Находим новые контакты
    const newContacts = contacts.filter(c => !previousContacts.has(c.id))

    if (newContacts.length > 0) {
      newContacts.forEach(contact => {
        // Воспроизводим звук
        playNotificationSound(contact.type)

        // Показываем toast уведомление
        const getIcon = () => {
          switch (contact.type) {
            case 'ads-b':
              return <Plane className="w-4 h-4" />
            case 'ais':
              return <Ship className="w-4 h-4" />
            case 'aprs':
              return <Radio className="w-4 h-4" />
          }
        }

        const getTitle = () => {
          switch (contact.type) {
            case 'ads-b':
              return `✈️ ${contact.callsign || 'Неизвестный самолёт'}`
            case 'ais':
              return `🚢 ${contact.name || 'Неизвестное судно'}`
            case 'aprs':
              return `📻 ${contact.callsign || 'Неизвестный маяк'}`
          }
        }

        toast.info(
          getTitle(),
          {
            description: `RSSI: ${contact.rssi.toFixed(1)} dBm | ${contact.lat.toFixed(4)}, ${contact.lon.toFixed(4)}`,
            duration: 4000,
            icon: getIcon(),
          }
        )
      })
    }

    // Обновляем предыдущее состояние
    previousContactsRef.current = currentContacts
  }, [contacts, notificationsEnabled, playNotificationSound])

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        {notificationsEnabled ? (
          <Bell className="w-4 h-4 text-blue-500" />
        ) : (
          <BellOff className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">Уведомления</span>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={notificationsEnabled}
          onCheckedChange={setNotificationsEnabled}
        />
        <span className="text-xs text-muted-foreground">
          {notificationsEnabled ? 'Включены' : 'Выключены'}
        </span>
      </div>

      {notificationsEnabled && (
        <div className="flex items-center gap-2">
          <Switch
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
          />
          <span className="text-xs text-muted-foreground">
            {soundEnabled ? 'Звук включён' : 'Звук выключен'}
          </span>
        </div>
      )}

      <Badge variant="secondary" className="ml-auto">
        {contacts.length} объектов
      </Badge>
    </div>
  )
}
