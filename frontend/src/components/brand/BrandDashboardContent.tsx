'use client'

/**
 * Home, for a brand.
 *
 * Density tier: WORKING. 40px between subjects, 24px inside a panel, and no box drawn
 * around anything that is not a real object.
 *
 * What changed and why. This page used to open with eight cards: a welcome card, three
 * metric cards, two gauge cards and two companion cards, each with its own border, its own
 * shadow and its own padding. Sixteen edges sat between the first figure and the last, and
 * every one of them was drawn around something that was always the same kind of thing.
 * The greeting is now the page's own head, the three figures are a band separated by space,
 * and a card is kept only for the things that genuinely are objects: the discovery tile you
 * click, and the panels that hold lists.
 *
 * The honesty fix is the more important one. `unlockedProfilesCount` and
 * `activeCampaignsCount` are both `?? 0` inside the hook, so a 500 on either endpoint used
 * to render a confident "0" — a brand with sixty unlocked creators would be told they had
 * none. The hook has always exposed `profilesError` and `campaignsError`; this page now
 * reads them and renders an en dash with a line saying it did not load.
 */

import { useMemo, useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useDashboardData } from "@/hooks/useDashboardData"
import { useUserStore, useSubscriptionData, useTeamData } from "@/stores/userStore"
import { useNotifications } from "@/contexts/NotificationContext"
import { ChartProfileAnalysisV2 } from "@/components/chart-profile-analysis-v2"
import { ChartRemainingCreditsV2 } from "@/components/chart-remaining-credits-v2"
import { BrandQuotaWidget } from "@/components/brand/BrandQuotaWidget"
import { CampaignBars } from "@/components/brand/CampaignBars"
import { ShareCenterCard } from "@/components/brand/ShareCenterCard"
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton"
import { Button } from "@/components/ui/button"
import { Balloons } from "@/components/ui/balloons"
import { UserAvatar } from "@/components/UserAvatar"
import { SmartDiscovery } from "@/components/smart-discovery"
import { brandPoolApi } from "@/services/faAdminApi"
import {
  Page,

  StatBand,
  Stat,
  Panel,
  ListRow,
  GroupLabel,
  Money,
  UNKNOWN,
} from "@/components/brand/primitives"
import {
  AlertTriangle,
  Wallet,
  ArrowRight,
  Bell,
  CreditCard,
  BarChart3,
  FileText,
  Link2,
  UserPlus,
} from "lucide-react"

export function BrandDashboardContent() {
  const router = useRouter()

  const {
    teamsOverview,
    teamsLoading,
    unlockedProfilesCount,
    profilesLoading,
    profilesError,
    activeCampaignsCount,
    campaignsLoading,
    campaignsError,
    isLoading,
  } = useDashboardData()

  const subscription = useSubscriptionData()
  const team = useTeamData()
  const { isLoading: userStoreLoading, user } = useUserStore()
  const { notifications, markAsRead } = useNotifications()

  // Balloons celebration for credit events
  const balloonsRef = useRef<{ launchAnimation: () => void }>(null)
  const [celebrationDone, setCelebrationDone] = useState(false)

  useEffect(() => {
    if (celebrationDone || !notifications.length) return
    const creditNotifs = notifications.filter(
      (n) => !n.is_read && (n.notification_type === 'credit_purchase')
    )
    if (creditNotifs.length > 0) {
      // Delay slightly so the page has rendered
      const timer = setTimeout(() => {
        balloonsRef.current?.launchAnimation()
        setCelebrationDone(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [notifications, celebrationDone])

  // Pool balance for low-balance warning. A fetch FAILURE is a distinct error state
  // (with retry) — never silently conflated with a zero or empty pool.
  const [poolBalance, setPoolBalance] = useState<{ available_aed: number; total_funded_aed: number } | null>(null)
  const [poolError, setPoolError] = useState(false)
  const poolFetchedRef = useRef(false)
  const fetchPool = useCallback(() => {
    setPoolError(false)
    brandPoolApi.balance().then((res: any) => {
      if (res?.success && res.data) {
        setPoolBalance({
          available_aed: res.data.available_aed ?? (res.data.available_cents ? res.data.available_cents / 100 : 0),
          total_funded_aed: res.data.total_funded_aed ?? (res.data.total_funded_cents ? res.data.total_funded_cents / 100 : 0),
        })
      }
      // success:false with no data = brand simply has no funded pool (genuine
      // zero-data) → leave poolBalance null, show nothing. Only exceptions below
      // are treated as an error.
    }).catch(() => {
      setPoolBalance(null)
      setPoolError(true)
    })
  }, [])
  useEffect(() => {
    if (poolFetchedRef.current) return
    poolFetchedRef.current = true
    fetchPool()
  }, [fetchPool])

  const userDisplayData = useMemo(() => {
    if (!user || isLoading) return null

    const getDisplayName = () => {
      if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
      if (user.full_name) return user.full_name
      if (user.first_name) return user.first_name
      if (user.email) return user.email.split('@')[0]
      return null
    }

    return {
      displayName: getDisplayName(),
      companyName: user.company || null,
    }
  }, [user, isLoading])

  // Derive subscription tier display. `null` means we do not know yet, which is a
  // different thing from Free — a brand on Premium must never be shown "Free" because a
  // request was still in flight.
  const tierValue = useMemo(() => {
    if (userStoreLoading || teamsLoading) return null

    const tier = team?.subscription_tier
      || subscription?.tier
      || teamsOverview?.team_info?.subscription_tier

    const tierMap: Record<string, string> = {
      free: 'Free',
      standard: 'Standard',
      premium: 'Premium',
      enterprise: 'Enterprise',
    }

    return tier ? (tierMap[tier] || tier) : 'Free'
  }, [userStoreLoading, teamsLoading, team, subscription, teamsOverview])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const who = userDisplayData?.companyName || userDisplayData?.displayName

  return (
    <Page tier="working">

      {/* Anything genuinely wrong comes before the greeting, because a depleted pool stops
          campaigns paying out and nothing else on this page matters until it is fixed. */}
      {poolBalance && poolBalance.total_funded_aed > 0 && (() => {
        const pct = (poolBalance.available_aed / poolBalance.total_funded_aed) * 100

        if (poolBalance.available_aed <= 0) return (
          <Alert
            tone="bad"
            icon={AlertTriangle}
            title="Your cashback pool is empty"
            body="Campaigns cannot pay cashback until it is topped up."
            action={<PoolAction href="/cashback-pool/topup" label="Top up now" primary />}
          />
        )
        if (pct < 5) return (
          <Alert
            tone="bad"
            icon={AlertTriangle}
            title={<>Cashback pool critically low, <Money amount={poolBalance.available_aed} /> left</>}
            body="Campaigns may stop paying cashback within days."
            action={<PoolAction href="/cashback-pool/topup" label="Top up" primary />}
          />
        )
        if (pct < 20) return (
          <Alert
            tone="warn"
            icon={Wallet}
            title={<>Cashback pool running low, <Money amount={poolBalance.available_aed} /> left</>}
            action={<PoolAction href="/cashback-pool/topup" label="Top up" />}
          />
        )
        return null
      })()}

      {/* A failed balance fetch is its own state, in the quiet tone, so it can never be
          read as "the pool is empty". */}
      {poolError && !poolBalance && (
        <Alert
          tone="neutral"
          icon={AlertTriangle}
          title="We could not load your cashback pool balance"
          body="This is a display problem. It does not mean your pool is empty."
          action={<Button variant="outline" size="sm" onClick={fetchPool}>Try again</Button>}
        />
      )}

      {/* The greeting IS the page head. It used to be a card of its own, sitting beside
          three more cards, which spent a border and a shadow on saying hello. */}
      <header className="flex items-center gap-ds-3">
        <UserAvatar
          key={`dashboard-avatar-${JSON.stringify(user?.avatar_config) || 'default'}`}
          user={user || undefined}
          size={56}
          className="shrink-0"
        />
        <div className="flex min-w-0 flex-col gap-ds-1">
          <h1 className="truncate text-ds-title text-foreground">
            {greeting}{who ? <>, {who}</> : null}
          </h1>
          <p className="max-w-[65ch] text-ds-body text-muted-foreground">
            {tierValue
              ? `You are on the ${tierValue} plan. Here is where your creators, credits and campaigns stand today.`
              : 'Here is where your creators, credits and campaigns stand today.'}
          </p>
        </div>
      </header>

      {/* Three figures, separated by 40px of space instead of by six borders. Each one
          carries its own loading and error state; none of them can print a zero it does
          not have. */}
      <StatBand cols={3}>
        <Stat
          label="Creators unlocked, all time"
          value={unlockedProfilesCount}
          hint="Everyone your team has ever opened"
          href="/creators"
          loading={profilesLoading}
          error={!!profilesError}
        />
        <Stat
          label="Active campaigns"
          value={activeCampaignsCount}
          hint="Running right now"
          href="/campaigns"
          loading={campaignsLoading}
          error={!!campaignsError}
        />
        <Stat
          label="Your plan"
          value={tierValue ?? UNKNOWN}
          hint="Seats, unlocks and credits"
          href="/billing"
          loading={userStoreLoading || teamsLoading}
        />
      </StatBand>

      {/* The one thing we want them to do next, at the size that says so. A real object,
          so it keeps its card. */}
      <SmartDiscovery onDiscover={() => router.push('/discover')} className="h-[280px]" />

      {/* Reference data, deliberately below the action and behind its own section label.
          The gauges are the only figures on this page that keep a surface, because each is
          a drawn dial rather than a number. */}
      <section className="flex flex-col gap-ds-3">
        <GroupLabel>Usage this cycle</GroupLabel>
        <div className="grid grid-cols-1 gap-ds-3 lg:grid-cols-2">
          <div aria-label="Profile unlocks remaining this billing cycle" className="h-[300px]">
            <ChartProfileAnalysisV2 />
          </div>
          <div aria-label="Remaining credits this billing cycle" className="h-[300px]">
            <ChartRemainingCreditsV2 />
          </div>
        </div>
      </section>

      {/* Companion detail. Every one of these renders nothing at all when it has nothing
          to say, so a brand with no campaigns and no shares sees a shorter page rather
          than a wall of apologies. */}
      <section className="grid grid-cols-1 gap-ds-3 lg:grid-cols-2">
        <CampaignBars />
        <ShareCenterCard />
        <BrandQuotaWidget />

        <Panel
          title="Recent activity"
          action={
            <Link href="/notifications" className="text-ds-body-sm text-primary hover:underline">
              See all
            </Link>
          }
          flush
        >
          {notifications.length === 0 ? (
            <p className="px-6 pb-ds-3 text-ds-body-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <div className="px-4">
              {notifications.slice(0, 5).map((n) => {
                const iconMap: Record<string, typeof Bell> = {
                  credit_purchase: CreditCard,
                  low_balance: AlertTriangle,
                  analytics_completed: BarChart3,
                  proposal_received: FileText,
                  proposal_updated: FileText,
                  share_received: Link2,
                  team_invite: UserPlus,
                }
                const Icon = iconMap[n.notification_type] || Bell
                const activate = () => {
                  if (!n.is_read) markAsRead(n.id)
                  if (n.action_url) router.push(n.action_url)
                }
                return (
                  <ListRow
                    key={n.id}
                    onClick={activate}
                    aria-label={`Notification: ${n.title}${n.is_read ? '' : ' (unread)'}`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className={`min-w-0 flex-1 truncate text-ds-body ${n.is_read ? 'text-muted-foreground' : 'font-medium'}`}>
                      {n.title}
                    </span>
                    {!n.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    <span className="shrink-0 text-ds-caption text-muted-foreground">
                      {getTimeAgo(n.created_at)}
                    </span>
                  </ListRow>
                )
              })}
            </div>
          )}
        </Panel>
      </section>

      <Balloons ref={balloonsRef} />
    </Page>
  )
}

/**
 * One banner, three tones, all four colours from the global semantic tokens.
 *
 * This replaces three hand-written blocks of `bg-red-50 dark:bg-red-950 border-red-200
 * dark:border-red-800 text-red-800 dark:text-red-300`, which is the same decision written
 * out four times per tone and is why "warning" meant two different ambers on two screens.
 */
function Alert({
  tone, icon: Icon, title, body, action,
}: {
  tone: 'bad' | 'warn' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  title: React.ReactNode
  body?: React.ReactNode
  action?: React.ReactNode
}) {
  const skin = {
    bad: 'border-danger/30 bg-danger/[0.07]',
    warn: 'border-warning/35 bg-warning/[0.09]',
    neutral: 'border-border bg-muted/40',
  }[tone]
  const ink = {
    bad: 'text-danger',
    warn: 'text-warning',
    neutral: 'text-muted-foreground',
  }[tone]

  return (
    <div className={`flex flex-col gap-ds-3 rounded-ds-lg border px-5 py-4 sm:flex-row sm:items-center ${skin}`}>
      <Icon className={`h-5 w-5 shrink-0 ${ink}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
        <p className="text-ds-label text-foreground">{title}</p>
        {body && <p className="text-ds-body-sm text-muted-foreground">{body}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

function PoolAction({ href, label, primary }: { href: string; label: string; primary?: boolean }) {
  return (
    <Button asChild size="sm" variant={primary ? 'default' : 'outline'}>
      <Link href={href} className="gap-ds-1">
        {label}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Button>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
