"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  MessageCircle, 
  Share,
  Target,
  Activity
} from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  loading?: boolean
}

export function MetricCard({ title, value, change, icon, loading }: MetricCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[80px] mb-2" />
          <Skeleton className="h-3 w-[120px]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        {change !== undefined && (
          <Badge 
            variant="outline" 
            className={`text-xs ${
              change > 0 ? "text-green-600 border-green-200 bg-green-50" : 
              change < 0 ? "text-red-600 border-red-200 bg-red-50" : 
              "text-gray-600 border-gray-200 bg-gray-50"
            }`}
          >
            {change > 0 ? (
              <>+{change}%</>
            ) : change < 0 ? (
              <>{change}%</>
            ) : (
              <>0%</>
            )}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

interface EngagementCardProps {
  title: string
  metrics: {
    likes: number
    comments: number
    shares: number
    saves: number
  }
  loading?: boolean
}

export function EngagementCard({ title, metrics, loading }: EngagementCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[140px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-4 w-[40px]" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const total = metrics.likes + metrics.comments + metrics.shares + metrics.saves
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm">Likes</span>
            </div>
            <span className="text-sm font-medium">{((metrics.likes / total) * 100).toFixed(1)}%</span>
          </div>
          <Progress value={(metrics.likes / total) * 100} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Comments</span>
            </div>
            <span className="text-sm font-medium">{((metrics.comments / total) * 100).toFixed(1)}%</span>
          </div>
          <Progress value={(metrics.comments / total) * 100} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share className="h-4 w-4 text-green-500" />
              <span className="text-sm">Shares</span>
            </div>
            <span className="text-sm font-medium">{((metrics.shares / total) * 100).toFixed(1)}%</span>
          </div>
          <Progress value={(metrics.shares / total) * 100} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Saves</span>
            </div>
            <span className="text-sm font-medium">{((metrics.saves / total) * 100).toFixed(1)}%</span>
          </div>
          <Progress value={(metrics.saves / total) * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}

interface QuickStatsProps {
  stats: {
    label: string
    value: string | number
    icon: React.ReactNode
    trend?: number
  }[]
  loading?: boolean
}

export function QuickStatsGrid({ stats, loading }: QuickStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <MetricCard 
            key={i}
            title=""
            value=""
            icon={<Skeleton className="h-4 w-4" />}
            loading
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <MetricCard
          key={index}
          title={stat.label}
          value={stat.value}
          change={stat.trend}
          icon={stat.icon}
        />
      ))}
    </div>
  )
}