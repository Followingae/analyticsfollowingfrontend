"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, Brain, TrendingUp } from "lucide-react"
import type { MasterInfluencer } from "@/types/influencerDatabase"
import { getEngagementColor, formatCount } from "@/types/influencerDatabase"

interface InfluencerAnalyticsTabProps {
  influencer: MasterInfluencer
  onRefresh: () => void
}

export function InfluencerAnalyticsTab({
  influencer,
  onRefresh,
}: InfluencerAnalyticsTabProps) {
  const engagementColor = getEngagementColor(influencer.engagement_rate || 0)

  const languageEntries = Object.entries(influencer.language_distribution || {}).sort(
    (a, b) => b[1] - a[1]
  )
  const maxLangValue = languageEntries.length > 0 ? languageEntries[0][1] : 1

  const lastRefresh = influencer.last_analytics_refresh
    ? new Date(influencer.last_analytics_refresh).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never"

  const hasAnalytics = influencer.engagement_rate !== null && influencer.engagement_rate > 0

  return (
    <div className="space-y-6">
      {/* Engagement Rate */}
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground mb-1">Engagement Rate</p>
        <p className={`text-4xl font-bold ${engagementColor}`}>
          {influencer.engagement_rate?.toFixed(2) || "0.00"}%
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Based on avg {formatCount(influencer.avg_likes)} likes, {formatCount(influencer.avg_comments)} comments per post
        </p>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Avg Likes</p>
          <p className="text-lg font-semibold">{formatCount(influencer.avg_likes)}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Avg Comments</p>
          <p className="text-lg font-semibold">{formatCount(influencer.avg_comments)}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Avg Views</p>
          <p className="text-lg font-semibold">{formatCount(influencer.avg_views)}</p>
        </Card>
      </div>

      {/* AI Analysis */}
      {(influencer.ai_content_categories?.length > 0 || influencer.ai_sentiment_score !== null) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">AI Analysis</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Content Categories</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {(influencer.ai_content_categories || []).map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-[10px] capitalize">
                    {cat}
                  </Badge>
                ))}
                {(!influencer.ai_content_categories || influencer.ai_content_categories.length === 0) && (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </div>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Sentiment Score</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm font-medium">
                  {influencer.ai_sentiment_score?.toFixed(2) || "N/A"}
                </p>
                {influencer.ai_sentiment_score !== null && (
                  <Progress
                    value={(influencer.ai_sentiment_score || 0) * 100}
                    className="flex-1 h-1.5"
                  />
                )}
              </div>
            </Card>
          </div>
          {influencer.ai_audience_quality_score !== null && (
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Audience Quality Score</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm font-medium">
                  {influencer.ai_audience_quality_score?.toFixed(2) || "N/A"}
                </p>
                <Progress
                  value={(influencer.ai_audience_quality_score || 0) * 100}
                  className="flex-1 h-1.5"
                />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Language Distribution */}
      {languageEntries.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Language Distribution</h3>
          <div className="space-y-2">
            {languageEntries.map(([lang, value]) => (
              <div key={lang} className="flex items-center gap-3">
                <Badge variant="outline" className="w-16 justify-center text-xs uppercase">
                  {lang}
                </Badge>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(value / maxLangValue) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {(value * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasAnalytics && (
        <>
          <Separator />
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No analytics data available. This influencer may not have been searched
              via Creator Analytics yet.
            </p>
          </Card>
        </>
      )}

      {/* Refresh Button */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">Last refreshed: {lastRefresh}</p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-3 w-3 mr-1.5" />
          Refresh from Profiles
        </Button>
      </div>
    </div>
  )
}
