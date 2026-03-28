'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Sparkles, Clock, Zap, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TrialLimitItem {
  current_usage: number
  daily_limit: number
  remaining: number
  display_name: string
}

interface TrialBannerProps {
  trialEnd: string | null
  trialDurationDays?: number
  dailyUsage?: Record<string, TrialLimitItem>
  dailyCreditLimit?: number
  onDismiss?: () => void
}

const SESSION_DISMISS_KEY = 'trial_banner_dismissed'

export function TrialBanner({
  trialEnd,
  trialDurationDays = 7,
  dailyUsage,
  dailyCreditLimit = 250,
  onDismiss,
}: TrialBannerProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(sessionStorage.getItem(SESSION_DISMISS_KEY) === 'true')
    }
  }, [])

  const { daysRemaining, dayNumber, isUrgent, trialProgress } = useMemo(() => {
    if (!trialEnd) {
      return { daysRemaining: 7, dayNumber: 1, isUrgent: false, trialProgress: 14 }
    }
    const now = new Date()
    const end = new Date(typeof trialEnd === 'number' ? trialEnd * 1000 : trialEnd)
    const msRemaining = end.getTime() - now.getTime()
    const days = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))
    const day = Math.max(1, trialDurationDays - days + 1)
    return {
      daysRemaining: days,
      dayNumber: day,
      isUrgent: days <= 2,
      trialProgress: Math.min(100, ((day) / trialDurationDays) * 100),
    }
  }, [trialEnd, trialDurationDays])

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_DISMISS_KEY, 'true')
    }
    onDismiss?.()
  }

  if (dismissed) return null

  // Extract key metrics for compact display
  const profileUsage = dailyUsage?.profile_analysis
  const creditsUsage = dailyUsage?.credits
  const postUsage = dailyUsage?.post_analytics

  return (
    <div className="relative group">
      {/* Gradient border effect */}
      <div
        className={`absolute -inset-[1px] rounded-xl opacity-70 blur-[1px] transition-opacity duration-500 group-hover:opacity-100 ${
          isUrgent
            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500'
            : 'bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500'
        }`}
      />

      <Card className="relative border-0 bg-card overflow-hidden">
        {/* Subtle animated gradient shimmer at top */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] ${
            isUrgent
              ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-red-500'
              : 'bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500'
          }`}
          style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s linear infinite',
          }}
        />

        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${
                isUrgent
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-violet-500/10 text-violet-500'
              }`}
            >
              {isUrgent ? (
                <Clock className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold">
                  Day {dayNumber} of {trialDurationDays}
                </h3>
                <Badge
                  className={`text-[10px] px-1.5 py-0 border-0 ${
                    isUrgent
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300'
                  }`}
                >
                  {isUrgent
                    ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`
                    : 'Free Trial'}
                </Badge>
              </div>

              {/* Trial day progress bar */}
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 max-w-[200px]">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isUrgent
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : 'bg-gradient-to-r from-blue-500 to-violet-500'
                      }`}
                      style={{ width: `${trialProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Compact daily usage row */}
              {dailyUsage && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                  {profileUsage && (
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium text-foreground">
                        {profileUsage.current_usage}/{profileUsage.daily_limit}
                      </span>
                      profiles
                    </span>
                  )}
                  {profileUsage && creditsUsage && (
                    <span className="text-border">|</span>
                  )}
                  {creditsUsage && (
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium text-foreground">
                        {creditsUsage.remaining}/{dailyCreditLimit}
                      </span>
                      credits left
                    </span>
                  )}
                  {creditsUsage && postUsage && (
                    <span className="text-border">|</span>
                  )}
                  {postUsage && (
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium text-foreground">
                        {postUsage.current_usage}/{postUsage.daily_limit}
                      </span>
                      posts
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* CTA + dismiss */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => router.push('/pricing')}
                className={`hidden sm:inline-flex text-xs font-medium text-white border-0 shadow-sm ${
                  isUrgent
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                    : 'bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                Upgrade to Standard
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>

              {/* Mobile CTA */}
              <Button
                size="sm"
                onClick={() => router.push('/pricing')}
                className={`sm:hidden text-xs font-medium text-white border-0 ${
                  isUrgent
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-blue-500 to-violet-600'
                }`}
              >
                Upgrade
              </Button>

              <button
                onClick={handleDismiss}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Dismiss trial banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* CSS keyframes for shimmer */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}} />
      </Card>
    </div>
  )
}
