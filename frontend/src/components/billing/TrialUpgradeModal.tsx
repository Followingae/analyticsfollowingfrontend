'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  ArrowRight,
  Clock,
  Users,
  Mail,
  Image,
  Coins,
  Search,
  BarChart3,
  Download,
  Infinity,
  ShieldCheck,
} from 'lucide-react'

interface TrialLimitItem {
  current_usage: number
  daily_limit: number
  remaining: number
  display_name: string
}

interface TrialUpgradeModalProps {
  open: boolean
  onClose: () => void
  limitHit?: string // e.g. "profile_analysis"
  limitInfo?: TrialLimitItem
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

const STANDARD_PLAN_LIMITS: Record<string, string> = {
  profile_analysis: '500/month',
  email_lookup: 'Unlimited',
  post_analytics: 'Unlimited',
  credits: '8,750/month',
  discovery_search: 'Unlimited',
  campaign_analysis: 'Unlimited',
  bulk_export: 'Unlimited',
}

export function TrialUpgradeModal({
  open,
  onClose,
  limitHit,
  limitInfo,
}: TrialUpgradeModalProps) {
  const router = useRouter()
  const Icon = limitHit ? (ACTION_ICONS[limitHit] || Clock) : Clock
  const displayName = limitInfo?.display_name || 'Daily Limit'
  const standardLimit = limitHit ? STANDARD_PLAN_LIMITS[limitHit] : 'Unlimited'

  const handleUpgrade = () => {
    onClose()
    router.push('/pricing')
  }

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-lg">Daily Limit Reached</DialogTitle>
              <DialogDescription className="mt-0.5">
                You have reached your trial limit for today.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Which limit was hit */}
        {limitInfo && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-red-500/10">
                <Icon className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {limitInfo.current_usage} of {limitInfo.daily_limit} used today
                </p>
              </div>
              <Badge className="ml-auto text-[10px] px-1.5 py-0 border-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                Full
              </Badge>
            </div>

            {/* Usage bar */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-red-500 w-full" />
            </div>
          </div>
        )}

        {/* Comparison */}
        <div className="space-y-2.5 py-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Upgrade comparison
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Trial */}
            <div className="rounded-lg border border-dashed border-muted-foreground/20 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Trial</span>
              </div>
              <p className="text-sm font-semibold">
                {limitInfo ? `${limitInfo.daily_limit}/day` : 'Limited'}
              </p>
              <p className="text-[11px] text-muted-foreground">Daily caps on all features</p>
            </div>

            {/* Standard */}
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-violet-500" />
                <span className="text-xs font-medium text-violet-600 dark:text-violet-400">Standard</span>
              </div>
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold">{standardLimit}</p>
                {standardLimit === 'Unlimited' && (
                  <Infinity className="h-3.5 w-3.5 text-violet-500" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">No daily restrictions</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleUpgrade}
            className="w-full text-white border-0 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 shadow-sm"
          >
            <Zap className="h-4 w-4" />
            Upgrade Now - د.إ199/mo
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-muted-foreground"
          >
            Continue with trial tomorrow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
