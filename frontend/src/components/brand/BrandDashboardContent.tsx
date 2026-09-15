'use client'

/**
 * The brand's home screen.
 *
 * Built to an approved direction, in the language of the dashboards it was designed against:
 * one filled stat carrying the thing that needs them, three plain ones beside it, a real
 * chart of content arriving, a progress ring, the creators mid-campaign, and the four modules
 * as their artwork with nothing on them but a name.
 *
 * EVERYTHING HERE IS MEASURED. The week of bars is `sent_for_review_at` grouped by day with
 * the empty days generated rather than dropped, so a quiet Sunday is a zero in the right
 * place. The ring is `campaign_creators.stage` counted over live campaigns. The creator list
 * is the same rows ordered by who is waiting on the brand. No deltas, no "vs last period" and
 * no sparkline of invented history: we do not store it, and a made-up percentage on a home
 * screen is the one number a client will quote back.
 *
 * COMPONENTS ARE SHADCN AS INSTALLED - Card, Button, Badge, Avatar, Skeleton, ChartContainer.
 * No local wrappers, no hand-rolled chart. Colour comes from theme tokens only.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Bar, BarChart, Cell, XAxis } from 'recharts'

import { useDashboardData } from '@/hooks/useDashboardData'
import { useUserStore } from '@/stores/userStore'
import { useCommercialAccount } from '@/hooks/useCommercialAccount'
import { contentBrandApi, type ContentSummary } from '@/services/contentDeliveryApi'
import { brandProposalViewApi } from '@/services/adminProposalMasterApi'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { cn } from '@/lib/utils'
import { ArrowUpRight } from 'lucide-react'

const PROPOSAL_WAITING = ['sent', 'in_review', 'more_requested']

const MODULES = [
  { key: 'find', name: 'Find', art: '/modules/find.png', href: '/discover' },
  { key: 'run', name: 'Run', art: '/modules/run.png', href: '/run' },
  { key: 'mor', name: 'Merchant of Record', art: '/modules/mor.png', href: '/mor' },
  { key: 'manage', name: 'Manage', art: '/modules/manage.png', href: '/campaigns' },
]

const chartConfig = { count: { label: 'Pieces', color: 'var(--chart-1)' } } satisfies ChartConfig

type Summary = ContentSummary & {
  series?: { day: string; date: string; count: number }[]
  progress?: { total: number; posted: number; in_review: number; remaining: number; pct: number | null }
  creators?: { username: string; campaign: string; stage: string; stage_label: string }[]
}

export function BrandDashboardContent() {
  const router = useRouter()
  const { unlockedProfilesCount, activeCampaignsCount, isLoading } = useDashboardData()
  const { user } = useUserStore()
  const { owns } = useCommercialAccount()

  const [s, setS] = useState<Summary | null>(null)
  useEffect(() => {
    contentBrandApi.summary().then((d) => setS(d as Summary)).catch(() => setS(null))
  }, [])

  const [proposals, setProposals] = useState<any[]>([])
  useEffect(() => {
    let dead = false
    brandProposalViewApi.listProposals({ limit: 10 })
      .then((r) => { if (!dead) setProposals(r?.proposals ?? []) })
      .catch(() => { /* leave empty */ })
    return () => { dead = true }
  }, [])

  const waiting = useMemo(
    () => proposals.filter((p) => PROPOSAL_WAITING.includes(
      String(p?.proposal?.status ?? p?.status ?? ''))),
    [proposals])

  const who = useMemo(() => {
    if (!user) return { name: null as string | null, initials: '—' }
    const name = user.company || user.full_name || user.first_name
      || user.email?.split('@')[0] || null
    const initials = (name || '?').split(' ').filter(Boolean).slice(0, 2)
      .map((w: string) => w[0]).join('').toUpperCase()
    return { name, initials }
  }, [user])

  const needsYou = (s?.awaiting_you ?? 0) + waiting.length
  const series = s?.series ?? []
  const peak = Math.max(...series.map((d) => d.count), 0)
  const progress = s?.progress
  const creators = s?.creators ?? []

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="flex w-full flex-col gap-4 p-4 md:p-5">

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greet()}{who.name ? `, ${who.name}` : ''}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {line(activeCampaignsCount, waiting.length, s?.awaiting_you ?? 0)}
          </p>
        </div>
        <div className="flex items-center gap-2.5 rounded-full border bg-card py-1 pl-1 pr-3.5">
          <Avatar className="size-7"><AvatarFallback className="text-[10px]">{who.initials}</AvatarFallback></Avatar>
          <span className="text-[13px] font-medium">{who.name ?? 'Your account'}</span>
        </div>
      </div>

      {/* Four figures. The first is filled, because it is the only one that is a request. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat filled label="Waiting on you" value={needsYou} loading={s === null}
              foot={needsYou ? 'Content and proposals' : 'You are all caught up'}
              badge={waiting.length ? `${waiting.length} proposal${waiting.length === 1 ? '' : 's'}` : undefined}
              href={s?.focus ? `/campaigns/${s.focus.campaign_id}/content` : '/proposals'} />
        <Stat label="Creators working" value={s?.creators_working} loading={s === null}
              foot="Filming or posting now" href="/campaigns" />
        <Stat label="Campaigns live" value={s?.live_campaigns ?? activeCampaignsCount}
              loading={s === null} foot="Running right now" href="/campaigns" />
        <Stat label="Creators unlocked" value={unlockedProfilesCount} loading={false}
              foot="Across your whole team" href="/creators" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.45fr_1fr_1fr]">

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Content coming in</CardTitle>
            <CardDescription className="text-xs">Pieces your creators sent, last seven days</CardDescription>
          </CardHeader>
          <CardContent>
            {s === null ? (
              <Skeleton className="h-[132px] w-full" />
            ) : peak === 0 ? (
              <p className="flex h-[132px] items-center text-[13px] text-muted-foreground">
                Nothing has come in this week.
              </p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[132px] w-full">
                <BarChart data={series} margin={{ top: 6, left: 0, right: 0, bottom: 0 }}>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8}
                         tick={{ fontSize: 11 }} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="count" radius={999} barSize={26}>
                    {series.map((d) => (
                      <Cell key={d.date}
                            fill={d.count === peak ? 'var(--chart-1)' : 'var(--muted)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Needs you</CardTitle>
            <CardDescription className="text-xs">Oldest first</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-3">
            <div>
              {waiting.slice(0, 1).map((p) => {
                const pr = p?.proposal ?? p
                return (
                  <Row key={pr?.id} title={pr?.title || pr?.campaign_name || 'Proposal'}
                       sub={pr?.deadline_at
                         ? `Reply by ${new Date(pr.deadline_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                         : 'Waiting on your answer'}
                       badge="Proposal" />
                )
              })}
              {!!s?.awaiting_you && (
                <Row title={`${s.awaiting_you} piece${s.awaiting_you === 1 ? '' : 's'} to approve`}
                     sub={s.focus?.campaign_name ?? 'Across your campaigns'}
                     badge="Content" tone="warn" />
              )}
              {s !== null && !waiting.length && !s.awaiting_you && (
                <p className="py-2 text-[13px] text-muted-foreground">Nothing needs you.</p>
              )}
            </div>
            {(waiting.length > 0 || !!s?.awaiting_you) && (
              <Button asChild className="w-full" size="sm">
                <Link href={waiting.length
                  ? `/proposals/${waiting[0]?.proposal?.id ?? waiting[0]?.id ?? ''}`
                  : (s?.focus ? `/campaigns/${s.focus.campaign_id}/content` : '/campaigns')}>
                  {waiting.length ? 'Open the proposal' : 'Review content'}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Campaign progress</CardTitle>
            <CardDescription className="text-xs">Across everything live</CardDescription>
          </CardHeader>
          <CardContent>
            {s === null ? <Skeleton className="mx-auto size-[132px] rounded-full" />
              : !progress || progress.pct === null ? (
                <p className="flex h-[132px] items-center text-[13px] text-muted-foreground">
                  Nothing booked yet.
                </p>
              ) : <Ring progress={progress} />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Your creators</CardTitle>
            <CardDescription className="text-xs">Working on something right now</CardDescription>
          </CardHeader>
          <CardContent>
            {s === null ? (
              <div className="space-y-2">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-10 w-full" />)}</div>
            ) : creators.length === 0 ? (
              <p className="py-2 text-[13px] text-muted-foreground">Nobody is mid-campaign.</p>
            ) : (
              <ul>
                {creators.map((c, i) => (
                  <li key={c.username}
                      className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t')}>
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[10px]">
                        {c.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{c.username}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{c.campaign}</p>
                    </div>
                    <Badge variant={c.stage === 'content_in' ? 'default' : 'secondary'}
                           className="shrink-0 text-[10px]">
                      {c.stage_label}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* The modules ARE the artwork. A name, and nothing else on them. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
          {MODULES.map((m) => {
            const has = !!owns?.[m.key]
            return (
              <Link key={m.key} href={has ? m.href : '/pricing'}
                    className={cn('group relative isolate aspect-[16/10] overflow-hidden rounded-xl',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}>
                <Image src={m.art} alt="" fill sizes="(max-width: 1024px) 50vw, 260px"
                       className={cn('-z-10 object-cover object-right transition-transform duration-500',
                                     'group-hover:scale-[1.05]', !has && 'grayscale')} />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 to-black/10" />
                <p className="absolute inset-x-0 bottom-0 truncate p-3 text-[12.5px] font-semibold text-white">
                  {m.name}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function greet() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function line(live: number, proposals: number, content: number): string {
  const bits: string[] = []
  if (live) bits.push(`${live} campaign${live === 1 ? '' : 's'} running`)
  if (proposals) bits.push(`${proposals} proposal${proposals === 1 ? '' : 's'} to answer`)
  if (content) bits.push(`${content} piece${content === 1 ? '' : 's'} to approve`)
  if (!bits.length) return 'Nothing needs you today.'
  return bits.join(' and ') + '.'
}

function Stat({ label, value, foot, badge, href, loading, filled }: {
  label: string; value: number | undefined; foot: string; badge?: string
  href: string; loading: boolean; filled?: boolean
}) {
  return (
    <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
      <Card className={cn('relative h-full transition-colors',
                          filled ? 'border-transparent bg-foreground text-background'
                                 : 'hover:bg-muted/40')}>
        <CardContent className="p-4">
          <p className={cn('text-[12.5px] font-medium',
                           filled ? 'text-background/65' : 'text-muted-foreground')}>{label}</p>
          <span className={cn('absolute right-3.5 top-3.5 grid size-6 place-items-center rounded-full border',
                              filled ? 'border-background/25 bg-background/10' : 'border-border')}>
            <ArrowUpRight className="size-3" />
          </span>
          {loading
            ? <Skeleton className="mt-4 h-8 w-14" />
            : <p className="mt-4 text-[32px] font-bold leading-none tabular-nums tracking-tight">
                {value ?? '—'}
              </p>}
          <div className="mt-2.5 flex items-center gap-2">
            {badge && (
              <Badge variant={filled ? 'secondary' : 'outline'} className="text-[10px]">{badge}</Badge>
            )}
            <span className={cn('truncate text-[11px]',
                                filled ? 'text-background/55' : 'text-muted-foreground')}>{foot}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function Row({ title, sub, badge, tone }: {
  title: string; sub: string; badge: string; tone?: 'warn'
}) {
  return (
    <div className="flex items-center gap-3 border-t py-2.5 first:border-t-0 first:pt-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <Badge variant={tone === 'warn' ? 'default' : 'secondary'} className="shrink-0 text-[10px]">
        {badge}
      </Badge>
    </div>
  )
}

/* Posted, in review and still to come, drawn to one scale. SVG rather than a radial chart:
   three arcs of one circle is a stroke-dasharray, and a charting library here would be a
   dependency carrying a rounding bug. */
function Ring({ progress }: {
  progress: { total: number; posted: number; in_review: number; remaining: number; pct: number | null }
}) {
  const R = 52
  const C = 2 * Math.PI * R
  const share = (n: number) => (progress.total ? (n / progress.total) * C : 0)
  const posted = share(progress.posted)
  const review = share(progress.in_review)

  return (
    <div>
      <div className="relative mx-auto grid size-[132px] place-items-center">
        <svg width="132" height="132" viewBox="0 0 132 132" className="absolute">
          <circle cx="66" cy="66" r={R} fill="none" stroke="var(--muted)" strokeWidth="15" />
          <circle cx="66" cy="66" r={R} fill="none" stroke="var(--foreground)" strokeWidth="15"
                  strokeLinecap="round" strokeDasharray={`${posted} ${C}`}
                  transform="rotate(-90 66 66)" />
          {review > 0 && (
            <circle cx="66" cy="66" r={R} fill="none" stroke="var(--chart-1)" strokeWidth="15"
                    strokeLinecap="round" strokeDasharray={`${review} ${C}`}
                    strokeDashoffset={-posted} transform="rotate(-90 66 66)" />
          )}
        </svg>
        <div className="relative text-center">
          <p className="text-[26px] font-bold leading-none tabular-nums tracking-tight">
            {progress.pct}%
          </p>
          <p className="mt-1 text-[10.5px] text-muted-foreground">posted</p>
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-4 text-[11px] text-muted-foreground">
        <Key color="var(--foreground)" label={`${progress.posted} posted`} />
        <Key color="var(--chart-1)" label={`${progress.in_review} in review`} />
        <Key color="var(--muted)" label={`${progress.remaining} to come`} />
      </div>
    </div>
  )
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-[7px] rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}
