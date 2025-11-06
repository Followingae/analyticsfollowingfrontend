'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, X, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToastLoader } from '@/components/ui/toast-loader'

interface ProcessingToast {
  username: string
  startedAt: number
  id: string
}

interface ConsolidatedProcessingToastProps {
  processingToasts: ProcessingToast[]
  completedToasts?: string[]
  onViewDetails?: () => void
  onCancelAll?: () => void
  onViewCompleted?: () => void
}

export const ConsolidatedProcessingToast: React.FC<ConsolidatedProcessingToastProps> = ({
  processingToasts,
  completedToasts = [],
  onViewDetails,
  onCancelAll,
  onViewCompleted
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Update time every second for elapsed time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatElapsedTime = (startedAt: number) => {
    const elapsed = Math.floor((currentTime - startedAt) / 1000)
    if (elapsed < 60) return `${elapsed}s`
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    return `${minutes}m ${seconds}s`
  }

  const totalProcessing = processingToasts.length
  const totalCompleted = completedToasts.length
  const hasMultiple = totalProcessing > 1 || totalCompleted > 0

  // Single creator processing (original behavior)
  if (totalProcessing === 1 && totalCompleted === 0) {
    const toast = processingToasts[0]
    return (
      <div className="flex items-center gap-3">
        <ToastLoader size={40} text="AI" />
        <div className="flex-1">
          <div className="text-sm font-medium">
            AI Analytics Processing for {toast.username}
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatElapsedTime(toast.startedAt)}
          </div>
        </div>
      </div>
    )
  }

  // Multiple creators - consolidated view
  return (
    <div className="min-w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ToastLoader size={36} text="AI" />
          <div className="flex-1">
            <div className="text-sm font-medium">
              {totalProcessing > 0 && (
                <span>Processing {totalProcessing} creator{totalProcessing !== 1 ? 's' : ''}</span>
              )}
              {totalCompleted > 0 && totalProcessing === 0 && (
                <span>✅ {totalCompleted} completed!</span>
              )}
              {totalCompleted > 0 && totalProcessing > 0 && (
                <span> • {totalCompleted} completed</span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {totalProcessing > 0 ? (
                <span>
                  {processingToasts.slice(0, 2).map(t => t.username).join(', ')}
                  {totalProcessing > 2 && ` +${totalProcessing - 2} more`}
                </span>
              ) : (
                <span>All analytics ready!</span>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {hasMultiple && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          )}
          {onCancelAll && totalProcessing > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelAll}
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && hasMultiple && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {/* Processing Items */}
            {processingToasts.map((toast) => (
              <div key={toast.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="font-medium">{toast.username}</span>
                </div>
                <div className="text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatElapsedTime(toast.startedAt)}
                </div>
              </div>
            ))}

            {/* Completed Items */}
            {completedToasts.map((username) => (
              <div key={username} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  <span className="font-medium text-green-400">{username}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Ready
                </Badge>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {(onViewCompleted || onViewDetails) && (
            <div className="flex gap-2 mt-3">
              {onViewCompleted && totalCompleted > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewCompleted}
                  className="text-xs flex-1 h-7"
                >
                  View {totalCompleted} Result{totalCompleted !== 1 ? 's' : ''}
                </Button>
              )}
              {onViewDetails && totalProcessing > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewDetails}
                  className="text-xs flex-1 h-7"
                >
                  View Queue
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}