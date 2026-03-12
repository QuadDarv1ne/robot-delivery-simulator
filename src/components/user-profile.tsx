'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Mail, 
  Users, 
  LogOut, 
  Settings, 
  Trophy,
  Target,
  Navigation,
  Clock,
  AlertTriangle,
  Edit2,
  Save,
  X
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface UserProfileProps {
  onLogout: () => void
}

export function UserProfile({ onLogout }: UserProfileProps) {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [group, setGroup] = useState(user?.group || '')
  const [isSaving, setIsSaving] = useState(false)

  if (!user) return null

  const handleSave = async () => {
    setIsSaving(true)
    await updateUser({ name, group })
    setIsEditing(false)
    setIsSaving(false)
  }

  const handleCancel = () => {
    setName(user.name)
    setGroup(user.group || '')
    setIsEditing(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500">Администратор</Badge>
      case 'teacher':
        return <Badge className="bg-purple-500">Преподаватель</Badge>
      default:
        return <Badge className="bg-blue-500">Студент</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Mail className="w-3 h-3" />
                {user.email}
              </CardDescription>
            </div>
          </div>
          {getRoleBadge(user.role)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Edit Profile */}
        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Имя</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-group">Группа</Label>
              <Input
                id="edit-group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-1" />
                Сохранить
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" />
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {user.group && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Группа: {user.group}
                </div>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <Separator />
        
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Target className="w-3 h-3" />
              Доставок
            </div>
            <div className="text-xl font-bold">{user.totalDeliveries || 0}</div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Trophy className="w-3 h-3" />
              Успешность
            </div>
            <div className="text-xl font-bold">
              {user.successRate ? `${Math.round(user.successRate)}%` : '0%'}
            </div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Navigation className="w-3 h-3" />
              Пройдено
            </div>
            <div className="text-xl font-bold">
              {user.totalDistance ? `${(user.totalDistance / 1000).toFixed(1)} км` : '0 км'}
            </div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
              Лучшее время
            </div>
            <div className="text-xl font-bold">
              {user.bestTime ? `${Math.round(user.bestTime)} сек` : '-'}
            </div>
          </div>
        </div>
        
        {/* Performance */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Рейтинг производительности</div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Эффективность</span>
                <span>{user.successRate ? Math.round(user.successRate) : 0}%</span>
              </div>
              <Progress value={user.successRate || 0} className="h-1" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Безопасность</span>
                <span>{user.totalCollisions === 0 ? 100 : Math.max(0, 100 - user.totalCollisions * 10)}%</span>
              </div>
              <Progress value={user.totalCollisions === 0 ? 100 : Math.max(0, 100 - user.totalCollisions * 10)} className="h-1" />
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Achievements placeholder */}
        <div className="space-y-2">
          <div className="text-xs font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Достижения
          </div>
          <div className="flex flex-wrap gap-1">
            {user.totalDeliveries && user.totalDeliveries > 0 && (
              <Badge variant="secondary" className="text-xs">
                🚀 Первая доставка
              </Badge>
            )}
            {user.totalDeliveries && user.totalDeliveries >= 10 && (
              <Badge variant="secondary" className="text-xs">
                📦 10 доставок
              </Badge>
            )}
            {user.totalCollisions === 0 && user.totalDeliveries && user.totalDeliveries > 0 && (
              <Badge variant="secondary" className="text-xs">
                🛡️ Безопасный водитель
              </Badge>
            )}
            {(!user.totalDeliveries || user.totalDeliveries === 0) && (
              <span className="text-xs text-muted-foreground">
                Выполните первую доставку для получения достижений
              </span>
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Logout */}
        <Button 
          variant="outline" 
          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Выйти из аккаунта
        </Button>
      </CardContent>
    </Card>
  )
}
