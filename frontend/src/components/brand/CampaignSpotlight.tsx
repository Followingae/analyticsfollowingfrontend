'use client'

/**
 * The client's campaigns, on the client's front page.
 *
 * A brand with work in flight should not have to go looking for it. Between confirming and
 * the first post there is a fortnight where the only way to find out what is happening is
 * to email us — and that fortnight decides whether we feel like a partner or a silence.
 *
 * So the campaign leads the page: their own artwork, their own logo, the state in a
 * sentence, the creators as faces, and what moved this week. Arrows when there is more than
 * one, because a brand running three campaigns should flick between them the way you flick
 * between photos, not navigate a list.
 *
 * Every word here comes from the same place their campaign page reads, so the two can never
 * tell them different things.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowRight, Camera, CheckCircle2, ChevronLeft, ChevronRight, Eye, FileText,
  PackageCheck, PartyPopper, Sparkles, Truck, UserCheck, type LucideIcon,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cdnAvatar } from '@/lib/avatar'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  UserCheck, FileText, PackageCheck, Camera, Eye, Sparkles, PartyPopper, Truck,
}

type Step = { key: string; label: string; icon?: string; done: boolean; active: boolean; count?: number; of?: number }

type Item = {
  campaign: {
    id: string; name: string; brand_name?: string | null
    hero_image_url?: string | null; brand_logo_url?: string | null
    start_date?: string | null; confirmed_at?: string | null
  }
  overall: { key: string; headline: string; sub: string; steps: Step[] }
  counts: Record<string, number>
  needs_product: boolean
  creators: { id: string; username?: string | null; avatar?: string | null; state_label: string; progress: number }[]
  latest: { at: string; text: string; avatar?: string | null }[]
}

const compact = (n?: number | null) =>
  n == null ? '0' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`

const ago = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`
  const d = Math.round(mins / 1440)
  return d === 1 ? 'Yesterday' : `${d}d ago`
}

export function CampaignSpotlight({ className }: { className?: string }) {
  const [items, setItems] = useState<Item[] | null>(null)
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/campaigns/ongoing/summary`)
      const j = await res.json().catch(() => ({}))
      setItems(res.ok ? (j?.data?.campaigns || []) : [])
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (items === null) return <Skeleton className={cn('h-[330px] w-full rounded-2xl', className)} />
  if (items.length === 0) return null

  const it = items[Math.min(i, items.length - 1)]
  const { campaign, overall, counts } = it
  const active = overall.steps.find(s => s.active) || overall.steps[0]
  const Icon = ICONS[active?.icon || 'UserCheck'] || UserCheck
  const done = overall.steps.filter(s => s.done).length
  const pct = Math.round(((done + 0.5) / Math.max(overall.steps.length, 1)) * 100)

  const go = (n: number) => {
    setDir(n)
    setI(prev => (prev + n + items.length) % items.length)
  }

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {items.length > 1 ? `Your campaigns · ${i + 1} of ${items.length}` : 'Your campaign'}
        </span>
        {items.length > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full"
                    onClick={() => go(-1)} aria-label="Previous campaign">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full"
                    onClick={() => go(1)} aria-label="Next campaign">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={campaign.id}
          custom={dir}
          initial={{ opacity: 0, x: dir * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -24 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Card className="overflow-hidden border-border/70 p-0">
            <div className="grid md:grid-cols-[1.15fr_1fr]">
              {/* Their artwork, their logo. A brand should recognise their own campaign
                  before reading a word of it. */}
              <div className="relative min-h-[190px] md:min-h-[300px]">
                {campaign.hero_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={campaign.hero_image_url} alt={campaign.name}
                       className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-muted to-background" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

                <div className="relative flex h-full flex-col justify-between p-5">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-9 w-9 rounded-xl ring-2 ring-white/25">
                      <AvatarImage src={campaign.brand_logo_url || undefined} className="object-cover" />
                      <AvatarFallback className="rounded-xl bg-white/15 text-[11px] text-white">
                        {(campaign.brand_name || campaign.name || '?').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/70">
                        {campaign.brand_name || 'Campaign'}
                      </p>
                      <p className="truncate text-[15px] font-semibold text-white">{campaign.name}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <motion.span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur"
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.7} />
                      </motion.span>
                      <div className="min-w-0">
                        <p className="text-balance text-[19px] font-semibold leading-tight text-white">
                          {overall.headline}
                        </p>
                        <p className="text-[13px] text-white/75">{overall.sub}</p>
                      </div>
                    </div>

                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                      <motion.div className="h-full rounded-full bg-white"
                                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-white/75">
                      {overall.steps.filter(s => s.done || s.active).slice(-3).map(s => (
                        <span key={s.key} className="inline-flex items-center gap-1">
                          {s.done ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                          {s.label}{s.of ? ` ${s.count}/${s.of}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* The detail side: who is on it, what moved, and the way in. */}
              <div className="flex flex-col justify-between gap-4 p-5">
                <div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      ['Creators', counts.creators],
                      it.needs_product
                        ? ['Received', `${counts.received}/${counts.creators}`]
                        : ['Briefed', `${counts.briefed}/${counts.creators}`],
                      ['Live', counts.live],
                    ].map(([label, value]) => (
                      <div key={label as string} className="rounded-xl bg-muted/60 px-3 py-2.5">
                        <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{label}</div>
                        <div className="text-[17px] font-semibold leading-tight tabular-nums">{value as any}</div>
                      </div>
                    ))}
                  </div>

                  {it.creators.length > 0 && (
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {it.creators.slice(0, 6).map(c => (
                          <Avatar key={c.id} className="h-7 w-7 ring-2 ring-background">
                            <AvatarImage src={cdnAvatar(c.avatar) || undefined} className="object-cover" />
                            <AvatarFallback className="text-[9px]">
                              {(c.username || '?').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-[12.5px] text-muted-foreground">
                        {counts.creators} creators · {compact(counts.reach)} combined followers
                      </span>
                    </div>
                  )}

                  {it.latest.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {it.latest.map((l, k) => (
                        <li key={k} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span className="text-[13px] leading-snug">
                            {l.text}
                            <span className="ml-1.5 text-[11.5px] text-muted-foreground">{ago(l.at)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  {overall.key === 'complete' ? (
                    <Badge className="rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                      Complete
                    </Badge>
                  ) : <span />}
                  <Button asChild className="rounded-xl">
                    <Link href={`/campaigns/${campaign.id}`}>
                      See the campaign <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {items.map((_, k) => (
            <button
              key={k}
              aria-label={`Campaign ${k + 1}`}
              onClick={() => { setDir(k > i ? 1 : -1); setI(k) }}
              className={cn('h-1.5 rounded-full transition-all',
                            k === i ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
