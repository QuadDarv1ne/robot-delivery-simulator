'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Navigation,
  Target,
  Zap,
  RefreshCw,
  Award,
  Users,
  BarChart3
} from 'lucide-react'

interface LeaderboardEntry {
  id: string
  rank: number
  name: string
  email: string
  group: string | null
  avatar: string | null
  totalDeliveries: number
  successfulDeliveries: number
  successRate: number
  totalDistance: number
  totalCollisions: number
  avgDuration: number
  bestTime: number | null
  achievements: number
  score: number
  previousRank: number | null
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  groups: string[]
  currentUserPosition: LeaderboardEntry | null
  period: string
  total: number
}

interface LeaderboardProps {
  currentUserId?: string
}

export function Leaderboard({ currentUserId }: LeaderboardProps) {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('all')
  const [group, setGroup] = useState('')
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full')

  useEffect(() => {
    fetchLeaderboard()
  }, [period, group])

  const fetchLeaderboard = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('period', period)
      if (group) params.set('group', group)

      const url = `${window.location.origin}/api/leaderboard?${params}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = ['bg-yellow-500', 'bg-gray-400', 'bg-amber-600']
      return (
        <div className={`w-8 h-8 rounded-full ${colors[rank - 1]} flex items-center justify-center`}>
          {rank === 1 ? <Crown className="w-4 h-4 text-white" /> : <Medal className="w-4 h-4 text-white" />}
        </div>
      )
    }
    return (
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <span className="text-sm font-bold">{rank}</span>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  const getRankChange = (current: number, previous: number | null) => {
    if (previous === null) return null
    const diff = previous - current
    if (diff > 0) return { up: true, value: diff }
    if (diff < 0) return { up: false, value: Math.abs(diff) }
    return { up: null, value: 0 }
  }

  const formatTime = (seconds: number | null) => {
    if (seconds === null || seconds === Infinity) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} км`
    }
    return `${meters} м`
  }

  // Top 3 podium
  const renderPodium = () => {
    if (!data || data.leaderboard.length < 3) return null

    const top3 = data.leaderboard.slice(0, 3)
    const positions = [1, 0, 2] // Order: 2nd, 1st, 3rd for visual layout

    return (
      <div className="flex items-end justify-center gap-2 mb-6 h-40">
        {positions.map((idx, pos) => {
          const user = top3[idx]
          if (!user) return null
          const heights = ['h-24', 'h-32', 'h-20']
          const colors = ['bg-gray-200 dark:bg-gray-700', 'bg-yellow-100 dark:bg-yellow-900/30', 'bg-amber-100 dark:bg-amber-900/30']
          
          return (
            <div key={user.id} className="flex flex-col items-center">
              <div className="relative mb-2">
                <Avatar className={`h-12 w-12 ring-2 ${idx === 0 ? 'ring-yellow-500' : idx === 1 ? 'ring-gray-400' : 'ring-amber-600'}`}>
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1">
                  {getRankIcon(idx + 1)}
                </div>
              </div>
              <div className={`w-24 ${heights[idx]} ${colors[idx]} rounded-t-lg flex flex-col items-center justify-end p-2`}>
                <span className="text-xs font-medium truncate w-full text-center">{user.name}</span>
                <span className="text-lg font-bold">{user.score}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Загрузка рейтинга...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Рейтинг студентов
              </CardTitle>
              <CardDescription>
                Всего участников: {data?.total || 0}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-36">
                  <Clock className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все время</SelectItem>
                  <SelectItem value="month">За месяц</SelectItem>
                  <SelectItem value="week">За неделю</SelectItem>
                </SelectContent>
              </Select>

              <Select value={group || 'all'} onValueChange={(v) => setGroup(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-36">
                  <Users className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Группа" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все группы</SelectItem>
                  {data?.groups.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={fetchLeaderboard}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current user position */}
      {data?.currentUserPosition && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">#{data.currentUserPosition.rank}</div>
                <div className="text-xs text-muted-foreground">Ваше место</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="flex items-center gap-3 flex-1">
                <Avatar>
                  <AvatarImage src={data.currentUserPosition.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(data.currentUserPosition.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{data.currentUserPosition.name}</div>
                  <div className="text-sm text-muted-foreground">{data.currentUserPosition.email}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-lg font-bold">{data.currentUserPosition.score}</div>
                  <div className="text-xs text-muted-foreground">очков</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Podium for top 3 */}
      {renderPodium()}

      {/* Leaderboard table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="divide-y">
              {data?.leaderboard.map((user, index) => {
                const isCurrentUser = user.id === currentUserId
                
                return (
                  <div
                    key={user.id}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                      isCurrentUser ? 'bg-primary/5 border-l-2 border-primary' : ''
                    } ${user.rank <= 3 ? 'bg-muted/30' : ''}`}
                  >
                    {/* Rank */}
                    <div className="flex items-center gap-2 w-12">
                      {getRankBadge(user.rank)}
                    </div>

                    {/* User info */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{user.name}</span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs">Вы</Badge>
                        )}
                        {user.achievements > 0 && (
                          <Award className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {user.group && <span>{user.group}</span>}
                        {user.group && <span>•</span>}
                        <span>{user.totalDeliveries} доставок</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:grid grid-cols-5 gap-4 text-center text-sm">
                      <div>
                        <div className="font-mono font-semibold text-green-500">
                          {user.successRate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Успех</div>
                      </div>
                      <div>
                        <div className="font-mono font-semibold">
                          {user.totalDeliveries}
                        </div>
                        <div className="text-xs text-muted-foreground">Доставок</div>
                      </div>
                      <div>
                        <div className="font-mono font-semibold">
                          {formatDistance(user.totalDistance)}
                        </div>
                        <div className="text-xs text-muted-foreground">Расстояние</div>
                      </div>
                      <div>
                        <div className={`font-mono font-semibold ${user.totalCollisions > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {user.totalCollisions}
                        </div>
                        <div className="text-xs text-muted-foreground">Столкн.</div>
                      </div>
                      <div>
                        <div className="font-mono font-semibold">
                          {formatTime(user.bestTime)}
                        </div>
                        <div className="text-xs text-muted-foreground">Лучшее время</div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right w-20">
                      <div className="text-lg font-bold">{user.score}</div>
                      <div className="text-xs text-muted-foreground">очков</div>
                    </div>
                  </div>
                )
              })}

              {(!data || data.leaderboard.length === 0) && (
                <div className="py-12 text-center text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Нет данных для отображения</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span>1 место</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-gray-400" />
              <span>2 место</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-amber-600" />
              <span>3 место</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              <span>Есть достижения</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Очки = успех% × 100 + доставки × 10 + расстояние/100 - столкновения × 5 + достижения × 20</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
