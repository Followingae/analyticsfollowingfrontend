'use client'

/**
 * The bento tiles of the merchant home.
 *
 * Every number on every tile comes from GET /merchant/home. A tile with
 * nothing to show says so in a sentence; it never fills the gap with a zero
 * dressed as a measurement.
 */
import Link from 'next/link'
import { Play, Circle, Image as ImageIcon, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContentThumb, HomeCampaign, HomeCreator, MerchantHomeData, NeedsYouItem, ProgrammeTier, Trial, VisitDay } from '@/services/merchantApi'
import { deliverableName, deliverablesLine } from '@/services/merchantApi'
import { Tile, TileTitle, Eyebrow, Dot, DOT, DOT_LABEL, LIME, Money, Face, Cover, Quiet, compact, shortDate } from './bits'

/* ── Trial ───────────────────────────────────────────────────────────────── */

export function TrialTile({ trial, className }: { trial: Trial; className?: string }) {
  const per = trial.creators_per_month || 0
  const used = Math.min(trial.used_this_month || 0, per)
  const pending = trial.status === 'pending'

  let line: string
  if (pending) {
    line = `${per} a month for ${trial.months} months. Month one begins the day your campaign goes live.`
  } else if (trial.left_this_month > 0) {
    line =
      trial.month < trial.months
        ? `${trial.left_this_month} ${trial.left_this_month === 1 ? 'spot' : 'spots'} open this month. The next ${per} start next month.`
        : `${trial.left_this_month} ${trial.left_this_month === 1 ? 'spot' : 'spots'} open in your last month.`
  } else {
    line = trial.month < trial.months ? `This month is full. The next ${per} start next month.` : 'This month is full, and it is your last.'
  }

  return (
    <Tile className={cn(LIME, 'justify-between border-0 p-6', className)}>
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-semibold uppercase tracking-[0.08em]">Your trial</span>
        <span className="text-[13px] font-medium opacity-75">{pending ? 'Starts when live' : `Month ${trial.month} of ${trial.months}`}</span>
      </div>
      <div className="flex flex-col gap-3.5">
        <div className="text-[40px] font-medium leading-none tracking-[-0.03em] sm:text-[44px]">
          {pending ? trial.total_creators : used}
          <span className="text-[18px] font-medium opacity-70 sm:text-[20px]">
            {pending ? ' creators, on us' : ` of ${per} creators this month`}
          </span>
        </div>
        <div role="img" aria-label={`${used} of ${per} creators booked`} className="flex gap-2">
          {Array.from({ length: per }).map((_, i) => (
            <span key={i} className={cn('h-2.5 flex-1 rounded-full', i < used && !pending ? 'bg-[oklch(0.2_0.03_140)]' : 'bg-[oklch(0.2_0.03_140)]/[0.18]')} />
          ))}
        </div>
        <div className="text-[13px] opacity-80">{line}</div>
      </div>
    </Tile>
  )
}

/* ── Campaign card ───────────────────────────────────────────────────────── */

export function CampaignTile({ campaign, tier, className }: { campaign: HomeCampaign; tier: ProgrammeTier | null; className?: string }) {
  const filled = campaign.accepted_count ?? 0
  const max = campaign.max_participants ?? 0
  const pct = max > 0 ? Math.min(100, Math.round((filled / max) * 100)) : 0
  const deliverables = tier ? deliverablesLine(tier.guaranteed) : campaign.deliverable_tier
  return (
    <Tile className={cn('flex-row gap-0 p-0', className)}>
      <div className="w-[42%] shrink-0">
        <Cover src={campaign.hero_image_url} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-5">
        <div className="flex flex-col gap-1.5">
          <Eyebrow>Barter campaign</Eyebrow>
          <h2 className="m-0 text-[19px] font-semibold leading-tight tracking-[-0.02em]">{campaign.name}</h2>
          <span className="text-[13px] text-muted-foreground">
            {campaign.value_per_creator_aed != null ? (
              <>
                <Money amount={campaign.value_per_creator_aed} /> per creator
              </>
            ) : null}
            {campaign.value_per_creator_aed != null && deliverables ? ' · ' : ''}
            {deliverables}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>Spots filled</span>
            <span className="font-medium text-foreground">
              {filled} of {max || '–'}
            </span>
          </div>
          <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-muted-foreground">
            {campaign.start_date ? `Live since ${shortDate(campaign.start_date)}` : 'Live'}
            {campaign.end_date ? ` · ends ${shortDate(campaign.end_date)}` : ''}
          </div>
        </div>
      </div>
    </Tile>
  )
}

/* ── Needs you ───────────────────────────────────────────────────────────── */

const ACTION: Record<NeedsYouItem['kind'], string> = { application: 'Review', content: 'Watch', visit: 'See' }

export function NeedsYouTile({
  items,
  approvalMode,
  onSwitchMode,
  switching,
  className,
}: {
  items: NeedsYouItem[]
  approvalMode: 'auto' | 'manual'
  onSwitchMode: () => void
  switching?: boolean
  className?: string
}) {
  return (
    <Tile className={className}>
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-[15px] font-semibold">Needs you</h2>
        {items.length > 0 ? (
          <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
            {items.length}
          </span>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
        {items.length === 0 ? (
          <Quiet>Nothing waiting on you. We will put anything that needs a decision here.</Quiet>
        ) : (
          items.slice(0, 4).map((item) => (
            <Link
              key={`${item.kind}-${item.id}`}
              href={item.href || '/merchant/campaign#creators'}
              className="flex items-center gap-2.5 rounded-xl bg-muted/60 px-3 py-2.5 transition-colors hover:bg-muted"
            >
              <Face name={item.title} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-medium text-foreground">{item.title}</span>
                {item.subtitle ? <span className="truncate text-xs text-muted-foreground">{item.subtitle}</span> : null}
              </span>
              <span className="text-xs font-medium text-foreground">{ACTION[item.kind]}</span>
            </Link>
          ))
        )}
      </div>
      <span className="mt-auto text-xs text-muted-foreground">
        Creator approval: {approvalMode === 'manual' ? 'you approve each one' : 'automatic'}.{' '}
        <button type="button" onClick={onSwitchMode} disabled={switching} className="underline underline-offset-2 hover:text-foreground disabled:opacity-50">
          {approvalMode === 'manual' ? 'Switch to automatic' : 'Approve each creator yourself'}
        </button>
      </span>
    </Tile>
  )
}

/* ── Visits ──────────────────────────────────────────────────────────────── */

export function VisitsTile({ visits, className }: { visits: MerchantHomeData['visits']; className?: string }) {
  const days: VisitDay[] = (visits?.last14 || []).slice(-14)
  const max = Math.max(1, ...days.map((d) => d.count || 0))
  const hasAny = days.some((d) => d.count > 0)
  const w = 280
  const slot = w / Math.max(days.length, 1)
  const bar = Math.max(6, slot * 0.7)
  return (
    <Tile className={className}>
      <TileTitle aside="Last 14 days">Visits</TileTitle>
      <div className="flex items-baseline gap-2">
        <span className="text-[32px] font-medium leading-none tracking-[-0.03em]">{visits?.total ?? 0}</span>
        <span className="text-[13px] text-muted-foreground">
          {visits?.total === 1 ? 'creator came in' : 'creators came in'}
          {visits?.upcoming ? ` · ${visits.upcoming} booked` : ''}
        </span>
      </div>
      {days.length === 0 ? (
        <Quiet className="my-auto">Visits show up here as creators check in with your code.</Quiet>
      ) : (
        <>
          <svg
            role="img"
            aria-label={hasAny ? `Visits per day over ${days.length} days` : 'No visits yet'}
            viewBox={`0 0 ${w} 72`}
            preserveAspectRatio="none"
            className="min-h-[48px] w-full flex-1"
          >
            {days.map((d, i) => {
              const h = d.count > 0 ? Math.max(8, (d.count / max) * 68) : 4
              const isLast = i === days.length - 1
              return (
                <rect
                  key={d.date}
                  x={i * slot + (slot - bar) / 2}
                  y={72 - h}
                  width={bar}
                  height={h}
                  rx={d.count > 0 ? 4 : 2}
                  className={d.count > 0 ? (isLast ? 'fill-primary' : 'fill-foreground') : 'fill-muted'}
                />
              )
            })}
          </svg>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{shortDate(days[0]?.date)}</span>
            <span>Today</span>
          </div>
        </>
      )}
    </Tile>
  )
}

/* ── Content so far ──────────────────────────────────────────────────────── */

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[26px] font-medium leading-none tracking-[-0.03em]">{value}</span>
      <span className="mt-1 text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

export function Thumb({ item, className, badge }: { item: ContentThumb; className?: string; badge?: string }) {
  const label = `${deliverableName(item.type || 'post')}${item.creator ? ` by ${item.creator}` : ''}`
  return (
    <Link
      href="/merchant/campaign#content"
      aria-label={label}
      className={cn('relative flex min-h-[64px] items-end overflow-hidden rounded-xl bg-muted p-2', className)}
    >
      <Cover src={item.thumb_url} className="absolute inset-0" />
      {badge ? (
        <span className="relative rounded-full bg-black/40 px-1.5 py-0.5 text-[11px] font-semibold text-white">{badge}</span>
      ) : null}
    </Link>
  )
}

export function ContentTile({ content, className }: { content: MerchantHomeData['content']; className?: string }) {
  const latest = content?.latest || []
  const anything = (content?.reels || 0) + (content?.stories || 0) + (content?.posts || 0) > 0
  return (
    <Tile className={className}>
      <TileTitle
        aside={
          <Link href="/merchant/campaign#content" className="hover:text-foreground">
            See all
          </Link>
        }
      >
        Content so far
      </TileTitle>
      {!anything ? (
        <Quiet className="my-auto">The first reel or story lands here as soon as a creator posts it.</Quiet>
      ) : (
        <>
          <div className="flex flex-wrap gap-6">
            <Stat value={content.reels} label="Reels" />
            <Stat value={content.stories} label="Stories" />
            {content.posts > 0 ? <Stat value={content.posts} label="Posts" /> : null}
            <Stat value={compact(content.views)} label="Views" />
            <Stat value={compact(content.likes)} label="Likes and saves" />
          </div>
          {latest.length > 0 ? (
            <div aria-label="Latest content" className="grid min-h-0 flex-1 grid-cols-6 gap-2">
              {latest.slice(0, 6).map((item) => (
                <Thumb key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </Tile>
  )
}

/* ── Your creators ───────────────────────────────────────────────────────── */

export function CreatorsTile({ creators, className }: { creators: HomeCreator[]; className?: string }) {
  return (
    <Tile className={className}>
      <h2 className="m-0 text-[15px] font-semibold">Your creators</h2>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto">
        {creators.length === 0 ? (
          <Quiet>Creators who join your campaign are listed here with where they are up to.</Quiet>
        ) : (
          creators.slice(0, 6).map((c) => (
            <div key={c.id} className="flex items-center gap-2.5">
              <Face name={c.name} src={c.avatar_url} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-medium text-foreground">{c.name}</span>
                <span className="truncate text-xs text-muted-foreground">{c.note || DOT_LABEL[c.state]}</span>
              </span>
              <Dot className={DOT[c.state]} />
            </div>
          ))
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        {(['done', 'posting', 'coming'] as const).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <Dot className={cn('size-1.5', DOT[k])} />
            {DOT_LABEL[k]}
          </span>
        ))}
      </div>
    </Tile>
  )
}

/* ── What each creator gets / what you get back ──────────────────────────── */

export function OfferTile({
  items,
  total,
  minimum,
  tier,
  className,
}: {
  items: { name: string; value_aed: number }[]
  total: number
  minimum: number
  tier: ProgrammeTier | null
  className?: string
}) {
  return (
    <Tile className={className}>
      <h2 className="m-0 text-[15px] font-semibold">What each creator gets</h2>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto">
        {items.length === 0 ? (
          <Quiet>Add what a creator receives when they visit, and its value.</Quiet>
        ) : (
          items.map((item, i) => (
            <div key={`${item.name}-${i}`} className="flex justify-between gap-3 text-[13px]">
              <span className="truncate text-foreground/80">{item.name}</span>
              <span className="font-medium text-foreground">
                <Money amount={item.value_aed} />
              </span>
            </div>
          ))
        )}
        <div aria-hidden="true" className="mt-auto h-px bg-border" />
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-muted-foreground">Value per creator</span>
          <span className="text-[22px] font-medium tracking-[-0.02em]">
            <Money amount={total} />
          </span>
        </div>
      </div>
      {tier ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--tone-good-ink)]">
          <Check className="size-3.5" strokeWidth={2} />
          Above the <Money amount={minimum} /> minimum. {tier.label}.
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">
          Your offer needs to be worth at least <Money amount={minimum} /> per creator.
        </span>
      )}
    </Tile>
  )
}

const DELIVERABLE_ICON: Record<string, typeof Play> = { reel: Play, video: Play, tiktok_video: Play, story: Circle, post: ImageIcon, carousel: ImageIcon }

export function GetBackTile({ tier, className }: { tier: ProgrammeTier | null; className?: string }) {
  return (
    <Tile className={className}>
      <h2 className="m-0 text-[15px] font-semibold">What you get back</h2>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto">
        {!tier ? (
          <Quiet>Once your offer reaches the minimum we will show what each creator posts in return.</Quiet>
        ) : (
          <>
            {tier.guaranteed.map((d) => {
              const Icon = DELIVERABLE_ICON[d.type] || ImageIcon
              return (
                <div key={`g-${d.type}`} className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-foreground text-background">
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[13px] font-medium">
                      {d.qty} {deliverableName(d.type, d.qty)} per creator
                    </span>
                    <span className="text-xs text-muted-foreground">Guaranteed at this value</span>
                  </span>
                </div>
              )
            })}
            {tier.attempted.map((d) => {
              const Icon = DELIVERABLE_ICON[d.type] || ImageIcon
              return (
                <div key={`a-${d.type}`} className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[13px] font-medium">
                      {d.qty} {deliverableName(d.type, d.qty)} per creator
                    </span>
                    <span className="text-xs text-muted-foreground">Attempted, not promised</span>
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>
      <span className="text-xs text-muted-foreground">Content is yours to reuse for 30 days.</span>
    </Tile>
  )
}
