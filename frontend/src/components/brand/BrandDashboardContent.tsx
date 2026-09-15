'use client'

/**
 * The brand's home screen.
 *
 * Built from `components/console/primitives` - PageHead, KpiRow, KpiCard, Panel, Row, Ring -
 * which is the kit the team's Today screens are built from. That is the point of this
 * rewrite: the internal dashboards looked better than the client's, and the reason was not
 * taste. It was that this screen hand-rolled cards, figures and list rows the house already
 * had opinions about. A KpiCard here now sits at the same height, with the same icon chip,
 * figure size and shadow as one on /work/today.
 *
 * NO EMPTY STATES. Every block is behind a real condition and the grids are built from what
 * survives. A client whose account has nothing in it gets a short page, not four boxes
 * explaining what they do not have.
 *
 * NOTHING IS INVENTED. The figures and the ring come from one endpoint that measures them.
 * KpiCard accepts `delta` and `since`; this screen deliberately passes neither, because we do
 * not store the history to compute a change against last month and the card reads fine
 * without one.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { useDashboardData } from '@/hooks/useDashboardData'
import { useCommercialAccount } from '@/hooks/useCommercialAccount'
import { contentBrandApi, type ContentSummary } from '@/services/contentDeliveryApi'
import { brandProposalViewApi } from '@/services/adminProposalMasterApi'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { CARD, KpiCard, KpiRow, PageHead, Panel, Ring, Row } from '@/components/console/primitives'
import { cn } from '@/lib/utils'
import { CheckCircle2, FileText, Megaphone, Users2 } from 'lucide-react'

const PROPOSAL_WAITING = ['sent', 'in_review', 'more_requested']

const MODULES = [
  { key: 'find', name: 'Find', art: '/modules/find.png', href: '/discover' },
  { key: 'run', name: 'Run', art: '/modules/run.png', href: '/run' },
  { key: 'mor', name: 'Merchant of Record', art: '/modules/mor.png', href: '/mor' },
  { key: 'manage', name: 'Manage', art: '/modules/manage.png', href: '/campaigns' },
]

type Summary = ContentSummary & {
  progress?: { total: number; posted: number; in_review: number; remaining: number; pct: number | null }
  creators?: { username: string; campaign: string; stage: string; stage_label: string }[]
}

export function BrandDashboardContent() {
  const { unlockedProfilesCount, activeCampaignsCount, isLoading } = useDashboardData()
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

  const needsYou = (s?.awaiting_you ?? 0) + waiting.length
  const progress = s?.progress
  const creators = s?.creators ?? []
  const live = s?.live_campaigns ?? activeCampaignsCount

  const showRing = !!progress && progress.pct !== null && progress.total > 0
  const showCreators = creators.length > 0
  const showNeeds = waiting.length > 0 || !!s?.awaiting_you

  if (isLoading) return <DashboardSkeleton />

  /* Only figures with something in them, plus "waiting on you", where a zero is the good
     news and worth saying out loud. */
  const kpis = [
    { key: 'waiting', label: 'Waiting on you', value: needsYou, icon: CheckCircle2,
      hint: needsYou ? 'Content and proposals' : 'You are all caught up', always: true },
    { key: 'live', label: 'Campaigns live', value: live, icon: Megaphone,
      hint: 'Running right now' },
    { key: 'working', label: 'Creators working', value: s?.creators_working ?? 0, icon: Users2,
      hint: 'Filming or posting' },
    { key: 'unlocked', label: 'Creators unlocked', value: unlockedProfilesCount, icon: FileText,
      hint: 'Across your whole team' },
  ].filter((k) => k.always || k.value > 0)

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 md:px-8 md:py-8">

      <PageHead title="Your campaigns"
                sub={summary(live, waiting.length, s?.awaiting_you ?? 0)} />

      <KpiRow cols={kpis.length === 3 ? 3 : 4}>
        {s === null
          ? [0, 1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-[102px] rounded-[var(--radius-card)]" />))
          : kpis.map((k) => (
              <KpiCard key={k.key} label={k.label} value={k.value} icon={k.icon} hint={k.hint} />
            ))}
      </KpiRow>

      {(showNeeds || showRing) && (
        <div className={cn('grid gap-4', showNeeds && showRing && 'lg:grid-cols-[1.6fr_1fr]')}>
          {showNeeds && (
            <Panel title="Needs you" description="Oldest first" flush>
              {waiting.slice(0, 3).map((p) => {
                const pr = p?.proposal ?? p
                return (
                  <Row
                    key={pr?.id}
                    tone="info"
                    title={pr?.title || pr?.campaign_name || 'Proposal'}
                    meta={pr?.deadline_at
                      ? `Reply by ${new Date(pr.deadline_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                      : 'Waiting on your answer'}
                    right={<Badge variant="secondary" className="text-[11px]">Proposal</Badge>}
                  />
                )
              })}
              {!!s?.awaiting_you && (
                <Row
                  tone="warn"
                  title={`${s.awaiting_you} piece${s.awaiting_you === 1 ? '' : 's'} of content to approve`}
                  meta={s.focus?.campaign_name ?? 'Across your campaigns'}
                  right={<Badge className="text-[11px]">Content</Badge>}
                />
              )}
              <div className="px-6 pt-3">
                <Button asChild size="sm">
                  <Link href={waiting.length
                    ? `/proposals/${waiting[0]?.proposal?.id ?? waiting[0]?.id ?? ''}`
                    : (s?.focus ? `/campaigns/${s.focus.campaign_id}/content` : '/campaigns')}>
                    {waiting.length ? 'Open the proposal' : 'Review content'}
                  </Link>
                </Button>
              </div>
            </Panel>
          )}

          {showRing && (
            <Panel title="Campaign progress" description="Across everything live">
              <Ring pct={progress!.pct} size={124}
                    caption={`${progress!.posted} posted, ${progress!.in_review} in review, ${progress!.remaining} to come`} />
            </Panel>
          )}
        </div>
      )}

      {showCreators && (
        <Panel title="Your creators" description="Working on something right now" flush>
          {creators.map((c) => (
            <Row
              key={c.username}
              tone={c.stage === 'content_in' ? 'warn'
                    : c.stage === 'posted' || c.stage === 'paid' ? 'good' : 'neutral'}
              title={c.username}
              meta={c.campaign}
              right={<Badge variant="secondary" className="text-[11px]">{c.stage_label}</Badge>}
            />
          ))}
        </Panel>
      )}

      {/* The modules, as their artwork with a name on it. A short row, not four billboards. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {MODULES.map((m) => {
          const has = !!owns?.[m.key]
          return (
            <Link
              key={m.key}
              href={has ? m.href : '/pricing'}
              className={cn(CARD, 'group relative isolate h-[88px] overflow-hidden',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
            >
              <Image src={m.art} alt="" fill sizes="(max-width: 1024px) 50vw, 300px"
                     className={cn('-z-10 object-cover object-right transition-transform duration-500',
                                   'group-hover:scale-[1.06]', !has && 'grayscale opacity-60')} />
              <span className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-4 pb-3">
                <span className="truncate text-[13px] font-semibold text-white">{m.name}</span>
                {!has && <span className="shrink-0 text-[11px] text-white/60">Add</span>}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function summary(live: number, proposals: number, content: number): string {
  const bits: string[] = []
  if (live) bits.push(`${live} campaign${live === 1 ? '' : 's'} running`)
  if (proposals) bits.push(`${proposals} proposal${proposals === 1 ? '' : 's'} to answer`)
  if (content) bits.push(`${content} piece${content === 1 ? '' : 's'} to approve`)
  if (!bits.length) return 'Nothing needs you today.'
  return `${bits.join(', ')}.`
}
