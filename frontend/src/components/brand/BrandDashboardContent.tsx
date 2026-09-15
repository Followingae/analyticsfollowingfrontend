'use client'

/**
 * The brand's home screen.
 *
 * WHAT WAS WRONG WITH THE OLD ONE. It was seven sections stacked vertically at identical
 * weight: a greeting, four figures, a queue, a discovery card, two gauges, four more
 * figures, then panels. Nothing was larger than anything else, so nothing led, and a client
 * arriving with three pieces of content to approve had to find that fact among eleven other
 * numbers. The figures were bare text on the page background, which is why it read as flat.
 *
 * WHAT THIS IS INSTEAD. Two columns. The left is the work, and it opens with ONE card that
 * carries whatever actually matters today. The right is the account: balances, usage and
 * activity, parked where they cannot interrupt. Size encodes importance, which is the only
 * reliable way to say "this first" without shouting.
 *
 * THE HERO IS A STATE MACHINE, and it is the point of the rewrite. A brand who has just
 * signed up, a brand with a proposal waiting and no campaigns, and a brand mid-campaign with
 * content to approve are three different people with three different next actions. The old
 * page showed all three the same eleven numbers, most of them zero. `heroFor` resolves ONE
 * of them, in urgency order, and everything below it renders only when it has something to
 * say.
 *
 * Built from shadcn primitives directly - Card, Button, Badge, Progress, Separator, Alert -
 * with no local wrappers, and coloured only from the theme's semantic tokens. No raw colour
 * values live in this file.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { useDashboardData } from '@/hooks/useDashboardData'
import { useUserStore, useSubscriptionData, useTeamData } from '@/stores/userStore'
import { useNotifications } from '@/contexts/NotificationContext'
import { API_CONFIG, ENDPOINTS, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { brandPoolApi } from '@/services/faAdminApi'
import { contentBrandApi, type ContentSummary } from '@/services/contentDeliveryApi'
import { brandProposalViewApi } from '@/services/adminProposalMasterApi'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Balloons } from '@/components/ui/balloons'
import { UserAvatar } from '@/components/UserAvatar'
import { ContentAwaitingPanel } from '@/components/brand/ContentAwaitingPanel'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { Money } from '@/components/brand/primitives'
import { cn } from '@/lib/utils'

import {
  AlertTriangle, ArrowRight, BarChart3, Bell, Compass, CreditCard, FileText,
  Link2, Megaphone, PlayCircle, Sparkles, UserPlus, Users, Wallet,
} from 'lucide-react'

/* Statuses at which a proposal is the client's move rather than ours. */
const PROPOSAL_WAITING = ['sent', 'in_review', 'more_requested']

type HeroKind = 'content' | 'proposals' | 'running' | 'unlocked' | 'welcome'

export function BrandDashboardContent() {
  const router = useRouter()

  const {
    unlockedProfilesCount, profilesLoading,
    activeCampaignsCount, campaigns, campaignsLoading,
    isLoading,
  } = useDashboardData()

  const subscription = useSubscriptionData()
  const team = useTeamData()
  const { isLoading: userStoreLoading, user } = useUserStore()
  const { notifications, markAsRead } = useNotifications()

  const balloonsRef = useRef<{ launchAnimation: () => void }>(null)

  /* ── the account's money and usage, for the rail ──────────────────────────── */
  const [credits, setCredits] = useState<{ balance: number; allowance: number } | null>(null)
  useEffect(() => {
    let dead = false
    fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.credits.walletSummary}`, {
      headers: getAuthHeaders(),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (dead || !j) return
        // Same unwrap the credits gauge has always used: the endpoint answers wrapped on
        // some paths and direct on others, and guessing one shape shows a zero balance to a
        // client who has thousands.
        const w = j?.success ? j.data : j
        if (!w) return
        setCredits({
          balance: Number(w?.current_balance ?? 0),
          allowance: Number(w?.monthly_allowance ?? w?.total_plan_credits ?? 0),
        })
      })
      .catch(() => { /* a failed balance shows nothing, never a zero */ })
    return () => { dead = true }
  }, [])

  /* ── the cashback pool, which can stop campaigns paying out ───────────────── */
  const [pool, setPool] = useState<{ available_aed: number; total_funded_aed: number } | null>(null)
  const [poolError, setPoolError] = useState(false)
  const poolOnce = useRef(false)
  const fetchPool = useCallback(() => {
    setPoolError(false)
    brandPoolApi.balance().then((res: any) => {
      if (res?.success && res.data) {
        setPool({
          available_aed: res.data.available_aed ?? (res.data.available_cents ?? 0) / 100,
          total_funded_aed: res.data.total_funded_aed ?? (res.data.total_funded_cents ?? 0) / 100,
        })
      }
    }).catch(() => { setPool(null); setPoolError(true) })
  }, [])
  useEffect(() => {
    if (poolOnce.current) return
    poolOnce.current = true
    fetchPool()
  }, [fetchPool])

  /* ── content waiting on them, anywhere ────────────────────────────────────── */
  const [content, setContent] = useState<ContentSummary | null>(null)
  const loadContent = useCallback(() => {
    contentBrandApi.summary().then(setContent).catch(() => setContent(null))
  }, [])
  useEffect(() => { loadContent() }, [loadContent])

  /* ── proposals, which is how a brand with no campaigns yet still has work ─── */
  const [proposals, setProposals] = useState<any[] | null>(null)
  useEffect(() => {
    let dead = false
    brandProposalViewApi.listProposals({ limit: 10 })
      .then((r) => { if (!dead) setProposals(r?.proposals ?? []) })
      .catch(() => { if (!dead) setProposals(null) })
    return () => { dead = true }
  }, [])

  const waitingProposals = useMemo(
    () => (proposals ?? []).filter((p) => PROPOSAL_WAITING.includes(
      String(p?.proposal?.status ?? p?.status ?? ''))),
    [proposals])

  const liveCampaigns = useMemo(
    () => (campaigns ?? []).filter((c: any) => c?.status === 'active'),
    [campaigns])

  const displayName = useMemo(() => {
    if (!user) return null
    if (user.company) return user.company
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
    return user.full_name || user.first_name || user.email?.split('@')[0] || null
  }, [user])

  const tier = useMemo(() => {
    if (userStoreLoading) return null
    const t = team?.subscription_tier || subscription?.tier
    const map: Record<string, string> = {
      free: 'Free', standard: 'Standard', premium: 'Premium', enterprise: 'Enterprise',
    }
    return t ? (map[t] || t) : 'Free'
  }, [userStoreLoading, team, subscription])

  /* THE decision this page exists to make. Urgency order, and exactly one wins:
     something of theirs is blocked on us > something of ours is blocked on them >
     it is running > they have creators but no campaign > they are brand new. */
  const hero: HeroKind = useMemo(() => {
    if (content && content.awaiting_you > 0) return 'content'
    if (waitingProposals.length > 0) return 'proposals'
    if (activeCampaignsCount > 0) return 'running'
    if (unlockedProfilesCount > 0) return 'unlocked'
    return 'welcome'
  }, [content, waitingProposals.length, activeCampaignsCount, unlockedProfilesCount])

  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  })()

  if (isLoading) return <DashboardSkeleton />

  const poolPct = pool && pool.total_funded_aed > 0
    ? (pool.available_aed / pool.total_funded_aed) * 100
    : null

  return (
    <div className="flex w-full flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">

      {/* Anything genuinely broken comes before everything, because a drained pool stops
          campaigns paying creators and nothing else on this page matters until it is fixed. */}
      {pool && poolPct !== null && poolPct < 20 && (
        <Alert variant={pool.available_aed <= 0 || poolPct < 5 ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {pool.available_aed <= 0
              ? 'Your cashback pool is empty'
              : <>Cashback pool running low, <Money amount={pool.available_aed} /> left</>}
          </AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>Campaigns cannot pay cashback once it runs out.</span>
            <Button asChild size="sm" variant="outline">
              <Link href="/cashback-pool/topup">Top up<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {poolError && !pool && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>We could not load your cashback pool balance</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>This is a display problem. It does not mean your pool is empty.</span>
            <Button size="sm" variant="outline" onClick={fetchPool}>Try again</Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

        {/* ── the work ───────────────────────────────────────────────────────── */}
        <main className="flex min-w-0 flex-col gap-6">

          <header className="flex items-center gap-4">
            <UserAvatar
              key={`dash-avatar-${JSON.stringify(user?.avatar_config) || 'default'}`}
              user={user || undefined}
              size={48}
              className="shrink-0"
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {greeting}{displayName ? <>, {displayName}</> : null}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-GB',
                  { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </header>

          <Hero
            kind={hero}
            content={content}
            proposals={waitingProposals}
            liveCount={activeCampaignsCount}
            unlocked={unlockedProfilesCount}
            onGo={(href) => router.push(href)}
          />

          {/* The queue itself. Renders nothing when nothing is waiting. */}
          {content && content.awaiting_you > 0 && (
            <ContentAwaitingPanel focus={content?.focus ?? null} onChanged={loadContent} />
          )}

          {/* Proposals, whenever there are any waiting and they are not already the hero. */}
          {hero !== 'proposals' && waitingProposals.length > 0 && (
            <ProposalList proposals={waitingProposals} />
          )}

          {/* Campaigns, whenever any are running. */}
          {liveCampaigns.length > 0 && (
            <CampaignList campaigns={liveCampaigns} loading={campaignsLoading} />
          )}

          {/* The nudge, only for somebody with nothing else to do. */}
          {(hero === 'unlocked' || hero === 'welcome') && <NextSteps unlocked={unlockedProfilesCount} />}
        </main>

        {/* ── the account ────────────────────────────────────────────────────── */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-medium">Your account</CardTitle>
                {tier && <Badge variant="secondary">{tier}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Meter
                label="Credits"
                value={credits?.balance ?? null}
                total={credits?.allowance ?? null}
                loading={credits === null}
                suffix="left this cycle"
              />
              <Separator />
              <Meter
                label="Creators unlocked"
                value={unlockedProfilesCount}
                total={null}
                loading={profilesLoading}
                suffix="all time"
              />
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/billing">Manage plan</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-medium">Activity</CardTitle>
                <Link href="/notifications"
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  See all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {notifications.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">Nothing yet.</p>
              ) : (
                <ul className="-mx-2">
                  {notifications.slice(0, 6).map((n, i) => {
                    const Icon = ICONS[n.notification_type] || Bell
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!n.is_read) markAsRead(n.id)
                            if (n.action_url) router.push(n.action_url)
                          }}
                          className={cn(
                            'flex w-full items-start gap-2.5 rounded-md px-2 py-2.5 text-left',
                            'transition-colors hover:bg-muted focus-visible:outline-none',
                            'focus-visible:ring-2 focus-visible:ring-ring',
                            i > 0 && 'border-t',
                          )}
                        >
                          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className={cn('min-w-0 flex-1 text-[13px] leading-snug',
                                              n.is_read ? 'text-muted-foreground' : 'font-medium')}>
                            {n.title}
                          </span>
                          {!n.is_read && (
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Balloons ref={balloonsRef} />
    </div>
  )
}

const ICONS: Record<string, typeof Bell> = {
  credit_purchase: CreditCard,
  low_balance: AlertTriangle,
  analytics_completed: BarChart3,
  proposal_received: FileText,
  proposal_updated: FileText,
  share_received: Link2,
  team_invite: UserPlus,
}

/* ─────────────────────────────────────────────────────────────────────────────
   The hero. One card, five faces, and only ever one of them on the page.
   ───────────────────────────────────────────────────────────────────────────── */
function Hero({ kind, content, proposals, liveCount, unlocked, onGo }: {
  kind: HeroKind
  content: ContentSummary | null
  proposals: any[]
  liveCount: number
  unlocked: number
  onGo: (href: string) => void
}) {
  const faces: Record<HeroKind, {
    icon: typeof Bell; figure: React.ReactNode; title: string
    body: string; cta: string; href: string; accent?: boolean
  }> = {
    content: {
      icon: PlayCircle,
      figure: content?.awaiting_you ?? 0,
      title: `${content?.awaiting_you === 1 ? 'piece' : 'pieces'} of content waiting on you`,
      body: 'Your creators have sent work through. Nothing goes live until you have seen it.',
      cta: 'Review it now',
      href: content?.focus ? `/campaigns/${content.focus.campaign_id}/content` : '/campaigns',
      accent: true,
    },
    proposals: {
      icon: FileText,
      figure: proposals.length,
      title: `${proposals.length === 1 ? 'proposal is' : 'proposals are'} waiting for you`,
      body: 'We have put a line-up together. Have a look and tell us who you want.',
      cta: proposals.length === 1 ? 'Open the proposal' : 'See the proposals',
      href: proposals.length === 1
        ? `/proposals/${proposals[0]?.proposal?.id ?? ''}`
        : '/proposals',
      accent: true,
    },
    running: {
      icon: Megaphone,
      figure: liveCount,
      title: `${liveCount === 1 ? 'campaign' : 'campaigns'} running right now`,
      body: 'Everything is moving and nothing needs you this minute. We will tell you when it does.',
      cta: 'See your campaigns',
      href: '/campaigns',
    },
    unlocked: {
      icon: Users,
      figure: unlocked,
      title: `${unlocked === 1 ? 'creator' : 'creators'} unlocked and ready`,
      body: 'You have the analytics. The next step is turning a shortlist into a campaign.',
      cta: 'Go to your creators',
      href: '/creators',
    },
    welcome: {
      icon: Sparkles,
      figure: null,
      title: 'Welcome to Following',
      body: 'Start by finding creators worth your budget. Everything else follows from the shortlist.',
      cta: 'Find creators',
      href: '/discover',
    },
  }

  const f = faces[kind]
  const Icon = f.icon

  return (
    <Card className={cn('overflow-hidden', f.accent && 'border-primary/40')}>
      <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex min-w-0 items-start gap-5">
          <span className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            f.accent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}>
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
              {f.figure !== null && (
                <span className="mr-2 text-3xl tabular-nums sm:text-4xl">{f.figure}</span>
              )}
              {f.title}
            </p>
            <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-muted-foreground">
              {f.body}
            </p>
          </div>
        </div>
        <Button
          size="lg"
          variant={f.accent ? 'default' : 'outline'}
          className="shrink-0"
          onClick={() => onGo(f.href)}
        >
          {f.cta}<ArrowRight className="ml-2 size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Lists. Each renders nothing at all when it has nothing to say.
   ───────────────────────────────────────────────────────────────────────────── */
function ProposalList({ proposals }: { proposals: any[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Proposals waiting for you</CardTitle>
          <Link href="/proposals"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            See all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul>
          {proposals.slice(0, 4).map((p, i) => {
            const pr = p?.proposal ?? p
            return (
              <li key={pr?.id ?? i}>
                <Link href={`/proposals/${pr?.id ?? ''}`}
                      className={cn(
                        'flex items-center justify-between gap-4 rounded-md px-2 py-3',
                        'transition-colors hover:bg-muted',
                        i > 0 && 'border-t',
                      )}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{pr?.title || pr?.campaign_name || 'Proposal'}</p>
                    {pr?.deadline_at && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Reply by {new Date(pr.deadline_at).toLocaleDateString('en-GB',
                          { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

function CampaignList({ campaigns, loading }: { campaigns: any[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Campaigns running</CardTitle>
          <Link href="/campaigns"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            See all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((n) => <Skeleton key={n} className="h-12 w-full" />)}
          </div>
        ) : (
          <ul>
            {campaigns.slice(0, 5).map((c: any, i: number) => (
              <li key={c?.id ?? i}>
                <Link href={`/campaigns/${c?.id ?? ''}`}
                      className={cn(
                        'flex items-center justify-between gap-4 rounded-md px-2 py-3',
                        'transition-colors hover:bg-muted',
                        i > 0 && 'border-t',
                      )}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c?.name || 'Campaign'}</p>
                    {typeof c?.creators_count === 'number' && (
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {c.creators_count} creators
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0">Live</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/* The only place on this page that teaches rather than reports. Shown to somebody who has
   nothing running, because for them an empty dashboard is the whole experience. */
function NextSteps({ unlocked }: { unlocked: number }) {
  const steps = [
    {
      icon: Compass, title: 'Find creators',
      body: 'Search by audience, engagement and category. Unlock the ones worth a closer look.',
      href: '/discover', done: unlocked > 0,
    },
    {
      icon: Users, title: 'Build a shortlist',
      body: 'Save the ones that fit into a list you can share with your team.',
      href: '/my-lists', done: false,
    },
    {
      icon: Megaphone, title: 'Run a campaign',
      body: 'Brief them, agree the work, and track it through to posted.',
      href: '/campaigns', done: false,
    },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Getting started</CardTitle>
        <CardDescription>Three steps, in order. Most brands do the first one today.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Link href={s.href}
                    className={cn('flex items-start gap-4 rounded-md px-2 py-3 transition-colors hover:bg-muted',
                                  i > 0 && 'border-t')}>
                <span className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg',
                  s.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}>
                  <s.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/* A balance, with its bar only when there is a ceiling to draw it against. An unknown
   figure renders as a skeleton, never as a zero. */
function Meter({ label, value, total, loading, suffix }: {
  label: string; value: number | null; total: number | null
  loading: boolean; suffix: string
}) {
  const pct = value !== null && total !== null && total > 0
    ? Math.min(100, Math.round((value / total) * 100))
    : null
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        {loading || value === null
          ? <Skeleton className="h-5 w-16" />
          : <span className="text-lg font-semibold tabular-nums">{value.toLocaleString('en-AE')}</span>}
      </div>
      {pct !== null && <Progress value={pct} className="mt-2.5 h-1.5" />}
      <p className="mt-1.5 text-xs text-muted-foreground">
        {total !== null && total > 0
          ? <span className="tabular-nums">of {total.toLocaleString('en-AE')} {suffix}</span>
          : suffix}
      </p>
    </div>
  )
}
