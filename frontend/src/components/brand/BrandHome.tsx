'use client'

/**
 * Home, for a brand, in the merchant home's language (founder, 20 Nov 2026: "I like the new
 * dashboard you created for the Partner Lead trial, can we have similar for our ACTUAL
 * platform"). Whitespace, a cloud, icons, almost no words.
 *
 * The cloud says the ONE thing that matters right now, in this order: a proposal or quote
 * waiting on them, content waiting for their approval, campaigns running, or nothing pending
 * (then: find creators). Under it, four bold tiles with one number each, every one a door
 * to its page. A number we could not load is a dash, never a confident zero.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, FileText, Megaphone, PlayCircle, Users, Sparkles, Search, Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tile, LIME, FOREST, greetingWord } from '@/components/merchant/bits'
import { ShellHeader } from '@/components/merchant/MerchantShell'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useUserStore, useSubscriptionData, useTeamData } from '@/stores/userStore'
import { planTierLabel } from '@/lib/plan-tier'
import { brandProposalViewApi } from '@/services/adminProposalMasterApi'
import { contentBrandApi, type ContentSummary } from '@/services/contentDeliveryApi'

type Waiting = { id: string; title: string; cover?: string | null; status: string; quote: boolean; creators?: number | null }
const WAITING = ['sent', 'in_review', 'more_requested']
const DASH = '–'

export function BrandHome() {
  const { user } = useUserStore()
  const team = useTeamData()
  const subscription = useSubscriptionData()
  const { unlockedProfilesCount, profilesError, profilesLoading, activeCampaignsCount, campaignsError, campaignsLoading,
          teamsOverview } = useDashboardData()

  const [waiting, setWaiting] = useState<Waiting | null>(null)
  const [pending, setPending] = useState<number | null>(null)
  const [content, setContent] = useState<ContentSummary | null>(null)
  const [loaded, setLoaded] = useState({ proposals: false, content: false })

  useEffect(() => {
    brandProposalViewApi.listProposals({ limit: 50 })
      .then(r => {
        // The list endpoint returns flat summaries, not the detail shape the type names.
        type Row = { id: string; title: string; status: string; created_at: string; cover_image_url?: string | null
                     total_budget?: number | null; total_influencers?: number | null }
        const open = ((r.proposals || []) as unknown as Row[]).filter(p => WAITING.includes(p.status))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setPending(r.pending_count ?? open.length)
        const p = open[0]
        if (p) setWaiting({ id: p.id, title: p.title, cover: p.cover_image_url, status: p.status,
                            quote: !p.total_budget, creators: p.total_influencers ?? null })
      })
      .catch(() => setPending(null))
      .finally(() => setLoaded(l => ({ ...l, proposals: true })))
    contentBrandApi.summary()
      .then(setContent)
      .catch(() => setContent(null))
      .finally(() => setLoaded(l => ({ ...l, content: true })))
  }, [])

  const company = user?.company || teamsOverview?.team_info?.name || user?.first_name || ''
  const tier = planTierLabel(team?.subscription_tier || subscription?.tier || teamsOverview?.team_info?.subscription_tier)
  const awaiting = content?.awaiting_you ?? null
  const live = content?.live_campaigns ?? (campaignsError ? null : activeCampaignsCount)
  const ready = loaded.proposals && loaded.content

  /* The one thing, in order of who is waiting on whom. */
  const hero = !ready ? null
    : waiting ? {
        icon: FileText,
        title: waiting.quote ? 'Your quote is ready' : 'Your proposal is ready',
        line: waiting.creators ? `${waiting.title} · ${waiting.creators} creators` : waiting.title,
        cta: 'Review', href: `/proposals/${waiting.id}`, cover: waiting.cover,
      }
    : awaiting && awaiting > 0 && content?.focus ? {
        icon: PlayCircle,
        title: `${awaiting} to approve`,
        line: content.focus.campaign_name,
        cta: 'Review content', href: `/campaigns/${content.focus.campaign_id}/content`, cover: null,
      }
    : live && live > 0 ? {
        icon: Megaphone,
        title: live === 1 ? 'Your campaign is live' : `${live} campaigns live`,
        line: 'Results update as creators post.',
        cta: 'Open campaigns', href: '/campaigns', cover: null,
      }
    : {
        icon: Search,
        title: 'Find your next creators',
        line: 'Search, analyse and shortlist in minutes.',
        cta: 'Discover', href: '/discover', cover: null,
      }

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

      <section aria-label="Right now" className="flex min-h-0 flex-1 flex-col gap-4">
        {/* The cloud */}
        <Tile className="relative min-h-[44dvh] flex-[3] items-center justify-center overflow-hidden border-0 bg-card p-0 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <span className="absolute -left-24 -top-28 size-[28rem] rounded-full bg-[oklch(0.9354_0.2254_121.5)]/35 blur-3xl" />
            <span className="absolute -bottom-32 right-[-6rem] size-[30rem] rounded-full bg-primary/25 blur-3xl" />
            <span className="absolute left-1/2 top-1/2 size-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/70 blur-2xl" />
          </div>

          {hero ? (
            <div className="relative flex flex-col items-center gap-7 px-6 text-center">
              {hero.cover ? (
                // The proposal's own cover, framed like the mark it replaces.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hero.cover} alt="" className="h-28 w-48 rounded-[22px] object-cover shadow-[0_18px_50px_-24px_rgba(0,0,0,0.45)] ring-4 ring-card" />
              ) : (
                <span className="relative inline-flex size-24 items-center justify-center rounded-full bg-card shadow-[0_18px_50px_-24px_rgba(0,0,0,0.35)] ring-1 ring-border">
                  <span className={cn('inline-flex size-16 items-center justify-center rounded-full', LIME)}>
                    <hero.icon className="size-7" strokeWidth={1.6} />
                  </span>
                  <span className="absolute -right-1 -top-1 inline-flex size-8 items-center justify-center rounded-full bg-card text-foreground shadow-sm ring-1 ring-border">
                    <Sparkles className="size-3.5" strokeWidth={2} />
                  </span>
                </span>
              )}
              <div className="flex flex-col items-center gap-2">
                <h2 className="m-0 text-[30px] font-medium leading-none tracking-[-0.03em] sm:text-[36px]">{hero.title}</h2>
                <p className="m-0 max-w-md text-sm text-muted-foreground">{hero.line}</p>
              </div>
              <Link href={hero.href}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background shadow-[0_14px_30px_-16px_rgba(0,0,0,0.5)] transition-opacity hover:opacity-90">
                {hero.cta}<ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </div>
          ) : (
            <div className="relative size-24 animate-pulse rounded-full bg-muted" />
          )}
        </Tile>

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
      </section>
    </div>
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
      <Tile as="div" className={cn('h-full min-h-[170px] justify-between gap-6 p-6 transition-transform group-hover:-translate-y-0.5', t.tile)}>
        <div className="flex items-center justify-between">
          <span className={cn('inline-flex size-11 items-center justify-center rounded-full', t.disc)}>
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
          <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-60" strokeWidth={2} />
        </div>
        <div className="flex flex-col gap-1">
          {value == null
            ? <span className="h-[52px] w-16 animate-pulse rounded-xl bg-current/10" />
            : <span className="text-[52px] font-medium leading-none tracking-[-0.04em] tabular-nums sm:text-[60px]">{value}</span>}
          <span className={cn('text-[12px] font-semibold uppercase tracking-[0.1em]', t.label)}>{label}</span>
        </div>
      </Tile>
    </Link>
  )
}
