'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Mail,
  Image,
  Coins,
  Search,
  BarChart3,
  Download,
  Gauge,
} from 'lucide-react'

interface TrialLimitItem {
  current_usage: number
  daily_limit: number
  remaining: number
  display_name: string
}

interface TrialDailyLimitsCardProps {
  limits: Record<string, TrialLimitItem>
  totalCreditsAllowed?: number
  dailyCreditLimit?: number
  className?: string
  compact?: boolean
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  profile_analysis: Users,
  email_lookup: Mail,
  post_analytics: Image,
  credits: Coins,
  discovery_search: Search,
  campaign_analysis: BarChart3,
  bulk_export: Download,
}

const ACTION_ORDER = [
  'profile_analysis',
  'credits',
  'post_analytics',
  'email_lookup',
  'discovery_search',
  'campaign_analysis',
  'bulk_export',
]

function getUsageColor(percentage: number): {
  bar: string
  text: string
  badge: string
} {
  if (percentage >= 100) {
    return {
      bar: 'bg-red-500/20',
      text: 'text-red-600 dark:text-red-400',
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    }
  }
  if (percentage >= 80) {
    return {
      bar: 'bg-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    }
  }
  if (percentage >= 50) {
    return {
      bar: 'bg-yellow-500/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    }
  }
  return {
    bar: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  }
}

function getBarFillColor(percentage: number): string {
  if (percentage >= 100) return 'bg-red-500'
  if (percentage >= 80) return 'bg-amber-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-emerald-500'
}

function LimitRow({ actionKey, item }: { actionKey: string; item: TrialLimitItem }) {
  const Icon = ACTION_ICONS[actionKey] || Gauge
  const percentage = item.daily_limit > 0
    ? Math.min(100, (item.current_usage / item.daily_limit) * 100)
    : 0
  const colors = getUsageColor(percentage)
  const isFull = percentage >= 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center justify-center w-7 h-7 rounded-md ${colors.bar}`}>
            <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
          </div>
          <span className="text-sm font-medium">{item.display_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm tabular-nums ${isFull ? colors.text + ' font-semibold' : 'text-muted-foreground'}`}>
            {item.current_usage} / {item.daily_limit}
          </span>
          {isFull && (
            <Badge className={`text-[10px] px-1.5 py-0 border-0 ${colors.badge}`}>
              Limit
            </Badge>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getBarFillColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function TrialDailyLimitsCard({
  limits,
  totalCreditsAllowed = 1750,
  dailyCreditLimit = 250,
  className = '',
  compact = false,
}: TrialDailyLimitsCardProps) {
  // Sort actions in a logical order
  const sortedActions = ACTION_ORDER.filter((key) => key in limits)
  // Include any actions not in the predefined order
  const remainingActions = Object.keys(limits).filter((key) => !ACTION_ORDER.includes(key))
  const allActions = [...sortedActions, ...remainingActions]

  if (allActions.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className={compact ? 'pb-3' : ''}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4.5 w-4.5" />
              Daily Limits
            </CardTitle>
            {!compact && (
              <CardDescription className="mt-1">
                Your trial includes daily usage caps. Limits reset at midnight UTC.
              </CardDescription>
            )}
          </div>
          <Badge
            variant="secondary"
            className="text-[10px] border-0 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
          >
            Trial
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`space-y-4 ${compact ? '' : 'sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-4 sm:space-y-0'}`}>
          {allActions.map((actionKey) => (
            <LimitRow key={actionKey} actionKey={actionKey} item={limits[actionKey]} />
          ))}
        </div>

        {!compact && (
          <div className="mt-5 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>Total trial credits: {totalCreditsAllowed.toLocaleString()}</span>
            <span>Daily credit cap: {dailyCreditLimit.toLocaleString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
