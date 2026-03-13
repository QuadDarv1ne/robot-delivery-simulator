'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  UserCog, 
  BarChart3, 
  Activity, 
  Navigation,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Trash2,
  Edit,
  Shield,
  GraduationCap,
  BookOpen,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react'

interface AdminStats {
  overview: {
    totalUsers: number
    studentsCount: number
    teachersCount: number
    adminsCount: number
    totalDeliveries: number
    successfulDeliveries: number
    failedDeliveries: number
    averageSuccessRate: number
    totalDistance: number
    totalCollisions: number
  }
  recentUsers: Array<{
    id: string
    name: string
    email: string
    role: string
    createdAt: string
  }>
  recentDeliveries: Array<{
    id: string
    scenarioName: string
    status: string
    distance: number
    duration: number
    createdAt: string
    user: { name: string; email: string }
  }>
  topPerformers: Array<{
    id: string
    name: string
    email: string
    successRate: number
    totalDeliveries: number
    bestTime: number | null
  }>
}

interface User {
  id: string
  email: string
  name: string
  role: string
  group: string | null
  avatar: string | null
  totalDeliveries: number
  successRate: number
  totalDistance: number
  totalCollisions: number
  createdAt: string
  lastActiveAt: string
  _count: {
    deliveries: number
    algorithms: number
    achievements: number
  }
}

interface AdminPanelProps {
  onLogout: () => void
}

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editData, setEditData] = useState({ name: '', role: '', group: '' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch stats and users
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }
    } catch (err) {
      setError('Ошибка загрузки данных')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (roleFilter) params.set('role', roleFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      setError('Ошибка поиска')
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          data: editData
        })
      })

      if (response.ok) {
        setSuccess('Пользователь обновлён')
        setIsEditDialogOpen(false)
        fetchData()
      } else {
        const data = await response.json()
        setError(data.error || 'Ошибка обновления')
      }
    } catch {
      setError('Ошибка соединения')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users?userId=${selectedUser.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Пользователь удалён')
        setIsDeleteDialogOpen(false)
        fetchData()
      } else {
        const data = await response.json()
        setError(data.error || 'Ошибка удаления')
      }
    } catch {
      setError('Ошибка соединения')
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditData({
      name: user.name,
      role: user.role,
      group: user.group || ''
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-red-500" />
      case 'teacher': return <BookOpen className="w-4 h-4 text-purple-500" />
      default: return <GraduationCap className="w-4 h-4 text-blue-500" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-red-500">Админ</Badge>
      case 'teacher': return <Badge className="bg-purple-500">Преподаватель</Badge>
      default: return <Badge className="bg-blue-500">Студент</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Загрузка админ-панели...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Админ-панель</h1>
              <p className="text-xs text-muted-foreground">Управление симулятором</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500 text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="deliveries">
              <Navigation className="w-4 h-4 mr-2" />
              Доставки
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {stats && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">Пользователей</span>
                      </div>
                      <div className="text-2xl font-bold">{stats.overview.totalUsers}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {stats.overview.studentsCount} студентов • {stats.overview.teachersCount} преподавателей
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Navigation className="w-4 h-4" />
                        <span className="text-xs">Доставок</span>
                      </div>
                      <div className="text-2xl font-bold">{stats.overview.totalDeliveries}</div>
                      <div className="text-xs text-green-500 mt-1">
                        {stats.overview.successfulDeliveries} успешно ({stats.overview.averageSuccessRate}%)
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs">Расстояние</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {(stats.overview.totalDistance / 1000).toFixed(1)} км
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Всего пройдено
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs">Столкновений</span>
                      </div>
                      <div className="text-2xl font-bold">{stats.overview.totalCollisions}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Всего за всё время
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Performers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Топ пользователи
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.topPerformers.map((user, index) => (
                          <div key={user.id} className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{user.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {user.totalDeliveries} доставок
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-mono">{Math.round(user.successRate)}%</div>
                              <div className="text-xs text-muted-foreground">успех</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Users */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Новые пользователи
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.recentUsers.map((user) => (
                          <div key={user.id} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{user.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                            </div>
                            {getRoleBadge(user.role)}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserCog className="w-5 h-5" />
                      Управление пользователями
                    </CardTitle>
                    <CardDescription>
                      Просмотр и редактирование пользователей
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Экспорт
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search & Filters */}
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск по имени или email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={roleFilter || 'all'} onValueChange={(v) => setRoleFilter(v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Роль" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      <SelectItem value="student">Студенты</SelectItem>
                      <SelectItem value="teacher">Преподаватели</SelectItem>
                      <SelectItem value="admin">Админы</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSearch}>Найти</Button>
                </div>

                <Separator className="mb-4" />

                {/* Users List */}
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{user.name}</span>
                            {getRoleIcon(user.role)}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                          {user.group && (
                            <div className="text-xs text-muted-foreground">Группа: {user.group}</div>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-center text-xs">
                          <div>
                            <div className="font-mono font-semibold">{user.totalDeliveries}</div>
                            <div className="text-muted-foreground">Доставок</div>
                          </div>
                          <div>
                            <div className="font-mono font-semibold">{Math.round(user.successRate)}%</div>
                            <div className="text-muted-foreground">Успех</div>
                          </div>
                          <div>
                            <div className="font-mono font-semibold">{(user.totalDistance / 1000).toFixed(1)}</div>
                            <div className="text-muted-foreground">км</div>
                          </div>
                          <div>
                            <div className={`font-mono font-semibold ${user.totalCollisions > 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {user.totalCollisions}
                            </div>
                            <div className="text-muted-foreground">Столкн.</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {users.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Пользователи не найдены
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deliveries Tab */}
          <TabsContent value="deliveries">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  История доставок
                </CardTitle>
                <CardDescription>
                  Последние доставки всех пользователей
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {stats?.recentDeliveries.map((delivery) => (
                      <div
                        key={delivery.id}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          delivery.status === 'success' ? 'bg-green-500' : 
                          delivery.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{delivery.scenarioName}</div>
                          <div className="text-xs text-muted-foreground">
                            {delivery.user.name} • {delivery.user.email}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center text-xs">
                          <div>
                            <div className="font-mono font-semibold">{delivery.distance} м</div>
                            <div className="text-muted-foreground">Расст.</div>
                          </div>
                          <div>
                            <div className="font-mono font-semibold">{delivery.duration} сек</div>
                            <div className="text-muted-foreground">Время</div>
                          </div>
                          <div>
                            <Badge variant={delivery.status === 'success' ? 'default' : 'secondary'}>
                              {delivery.status === 'success' ? 'Успех' : delivery.status === 'failed' ? 'Ошибка' : 'Отмена'}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {new Date(delivery.createdAt).toLocaleString('ru-RU')}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription>
              Изменение данных пользователя
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Имя</label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Роль</label>
              <Select
                value={editData.role}
                onValueChange={(value) => setEditData({ ...editData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Студент</SelectItem>
                  <SelectItem value="teacher">Преподаватель</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Группа</label>
              <Input
                value={editData.group}
                onChange={(e) => setEditData({ ...editData, group: e.target.value })}
                placeholder="ИУ7-72Б"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleEditUser}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Удалить пользователя?</DialogTitle>
            <DialogDescription>
              Это действие необратимо. Все данные пользователя будут удалены.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedUser.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
