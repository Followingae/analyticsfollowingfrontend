'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Smile, Frown, Meh, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SentimentIndicatorProps {
  sentimentScore?: number | null // -1.0 to 1.0
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
}

interface SentimentAnalysis {
  label: 'Very Positive' | 'Positive' | 'Neutral' | 'Negative' | 'Very Negative'
  color: string
  icon: React.ReactNode
  description: string
  bgColor: string
  textColor: string
}

// Sentiment analysis helper
function analyzeSentiment(score: number): SentimentAnalysis {
  if (score >= 0.6) {
    return {
      label: 'Very Positive',
      color: '#22C55E',
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Highly positive content sentiment',
      bgColor: 'bg-green-50 dark:bg-green-950',
      textColor: 'text-green-700 dark:text-green-300'
    }
  } else if (score >= 0.2) {
    return {
      label: 'Positive',
      color: '#10B981',
      icon: <Smile className="w-4 h-4" />,
      description: 'Generally positive content',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      textColor: 'text-emerald-700 dark:text-emerald-300'
    }
  } else if (score >= -0.2) {
    return {
      label: 'Neutral',
      color: '#6B7280',
      icon: <Meh className="w-4 h-4" />,
      description: 'Balanced content sentiment',
      bgColor: 'bg-gray-50 dark:bg-gray-950',
      textColor: 'text-gray-700 dark:text-gray-300'
    }
  } else if (score >= -0.6) {
    return {
      label: 'Negative',
      color: '#EF4444',
      icon: <Frown className="w-4 h-4" />,
      description: 'Somewhat negative content',
      bgColor: 'bg-red-50 dark:bg-red-950',
      textColor: 'text-red-700 dark:text-red-300'
    }
  } else {
    return {
      label: 'Very Negative',
      color: '#DC2626',
      icon: <TrendingDown className="w-4 h-4" />,
      description: 'Highly negative content sentiment',
      bgColor: 'bg-red-100 dark:bg-red-900',
      textColor: 'text-red-800 dark:text-red-200'
    }
  }
}

// Convert score (-1 to 1) to progress bar value (0 to 100)
function scoreToProgress(score: number): number {
  return ((score + 1) / 2) * 100
}

// Format score for display
function formatScore(score: number): string {
  return score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2)
}

export function SentimentIndicator({ 
  sentimentScore, 
  className, 
  size = 'md',
  showDetails = true 
}: SentimentIndicatorProps) {
  // Handle null or undefined sentiment score
  if (sentimentScore === null || sentimentScore === undefined) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className={size === 'sm' ? 'pb-2' : undefined}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            size === 'sm' ? 'text-sm' : 'text-base'
          )}>
            <Minus className="w-4 h-4" />
            Content Sentiment
          </CardTitle>
          {showDetails && (
            <CardDescription className={size === 'sm' ? 'text-xs' : undefined}>
              AI sentiment analysis
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className={size === 'sm' ? 'pt-2' : undefined}>
          <div className="text-center py-4 text-muted-foreground">
            <Meh className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className={size === 'sm' ? 'text-xs' : 'text-sm'}>
              Sentiment analysis pending
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const analysis = analyzeSentiment(sentimentScore)
  const progressValue = scoreToProgress(sentimentScore)

  if (size === 'sm') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("p-1 rounded", analysis.bgColor)}>
          {analysis.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={cn("text-xs border-0", analysis.bgColor, analysis.textColor)}
            >
              {analysis.label}
            </Badge>
            <span className={cn("text-sm font-semibold", analysis.textColor)}>
              {formatScore(sentimentScore)}
            </span>
          </div>
          <Progress 
            value={progressValue} 
            className="h-1 mt-1"
            style={{
              background: `linear-gradient(to right, #DC2626 0%, #6B7280 50%, #10B981 100%)`
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className={size === 'lg' ? 'pb-4' : 'pb-2'}>
        <CardTitle className={cn(
          "flex items-center gap-2",
          size === 'lg' ? 'text-xl' : 'text-base'
        )}>
          {analysis.icon}
          Content Sentiment
        </CardTitle>
        {showDetails && (
          <CardDescription>
            AI-powered sentiment analysis of content
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main sentiment display */}
          <div className={cn(
            "flex items-center justify-between p-4 rounded-lg border",
            analysis.bgColor
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                analysis.textColor
              )} style={{ backgroundColor: analysis.color + '20' }}>
                {analysis.icon}
              </div>
              <div>
                <p className={cn("font-semibold", analysis.textColor)}>
                  {analysis.label}
                </p>
                <p className={cn("text-sm opacity-80", analysis.textColor)}>
                  {analysis.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "font-bold",
                size === 'lg' ? 'text-2xl' : 'text-xl',
                analysis.textColor
              )}>
                {formatScore(sentimentScore)}
              </p>
              <p className="text-xs text-muted-foreground">
                sentiment score
              </p>
            </div>
          </div>

          {/* Progress bar visualization */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very Negative</span>
              <span>Neutral</span>
              <span>Very Positive</span>
            </div>
            <div className="relative">
              <Progress 
                value={progressValue}
                className="h-2"
              />
              {/* Custom gradient overlay */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: `linear-gradient(to right, 
                    #DC2626 0%, 
                    #EF4444 25%, 
                    #6B7280 50%, 
                    #10B981 75%, 
                    #22C55E 100%)`
                }}
              />
              {/* Score indicator dot */}
              <div
                className="absolute top-0 w-2 h-2 bg-white border-2 rounded-full transform -translate-y-0.5 -translate-x-1"
                style={{
                  left: `${progressValue}%`,
                  borderColor: analysis.color
                }}
              />
            </div>
          </div>

          {/* Additional context if large size */}
          {size === 'lg' && showDetails && (
            <div className="grid grid-cols-3 gap-4 pt-2 border-t text-center">
              <div>
                <p className="text-sm text-red-600 font-semibold">
                  {sentimentScore < -0.2 ? '●' : '○'}
                </p>
                <p className="text-xs text-muted-foreground">Negative</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">
                  {Math.abs(sentimentScore) <= 0.2 ? '●' : '○'}
                </p>
                <p className="text-xs text-muted-foreground">Neutral</p>
              </div>
              <div>
                <p className="text-sm text-green-600 font-semibold">
                  {sentimentScore > 0.2 ? '●' : '○'}
                </p>
                <p className="text-xs text-muted-foreground">Positive</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Compact sentiment badge for use in lists
export function SentimentBadge({ 
  sentimentScore, 
  className 
}: { 
  sentimentScore?: number | null
  className?: string 
}) {
  if (sentimentScore === null || sentimentScore === undefined) {
    return (
      <Badge variant="outline" className={cn("text-xs", className)}>
        <Meh className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    )
  }

  const analysis = analyzeSentiment(sentimentScore)
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs border-0 gap-1",
        analysis.bgColor,
        analysis.textColor,
        className
      )}
    >
      {analysis.icon}
      {analysis.label}
    </Badge>
  )
}