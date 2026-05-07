"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Sparkles, Brain, BarChart3, Instagram, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

// Display stages for the timeline. Backend progress_percent drives which one
// is "active" — see PROGRESS_TO_STAGE_INDEX below.
const PIPELINE_STAGES = [
  { id: 'fetching',  label: 'Fetching profile…',     icon: Instagram },
  { id: 'analyzing', label: 'Analyzing content…',     icon: Brain },
  { id: 'insights',  label: 'Generating insights…',   icon: Sparkles },
  { id: 'finalizing',label: 'Finalizing analytics…',  icon: BarChart3 },
] as const

// Backend writes progress_percent at the boundaries 5/20/30/85/100.
// Map any incoming value to a stage index. (Stage 0 covers up to 25%, etc.)
function progressToStageIndex(p: number): number {
  if (p < 25) return 0
  if (p < 50) return 1
  if (p < 85) return 2
  return 3
}

// Fallback typical creator-search runtime when we have no real data yet.
const FALLBACK_TOTAL_SECONDS = 150

interface BackendStatus {
  progress_percent?: number
  progress_message?: string | null
  current_stage?: string
  estimated_remaining_seconds?: number
  status?: string
}

interface ProcessingCreatorCardProps {
  username: string
  startedAt: number // Date.now() timestamp
  onComplete?: () => void
}

export function ProcessingCreatorCard({ username, startedAt }: ProcessingCreatorCardProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null)

  // Track elapsed time — used for fallback progress only when backend hasn't
  // reported yet (first 4s before first poll lands).
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  // Listen for real backend progress events (emitted by useCreatorSearch.ts)
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (!detail || detail.username !== username) return
      setBackendStatus(detail.status as BackendStatus)
    }
    window.addEventListener('creator-search-progress', handler)
    return () => window.removeEventListener('creator-search-progress', handler)
  }, [username])

  // F2: real progress drives the bar. No 95% cap. Backend writes 100 only when
  // the job is genuinely complete. Fallback to elapsed-time estimate only when
  // we haven't received a backend update yet.
  const realProgress = backendStatus?.progress_percent
  const overallProgress =
    typeof realProgress === 'number'
      ? Math.max(0, Math.min(100, realProgress))
      : Math.min((elapsedSeconds / FALLBACK_TOTAL_SECONDS) * 100, 90)

  const currentStageIndex = progressToStageIndex(overallProgress)
  const currentStage = PIPELINE_STAGES[currentStageIndex]
  const StageIcon = currentStage.icon

  // F3-style: use backend progress_message when available
  const displayMessage =
    backendStatus?.progress_message ||
    currentStage.label

  // ETA: prefer backend value, fall back to clock estimate
  const estimatedRemaining =
    typeof backendStatus?.estimated_remaining_seconds === 'number'
      ? Math.max(0, backendStatus.estimated_remaining_seconds)
      : Math.max(0, FALLBACK_TOTAL_SECONDS - elapsedSeconds)

  const formatTime = useCallback((seconds: number) => {
    if (seconds <= 0) return 'Almost done…'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) return `~${mins}m ${secs}s remaining`
    return `~${secs}s remaining`
  }, [])

  return (
    <Card className="group relative overflow-hidden bg-card border-border shadow-sm processing-card-glow">
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none processing-border-animation" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none animate-pulse" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/8 to-transparent rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none processing-shimmer" />

      <CardContent className="p-4 space-y-4">
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-fit">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full blur-lg scale-125 processing-pulse" />
            <div className="relative h-16 w-16 rounded-full border-3 border-background shadow-md overflow-hidden">
              <Skeleton className="h-full w-full rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin opacity-60" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-sm leading-tight">@{username}</h3>
            <p className="text-xs text-muted-foreground">{displayMessage}</p>
          </div>

          <div className="flex justify-center items-center gap-1.5">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-medium flex items-center gap-1 processing-badge-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing
            </Badge>
          </div>
        </div>

        {/* Pipeline timeline */}
        <div className="space-y-2">
          {PIPELINE_STAGES.map((stage, index) => {
            const Icon = stage.icon
            const isActive = index === currentStageIndex
            const isCompleted = index < currentStageIndex
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
                  {isActive ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
                </div>
                <span className={`text-[11px] flex-1 ${
                  isActive ? 'text-primary font-medium' : isCompleted ? 'text-muted-foreground line-through' : 'text-muted-foreground'
                }`}>
                  {isCompleted ? stage.label.replace('…', '') : stage.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Real overall progress bar — no 95% cap */}
        <div className="space-y-1.5">
          <Progress value={overallProgress} className="h-1.5" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{Math.round(overallProgress)}%</span>
            <span className="text-[10px] text-muted-foreground">{formatTime(estimatedRemaining)}</span>
          </div>
        </div>

        {/* F9: after 30s, gently nudge users that they don't have to watch */}
        {elapsedSeconds > 30 && (
          <div className="rounded-md border border-primary/20 bg-primary/5 p-2 text-[10px] text-muted-foreground leading-snug">
            <span className="font-medium text-foreground">No need to wait.</span>{' '}
            You can navigate away — we'll send a notification when @{username} is ready.
          </div>
        )}

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
        @keyframes borderRotate { to { --border-angle: 360deg; } }
        .processing-pulse { animation: processingPulse 2s ease-in-out infinite; }
        @keyframes processingPulse {
          0%, 100% { opacity: 0.2; transform: scale(1.1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
        .processing-shimmer { animation: shimmerDrift 3s ease-in-out infinite; }
        @keyframes shimmerDrift {
          0%, 100% { opacity: 0.3; transform: translate(16px, -16px); }
          50% { opacity: 0.6; transform: translate(10px, -10px); }
        }
        .processing-badge-pulse { animation: badgePulse 2s ease-in-out infinite; }
        @keyframes badgePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
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
