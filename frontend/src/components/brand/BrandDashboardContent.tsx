'use client'

/**
 * The brand's home screen. ONE VIEWPORT, no scrolling.
 *
 * The version before this scrolled for three screens: four figures whether or not they had
 * anything in them, a long campaigns list, a getting-started card, a proposals list and an
 * activity feed, each with a paragraph under it. Everything on a dashboard that needs
 * scrolling to reach is a thing nobody reads.
 *
 * So it is a fixed grid that fills the available height and stops. Top half: the one thing
 * that needs them, plus whatever figures actually have something in them. Bottom half: the
 * four modules. Nothing else. Every deeper surface has its own page and its own link in the
 * sidebar; repeating those pages here in miniature was the mistake.
 *
 * RULES THIS PAGE KEEPS
 * - A figure renders only when it has a number worth showing. Four tiles where two are zero
 *   is four tiles of nothing.
 * - Every card is one line of copy at most. If it needs a paragraph it belongs on its page.
 * - Actions are buttons. A word with an arrow after it is not a button.
 * - No decorative marks. No status dots, no lock glyphs, no rings. State is carried by the
 *   artwork being colour or grey, and by the button's words.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import { useDashboardData } from '@/hooks/useDashboardData'
import { useUserStore } from '@/stores/userStore'
import { useCommercialAccount } from '@/hooks/useCommercialAccount'
import { contentBrandApi, type ContentSummary } from '@/services/contentDeliveryApi'
import { brandProposalViewApi } from '@/services/adminProposalMasterApi'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

const PROPOSAL_WAITING = ['sent', 'in_review', 'more_requested']
type HeroKind = 'content' | 'proposals' | 'running' | 'unlocked' | 'welcome'

const MODULES = [
  { key: 'find', name: 'Find', art: '/modules/find.png',
    owned: 'Search and unlock creators', pitch: 'Analytics we measured, not guessed',
    href: '/discover' },
  { key: 'run', name: 'Run', art: '/modules/run.png',
    owned: 'Brief creators, run it to delivery', pitch: 'Post a brief, take priced offers back',
    href: '/run' },
  { key: 'mor', name: 'Merchant of Record', art: '/modules/mor.png',
    owned: 'We pay your creators', pitch: 'One invoice instead of forty',
    href: '/mor' },
  { key: 'manage', name: 'Manage', art: '/modules/manage.png',
    owned: 'Your account team runs it', pitch: 'We source, negotiate and run it',
    href: '/campaigns' },
]

export function BrandDashboardContent() {
  const router = useRouter()
  const { unlockedProfilesCount, activeCampaignsCount, isLoading } = useDashboardData()
  const { user } = useUserStore()
  const { owns } = useCommercialAccount()

  const [content, setContent] = useState<ContentSummary | null>(null)
  useEffect(() => {
    contentBrandApi.summary().then(setContent).catch(() => setContent(null))
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

  const firstName = useMemo(() => {
    if (!user) return null
    return user.first_name || user.company || user.full_name?.split(' ')[0]
      || user.email?.split('@')[0] || null
  }, [user])

  const hero: HeroKind = useMemo(() => {
    if (content && content.awaiting_you > 0) return 'content'
    if (waiting.length > 0) return 'proposals'
    if (activeCampaignsCount > 0) return 'running'
    if (unlockedProfilesCount > 0) return 'unlocked'
    return 'welcome'
  }, [content, waiting.length, activeCampaignsCount, unlockedProfilesCount])

  /* Only figures that have something in them. "Waiting on you" survives a zero because a
     zero there is the good news; the rest are noise at zero and are simply not rendered. */
  const figures = useMemo(() => {
    const all = [
      { label: 'Waiting on you', value: content?.awaiting_you,
        href: content?.focus ? `/campaigns/${content.focus.campaign_id}/content` : '/campaigns',
        keepAtZero: true },
      { label: 'Creators working', value: content?.creators_working, href: '/campaigns' },
      { label: 'Campaigns live', value: content?.live_campaigns ?? activeCampaignsCount,
        href: '/campaigns' },
      { label: 'Creators unlocked', value: unlockedProfilesCount, href: '/creators' },
    ]
    return all.filter((f) => typeof f.value === 'number' && (f.value > 0 || f.keepAtZero))
              .slice(0, 3)
  }, [content, activeCampaignsCount, unlockedProfilesCount])

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4 md:gap-4 md:p-5">

      <h1 className="shrink-0 text-lg font-semibold tracking-tight">
        {greet()}{firstName ? `, ${firstName}` : ''}
      </h1>

      {/* Top: the one thing, and the figures worth showing. */}
      <div className="grid min-h-0 shrink-0 gap-3 md:gap-4 lg:grid-cols-3 lg:flex-[3]">
        <div className="lg:col-span-2">
          <Hero kind={hero} content={content} waiting={waiting}
                liveCount={activeCampaignsCount} unlocked={unlockedProfilesCount}
                onGo={(href) => router.push(href)} />
        </div>
        <div className={cn('grid gap-3 md:gap-4',
                           figures.length === 3 ? 'grid-cols-3 lg:grid-cols-1' : 'grid-cols-2')}>
          {figures.map((f) => (
            <Figure key={f.label} label={f.label}
                    value={f.value as number} href={f.href}
                    loading={content === null && !f.keepAtZero} />
          ))}
        </div>
      </div>

      {/* Bottom: what Following does, owned or not. */}
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {MODULES.map((m) => {
          const has = !!owns?.[m.key]
          return (
            <div key={m.key}
                 className="group relative isolate min-h-[132px] overflow-hidden rounded-xl">
              <Image src={m.art} alt="" fill sizes="(max-width: 1024px) 50vw, 25vw"
                     className={cn('-z-10 object-cover object-right transition-transform duration-500',
                                   'group-hover:scale-[1.04]', !has && 'grayscale')} />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/70 to-black/25" />
              <div className="flex h-full flex-col justify-end gap-2.5 p-4">
                <div>
                  <p className="text-sm font-semibold tracking-tight text-white">{m.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-white/60">
                    {has ? m.owned : m.pitch}
                  </p>
                </div>
                <Button asChild size="sm"
                        className={cn('h-7 w-fit px-3 text-xs',
                                      has ? 'bg-white text-black hover:bg-white/90'
                                          : 'bg-white/15 text-white hover:bg-white/25')}>
                  <Link href={has ? m.href : '/pricing'}>{has ? 'Open' : 'Add'}</Link>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function greet() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function Figure({ label, value, href, loading }: {
  label: string; value: number; href: string; loading: boolean
}) {
  return (
    <Link href={href}
          className={cn('flex flex-col justify-center rounded-xl border bg-card px-4 py-3',
                        'transition-colors hover:bg-muted/50',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}>
      {loading
        ? <Skeleton className="h-7 w-12" />
        : <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>}
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{label}</p>
    </Link>
  )
}

function Hero({ kind, content, waiting, liveCount, unlocked, onGo }: {
  kind: HeroKind; content: ContentSummary | null; waiting: any[]
  liveCount: number; unlocked: number; onGo: (href: string) => void
}) {
  const faces: Record<HeroKind, { art: string; title: string; cta: string; href: string }> = {
    content: {
      art: '/modules/run.png',
      title: `${content?.awaiting_you} ${content?.awaiting_you === 1 ? 'piece' : 'pieces'} of content waiting on you`,
      cta: 'Review it',
      href: content?.focus ? `/campaigns/${content.focus.campaign_id}/content` : '/campaigns',
    },
    proposals: {
      art: '/modules/proposals.png',
      title: `${waiting.length} ${waiting.length === 1 ? 'proposal' : 'proposals'} waiting for you`,
      cta: waiting.length === 1 ? 'Open it' : 'See them',
      href: waiting.length === 1 ? `/proposals/${waiting[0]?.proposal?.id ?? waiting[0]?.id ?? ''}` : '/proposals',
    },
    running: {
      art: '/modules/run.png',
      title: `${liveCount} ${liveCount === 1 ? 'campaign' : 'campaigns'} running`,
      cta: 'See campaigns', href: '/campaigns',
    },
    unlocked: {
      art: '/modules/find.png',
      title: `${unlocked} creators unlocked and ready`,
      cta: 'Your creators', href: '/creators',
    },
    welcome: {
      art: '/modules/welcome.png',
      title: 'Find creators worth your budget',
      cta: 'Start here', href: '/discover',
    },
  }
  const f = faces[kind]

  return (
    <div className="relative isolate flex h-full min-h-[172px] flex-col justify-end gap-4 overflow-hidden rounded-xl p-5 md:p-6">
      <Image src={f.art} alt="" fill priority sizes="(max-width: 1024px) 100vw, 640px"
             className="-z-10 object-cover object-right" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/75 to-black/20" />
      <p className="max-w-[24ch] text-xl font-semibold leading-tight tracking-tight text-white md:text-2xl">
        {f.title}
      </p>
      <Button size="sm" onClick={() => onGo(f.href)}
              className="w-fit bg-white text-black hover:bg-white/90">
        {f.cta}<ArrowRight className="ml-1.5 size-3.5" />
      </Button>
    </div>
  )
}
