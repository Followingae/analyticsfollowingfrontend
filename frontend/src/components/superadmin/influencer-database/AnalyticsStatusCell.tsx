"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CheckCircle2, XCircle, Clock, Loader2, RefreshCw, CircleDot } from "lucide-react"
import type { AnalyticsStatus } from "@/hooks/useAnalyticsStatusPoller"

interface AnalyticsStatusCellProps {
  status: AnalyticsStatus
  justCompleted?: boolean
  onRetry?: () => void
}

export function AnalyticsStatusCell({ status, justCompleted, onRetry }: AnalyticsStatusCellProps) {
  switch (status.status) {
    case "pending":
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <Clock className="h-3.5 w-3.5" />
          <span>Pending</span>
        </div>
      )

    case "queued":
      return (
        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs">
          <CircleDot className="h-3.5 w-3.5" />
          <span>Queued</span>
        </div>
      )

    case "processing":
      return (
        <div className="flex flex-col gap-1 min-w-[120px]">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>{status.progress}%</span>
          </div>
          <Progress value={status.progress} className="h-1.5" />
          {status.progressMessage && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
              {status.progressMessage}
            </span>
          )}
        </div>
      )

    case "completed":
      return (
        <div
          className={`flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs ${
            justCompleted ? "animate-pulse" : ""
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Complete</span>
        </div>
      )

    case "failed":
      return (
        <TooltipProvider>
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs cursor-help">
                  <XCircle className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[80px]">Failed</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px]">
                <p className="text-xs">{status.error || "Unknown error"}</p>
              </TooltipContent>
            </Tooltip>
            {onRetry && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation()
                  onRetry()
                }}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TooltipProvider>
      )

    case "skipped":
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Existing data</span>
        </div>
      )

    default:
      return null
  }
}
