import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Clock, Calendar, Trophy, Users, Zap, Target } from "lucide-react"
import type { AdvancedMetrics } from "@/types/creatorTypes"

interface AdvancedAnalyticsCardProps {
  advancedMetrics: AdvancedMetrics
}

export function AdvancedAnalyticsCard({ advancedMetrics }: AdvancedAnalyticsCardProps) {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600'
      case 'decreasing':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return '📈'
      case 'decreasing':
        return '📉'
      default:
        return '📊'
    }
  }

  const formatHour = (hour: number) => {
    return hour === 0 ? '12 AM' : 
           hour < 12 ? `${hour} AM` : 
           hour === 12 ? '12 PM' : 
           `${hour - 12} PM`
  }

  const { engagement_trends, content_performance, competitive_analysis } = advancedMetrics

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Advanced Analytics Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Engagement Trends */}
        <div>
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Engagement Trends
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Growth Trend</span>
                <Badge className={`capitalize ${getTrendColor(engagement_trends.trend_direction)} bg-opacity-10`}>
                  {getTrendIcon(engagement_trends.trend_direction)} {engagement_trends.trend_direction}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Monthly Growth</span>
                <span className={`font-bold ${getTrendColor(engagement_trends.trend_direction)}`}>
                  {engagement_trends.monthly_growth > 0 ? '+' : ''}{engagement_trends.monthly_growth.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Viral Potential</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Score</span>
                  <span className="font-bold text-purple-600">
                    {content_performance.viral_potential_score.toFixed(1)}/10
                  </span>
                </div>
                <Progress value={content_performance.viral_potential_score * 10} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            Optimal Posting Times
          </h4>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Peak Hours</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {engagement_trends.peak_hours.map((hour) => (
                  <Badge key={hour} variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatHour(hour)}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-sm text-muted-foreground">Best Days</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {engagement_trends.optimal_posting_days.map((day) => (
                  <Badge key={day} variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {day}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Performance */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-500" />
            Content Performance Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-green-600">Best Performing</div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 w-full justify-center">
                <Trophy className="h-3 w-3 mr-1" />
                {content_performance.best_performing_type}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-red-600">Needs Improvement</div>
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 w-full justify-center" variant="outline">
                {content_performance.worst_performing_type}
              </Badge>
            </div>
          </div>
        </div>

        {/* Competitive Analysis */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Competitive Positioning
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Market Position</span>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                {competitive_analysis.market_position}
              </Badge>
            </div>
            
            <div>
              <span className="text-sm font-medium">Competitive Advantage</span>
              <p className="text-sm text-muted-foreground mt-1">
                {competitive_analysis.competitive_advantage}
              </p>
            </div>
            
            <div>
              <span className="text-sm font-medium">Similar Creators</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {competitive_analysis.similar_creators.map((creator) => (
                  <Badge key={creator} variant="outline" className="text-xs">
                    {creator}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="pt-4 border-t bg-muted/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Performance Insights
          </h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Growth Trajectory:</strong> {engagement_trends.trend_direction} trend with {Math.abs(engagement_trends.monthly_growth).toFixed(1)}% monthly change
            </p>
            <p>
              <strong>Content Strategy:</strong> Focus on {content_performance.best_performing_type.toLowerCase()}, optimize {content_performance.worst_performing_type.toLowerCase()}
            </p>
            <p>
              <strong>Posting Schedule:</strong> Best results on {engagement_trends.optimal_posting_days.slice(0, 2).join(' & ')} between {formatHour(engagement_trends.peak_hours[0])} - {formatHour(engagement_trends.peak_hours[engagement_trends.peak_hours.length - 1])}
            </p>
            <p>
              <strong>Market Standing:</strong> {competitive_analysis.market_position} performer with strong {competitive_analysis.competitive_advantage.toLowerCase()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}