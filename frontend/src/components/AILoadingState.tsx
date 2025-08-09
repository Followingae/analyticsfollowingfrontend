'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Brain, Loader2, Coffee, Clock, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AILoadingStateProps {
  title: string
  description: string
  message?: string
  estimatedTime?: string
  showProgress?: boolean
  icon?: React.ReactNode
}

export function AILoadingState({ 
  title, 
  description, 
  message = "AI analysis in progress...",
  estimatedTime = "3-5 minutes",
  showProgress = true,
  icon
}: AILoadingStateProps) {
  const [progress, setProgress] = useState(20)
  
  // Simulate progress animation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 20 // Reset to create continuous animation
        return prev + Math.random() * 15
      })
    }, 2000)
    
    return () => clearInterval(timer)
  }, [])

  return (
    <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/50 dark:to-purple-950/50 dark:border-blue-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          {icon || <Brain className="w-5 h-5" />}
          {title}
          <Badge variant="outline" className="ml-auto text-blue-600 border-blue-300">
            Processing
          </Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Processing Message */}
        <div className="flex items-center justify-center p-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="relative">
                <Brain className="h-8 w-8 text-blue-600 animate-pulse" />
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-3 w-3 text-yellow-500 animate-bounce" />
                </div>
              </div>
            </div>
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              {message}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>ETA: {estimatedTime}</span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Analysis Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-2 bg-gray-200 dark:bg-gray-800" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse" 
                   style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        
        {/* Coffee Break Message */}
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-300 text-sm">
            <Coffee className="h-4 w-4" />
            <span className="font-medium">Perfect time for a coffee break!</span>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
            Page refreshes automatically when ready
          </p>
        </div>
      </CardContent>
    </Card>
  )
}