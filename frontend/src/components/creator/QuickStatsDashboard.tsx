import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Calendar, Clock, Building } from "lucide-react"
import type { QuickMetrics } from "@/types/creatorTypes"

interface QuickStatsDashboardProps {
  quickMetrics: QuickMetrics
}

export function QuickStatsDashboard({ quickMetrics }: QuickStatsDashboardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getAccountTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'business':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'creator':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
      case 'personal':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Average Likes */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs text-muted-foreground">Avg Likes</span>
            </div>
            <div className="text-lg font-semibold">
              {formatNumber(quickMetrics.avg_likes_per_post)}
            </div>
          </div>

          {/* Average Comments */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs text-muted-foreground">Avg Comments</span>
            </div>
            <div className="text-lg font-semibold">
              {formatNumber(quickMetrics.avg_comments_per_post)}
            </div>
          </div>

          {/* Posting Frequency */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-muted-foreground">Posts</span>
            </div>
            <div className="text-sm font-medium">
              {quickMetrics.posting_frequency}
            </div>
          </div>

          {/* Last Post Date */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs text-muted-foreground">Last Post</span>
            </div>
            <div className="text-sm font-medium">
              {formatDate(quickMetrics.last_post_date)}
            </div>
          </div>
        </div>

        {/* Account Type Badge */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Account Type</span>
            <Badge className={`text-xs ${getAccountTypeColor(quickMetrics.account_type)}`}>
              <Building className="h-3 w-3 mr-1" />
              {quickMetrics.account_type}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}