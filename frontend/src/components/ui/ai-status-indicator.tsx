"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Brain, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Loader2,
  Sparkles,
  TrendingUp,
  Languages,
  Tag
} from "lucide-react"
import { cn } from "@/lib/utils"
import { instagramApiService } from "@/services/instagramApi"

export type AIProcessingStatus = 'completed' | 'pending' | 'not_available' | 'partial_data' | 'running' | 'failed'

export interface AIInsights {
  ai_primary_content_type?: string | null
  ai_content_distribution?: Record<string, number> | null
  ai_avg_sentiment_score?: number | null
  ai_language_distribution?: Record<string, number> | null
  ai_content_quality_score?: number | null
  ai_profile_analyzed_at?: string | null
  has_ai_analysis: boolean
  ai_processing_status: AIProcessingStatus
}

interface AIStatusIndicatorProps {
  username: string
  insights?: AIInsights
  compact?: boolean
  showDetails?: boolean
  onRetryAnalysis?: () => void
}

export function AIStatusIndicator({
  username,
  insights,
  compact = false,
  showDetails = false,
  onRetryAnalysis
}: AIStatusIndicatorProps) {
  const [status, setStatus] = useState<AIProcessingStatus>(insights?.ai_processing_status || 'not_available')
  const [progress, setProgress] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const getStatusInfo = (status: AIProcessingStatus) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800',
          title: 'AI Analysis Complete',
          message: 'AI insights are available and up to date'
        }
      case 'running':
        return {
          icon: Loader2,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          borderColor: 'border-blue-200 dark:border-blue-800',
          title: 'AI Analysis Running',
          message: `Analyzing content... ${progress}% complete`,
          animated: true
        }
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          title: 'AI Analysis Queued',
          message: 'Analysis will begin shortly'
        }
      case 'partial_data':
        return {
          icon: RefreshCw,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 dark:bg-orange-950',
          borderColor: 'border-orange-200 dark:border-orange-800',
          title: 'Updating AI Data',
          message: 'Refreshing insights for better accuracy'
        }
      case 'failed':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800',
          title: 'Analysis Issue',
          message: 'Automatically retrying analysis...'
        }
      case 'not_available':
      default:
        return {
          icon: Brain,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-950',
          borderColor: 'border-gray-200 dark:border-gray-800',
          title: 'AI Analysis Available',
          message: 'Start AI analysis to get detailed insights'
        }
    }
  }

  const statusInfo = getStatusInfo(status)
  const Icon = statusInfo.icon

  const handleRetryAnalysis = async () => {
    if (onRetryAnalysis) {
      setIsRefreshing(true)
      try {
        await onRetryAnalysis()
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  // Auto-refresh status for running analyses
  useEffect(() => {
    if (status === 'running' || status === 'pending') {
      const interval = setInterval(async () => {
        try {
          const result = await instagramApiService.getProfileAnalysisStatus(username)
          if (result.success && result.data) {
            setStatus(result.data.analysis_status)
            if (result.data.progress?.percentage) {
              setProgress(result.data.progress.percentage)
            }
          }
        } catch (error) {
          console.error('Failed to refresh AI status:', error)
        }
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [status, username])

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Icon 
          className={cn("h-4 w-4", statusInfo.color, statusInfo.animated && "animate-spin")} 
        />
        <Badge 
          variant="outline" 
          className={cn("text-xs", statusInfo.color, statusInfo.borderColor)}
        >
          {statusInfo.title}
        </Badge>
      </div>
    )
  }

  return (
    <Alert className={cn(statusInfo.bgColor, statusInfo.borderColor)}>
      <Icon 
        className={cn("h-4 w-4", statusInfo.color, statusInfo.animated && "animate-spin")} 
      />
      <div className="flex-1">
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{statusInfo.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{statusInfo.message}</p>
          </div>
          {(status === 'not_available' || status === 'failed') && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleRetryAnalysis}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Start Analysis'
              )}
            </Button>
          )}
        </AlertDescription>
        {status === 'running' && progress > 0 && (
          <Progress value={progress} className="mt-3 h-2" />
        )}
      </div>
    </Alert>
  )
}

interface AIInsightsDisplayProps {
  insights: AIInsights
  compact?: boolean
}

export function AIInsightsDisplay({ insights, compact = false }: AIInsightsDisplayProps) {
  if (!insights.has_ai_analysis || insights.ai_processing_status !== 'completed') {
    return null
  }

  const getSentimentDisplay = (score?: number | null) => {
    if (score === null || score === undefined) return 'Neutral'
    if (score > 0.1) return 'Positive'
    if (score < -0.1) return 'Negative'
    return 'Neutral'
  }

  const getSentimentColor = (score?: number | null) => {
    if (score === null || score === undefined) return 'text-gray-600'
    if (score > 0.1) return 'text-green-600'
    if (score < -0.1) return 'text-red-600'
    return 'text-gray-600'
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3 text-purple-600" />
        <span>AI Analyzed</span>
        {insights.ai_primary_content_type && (
          <>
            <span>•</span>
            <span>{insights.ai_primary_content_type}</span>
          </>
        )}
      </div>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          AI Content Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.ai_primary_content_type && (
          <div className="flex items-center gap-2">
            <Tag className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-medium">Primary Content:</span>
            <Badge variant="secondary" className="text-xs">
              {insights.ai_primary_content_type}
            </Badge>
          </div>
        )}

        {insights.ai_avg_sentiment_score !== null && insights.ai_avg_sentiment_score !== undefined && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-xs font-medium">Sentiment:</span>
            <Badge 
              variant="outline" 
              className={cn("text-xs", getSentimentColor(insights.ai_avg_sentiment_score))}
            >
              {getSentimentDisplay(insights.ai_avg_sentiment_score)}
            </Badge>
          </div>
        )}

        {insights.ai_content_quality_score && (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-emerald-600" />
            <span className="text-xs font-medium">Quality Score:</span>
            <span className="text-xs font-bold text-emerald-600">
              {Math.round(insights.ai_content_quality_score * 100)}%
            </span>
          </div>
        )}

        {insights.ai_language_distribution && (
          <div className="flex items-center gap-2">
            <Languages className="h-3 w-3 text-indigo-600" />
            <span className="text-xs font-medium">Languages:</span>
            <div className="flex gap-1">
              {Object.entries(insights.ai_language_distribution)
                .slice(0, 3)
                .map(([lang, percentage]) => (
                  <Badge key={lang} variant="outline" className="text-xs">
                    {lang.toUpperCase()} {Math.round(percentage)}%
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {insights.ai_profile_analyzed_at && (
          <div className="text-xs text-muted-foreground">
            Last analyzed: {new Date(insights.ai_profile_analyzed_at).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}