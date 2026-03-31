"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Sparkles, Brain, BarChart3, Instagram, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

// Pipeline stages with estimated durations (in seconds)
const PIPELINE_STAGES = [
  { id: 'fetching', label: 'Fetching profile...', icon: Instagram, durationRange: [8, 20] },
  { id: 'analyzing', label: 'Analyzing content...', icon: Brain, durationRange: [30, 60] },
  { id: 'insights', label: 'Generating insights...', icon: Sparkles, durationRange: [20, 40] },
  { id: 'finalizing', label: 'Finalizing analytics...', icon: BarChart3, durationRange: [10, 30] },
] as const

// Total estimated time for the full pipeline (seconds)
const ESTIMATED_TOTAL_SECONDS = 150

interface ProcessingCreatorCardProps {
  username: string
  startedAt: number // Date.now() timestamp
  onComplete?: () => void
}

export function ProcessingCreatorCard({ username, startedAt }: ProcessingCreatorCardProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [stageProgress, setStageProgress] = useState(0)

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - startedAt) / 1000)
      setElapsedSeconds(elapsed)
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  // Advance through stages based on elapsed time
  useEffect(() => {
    // Calculate cumulative thresholds for each stage
    const thresholds = [0, 15, 60, 100, ESTIMATED_TOTAL_SECONDS]

    let stage = 0
    for (let i = 1; i < thresholds.length; i++) {
      if (elapsedSeconds >= thresholds[i]) {
        stage = Math.min(i, PIPELINE_STAGES.length - 1)
      }
    }
    setCurrentStageIndex(stage)

    // Calculate progress within the current stage
    const stageStart = thresholds[stage]
    const stageEnd = thresholds[stage + 1] || ESTIMATED_TOTAL_SECONDS
    const stageDuration = stageEnd - stageStart
    const stageElapsed = elapsedSeconds - stageStart
    const progress = Math.min((stageElapsed / stageDuration) * 100, 95) // Cap at 95% to avoid looking "stuck at 100%"
    setStageProgress(progress)
  }, [elapsedSeconds])

  // Overall progress percentage (capped at 95%)
  const overallProgress = Math.min((elapsedSeconds / ESTIMATED_TOTAL_SECONDS) * 100, 95)

  // Estimate time remaining
  const estimatedRemaining = Math.max(0, ESTIMATED_TOTAL_SECONDS - elapsedSeconds)
  const formatTime = useCallback((seconds: number) => {
    if (seconds <= 0) return 'Almost done...'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) return `~${mins}m ${secs}s remaining`
    return `~${secs}s remaining`
  }, [])

  const currentStage = PIPELINE_STAGES[currentStageIndex]
  const StageIcon = currentStage.icon

  return (
    <Card className="group relative overflow-hidden bg-card border-border shadow-sm processing-card-glow">
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none processing-border-animation" />

      {/* Subtle animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none animate-pulse" />

      {/* Background decorative shimmer */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/8 to-transparent rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none processing-shimmer" />

      <CardContent className="p-4 space-y-4">
        {/* Avatar skeleton + username */}
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-fit">
            {/* Animated glow behind avatar */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full blur-lg scale-125 processing-pulse" />
            {/* Skeleton avatar with shimmer */}
            <div className="relative h-16 w-16 rounded-full border-3 border-background shadow-md overflow-hidden">
              <Skeleton className="h-full w-full rounded-full" />
              {/* Spinner overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin opacity-60" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-sm leading-tight">
              @{username}
            </h3>
            <p className="text-xs text-muted-foreground">Processing new creator</p>
          </div>

          {/* Processing badge */}
          <div className="flex justify-center items-center gap-1.5">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-medium flex items-center gap-1 processing-badge-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing
            </Badge>
          </div>
        </div>

        {/* Pipeline stages */}
        <div className="space-y-2">
          {PIPELINE_STAGES.map((stage, index) => {
            const Icon = stage.icon
            const isActive = index === currentStageIndex
            const isCompleted = index < currentStageIndex
            const isPending = index > currentStageIndex

            return (
              <div
                key={stage.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-500 ${
                  isActive
                    ? 'bg-primary/10 border border-primary/20'
                    : isCompleted
                      ? 'bg-muted/30 opacity-60'
                      : 'opacity-30'
                }`}
              >
                <div className={`flex-shrink-0 ${isActive ? 'text-primary' : isCompleted ? 'text-primary/50' : 'text-muted-foreground'}`}>
                  {isActive ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isCompleted ? (
                    <Icon className="h-3 w-3" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                </div>
                <span className={`text-[11px] flex-1 ${
                  isActive ? 'text-primary font-medium' : isCompleted ? 'text-muted-foreground line-through' : 'text-muted-foreground'
                }`}>
                  {isCompleted ? stage.label.replace('...', '') : stage.label}
                </span>
                {isActive && (
                  <div className="flex-shrink-0">
                    <div className="h-1 w-8 bg-primary/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000"
                        style={{ width: `${stageProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Overall progress bar */}
        <div className="space-y-1.5">
          <Progress
            value={overallProgress}
            className="h-1.5"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {Math.round(overallProgress)}%
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatTime(estimatedRemaining)}
            </span>
          </div>
        </div>

        {/* Disabled analytics button placeholder */}
        <div className="w-full">
          <div className="w-full h-8 bg-muted/50 border border-border rounded-md flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <BarChart3 className="h-3 w-3" />
            Analytics
          </div>
        </div>
      </CardContent>

      {/* @ts-ignore */}
      <style>{`
        .processing-card-glow {
          box-shadow:
            0 0 0 1px color-mix(in oklch, var(--primary) 15%, transparent),
            0 0 20px -5px color-mix(in oklch, var(--primary) 10%, transparent);
        }

        .processing-border-animation {
          background: conic-gradient(
            from var(--border-angle, 0deg),
            transparent 60%,
            color-mix(in oklch, var(--primary) 30%, transparent) 80%,
            transparent 100%
          );
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          padding: 1px;
          animation: borderRotate 4s linear infinite;
        }

        @keyframes borderRotate {
          to {
            --border-angle: 360deg;
          }
        }

        .processing-pulse {
          animation: processingPulse 2s ease-in-out infinite;
        }

        @keyframes processingPulse {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1.1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.3);
          }
        }

        .processing-shimmer {
          animation: shimmerDrift 3s ease-in-out infinite;
        }

        @keyframes shimmerDrift {
          0%, 100% {
            opacity: 0.3;
            transform: translate(16px, -16px);
          }
          50% {
            opacity: 0.6;
            transform: translate(10px, -10px);
          }
        }

        .processing-badge-pulse {
          animation: badgePulse 2s ease-in-out infinite;
        }

        @keyframes badgePulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @property --border-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
      `}</style>
    </Card>
  )
}
