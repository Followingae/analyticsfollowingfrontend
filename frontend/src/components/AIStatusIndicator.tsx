'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AIProcessingStatus, AIProcessingProgress } from '@/services/instagramApi'
import { Brain, Loader2, CheckCircle, AlertCircle, Play, Sparkles } from 'lucide-react'

interface AIStatusIndicatorProps {
  status: AIProcessingStatus
  progress?: AIProcessingProgress
  onTriggerAnalysis?: () => void
  isTriggering?: boolean
  title?: string
  description?: string
  showTriggerButton?: boolean
}

export function AIStatusIndicator({ 
  status, 
  progress, 
  onTriggerAnalysis,
  isTriggering = false,
  title = "AI Content Analysis",
  description,
  showTriggerButton = true
}: AIStatusIndicatorProps) {
  
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          badge: <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>,
          color: 'green'
        }
      case 'pending':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
          badge: <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Processing</Badge>,
          color: 'blue'
        }
      case 'not_available':
      default:
        return {
          icon: <Brain className="h-5 w-5 text-muted-foreground" />,
          badge: <Badge variant="outline" className="text-muted-foreground">Not Available</Badge>,
          color: 'gray'
        }
    }
  }

  const statusConfig = getStatusConfig()

  if (status === 'pending') {
    return (
      <div className="relative w-full">
        {/* Central AI Processing Display */}
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 dark:border-blue-700">
          <CardContent className="flex flex-col items-center justify-center py-12 px-8">
            {/* Large AI Brain Icon with Animation */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-full">
                <Brain className="h-12 w-12 text-white animate-pulse" />
              </div>
            </div>
            
            {/* Main Title */}
            <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🧠 AI Content Intelligence
            </h2>
            
            {/* Processing Status */}
            <div className="text-center mb-6">
              <p className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-2">
                🔥 AI Content Intelligence is analyzing this creator...
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span>
                  {progress ? 
                    `Processing ${progress.analyzed_posts || progress.completed || 0} of ${progress.total_posts || progress.completed + progress.processing + progress.pending || 0} posts` :
                    'Deep analysis in progress...'
                  }
                </span>
              </div>
              <div className="text-sm text-center text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                ☕ Perfect time for a coffee break! <br />
                <span className="font-medium">AI analysis typically takes 3-5 minutes</span> <br />
                We're analyzing content categories, sentiment, and language patterns
              </div>
            </div>
            
            {/* Progress Bar */}
            {progress?.completion_percentage !== undefined ? (
              <div className="w-full max-w-md space-y-3 mb-6">
                <div className="relative">
                  <Progress value={progress.completion_percentage} className="h-3 bg-gray-200 dark:bg-gray-800" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse" 
                       style={{ width: `${progress.completion_percentage}%` }} />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {progress.completion_percentage.toFixed(1)}% Complete
                  </span>
                  {progress.estimated_completion_time && (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      ~{progress.estimated_completion_time} remaining
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md space-y-3 mb-6">
                <div className="relative">
                  <Progress value={30} className="h-3 bg-gray-200 dark:bg-gray-800" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse w-[30%]" />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Analysis starting... Estimated completion: ~4 minutes
                </div>
              </div>
            )}
            
            {/* Processing Breakdown */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
              <div className="text-center p-3 bg-green-100 dark:bg-green-900/50 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-xl font-bold text-green-700 dark:text-green-300">
                  ✅ {progress?.analyzed_posts || progress?.completed || '~'}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 font-medium">Analyzed</div>
              </div>
              <div className="text-center p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  ⚡ {progress?.processing_posts || progress?.processing || '~'}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Processing</div>
              </div>
              <div className="text-center p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-border dark:border-gray-800">
                <div className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  ⏳ {progress?.pending_posts || progress?.pending || '~'}
                </div>
                <div className="text-xs text-muted-foreground dark:text-gray-400 font-medium">Pending</div>
              </div>
            </div>
            
            {/* AI Features Being Analyzed */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">AI Features:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 dark:text-purple-300">
                  📊 Content Categories
                </Badge>
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:text-blue-300">
                  😊 Sentiment Analysis
                </Badge>
                <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:text-green-300">
                  🌐 Language Detection
                </Badge>
              </div>
            </div>
            
            {/* Refresh Note */}
            <div className="mt-4 text-xs text-center text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
              <div className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                🔄 Live Processing Updates
              </div>
              <div>
                This page automatically refreshes to show real-time progress.<br />
                Feel free to explore other tabs while AI analysis runs in the background!
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Floating particles animation */}
        <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0s]" />
        <div className="absolute top-8 right-8 w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:1s]" />
        <div className="absolute bottom-12 left-12 w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:2s]" />
        <div className="absolute bottom-8 right-4 w-1 h-1 bg-purple-300 rounded-full animate-bounce [animation-delay:0.5s]" />
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div className="relative w-full">
        {/* Completed State - Celebratory */}
        <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 dark:border-green-700 ">
          <CardContent className="flex flex-col items-center justify-center py-8 px-6">
            {/* Success Icon */}
            <div className="relative mb-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-full ">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 animate-bounce">
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
            </div>
            
            {/* Success Message */}
            <h3 className="text-lg font-bold text-center mb-2 text-green-800 dark:text-green-200">
              ✨ AI Analysis Complete!
            </h3>
            <p className="text-sm text-center text-green-700 dark:text-green-300 mb-4">
              Your content has been analyzed with advanced AI insights
            </p>
            
            {/* Features Available */}
            <div className="flex flex-wrap justify-center gap-2">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                ✅ Categories Detected
              </Badge>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                ✅ Sentiment Analyzed
              </Badge>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                ✅ Languages Identified
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Celebration particles */}
        <div className="absolute top-2 left-2 w-1 h-1 bg-yellow-400 rounded-full animate-ping" />
        <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping [animation-delay:0.5s]" />
        <div className="absolute bottom-2 left-6 w-1 h-1 bg-emerald-400 rounded-full animate-ping [animation-delay:1s]" />
        <div className="absolute bottom-4 right-2 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping [animation-delay:1.5s]" />
      </div>
    )
  }

  if (status === 'not_available' && showTriggerButton) {
    return (
      <div className="relative w-full">
        {/* Central AI Trigger Display */}
        <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300">
          <CardContent className="flex flex-col items-center justify-center py-16 px-8">
            {/* Large AI Brain Icon */}
            <div className="relative mb-6">
              <div className="bg-gradient-to-r from-gray-400 to-blue-400 p-6 rounded-full">
                <Brain className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                <Sparkles className="h-4 w-4 text-yellow-800" />
              </div>
            </div>
            
            {/* Main Title */}
            <h2 className="text-2xl font-bold text-center mb-3 bg-gradient-to-r from-gray-700 to-blue-600 bg-clip-text text-transparent">
              🧠 AI Content Intelligence
            </h2>
            
            {/* Description */}
            <p className="text-center text-muted-foreground mb-6 max-w-md leading-relaxed">
              Get advanced AI insights including sentiment analysis, content categorization, and language detection for all posts.
            </p>
            
            {/* Features Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 w-full max-w-lg">
              <div className="text-center p-3 bg-background/50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-lg mb-1">📊</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">20+ Categories</div>
                <div className="text-xs text-muted-foreground">Fashion, Tech, Travel...</div>
              </div>
              <div className="text-center p-3 bg-background/50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-lg mb-1">😊</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Sentiment Scores</div>
                <div className="text-xs text-muted-foreground">Positive/Neutral/Negative</div>
              </div>
              <div className="text-center p-3 bg-background/50 dark:bg-gray-800/50 rounded-lg border">
                <div className="text-lg mb-1">🌐</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Language Detection</div>
                <div className="text-xs text-muted-foreground">20+ Languages</div>
              </div>
            </div>
            
            {/* Manual Get Analysis Button */}
            <Button 
              onClick={onTriggerAnalysis} 
              disabled={isTriggering}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-8 py-3 rounded-lg   transition-all duration-300 transform hover:scale-105 disabled:scale-100"
            >
              {isTriggering ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Starting Analysis...</span>
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5 mr-2" />
                  <span>Get AI Analysis</span>
                </>
              )}
            </Button>
            
            {/* Manual Control Note */}
            <p className="text-xs text-muted-foreground mt-4 text-center">
              ⏱️ Click to start • Analysis takes 3-5 minutes • Manual control
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Simple status display
  return (
    <div className="flex items-center gap-2">
      {statusConfig.icon}
      <span className="text-sm font-medium">{title}</span>
      {statusConfig.badge}
    </div>
  )
}

// Compact version for inline use
export function AIStatusBadge({ status }: { status: AIProcessingStatus }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return { badge: <Badge className="bg-green-100 text-green-800">AI ✓</Badge> }
      case 'pending':
        return { badge: <Badge className="bg-blue-100 text-blue-800">AI ⟳</Badge> }
      case 'not_available':
      default:
        return { badge: <Badge variant="outline">AI -</Badge> }
    }
  }

  return getStatusConfig().badge
}