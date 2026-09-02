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
  ShieldCheck,
} from 'lucide-react'
import { getPlanLimits, unlockGatesForTier } from '@/config/planPricing'

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

/**
 * What Standard actually gives you for the thing the trial just stopped.
 *
 * The daily caps here are trial-only (app/services/trial_limit_service.py
 * TRIAL_DAILY_LIMITS); they do not exist on a paid plan. What DOES exist on
 * Standard is a monthly allowance for three of them, and nothing at all for the
 * rest, which are metered in credits like everything else.
 *
 * This table used to claim "500/month" profile unlocks (the server enforces
 * 350) and "Unlimited" for five actions, including email lookups, which have no
 * allowance and no price anywhere in the backend. An action with no enforced
 * monthly number does not get one invented for it: it gets the truth, which is
 * that the daily cap goes away and credits are the only meter left.
 */
function standardAllowance(action: string | undefined): { figure: string; note: string } {
  const limits = getPlanLimits('standard')
  const gates = unlockGatesForTier('standard')

  switch (action) {
    case 'profile_analysis':
      // app/core/plans.py PLANS['standard']: 8,750 credits funds 350 unlocks,
      // and unlock_cap_multiple UNLIMITED means nothing caps them above that.
      return {
        figure: `${(gates.included ?? 0).toLocaleString()} a month`,
        note: 'Plus as many more as you buy',
      }
    case 'post_analytics':
      // app/core/plans.py PLANS['standard'].monthly_posts_limit
      return {
        figure: `${limits.monthlyPosts.toLocaleString()} a month`,
        note: 'No daily cap',
      }
    case 'credits':
      // app/core/plans.py PLANS['standard'].monthly_credits
      return {
        figure: `${limits.monthlyCredits.toLocaleString()} a month`,
        note: 'Renewed every billing month',
      }
    default:
      return {
        figure: 'No daily cap',
        note: 'Metered in credits, like everything else',
      }
  }
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
  const standard = standardAllowance(limitHit)

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
              <p className="text-sm font-semibold">{standard.figure}</p>
              <p className="text-[11px] text-muted-foreground">{standard.note}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleUpgrade}
            className="w-full text-white border-0 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 shadow-sm"
          >
            {/* No price on this button. This modal has no pricing request
                behind it, so the only price it could print would come from a
                build-time default in the wrong currency. /pricing reads the
                live one. */}
            <Zap className="h-4 w-4" />
            See the plans
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
