'use client'

/**
 * A client's campaign, as a place rather than a report.
 *
 * The analytics page answers "how did it do", which is the right question only once things
 * have been posted. For the weeks before that — and they are weeks — the client is asking
 * something much simpler: where is my campaign, and is anything happening. Answering that
 * badly is how an agency ends up on a "just checking in" email every Tuesday.
 *
 * So the centrepiece is a single live status, said in a sentence, with the campaign's own
 * steps behind it. Underneath, every creator carries their own state, because a campaign is
 * never uniformly anywhere: two products have landed, one is with the courier, one creator
 * has already filmed. The page has to be able to say that without apologising for it.
 *
 * Nothing here is editable. The team moves the campaign; the client watches it move.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  Camera, CheckCircle2, ChevronRight, Clock, Eye, ExternalLink, FileText, Loader2,
  MapPin, PackageCheck, PartyPopper, Sparkles, Truck, UserCheck, Users, BarChart3,
  type LucideIcon,
} from 'lucide-react'
import { Cell, Pie, PieChart } from 'recharts'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cdnAvatar } from '@/lib/avatar'
import { cn } from '@/lib/utils'

// ── shapes ────────────────────────────────────────────────────────────────────────────────

type Step = { key: string; label: string; icon?: string; done: boolean; active: boolean; count?: number; of?: number }

type Creator = {
  id: string
  username?: string | null
  full_name?: string | null
  avatar?: string | null
  followers_count?: number | null
  engagement_rate?: number | null
  state: string
  state_label: string
  state_blurb: string
  progress: number
  steps: Step[]
  deliverables: any[]
  dispatched_at?: string | null
  received_at?: string | null
  dispatch_ref?: string | null
  content_due?: string | null
  posted_url?: string | null
  posted_at?: string | null
  visit_date?: string | null
  visit_time?: string | null
}

type Journey = {
  campaign: {
    id: string; name: string; brand_name?: string | null; status?: string | null
    description?: string | null; objective?: string | null
    hero_image_url?: string | null; brand_logo_url?: string | null
    start_date?: string | null; end_date?: string | null
    campaign_type?: string | null; fulfilment_mode?: string | null
    visit_location?: string | null; agreed_total_aed?: number | null
    confirmed_at?: string | null
  }
  overall: { key: string; headline: string; sub: string; steps: Step[] }
  counts: Record<string, any>
  needs_product: boolean
  dine_in: boolean
  creators: Creator[]
  timeline: { at: string; text: string; username?: string; avatar?: string | null }[]
}

// ── the vocabulary, kept in one place ─────────────────────────────────────────────────────

const ICONS: Record<string, LucideIcon> = {
  UserCheck, FileText, PackageCheck, Camera, Eye, Sparkles, PartyPopper, Truck,
}

/** Per-creator state → the icon and the wash behind it. Colour is state, never decoration. */
const STATE_STYLE: Record<string, { icon: LucideIcon; wash: string; dot: string }> = {
  confirmed:        { icon: UserCheck,    wash: 'bg-muted',                              dot: 'bg-neutral-400' },
  briefed:          { icon: FileText,     wash: 'bg-sky-50 dark:bg-sky-950/40',          dot: 'bg-sky-500' },
  product_ready:    { icon: PackageCheck, wash: 'bg-amber-50 dark:bg-amber-950/40',      dot: 'bg-amber-500' },
  dispatched:       { icon: Truck,        wash: 'bg-amber-50 dark:bg-amber-950/40',      dot: 'bg-amber-500' },
  received:         { icon: Camera,       wash: 'bg-violet-50 dark:bg-violet-950/40',    dot: 'bg-violet-500' },
  content_in:       { icon: Eye,          wash: 'bg-violet-50 dark:bg-violet-950/40',    dot: 'bg-violet-500' },
  content_approved: { icon: CheckCircle2, wash: 'bg-emerald-50 dark:bg-emerald-950/40',  dot: 'bg-emerald-500' },
  live:             { icon: Sparkles,     wash: 'bg-emerald-50 dark:bg-emerald-950/40',  dot: 'bg-emerald-500' },
}

const compact = (n?: number | null) =>
  n == null ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`

const when = (iso?: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const ago = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`
  const days = Math.round(mins / 1440)
  return days === 1 ? 'Yesterday' : `${days}d ago`
}

// ── the centrepiece ───────────────────────────────────────────────────────────────────────

/**
 * The one thing on the page that has to land in a second: where the campaign is.
 *
 * The icon breathes rather than spins — this sits on a screen somebody leaves open, and a
 * spinner reads as "loading" no matter what it is next to.
 */
function HeroStatus({ overall, needsProduct }: { overall: Journey['overall']; needsProduct: boolean }) {
  const active = overall.steps.find(s => s.active) || overall.steps[0]
  const Icon = ICONS[active?.icon || 'UserCheck'] || UserCheck
  const done = overall.steps.filter(s => s.done).length
  const pct = Math.round(((done + 0.5) / Math.max(overall.steps.length, 1)) * 100)

  return (
    <Card className="overflow-hidden border-border/70 bg-card">
      <CardContent className="p-6 sm:p-9">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="relative"
          >
            {/* Two rings, drifting outward on a long loop. Movement without urgency. */}
            {[0, 1].map(i => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute inset-0 rounded-full bg-primary/15"
                animate={{ scale: [1, 1.45, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 4.5, repeat: Infinity, delay: i * 2.2, ease: 'easeInOut' }}
              />
            ))}
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/12 text-primary sm:h-24 sm:w-24">
              <Icon className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={1.6} />
            </span>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={overall.headline}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.32 }}
              className="mt-6"
            >
              <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-[32px] sm:leading-tight">
                {overall.headline}
              </h2>
              <p className="mt-2 text-[15px] text-muted-foreground">{overall.sub}</p>
            </motion.div>
          </AnimatePresence>

          {/* The line the campaign is travelling along. */}
          <div className="mt-8 w-full">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
            </div>
            <div className={cn('mt-5 grid gap-3', needsProduct ? 'grid-cols-4 sm:grid-cols-7' : 'grid-cols-3 sm:grid-cols-6')}>
              {overall.steps.map((s, i) => {
                const StepIcon = ICONS[s.icon || 'UserCheck'] || UserCheck
                return (
                  <motion.div
                    key={s.key}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * i, duration: 0.3 }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                      s.done && 'border-transparent bg-primary/15 text-primary',
                      s.active && 'border-primary bg-primary text-primary-foreground shadow-sm',
                      !s.done && !s.active && 'border-border bg-background text-muted-foreground/60',
                    )}>
                      {s.done ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" strokeWidth={1.7} />}
                    </span>
                    <span className={cn(
                      'text-[11.5px] leading-tight',
                      s.active ? 'font-medium text-foreground' : 'text-muted-foreground',
                    )}>
                      {s.label}
                    </span>
                    {!!s.of && (s.done || s.active) && (
                      <span className="text-[11px] tabular-nums text-muted-foreground/70">{s.count}/{s.of}</span>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── the small numbers ─────────────────────────────────────────────────────────────────────

function Tile({ label, value, sub, icon: Icon }: {
  label: string; value: string | number; sub?: string; icon: LucideIcon
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground/60" strokeWidth={1.7} />
        </div>
        <div className="mt-3 text-[28px] font-semibold leading-none tabular-nums">{value}</div>
        {sub && <div className="mt-1.5 text-[13px] text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  )
}

// ── one creator ───────────────────────────────────────────────────────────────────────────

function CreatorCard({ c, onOpen }: { c: Creator; onOpen: () => void }) {
  const style = STATE_STYLE[c.state] || STATE_STYLE.confirmed
  const Icon = style.icon
  return (
    <motion.button
      layout
      onClick={onOpen}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group w-full rounded-2xl border border-border/70 bg-card p-5 text-left transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3.5">
        <Avatar className="h-12 w-12 rounded-xl">
          <AvatarImage src={cdnAvatar(c.avatar) || undefined} alt={c.username || ''} className="object-cover" />
          <AvatarFallback className="rounded-xl text-sm">
            {(c.username || '?').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">@{c.username}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
            {compact(c.followers_count)} followers
          </div>
        </div>
      </div>

      <div className={cn('mt-4 flex items-center gap-2 rounded-xl px-3 py-2', style.wash)}>
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
        <span className="text-[13.5px] font-medium">{c.state_label}</span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(c.progress * 100)}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </motion.button>
  )
}

function CreatorSheet({ c, open, onClose }: { c: Creator | null; open: boolean; onClose: () => void }) {
  if (!c) return null
  return (
    <Sheet open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="space-y-0 text-left">
          <div className="flex items-center gap-3.5">
            <Avatar className="h-14 w-14 rounded-xl">
              <AvatarImage src={cdnAvatar(c.avatar) || undefined} alt={c.username || ''} className="object-cover" />
              <AvatarFallback className="rounded-xl">{(c.username || '?').slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-lg">@{c.username}</SheetTitle>
              <p className="text-[13px] text-muted-foreground">
                {c.full_name ? `${c.full_name} · ` : ''}{compact(c.followers_count)} followers
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 px-4 pb-8">
          <div className={cn('rounded-2xl p-4', (STATE_STYLE[c.state] || STATE_STYLE.confirmed).wash)}>
            <div className="text-[15px] font-medium">{c.state_label}</div>
            <p className="mt-1 text-[13.5px] text-muted-foreground">{c.state_blurb}</p>
          </div>

          {!!c.deliverables?.length && (
            <div className="mt-6">
              <div className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Making</div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {c.deliverables.map((d: any, i: number) => (
                  <Badge key={i} variant="secondary" className="rounded-full font-normal">
                    {typeof d === 'string' ? d : `${d.quantity && d.quantity > 1 ? `${d.quantity} × ` : ''}${d.type || d.label || 'Deliverable'}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Their steps</div>
            <ol className="mt-3 space-y-0">
              {c.steps.map((s, i) => (
                <li key={s.key} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full border text-[11px]',
                      s.done && 'border-transparent bg-primary/15 text-primary',
                      s.active && 'border-primary bg-primary text-primary-foreground',
                      !s.done && !s.active && 'border-border text-muted-foreground/50',
                    )}>
                      {s.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    {i < c.steps.length - 1 && (
                      <span className={cn('w-px flex-1', s.done ? 'bg-primary/30' : 'bg-border')} />
                    )}
                  </div>
                  <div className="pb-5 pt-1">
                    <div className={cn('text-[14px]', s.active ? 'font-medium' : s.done ? '' : 'text-muted-foreground')}>
                      {s.label}
                    </div>
                    {s.key === 'dispatched' && c.dispatched_at && (
                      <div className="text-[12.5px] text-muted-foreground">
                        {when(c.dispatched_at)}{c.dispatch_ref ? ` · ${c.dispatch_ref}` : ''}
                      </div>
                    )}
                    {s.key === 'received' && c.received_at && (
                      <div className="text-[12.5px] text-muted-foreground">{when(c.received_at)}</div>
                    )}
                    {s.key === 'live' && c.posted_at && (
                      <div className="text-[12.5px] text-muted-foreground">{when(c.posted_at)}</div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {c.visit_date && (
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-muted px-3.5 py-3 text-[13.5px]">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Visiting {when(c.visit_date)}{c.visit_time ? ` at ${String(c.visit_time).slice(0, 5)}` : ''}
            </div>
          )}

          {c.posted_url && (
            <Button asChild className="mt-6 w-full rounded-xl">
              <a href={c.posted_url} target="_blank" rel="noreferrer">
                See the post <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── the page ──────────────────────────────────────────────────────────────────────────────

const DELIVERY_CHART: ChartConfig = {
  received: { label: 'Received', color: 'var(--primary)' },
  sent:     { label: 'On its way', color: 'oklch(0.78 0.13 85)' },
  waiting:  { label: 'Not yet sent', color: 'var(--muted)' },
}

export function CampaignJourney({ campaignId }: { campaignId: string }) {
  const [data, setData] = useState<Journey | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [openCreator, setOpenCreator] = useState<Creator | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/campaigns/${campaignId}/journey`)
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.detail || 'Could not load this campaign')
      setData(j.data)
      setErr(null)
    } catch (e: any) {
      setErr(e?.message || 'Could not load this campaign')
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => { load() }, [load])

  const delivery = useMemo(() => {
    if (!data?.needs_product) return []
    const total = data.counts.creators || 0
    const received = data.counts.received || 0
    const sent = Math.max((data.counts.dispatched || 0) - received, 0)
    return [
      { key: 'received', label: 'Received', value: received, fill: 'var(--color-received)' },
      { key: 'sent', label: 'On its way', value: sent, fill: 'var(--color-sent)' },
      { key: 'waiting', label: 'Not yet sent', value: Math.max(total - received - sent, 0), fill: 'var(--color-waiting)' },
    ].filter(d => d.value > 0)
  }, [data])

  if (loading) {
    return (
      <div className="space-y-5 p-4 md:p-8">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (err || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-muted-foreground">{err || 'Nothing to show yet'}</p>
        <Button variant="outline" onClick={() => { setLoading(true); load() }}>Try again</Button>
      </div>
    )
  }

  const { campaign, overall, counts, creators, timeline } = data

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-16 md:p-8">
      {/* The campaign's own picture, carried through from the proposal it came from. */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card">
        {campaign.hero_image_url ? (
          <div className="relative h-44 w-full sm:h-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={campaign.hero_image_url} alt={campaign.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-white/70">
                {campaign.brand_name || 'Your campaign'}
              </p>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{campaign.name}</h1>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {campaign.brand_name || 'Your campaign'}
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">{campaign.name}</h1>
          </div>
        )}
      </div>

      <HeroStatus overall={overall} needsProduct={data.needs_product} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Creators" value={counts.creators} icon={Users}
              sub={counts.briefed ? `${counts.briefed} briefed` : 'Booked for you'} />
        {data.needs_product ? (
          <Tile label="Products" value={`${counts.received}/${counts.creators}`} icon={PackageCheck}
                sub={counts.dispatched ? `${counts.dispatched} dispatched` : 'Ready to go out'} />
        ) : (
          <Tile label="Briefed" value={`${counts.briefed}/${counts.creators}`} icon={FileText}
                sub="Creators with the brief" />
        )}
        <Tile label="Content in" value={`${counts.content_in}/${counts.creators}`} icon={Eye}
              sub={counts.approved ? `${counts.approved} approved` : 'Awaiting first submissions'} />
        <Tile label="Live posts" value={counts.live} icon={Sparkles}
              sub={`${compact(counts.reach)} combined followers`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Every creator, because a campaign is never uniformly anywhere. */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold">Your creators</h3>
            <span className="text-[13px] text-muted-foreground">{creators.length} on this campaign</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {creators.map(c => (
              <CreatorCard key={c.id} c={c} onOpen={() => setOpenCreator(c)} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {delivery.length > 0 && (
            <Card className="border-border/70">
              <CardContent className="p-5">
                <h3 className="text-[15px] font-semibold">Delivery</h3>
                <ChartContainer config={DELIVERY_CHART} className="mx-auto mt-2 aspect-square max-h-[190px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
                    <Pie data={delivery} dataKey="value" nameKey="label" innerRadius={52} outerRadius={78} strokeWidth={3}>
                      {delivery.map(d => <Cell key={d.key} fill={d.fill} />)}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="space-y-1.5">
                  {delivery.map(d => (
                    <div key={d.key} className="flex items-center justify-between text-[13.5px]">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                        {d.label}
                      </span>
                      <span className="font-medium tabular-nums">{d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {timeline.length > 0 && (
            <Card className="border-border/70">
              <CardContent className="p-5">
                <h3 className="text-[15px] font-semibold">Latest</h3>
                <ul className="mt-3 space-y-3.5">
                  {timeline.slice(0, 8).map((t, i) => (
                    <motion.li
                      key={`${t.at}-${i}`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i }}
                      className="flex gap-3"
                    >
                      <Avatar className="mt-0.5 h-7 w-7">
                        <AvatarImage src={cdnAvatar(t.avatar) || undefined} className="object-cover" />
                        <AvatarFallback className="text-[10px]">{(t.username || '?').slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-[13.5px] leading-snug">{t.text}</div>
                        <div className="text-[12px] text-muted-foreground">{ago(t.at)}</div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/70">
            <CardContent className="p-5">
              <h3 className="text-[15px] font-semibold">Campaign details</h3>
              <dl className="mt-3 space-y-2.5 text-[13.5px]">
                {campaign.objective && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Objective</dt>
                    <dd className="text-right">{campaign.objective}</dd>
                  </div>
                )}
                {campaign.start_date && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Started</dt>
                    <dd>{when(campaign.start_date)}</dd>
                  </div>
                )}
                {campaign.confirmed_at && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Confirmed</dt>
                    <dd>{when(campaign.confirmed_at)}</dd>
                  </div>
                )}
                {campaign.visit_location && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Venue</dt>
                    <dd className="text-right">{campaign.visit_location}</dd>
                  </div>
                )}
              </dl>
              <Button asChild variant="outline" className="mt-4 w-full rounded-xl">
                <Link href={`/campaigns/${campaign.id}/posts`}>
                  <BarChart3 className="mr-2 h-4 w-4" /> Full analytics
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreatorSheet c={openCreator} open={!!openCreator} onClose={() => setOpenCreator(null)} />
    </div>
  )
}
