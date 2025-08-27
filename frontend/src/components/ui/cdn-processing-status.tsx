"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { useCDNProcessingStatus, useCDNMediaRefresh } from "@/hooks/useCDNMedia"
import { toast } from "sonner"

interface CDNProcessingStatusProps {
  profileId: string
  className?: string
  variant?: 'compact' | 'detailed'
  showRefreshButton?: boolean
}

/**
 * Component to display CDN processing status for media assets
 */
export function CDNProcessingStatus({
  profileId,
  className,
  variant = 'compact',
  showRefreshButton = true
}: CDNProcessingStatusProps) {
  const processingStatus = useCDNProcessingStatus(profileId)
  const refreshMutation = useCDNMediaRefresh()

  const handleRefresh = React.useCallback(() => {
    refreshMutation.mutate(profileId)
  }, [refreshMutation, profileId])

  // Don't show anything if not processing
  if (!processingStatus.isProcessing && processingStatus.completionPercentage >= 100) {
    return variant === 'detailed' ? (
      <div className={cn("flex items-center gap-2 text-green-600", className)}>
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">All media processed</span>
      </div>
    ) : null
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-blue-500" />
          <span className="text-xs text-muted-foreground">
            Processing {Math.round(processingStatus.completionPercentage)}%
          </span>
        </div>
        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${processingStatus.completionPercentage}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("p-4 bg-muted/50 rounded-lg border", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
          <h3 className="font-medium">Processing Images</h3>
        </div>
        {showRefreshButton && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={cn("w-3 h-3 mr-1", refreshMutation.isPending && "animate-spin")} />
            Refresh
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Progress value={processingStatus.completionPercentage} className="w-full" />
        
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {processingStatus.completedAssets} of {processingStatus.totalAssets} assets
          </span>
          <span>{Math.round(processingStatus.completionPercentage)}% complete</span>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Images are being optimized for faster loading. This usually takes 30-60 seconds.
        </p>
      </div>
    </div>
  )
}

/**
 * Inline processing indicator for images
 */
interface InlineProcessingIndicatorProps {
  isProcessing: boolean
  completionPercentage: number
  className?: string
}

export function InlineProcessingIndicator({
  isProcessing,
  completionPercentage,
  className
}: InlineProcessingIndicatorProps) {
  if (!isProcessing && completionPercentage >= 100) return null

  return (
    <div className={cn(
      "absolute inset-0 bg-black/50 flex items-center justify-center rounded-[inherit]",
      className
    )}>
      <div className="text-center text-white">
        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1" />
        <div className="text-xs">Processing...</div>
        <div className="w-16 bg-white/20 rounded-full h-1 mt-1">
          <div 
            className="bg-white h-1 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <div className="text-xs mt-1">{Math.round(completionPercentage)}%</div>
      </div>
    </div>
  )
}

/**
 * Global CDN status banner for when system is processing
 */
interface CDNStatusBannerProps {
  profileId?: string
  show?: boolean
  onDismiss?: () => void
}

export function CDNStatusBanner({ 
  profileId, 
  show = true,
  onDismiss 
}: CDNStatusBannerProps) {
  const processingStatus = useCDNProcessingStatus(profileId || '')
  const [dismissed, setDismissed] = React.useState(false)

  const handleDismiss = React.useCallback(() => {
    setDismissed(true)
    onDismiss?.()
  }, [onDismiss])

  if (!show || dismissed || !processingStatus.isProcessing) {
    return null
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-3">
        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-blue-900 dark:text-blue-100">
            Optimizing Images
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
            We're processing this profile's images for faster loading. 
            Progress: {Math.round(processingStatus.completionPercentage)}%
          </p>
          <div className="mt-2">
            <Progress 
              value={processingStatus.completionPercentage} 
              className="w-full h-1"
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-blue-600 hover:text-blue-800 p-1"
        >
          ×
        </Button>
      </div>
    </div>
  )
}

/**
 * Error state component for CDN failures
 */
interface CDNErrorStateProps {
  error: string
  onRetry?: () => void
  className?: string
}

export function CDNErrorState({ 
  error, 
  onRetry, 
  className 
}: CDNErrorStateProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg",
      className
    )}>
      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
      <div className="flex-1 text-sm text-red-700 dark:text-red-200">
        {error}
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          Retry
        </Button>
      )}
    </div>
  )
}