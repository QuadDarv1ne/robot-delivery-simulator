'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  MessageSquare,
  Settings,
  Send
} from 'lucide-react'
import { useROS2Bridge } from '@/hooks/use-ros2-bridge'

interface ROS2BridgePanelProps {
  wsUrl?: string
}

export function ROS2BridgePanel({ wsUrl }: ROS2BridgePanelProps) {
  const {
    isConnected,
    topics,
    messages,
    connect,
    disconnect,
    publish,
    getMessagesForTopic
  } = useROS2Bridge({ url: wsUrl })

  // Get unique topics from messages
  const uniqueTopics = Array.from(new Set(messages.map(m => m.topic))).slice(-20)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="w-4 h-4" />
              ROS2 Bridge
            </CardTitle>
            <CardDescription>
              Интеграция с ROS2 через rosbridge_suite
            </CardDescription>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'} className={isConnected ? 'bg-green-500' : ''}>
            {isConnected ? (
              <><Wifi className="w-3 h-3 mr-1" />Подключено</>
            ) : (
              <><WifiOff className="w-3 h-3 mr-1" />Отключено</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={isConnected ? disconnect : connect}
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            {isConnected ? 'Отключить' : 'Подключить'}
          </Button>
        </div>

        <Separator />

        {/* Topics List */}
        <div className="space-y-2">
          <div className="text-xs font-medium flex items-center gap-2">
            <MessageSquare className="w-3 h-3" />
            Активные топики ({topics.length})
          </div>
          <ScrollArea className="h-32">
            <div className="space-y-1">
              {topics.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-2">
                  Нет активных топиков
                </div>
              ) : (
                topics.map((topic, idx) => (
                  <div
                    key={`${topic.topic}-${idx}`}
                    className="text-xs bg-muted/30 px-2 py-1 rounded flex items-center justify-between"
                  >
                    <code className="truncate">{topic.topic}</code>
                    <div className="flex gap-2 text-muted-foreground">
                      <span title="Publishers">P:{topic.publishers}</span>
                      <span title="Subscribers">S:{topic.subscribers}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Recent Messages */}
        <div className="space-y-2">
          <div className="text-xs font-medium flex items-center gap-2">
            <Send className="w-3 h-3" />
            Последние сообщения ({messages.length})
          </div>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {messages.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-2">
                  Нет сообщений
                </div>
              ) : (
                [...messages].reverse().slice(0, 20).map((msg, idx) => (
                  <div key={idx} className="text-xs bg-muted/30 px-2 py-1 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-blue-600 font-semibold">{msg.topic}</code>
                      <span className="text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-muted-foreground overflow-x-auto">
                      {typeof msg.message === 'object'
                        ? JSON.stringify(msg.message, null, 2).slice(0, 100)
                        : String(msg.message)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Quick Publish */}
        <Separator />
        <div className="space-y-2">
          <div className="text-xs font-medium">Быстрая публикация</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => publish('/robot/cmd_vel', 'geometry_msgs/Twist', {
                linear: { x: 0.5, y: 0, z: 0 },
                angular: { x: 0, y: 0, z: 0 }
              })}
            >
              Вперёд
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => publish('/robot/cmd_vel', 'geometry_msgs/Twist', {
                linear: { x: 0, y: 0, z: 0 },
                angular: { x: 0, y: 0, z: 0.5 }
              })}
            >
              Поворот
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => publish('/robot/cmd_vel', 'geometry_msgs/Twist', {
                linear: { x: -0.3, y: 0, z: 0 },
                angular: { x: 0, y: 0, z: 0 }
              })}
            >
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => publish('/robot/cmd_vel', 'geometry_msgs/Twist', {
                linear: { x: 0, y: 0, z: 0 },
                angular: { x: 0, y: 0, z: 0 }
              })}
            >
              Стоп
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
