'use client'

/**
 * The brand's home screen.
 *
 * Two columns: the work on the left, the account on the right. It opens with four coloured
 * figures, then the one thing that actually needs them, then their campaigns.
 *
 * COLOUR CARRIES MEANING HERE, which is the deliberate difference from the version before
 * this one. That one was correct and calm and read as a wireframe: every tile the same
 * weight, no colour anywhere, hierarchy from type size alone. Each figure now has its own
 * hue from the theme's chart tokens, and the tile that needs action fills with it.
 *
 * THE COLOUR RULE, so this does not rot into noise: the hue is carried by the ICON CHIP and
 * by a filled tile, never by body text. Every number and label stays `foreground` or
 * `muted-foreground`, which is what keeps contrast correct in both themes without anybody
 * having to check. The hues are `--chart-1` to `--chart-5`, so they follow the theme rather
 * than being picked here.
 *
 * NOTHING ON THIS PAGE IS INVENTED. The four figures come from one endpoint that really
 * returns them. There are no trend deltas, no "vs last period" and no sparklines, because we
 * do not store the history to compute them and a fabricated 24% is worse than no percentage.
 * When those series exist, they belong here.
 *
 * Built from shadcn as installed, with no local wrappers.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import { useDashboardData } from '@/hooks/useDashboardData'
import { useUserStore, useSubscriptionData, useTeamData } from '@/stores/userStore'
import { useCommercialAccount } from '@/hooks/useCommercialAccount'
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
  AlertTriangle, ArrowRight, ArrowUpRight, BarChart3, Bell, CheckCircle2, Compass,
  CreditCard, FileText, Link2, Lock, Megaphone, PlayCircle, Sparkles, UserPlus, Users,
} from 'lucide-react'

const PROPOSAL_WAITING = ['sent', 'in_review', 'more_requested']
type HeroKind = 'content' | 'proposals' | 'running' | 'unlocked' | 'welcome'

/* The five hues, straight from the theme. Declared once so a tile cannot invent a sixth. */
const HUE = {
  amber: 'var(--chart-5)',
  violet: 'var(--chart-3)',
  green: 'var(--chart-4)',
  blue: 'var(--chart-2)',
  brand: 'var(--chart-1)',
} as const
type Hue = keyof typeof HUE

export function BrandDashboardContent() {
  const router = useRouter()

  const {
    unlockedProfilesCount, unlockedProfiles, profilesLoading,
    activeCampaignsCount, campaigns, campaignsLoading,
    isLoading,
  } = useDashboardData()

  const subscription = useSubscriptionData()
  const team = useTeamData()
  const { isLoading: userStoreLoading, user } = useUserStore()
  const { notifications, markAsRead } = useNotifications()
  const { owns } = useCommercialAccount()

  const balloonsRef = useRef<{ launchAnimation: () => void }>(null)

  const [credits, setCredits] = useState<{ balance: number; allowance: number } | null>(null)
  useEffect(() => {
    let dead = false
    fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.credits.walletSummary}`, {
      headers: getAuthHeaders(),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (dead || !j) return
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

  const [content, setContent] = useState<ContentSummary | null>(null)
  const loadContent = useCallback(() => {
    contentBrandApi.summary().then(setContent).catch(() => setContent(null))
  }, [])
  useEffect(() => { loadContent() }, [loadContent])

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

  /* Combined followers across the creators they have unlocked. Summed only from profiles
     that actually carry a number; if none do, the line is not rendered rather than showing
     a zero that would read as "your creators reach nobody". */
  const reach = useMemo(() => {
    const list = (unlockedProfiles ?? []) as any[]
    const known = list.map((p) => Number(p?.followers_count ?? p?.followers ?? 0))
                      .filter((n) => Number.isFinite(n) && n > 0)
    return known.length ? known.reduce((a, b) => a + b, 0) : null
  }, [unlockedProfiles])

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

      <header className="flex items-center gap-4">
        <UserAvatar
          key={`dash-avatar-${JSON.stringify(user?.avatar_config) || 'default'}`}
          user={user || undefined}
          size={48}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {greeting}{displayName ? <>, {displayName}</> : null}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-GB',
              { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {tier && <Badge variant="secondary" className="shrink-0">{tier}</Badge>}
      </header>

      {/* Four figures, all of them real, each with its own hue. The first is filled when it
          is asking for something, because a request should not look like a statistic. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Figure
          hue="amber" icon={PlayCircle} label="Waiting on you"
          value={content?.awaiting_you} loading={content === null}
          sub={content?.awaiting_you ? 'Content to approve' : 'Nothing to review'}
          filled={!!content?.awaiting_you}
          href={content?.focus ? `/campaigns/${content.focus.campaign_id}/content` : '/campaigns'}
        />
        <Figure
          hue="blue" icon={Users} label="Creators working"
          value={content?.creators_working} loading={content === null}
          sub="Filming or posting" href="/campaigns"
        />
        <Figure
          hue="violet" icon={Megaphone} label="Campaigns live"
          value={content?.live_campaigns ?? activeCampaignsCount}
          loading={content === null && campaignsLoading}
          sub="Running right now" href="/campaigns"
        />
        <Figure
          hue="green" icon={CheckCircle2} label="Content approved"
          value={content?.approved} loading={content === null}
          sub="Signed off" href="/campaigns"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="flex min-w-0 flex-col gap-6">

          <Hero
            kind={hero} content={content} proposals={waitingProposals}
            liveCount={activeCampaignsCount} unlocked={unlockedProfilesCount}
            onGo={(href) => router.push(href)}
          />

          {content && content.awaiting_you > 0 && (
            <ContentAwaitingPanel focus={content?.focus ?? null} onChanged={loadContent} />
          )}

          {hero !== 'proposals' && waitingProposals.length > 0 && (
            <ProposalList proposals={waitingProposals} />
          )}

          {liveCampaigns.length > 0 && (
            <CampaignProgress campaigns={liveCampaigns} loading={campaignsLoading} />
          )}

          {(hero === 'unlocked' || hero === 'welcome') && <NextSteps unlocked={unlockedProfilesCount} />}

          <Modules owns={owns} />
        </main>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Your creators</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div>
                <div className="flex items-baseline gap-2">
                  {profilesLoading
                    ? <Skeleton className="h-7 w-14" />
                    : <span className="text-2xl font-semibold tabular-nums">
                        {unlockedProfilesCount.toLocaleString('en-AE')}
                      </span>}
                  <span className="text-xs text-muted-foreground">unlocked</span>
                </div>
                {reach !== null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="tabular-nums">{compact(reach)}</span> followers between them
                  </p>
                )}
              </div>
              <Separator />
              <Meter
                label="Credits" value={credits?.balance ?? null}
                total={credits?.allowance ?? null} loading={credits === null}
                suffix="left this cycle"
              />
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/creators">See your creators</Link>
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
  credit_purchase: CreditCard, low_balance: AlertTriangle, analytics_completed: BarChart3,
  proposal_received: FileText, proposal_updated: FileText, share_received: Link2,
  team_invite: UserPlus,
}

function compact(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`
  return String(n)
}

/* One figure. The hue lives on the icon chip, or fills the whole tile when it is asking for
   something. Never on the text, which is what keeps contrast right in both themes. */
function Figure({ hue, icon: Icon, label, value, sub, loading, href, filled }: {
  hue: Hue; icon: typeof Bell; label: string
  value: number | undefined; sub: string; loading: boolean; href: string; filled?: boolean
}) {
  const c = HUE[hue]
  return (
    <Link
      href={href}
      className={cn(
        'group relative overflow-hidden rounded-xl border p-4 transition-colors sm:p-5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        filled ? 'border-transparent' : 'bg-card hover:bg-muted/50',
      )}
      style={filled ? { background: `color-mix(in oklch, ${c} 16%, var(--card))` } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `color-mix(in oklch, ${c} 18%, transparent)`, color: c }}
        >
          <Icon className="size-[18px]" />
        </span>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      {loading
        ? <Skeleton className="mt-4 h-8 w-16" />
        : <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight">
            {value ?? '—'}
          </p>}
      <p className="mt-1 text-[13px] font-medium">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </Link>
  )
}

function Hero({ kind, content, proposals, liveCount, unlocked, onGo }: {
  kind: HeroKind; content: ContentSummary | null; proposals: any[]
  liveCount: number; unlocked: number; onGo: (href: string) => void
}) {
  const faces: Record<HeroKind, {
    icon: typeof Bell; hue: Hue; title: string; body: string
    cta: string; href: string; urgent?: boolean; art: string
  }> = {
    content: {
      art: '/modules/run.png', icon: PlayCircle, hue: 'amber',
      title: `${content?.awaiting_you} ${content?.awaiting_you === 1 ? 'piece' : 'pieces'} of content waiting on you`,
      body: 'Your creators have sent work through. Nothing goes live until you have seen it.',
      cta: 'Review it now',
      href: content?.focus ? `/campaigns/${content.focus.campaign_id}/content` : '/campaigns',
      urgent: true,
    },
    proposals: {
      art: '/modules/proposals.png', icon: FileText, hue: 'violet',
      title: `${proposals.length} ${proposals.length === 1 ? 'proposal is' : 'proposals are'} waiting for you`,
      body: 'We have put a line-up together. Have a look and tell us who you want.',
      cta: proposals.length === 1 ? 'Open the proposal' : 'See the proposals',
      href: proposals.length === 1 ? `/proposals/${proposals[0]?.proposal?.id ?? ''}` : '/proposals',
      urgent: true,
    },
    running: {
      art: '/modules/run.png', icon: Megaphone, hue: 'blue',
      title: `${liveCount} ${liveCount === 1 ? 'campaign' : 'campaigns'} running right now`,
      body: 'Everything is moving and nothing needs you this minute. We will tell you when it does.',
      cta: 'See your campaigns', href: '/campaigns',
    },
    unlocked: {
      art: '/modules/find.png', icon: Users, hue: 'blue',
      title: `${unlocked} ${unlocked === 1 ? 'creator' : 'creators'} unlocked and ready`,
      body: 'You have the analytics. The next step is turning a shortlist into a campaign.',
      cta: 'Go to your creators', href: '/creators',
    },
    welcome: {
      art: '/modules/welcome.png', icon: Sparkles, hue: 'brand',
      title: 'Welcome to Following',
      body: 'Start by finding creators worth your budget. Everything else follows from the shortlist.',
      cta: 'Find creators', href: '/discover',
    },
  }

  const f = faces[kind]
  const Icon = f.icon
  const c = HUE[f.hue]

  return (
    <div className="relative isolate overflow-hidden rounded-xl border border-transparent">
      <Image
        src={f.art} alt="" fill priority sizes="(max-width: 1024px) 100vw, 900px"
        className="-z-10 object-cover object-right"
      />
      {/* The art was generated with an empty left third on purpose. This gradient deepens
          it so the words sit on near-black at every width, including the narrow ones where
          the subject creeps leftward. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/85 to-black/25" />
      <div className="flex min-h-[210px] flex-col justify-center gap-5 p-6 sm:p-8">
        <div className="max-w-[46ch]">
          <span className="mb-4 flex size-10 items-center justify-center rounded-xl"
                style={{ background: c, color: '#000' }}>
            <Icon className="size-5" />
          </span>
          <p className="text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl">
            {f.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{f.body}</p>
        </div>
        <div>
          <Button size="lg" onClick={() => onGo(f.href)}
                  className="bg-white text-black hover:bg-white/90">
            {f.cta}<ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/* Each live campaign, with a bar ONLY when the row actually carries the numbers to draw one.
   A bar over an unknown is a picture of a guess. */
function CampaignProgress({ campaigns, loading }: { campaigns: any[]; loading: boolean }) {
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
          <div className="space-y-2">{[0, 1].map((n) => <Skeleton key={n} className="h-16 w-full" />)}</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {campaigns.slice(0, 4).map((c: any, i: number) => {
              const done = Number(c?.completed_deliverables ?? c?.posts_live ?? NaN)
              const total = Number(c?.total_deliverables ?? NaN)
              const pct = Number.isFinite(done) && Number.isFinite(total) && total > 0
                ? Math.min(100, Math.round((done / total) * 100))
                : null
              const hue = HUE[(['violet', 'blue', 'green', 'amber'] as Hue[])[i % 4]]
              return (
                <Link key={c?.id ?? i} href={`/campaigns/${c?.id ?? ''}`}
                      className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium">{c?.name || 'Campaign'}</p>
                    <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: hue }} />
                  </div>
                  {typeof c?.creators_count === 'number' && (
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                      {c.creators_count} creators
                    </p>
                  )}
                  {pct !== null && (
                    <>
                      <Progress value={pct} className="mt-3 h-1.5" />
                      <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
                        {done} of {total} delivered
                      </p>
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* Every module, owned or not.
 *
 * Showing only what an account already has was the wrong call: this is the one place in the
 * product where a client can see what they are NOT on, and hiding it removes the only
 * upsell surface we have. What they hold opens; what they do not is dimmed, carries a lock,
 * and says what it would do for them.
 *
 * The artwork is the same series across all four, each generated with an empty left third
 * for exactly this overlay.
 */
const MODULES = [
  { key: 'find', name: 'Find', art: '/modules/find.png',
    owned: 'Search, analyse and unlock creators',
    pitch: 'Measured analytics on every creator, not follower counts',
    href: '/discover', hue: 'blue' as Hue },
  { key: 'run', name: 'Run', art: '/modules/run.png',
    owned: 'Brief creators and run it to delivery',
    pitch: 'Post a brief, take priced offers back, track it to posted',
    href: '/run', hue: 'violet' as Hue },
  { key: 'mor', name: 'Merchant of Record', art: '/modules/mor.png',
    owned: 'We contract and pay your creators',
    pitch: 'One invoice instead of forty. You pay us, we pay them',
    href: '/mor', hue: 'green' as Hue },
  { key: 'manage', name: 'Manage', art: '/modules/manage.png',
    owned: 'Your account team runs the campaign',
    pitch: 'We source, negotiate and run it. You watch it happen',
    href: '/campaigns', hue: 'brand' as Hue },
]

function Modules({ owns }: { owns: Record<string, boolean> }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">What Following can do for you</h2>
        <Link href="/pricing"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          See plans
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {MODULES.map((m) => {
          const has = !!owns?.[m.key]
          return (
            <Link
              key={m.key}
              href={has ? m.href : '/pricing'}
              className={cn(
                'group relative isolate overflow-hidden rounded-xl border border-transparent',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <Image
                src={m.art} alt="" fill sizes="(max-width: 640px) 100vw, 440px"
                className={cn(
                  '-z-10 object-cover object-right transition-[transform,filter] duration-500',
                  'group-hover:scale-[1.03]',
                  !has && 'grayscale',
                )}
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/80 to-black/30" />
              <div className="flex min-h-[148px] flex-col justify-between gap-4 p-5">
                <div className="max-w-[30ch]">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full"
                          style={{ background: has ? HUE[m.hue] : 'rgba(255,255,255,0.35)' }} />
                    <p className="text-[15px] font-semibold tracking-tight text-white">{m.name}</p>
                    {!has && <Lock className="size-3 text-white/45" aria-hidden />}
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">
                    {has ? m.owned : m.pitch}
                  </p>
                </div>
                <span className={cn(
                  'inline-flex items-center gap-1.5 text-[12.5px] font-medium',
                  has ? 'text-white' : 'text-white/70',
                )}>
                  {has ? 'Open' : 'Add it'}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

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
                      className={cn('flex items-center justify-between gap-4 rounded-md px-2 py-3',
                                    'transition-colors hover:bg-muted', i > 0 && 'border-t')}>
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

function NextSteps({ unlocked }: { unlocked: number }) {
  const steps = [
    { icon: Compass, hue: 'blue' as Hue, title: 'Find creators',
      body: 'Search by audience, engagement and category. Unlock the ones worth a closer look.',
      href: '/discover', done: unlocked > 0 },
    { icon: Users, hue: 'violet' as Hue, title: 'Build a shortlist',
      body: 'Save the ones that fit into a list you can share with your team.',
      href: '/my-lists', done: false },
    { icon: Megaphone, hue: 'green' as Hue, title: 'Run a campaign',
      body: 'Brief them, agree the work, and track it through to posted.',
      href: '/campaigns', done: false },
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
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `color-mix(in oklch, ${HUE[s.hue]} 18%, transparent)`,
                               color: HUE[s.hue] }}>
                  <s.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {s.title}
                    {s.done && <span className="ml-2 text-xs font-normal text-muted-foreground">Done</span>}
                  </p>
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

function Meter({ label, value, total, loading, suffix }: {
  label: string; value: number | null; total: number | null; loading: boolean; suffix: string
}) {
  const pct = value !== null && total !== null && total > 0
    ? Math.min(100, Math.round((value / total) * 100)) : null
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
