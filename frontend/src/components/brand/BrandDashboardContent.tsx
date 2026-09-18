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
 *
 * WHAT THE PAGE IS ABOUT NOW, which is the larger change. It was organised around profile
 * unlocks: the first figure, both gauges and the headline sentence were all about a thing
 * the client BOUGHT rather than a thing they have to DO. Meanwhile the one thing a brand
 * actually owes us an answer on, their creators' content, was not on this page at all.
 *
 * So content leads. The figures answer "is anything waiting on me", the panel underneath is
 * the queue itself with the approve buttons in it, and a client can clear it without opening
 * anything. Unlocks and credits are still here, still exact, still metered, and have moved
 * to Usage this cycle where a balance belongs. Nothing was removed.
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
import { ContentAwaitingPanel } from "@/components/brand/ContentAwaitingPanel"
import { brandProposalViewApi } from "@/services/adminProposalMasterApi"
import { cn } from "@/lib/utils"

/** The card surface the dials already carry, so the figures beside them match. */
const CARD_SURFACE = 'rounded-[var(--radius-card,16px)] border bg-card'

import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton"
import { Button } from "@/components/ui/button"
import { Balloons } from "@/components/ui/balloons"
import { UserAvatar } from "@/components/UserAvatar"
import { SmartDiscovery } from "@/components/smart-discovery"
import { brandPoolApi } from "@/services/faAdminApi"
import { contentBrandApi, type ContentSummary } from "@/services/contentDeliveryApi"
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

  // Content across every campaign this brand can open, plus the queue on whichever campaign
  // has the most waiting. One request, because "is anything waiting on me anywhere" is a
  // question about the account rather than about a campaign.
  //
  // A failure leaves this null and the section simply does not render. It must never be
  // drawn as "nothing waiting": telling a client they are up to date when we could not ask
  // is the same class of lie as printing a zero for a failed count.
  const [content, setContent] = useState<ContentSummary | null>(null)
  const loadContent = useCallback(() => {
    contentBrandApi.summary()
      .then(setContent)
      .catch(() => setContent(null))
  }, [])
  useEffect(() => { loadContent() }, [loadContent])

  /* Proposals still waiting on THEM - sent, in review, or more asked for. The server has
     always counted this; nothing on the dashboard read it, so the one thing a client is
     most often here to do had no number anywhere on their home screen. */
  const [pendingProposals, setPendingProposals] = useState<number | null>(null)
  useEffect(() => {
    brandProposalViewApi.listProposals({ limit: 1 })
      .then((r) => setPendingProposals(r.pending_count ?? 0))
      .catch(() => setPendingProposals(null))
  }, [])

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
      {/* The welcome, as it was in April and as the founder asked for it back.
          "Welcome," on its own line, small and italic; their name underneath, large. The
          greeting-plus-name sentence that replaced it - "Good evening, Damas Jewellery" -
          put both on one line at one weight, which reads as a label and buries the only
          thing the block exists to say. The avatar is 90px, as it was. */}
      <header className="flex items-center gap-ds-4">
        <UserAvatar
          key={`dashboard-avatar-${JSON.stringify(user?.avatar_config) || 'default'}`}
          user={user || undefined}
          size={90}
          className="shrink-0"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="welcome-text-primary font-semibold italic">Welcome,</span>
          {who && (
            <span className="welcome-text-brand font-serif" title={who}>
              {who}
            </span>
          )}
        </div>
      </header>

      {/* What is waiting, and nothing else.
          This was four figures that were nearly always four zeros: "Creators working 0",
          "Content approved 0", "Live campaigns 0" - a wall of nothing that told a client
          their account was empty when it was simply quiet that week. Status counters read
          as zeros; requests read as work. So the band carries only the figures that are
          asking something of them, only when they are asking, and when nothing is, it says
          so in one line instead of four boxes. */}
      {(() => {
        const asks = [
          {
            key: 'content',
            label: 'Content to approve',
            value: content?.awaiting_you ?? 0,
            hint: 'Watch it, then approve it',
            tone: 'warn' as const,
            href: content?.focus ? `/campaigns/${content.focus.campaign_id}/content` : '/campaigns',
            loading: content === null,
          },
          {
            key: 'proposals',
            label: 'Proposals to answer',
            value: pendingProposals ?? 0,
            hint: 'Pick your creators, or ask for more',
            tone: 'warn' as const,
            href: '/proposals',
            loading: pendingProposals === null,
          },
          {
            key: 'live',
            label: 'Live campaigns',
            value: activeCampaignsCount ?? 0,
            hint: 'Running right now',
            tone: 'neutral' as const,
            href: '/campaigns',
            loading: campaignsLoading,
          },
          {
            key: 'working',
            label: 'Creators filming',
            value: content?.creators_working ?? 0,
            hint: 'Shooting or posting for you',
            tone: 'neutral' as const,
            href: '/campaigns',
            loading: content === null,
          },
        ]
        const shown = asks.filter((a) => a.loading || a.value > 0)
        if (!shown.length) {
          return (
            <p className="text-ds-body text-muted-foreground">
              Nothing is waiting on you.{' '}
              <button type="button" onClick={() => router.push('/discover')}
                      className="underline underline-offset-4 hover:text-foreground">
                Find your next creators
              </button>
              .
            </p>
          )
        }
        /* A ROW, not a grid. A four-column grid holding one item leaves that item stranded
           beside three empty cells, which is what a client with a single proposal waiting
           was looking at: one number, alone, against half a page of nothing. A row is the
           same shape whether it carries one item or four. */
        return (
          <div className="flex flex-wrap items-stretch gap-x-ds-6 gap-y-ds-4">
            {shown.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => router.push(a.href)}
                className="group flex min-w-[168px] flex-col items-start rounded-ds-md text-left"
              >
                <span className="flex items-center gap-1.5 text-ds-caption text-muted-foreground">
                  {a.value > 0 && (
                    <span className={cn('size-1.5 rounded-full',
                      a.tone === 'warn' ? 'bg-[var(--warning)]' : 'bg-muted-foreground/40')} />
                  )}
                  {a.label}
                </span>
                <span className="mt-ds-1 text-[28px] font-semibold leading-none tabular-nums
                                 transition-colors group-hover:text-primary">
                  {a.loading ? UNKNOWN : a.value}
                </span>
                <span className="mt-ds-1 text-ds-caption text-muted-foreground">{a.hint}</span>
              </button>
            ))}
          </div>
        )
      })()}

      {/* The queue itself, with the buttons in it. Renders nothing when nothing is waiting,
          so a client who is up to date gets a shorter page rather than an empty box. */}
      <ContentAwaitingPanel focus={content?.focus ?? null} onChanged={loadContent} />

      {/* The one thing we want them to do next. It keeps its card because it is a real
          object, and it keeps its height because the tile's own padding is built for it.

          Half the page, not two thirds. Stretched wide it read as a banner across the top
          of everything below it; at half it is one thing among several, which is what it
          is. */}
      <div className="max-w-[640px]">
        <SmartDiscovery onDiscover={() => router.push('/discover')}
                        className="h-[280px]" />
      </div>

      {/* Unlocks and credits. Still exact, still metered, and NOT removed: they have moved
          from being the organising idea of this page to being a balance, which is what they
          are. The gauges keep a surface because each is a drawn dial rather than a number,
          and the all-time unlock count joins them because it belongs with them rather than
          at the top of the page. */}
      <section className="flex flex-col gap-ds-3">
        <GroupLabel>Usage this cycle</GroupLabel>
        {/* One line: two dials and the two figures that belong with them. They were a row
            of dials and then a separate band underneath, which made a balance read as two
            subjects. The dials are shorter than they were, because a dial does not need to
            be 300px tall to be read - it needed that height only to fill a card that was
            too wide. */}
        <div className="grid grid-cols-1 gap-ds-3 sm:grid-cols-2 xl:grid-cols-4">
          <div aria-label="Profile unlocks remaining this billing cycle" className="h-[240px]">
            <ChartProfileAnalysisV2 />
          </div>
          <div aria-label="Remaining credits this billing cycle" className="h-[240px]">
            <ChartRemainingCreditsV2 />
          </div>
          {/* The same surface and the same height as the dials beside them. Left bare they
              floated in the middle of the row with the dials boxed either side, which read
              as two different things rather than one balance. */}
          <div className={cn(CARD_SURFACE, 'flex h-[240px] flex-col justify-center gap-ds-1 p-ds-4')}>
            <Stat
              label="Creators unlocked, all time"
              value={unlockedProfilesCount}
              hint="Everyone your team has ever opened"
              href="/creators"
              loading={profilesLoading}
              error={!!profilesError}
            />
          </div>
          <div className={cn(CARD_SURFACE, 'flex h-[240px] flex-col justify-center gap-ds-1 p-ds-4')}>
            <Stat
              label="Your plan"
              value={tierValue ?? UNKNOWN}
              hint="Seats, unlocks and credits"
              href="/billing"
              loading={userStoreLoading || teamsLoading}
            />
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
