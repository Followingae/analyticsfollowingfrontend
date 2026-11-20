'use client'

/**
 * Home, for a brand, in the merchant home's language (founder, 20 Nov 2026: "I like the new
 * dashboard you created for the Partner Lead trial, can we have similar for our ACTUAL
 * platform"). Whitespace, a cloud, icons, almost no words.
 *
 * The cloud says the ONE thing that matters right now, in this order of who is waiting on
 * whom: a proposal or quote waiting on them, content waiting for their approval, results in
 * from a campaign that just finished, a campaign running, or nothing pending (find
 * creators). Under it, four bold tiles with one number each, every one a door, and a slim
 * Inflink card for posting a creator RFP. A number we could not load is a dash, never a
 * confident zero.
 *
 * `?scene=quote|content|report|live|quiet` (only with `?home=new`) renders the cloud with
 * sample values, so each state can be reviewed on one account before this ships.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, FileText, Megaphone, PlayCircle, Users, Sparkles, Search, Crown, BarChart3, Send, Wallet, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tile, LIME, FOREST, greetingWord } from '@/components/merchant/bits'
import { ShellHeader } from '@/components/merchant/MerchantShell'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useUserStore, useSubscriptionData, useTeamData } from '@/stores/userStore'
import { planTierLabel } from '@/lib/plan-tier'
import { brandProposalViewApi } from '@/services/adminProposalMasterApi'
import { contentBrandApi, type ContentSummary } from '@/services/contentDeliveryApi'
import { campaignApi, type Campaign } from '@/services/campaignApiComplete'
import { inflinkApi, type RfpSummary } from '@/services/inflinkApi'
import { brandPoolApi } from '@/services/faAdminApi'
import { OpenQuotesCard } from '@/components/brand/OpenQuotesCard'

type Waiting = { id: string; title: string; cover?: string | null; quote: boolean; creators?: number | null }
type Hero = { icon: typeof Users; title: string; line: string; cta: string; href: string; cover?: string | null
              stats?: { value: string; label: string }[]; soon?: string }
type Scene = 'quote' | 'content' | 'report' | 'live' | 'quiet' | 'multi'
const WAITING = ['sent', 'in_review', 'more_requested']
const DASH = '–'
const RECENT_DAYS = 30

const compact = (n?: number | null) =>
  n == null ? DASH : Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

export function BrandHome() {
  const { user } = useUserStore()
  const team = useTeamData()
  const subscription = useSubscriptionData()
  const { unlockedProfilesCount, profilesError, profilesLoading, activeCampaignsCount, campaignsError, campaignsLoading,
          teamsOverview } = useDashboardData()

  const [waiting, setWaiting] = useState<Waiting | null>(null)
  const [pending, setPending] = useState<number | null>(null)
  const [content, setContent] = useState<ContentSummary | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null)
  const [rfps, setRfps] = useState<RfpSummary[] | null>(null)
  const [loaded, setLoaded] = useState({ proposals: false, content: false, campaigns: false })
  const [scene, setScene] = useState<Scene | null>(null)
  /* The cashback pool, for brands that fund one. Only a low or empty pool is shown; a
     failed read shows nothing here rather than a frightening zero. */
  const [pool, setPool] = useState<{ available: number; funded: number } | null>(null)

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('scene')
    if (s && ['quote', 'content', 'report', 'live', 'quiet', 'multi'].includes(s)) setScene(s as Scene)

    brandProposalViewApi.listProposals({ limit: 50 })
      .then(r => {
        // The list endpoint returns flat summaries, not the detail shape the type names.
        type Row = { id: string; title: string; status: string; created_at: string; cover_image_url?: string | null
                     total_budget?: number | null; total_influencers?: number | null }
        const open = ((r.proposals || []) as unknown as Row[]).filter(p => WAITING.includes(p.status))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setPending(r.pending_count ?? open.length)
        const p = open[0]
        if (p) setWaiting({ id: p.id, title: p.title, cover: p.cover_image_url, quote: !p.total_budget,
                            creators: p.total_influencers ?? null })
      })
      .catch(() => setPending(null))
      .finally(() => setLoaded(l => ({ ...l, proposals: true })))
    contentBrandApi.summary()
      .then(setContent)
      .catch(() => setContent(null))
      .finally(() => setLoaded(l => ({ ...l, content: true })))
    campaignApi.listCampaigns({ limit: 50 })
      .then(r => setCampaigns(r?.data?.campaigns ?? []))
      .catch(() => setCampaigns(null))
      .finally(() => setLoaded(l => ({ ...l, campaigns: true })))
    brandPoolApi.balance().then((res: any) => {
      const d = res?.success ? res.data : null
      if (d) setPool({ available: d.available_aed ?? (d.available_cents ? d.available_cents / 100 : 0),
                       funded: d.total_funded_aed ?? (d.total_funded_cents ? d.total_funded_cents / 100 : 0) })
    }).catch(() => setPool(null))
    inflinkApi.listRfps()
      .then(r => setRfps(r.items))
      .catch(() => setRfps(null))
  }, [])

  const company = user?.company || teamsOverview?.team_info?.name || user?.first_name || ''
  const tier = planTierLabel(team?.subscription_tier || subscription?.tier || teamsOverview?.team_info?.subscription_tier)
  const awaiting = content?.awaiting_you ?? null
  const live = content?.live_campaigns ?? (campaignsError ? null : activeCampaignsCount)
  const ready = loaded.proposals && loaded.content && loaded.campaigns

  const running = (campaigns ?? []).filter(c => c.status === 'active')
    .sort((a, b) => (b.posts_count || 0) - (a.posts_count || 0))[0]
  const finished = (campaigns ?? []).filter(c => c.status === 'completed'
      && Date.now() - new Date(c.updated_at || c.end_date || c.created_at).getTime() < RECENT_DAYS * 86_400_000)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]

  /* Everything waiting, most urgent first; the top shows up to three. */
  const QUIET: Hero = {
    icon: Sparkles, title: "You're all caught up", line: 'Post a brief and UAE creators send you their quotes.',
    cta: 'Post a brief', href: '/inflink/new', soon: 'Discover, coming soon',
  }
  const pendingList: Hero[] = []
  if (waiting) pendingList.push({
    icon: FileText, title: waiting.quote ? 'Your quote is ready' : 'Your proposal is ready',
    line: waiting.creators ? `${waiting.title} · ${waiting.creators} creators` : waiting.title,
    cta: 'Review', href: `/proposals/${waiting.id}`, cover: waiting.cover })
  if (awaiting && awaiting > 0 && content?.focus) pendingList.push({
    icon: PlayCircle, title: `${awaiting} to approve`, line: content.focus.campaign_name,
    cta: 'Review content', href: `/campaigns/${content.focus.campaign_id}/content` })
  if (finished) pendingList.push({
    icon: BarChart3, title: 'Your results are in', line: finished.name,
    cta: 'See results', href: `/campaigns/${finished.id}`,
    stats: [{ value: compact(finished.total_reach), label: 'reach' }, { value: compact(finished.posts_count), label: 'posts' },
            { value: compact(finished.creators_count), label: 'creators' }] })
  if (running) pendingList.push({
    icon: Megaphone, title: `${running.name} is live`, line: 'Results update as creators post.',
    cta: 'Open campaign', href: `/campaigns/${running.id}`,
    stats: [{ value: compact(running.creators_count), label: 'creators' }, { value: compact(running.posts_count), label: 'posts so far' },
            { value: compact(running.total_reach), label: 'reach' }] })
  const real: Hero[] | null = !ready ? null : pendingList.length ? pendingList.slice(0, 3) : [QUIET]

  /* Review-only samples, one per state. Never shown without ?home=new&scene=. */
  const SAMPLE: Record<Exclude<Scene, 'multi'>, Hero> = {
    quote: { icon: FileText, title: 'Your quote is ready', line: 'Ramadan 2027 · 14 creators', cta: 'Review', href: '/proposals' },
    content: { icon: PlayCircle, title: '6 to approve', line: 'Summer Launch 2026', cta: 'Review content', href: '/campaigns' },
    report: { icon: BarChart3, title: 'Your results are in', line: 'National Day 2026', cta: 'See results', href: '/campaigns',
              stats: [{ value: '2.4M', label: 'reach' }, { value: '38', label: 'posts' }, { value: '12', label: 'creators' }] },
    live: { icon: Megaphone, title: 'Summer Launch 2026 is live', line: 'Results update as creators post.', cta: 'Open campaign',
            href: '/campaigns', stats: [{ value: '12', label: 'creators' }, { value: '21', label: 'posts so far' }, { value: '860K', label: 'reach' }] },
    quiet: { icon: Sparkles, title: "You're all caught up", line: 'Post a brief and UAE creators send you their quotes.', cta: 'Post a brief', href: '/inflink/new', soon: 'Discover, coming soon' },
  }
  const heroes: Hero[] | null = scene === 'multi' ? [SAMPLE.quote, SAMPLE.content, SAMPLE.live]
    : scene ? [SAMPLE[scene]] : real
  const quietOnly = !!heroes && heroes.length === 1 && !!heroes[0].soon

  const liveRfps = (rfps ?? []).filter(r => r.status === 'live')
  const rfpQuotes = liveRfps.reduce((s, r) => s + (r.quotes_count || 0), 0)

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <ShellHeader
        lead={`${greetingWord()},`}
        accent={company || 'welcome back'}
        right={tier ? (
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full border bg-card px-3.5 text-[13px] font-medium">
            <Crown className="size-3.5" strokeWidth={1.75} />{tier}
          </span>
        ) : null}
      />

      <PoolStrip pool={pool} />

      <section aria-label="Right now" className="flex min-h-0 flex-1 flex-col gap-4">
        {/* The cloud: one card, or up to three when several things are waiting. */}
        {!heroes ? (
          <Tile className="min-h-[44dvh] flex-[3] items-center justify-center border-0 bg-card">
            <div className="size-24 animate-pulse rounded-full bg-muted" />
          </Tile>
        ) : heroes.length === 1 ? (
          <HeroCard hero={heroes[0]} size="lg" className="min-h-[44dvh] flex-[3]" />
        ) : heroes.length === 2 ? (
          <div className="grid min-h-[44dvh] flex-[3] grid-cols-1 gap-4 md:grid-cols-2">
            <HeroCard hero={heroes[0]} size="md" />
            <HeroCard hero={heroes[1]} size="md" />
          </div>
        ) : (
          <div className="grid min-h-[44dvh] flex-[3] grid-cols-1 gap-4 md:grid-cols-[1.35fr_1fr] md:grid-rows-2">
            <HeroCard hero={heroes[0]} size="md" className="md:row-span-2" />
            <HeroCard hero={heroes[1]} size="sm" />
            <HeroCard hero={heroes[2]} size="sm" />
          </div>
        )}

        {/* Four bold numbers, each a door */}
        <div className="grid flex-[2] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact href="/proposals" icon={FileText} tone="lime" label="waiting on you"
                value={!loaded.proposals ? null : pending == null ? DASH : String(pending)} />
          <Fact href="/campaigns" icon={Megaphone} tone="mist" label="live campaigns"
                value={campaignsLoading && !content ? null : live == null ? DASH : String(live)} />
          <Fact href={content?.focus ? `/campaigns/${content.focus.campaign_id}/content` : '/campaigns'}
                icon={PlayCircle} tone="forest" label="content to approve"
                value={!loaded.content ? null : awaiting == null ? DASH : String(awaiting)} />
          <Fact href="/creators" icon={Users} tone="paper" label="creators unlocked"
                value={profilesLoading ? null : profilesError ? DASH : String(unlockedProfilesCount ?? DASH)} />
        </div>

        {/* Inflink: post a brief, creators quote you. Not repeated when the cloud already says it. */}
        {!(quietOnly && !liveRfps.length) && <Link href={liveRfps.length ? '/inflink' : '/inflink/new'}
              className="group flex flex-wrap items-center gap-4 rounded-[20px] border bg-card p-4 pr-5 transition-colors hover:border-foreground/30">
          <span className={cn('inline-flex size-12 shrink-0 items-center justify-center rounded-full', LIME)}>
            <Send className="size-5" strokeWidth={1.75} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] font-semibold tracking-[-0.01em]">Creator RFP <span className="font-normal text-muted-foreground">on Inflink</span></span>
            <span className="text-[13px] text-muted-foreground">
              {liveRfps.length
                ? `${rfpQuotes} quote${rfpQuotes === 1 ? '' : 's'} in on ${liveRfps.length} live brief${liveRfps.length === 1 ? '' : 's'}`
                : 'Post a brief. UAE creators send you their quotes.'}
            </span>
          </span>
          <span className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity group-hover:opacity-90">
            {liveRfps.length ? 'See quotes' : 'Post a brief'}<ArrowRight className="size-4" strokeWidth={2} />
          </span>
        </Link>}
        <OpenQuotesCard />
      </section>
    </div>
  )
}

function PoolStrip({ pool }: { pool: { available: number; funded: number } | null }) {
  if (!pool || pool.funded <= 0) return null
  const pct = (pool.available / pool.funded) * 100
  if (pct >= 20) return null
  const empty = pool.available <= 0
  const money = `AED ${Math.round(pool.available).toLocaleString()}`
  const title = empty ? 'Your cashback pool is empty' : pct < 5 ? `Cashback pool critically low, ${money} left` : `Cashback pool running low, ${money} left`
  return (
    <Link href="/cashback-pool/topup"
          className={cn('flex flex-wrap items-center gap-3 rounded-[20px] border p-4 pr-5 transition-colors',
                        pct < 5 ? 'border-destructive/40 bg-destructive/5' : 'bg-card hover:border-foreground/30')}>
      <span className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-full', pct < 5 ? 'bg-destructive/10 text-destructive' : 'bg-muted')}>
        {pct < 5 ? <AlertTriangle className="size-5" strokeWidth={1.75} /> : <Wallet className="size-5" strokeWidth={1.75} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{title}</span>
        {pct < 5 && <span className="text-[13px] text-muted-foreground">Campaigns cannot pay cashback until it is topped up.</span>}
      </span>
      <span className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background">
        Top up<ArrowRight className="size-4" strokeWidth={2} />
      </span>
    </Link>
  )
}

function HeroCard({ hero, size, className }: { hero: Hero; size: 'lg' | 'md' | 'sm'; className?: string }) {
  const sm = size === 'sm'
  return (
    <Tile className={cn('relative items-center justify-center overflow-hidden border-0 bg-card p-0 shadow-[0_1px_0_rgba(0,0,0,0.03)]',
                        sm ? 'min-h-[200px]' : 'min-h-[300px]', className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className={cn('absolute -left-24 -top-28 rounded-full bg-[oklch(0.9354_0.2254_121.5)]/35 blur-3xl', sm ? 'size-[16rem]' : 'size-[28rem]')} />
        <span className={cn('absolute -bottom-32 right-[-6rem] rounded-full bg-primary/25 blur-3xl', sm ? 'size-[18rem]' : 'size-[30rem]')} />
        <span className="absolute left-1/2 top-1/2 size-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/70 blur-2xl" />
      </div>
      <div className={cn('relative flex flex-col items-center px-6 text-center', sm ? 'gap-3 py-5' : 'gap-6 py-8')}>
        {hero.cover && !sm ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.cover} alt="" className="h-28 w-48 rounded-[22px] object-cover shadow-[0_18px_50px_-24px_rgba(0,0,0,0.45)] ring-4 ring-card" />
        ) : (
          <span className={cn('relative inline-flex items-center justify-center rounded-full bg-card shadow-[0_18px_50px_-24px_rgba(0,0,0,0.35)] ring-1 ring-border', sm ? 'size-14' : 'size-24')}>
            <span className={cn('inline-flex items-center justify-center rounded-full', LIME, sm ? 'size-10' : 'size-16')}>
              <hero.icon className={sm ? 'size-5' : 'size-7'} strokeWidth={1.6} />
            </span>
            {!sm && (
              <span className="absolute -right-1 -top-1 inline-flex size-8 items-center justify-center rounded-full bg-card text-foreground shadow-sm ring-1 ring-border">
                <Sparkles className="size-3.5" strokeWidth={2} />
              </span>
            )}
          </span>
        )}
        <div className="flex flex-col items-center gap-1.5">
          <h2 className={cn('m-0 font-medium leading-none tracking-[-0.03em]', sm ? 'text-[22px]' : size === 'md' ? 'text-[28px]' : 'text-[30px] sm:text-[36px]')}>{hero.title}</h2>
          <p className="m-0 max-w-md text-sm text-muted-foreground">{hero.line}</p>
        </div>
        {hero.stats && !sm && (
          <div className="flex items-center gap-8">
            {hero.stats.map(st => (
              <div key={st.label} className="flex flex-col items-center">
                <span className="text-[26px] font-medium leading-none tracking-[-0.03em] tabular-nums">{st.value}</span>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{st.label}</span>
              </div>
            ))}
          </div>
        )}
        <Link href={hero.href}
              className={cn('inline-flex items-center gap-2 rounded-full bg-foreground font-medium text-background shadow-[0_14px_30px_-16px_rgba(0,0,0,0.5)] transition-opacity hover:opacity-90',
                            sm ? 'h-10 px-5 text-[13px]' : 'h-12 px-6 text-sm')}>
          {hero.cta}<ArrowRight className="size-4" strokeWidth={2} />
        </Link>
        {hero.soon && (
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/70 px-3 py-1 text-[12px] text-muted-foreground">
            <Search className="size-3" strokeWidth={2} />{hero.soon}
          </span>
        )}
      </div>
    </Tile>
  )
}

const TONE: Record<'lime' | 'mist' | 'paper' | 'forest', { tile: string; disc: string; label: string }> = {
  lime: { tile: cn(LIME, 'border-0'), disc: 'bg-[oklch(0.2_0.03_140)]/10', label: 'opacity-70' },
  mist: { tile: 'border-0 bg-primary/20 text-foreground', disc: 'bg-card/70', label: 'text-foreground/70' },
  paper: { tile: 'bg-card', disc: 'bg-muted', label: 'text-muted-foreground' },
  forest: { tile: cn(FOREST, 'border-0'), disc: 'bg-white/10', label: 'opacity-70' },
}

function Fact({ href, icon: Icon, value, label, tone }: {
  href: string; icon: typeof Users; value: string | null; label: string; tone: keyof typeof TONE
}) {
  const t = TONE[tone]
  return (
    <Link href={href} className="group rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Tile as="div" className={cn('h-full min-h-[150px] justify-between gap-5 p-6 transition-transform group-hover:-translate-y-0.5', t.tile)}>
        <div className="flex items-center justify-between">
          <span className={cn('inline-flex size-11 items-center justify-center rounded-full', t.disc)}>
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
          <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-60" strokeWidth={2} />
        </div>
        <div className="flex flex-col gap-1">
          {value == null
            ? <span className="h-[52px] w-16 animate-pulse rounded-xl bg-current/10" />
            : <span className="text-[52px] font-medium leading-none tracking-[-0.04em] tabular-nums sm:text-[56px]">{value}</span>}
          <span className={cn('text-[12px] font-semibold uppercase tracking-[0.1em]', t.label)}>{label}</span>
        </div>
      </Tile>
    </Link>
  )
}
