'use client'

/**
 * Quick questions: the whole brief, one tap at a time.
 *
 * The founder found the nine-page form "not really easy to fill" (25 Nov 2026), then that the
 * quick version skipped too much: platforms, content style, tone, the kind of creator, where to
 * shoot, references. So this walks ONE ordered list of questions and asks each one the brief
 * has not answered yet. Required ones (the brief's gaps) wait for an answer or a skip; the rest
 * can be passed with Next. A tap on a single-choice answer moves on by itself; follow-ups appear
 * only when an answer calls for one (a visit needs a place, barter needs the item).
 */
import * as React from 'react'
import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Ban, Banknote, Check, Gift, Layers, Store } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  CATEGORY_OPTS, MARKETS, OBJECTIVES, PLATFORM_LABEL, PLATFORM_ORDER, SHOOT, STYLES, TIERS,
  TONE_OPTS, USAGE, briefGaps,
  type BriefAnswers, type Deliverable, type Platform, type StepKey,
} from '@/lib/brandBrief'
import { PlatformMark } from './BriefSteps'
import { EASE, LIME, TagInput, TextArea, TextInput } from './ui'
import { cn } from '@/lib/utils'

type Props = {
  a: BriefAnswers
  set: (path: string, value: unknown) => void
  startKey?: string | null
  onDone: () => void
  onDetail: (step: StepKey) => void
  onExit: () => void
}

const has = (v: unknown) =>
  v != null && (typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) ? v.length > 0 : true)

/** Every question, in the order a brief is told. `ask` says whether it is still open. */
const ORDER: { key: string; ask: (a: BriefAnswers) => boolean }[] = [
  { key: 'campaign.name', ask: a => !has(a.campaign?.name) },
  { key: 'campaign.product', ask: a => !has(a.campaign?.product) },
  { key: 'campaign.objectives', ask: a => !has(a.campaign?.objectives) },
  { key: 'audience.markets', ask: a => !has(a.audience?.markets) },
  { key: 'creators.categories', ask: a => !has(a.creators?.categories) },
  { key: 'creators.tiers', ask: a => !has(a.creators?.tiers) },
  { key: 'platforms', ask: a => !has(a.platforms) },
  { key: 'deliverables', ask: a => !has(a.deliverables) },
  { key: 'content.styles', ask: a => !has(a.content?.styles) },
  { key: 'content.tones', ask: a => !has(a.content?.tones) },
  { key: 'content.shoot_locations', ask: a => !has(a.content?.shoot_locations) },
  { key: 'tagging.accounts', ask: a => !has(a.tagging?.accounts) },
  { key: 'visit.needed', ask: a => a.visit?.needed == null },
  { key: 'visit.locations', ask: a => a.visit?.needed === true && !has(a.visit?.locations?.filter(l => l.name || l.address)) },
  { key: 'compensation.mode', ask: a => !has(a.compensation?.mode) },
  { key: 'compensation.budget_aed', ask: a => ['paid', 'both'].includes(a.compensation?.mode || '') && !has(a.compensation?.budget_aed) },
  { key: 'compensation.barter_items', ask: a => ['barter', 'both'].includes(a.compensation?.mode || '') && !has(a.compensation?.barter_items?.filter(i => i.name)) },
  { key: 'usage.rights', ask: a => !has(a.usage?.rights) },
  { key: 'timeline.live_from', ask: a => !has(a.timeline?.live_from) && !has(a.timeline?.live_to) },
  { key: 'content.references', ask: a => !has(a.content?.references) && !has(a.content?.dos) },
]

const DELIVERABLE_PRESETS: { label: string; items: Deliverable[] }[] = [
  { label: '1 Reel', items: [{ platform: 'instagram', format: 'reel', quantity: 1 }] },
  { label: '1 Reel + 2 Stories', items: [{ platform: 'instagram', format: 'reel', quantity: 1 }, { platform: 'instagram', format: 'story', quantity: 2 }] },
  { label: '3 Stories', items: [{ platform: 'instagram', format: 'story', quantity: 3 }] },
  { label: '1 Post + 3 Stories', items: [{ platform: 'instagram', format: 'post', quantity: 1 }, { platform: 'instagram', format: 'story', quantity: 3 }] },
  { label: '1 TikTok video', items: [{ platform: 'tiktok', format: 'video', quantity: 1 }] },
  { label: '1 Reel + 1 TikTok', items: [{ platform: 'instagram', format: 'reel', quantity: 1 }, { platform: 'tiktok', format: 'video', quantity: 1 }] },
  { label: '1 YouTube Short', items: [{ platform: 'youtube', format: 'short', quantity: 1 }] },
  { label: '1 Snapchat story', items: [{ platform: 'snapchat', format: 'story', quantity: 1 }] },
]

const iso = (d: Date) => d.toISOString().slice(0, 10)
function windowFor(kind: 'soon' | 'month' | 'next'): [string, string] {
  const t = new Date()
  if (kind === 'soon') { const a = new Date(t); a.setDate(a.getDate() + 7); const b = new Date(t); b.setDate(b.getDate() + 21); return [iso(a), iso(b)] }
  if (kind === 'month') { const b = new Date(t.getFullYear(), t.getMonth() + 1, 0); return [iso(t), iso(b)] }
  const a = new Date(t.getFullYear(), t.getMonth() + 1, 1); const b = new Date(t.getFullYear(), t.getMonth() + 2, 0); return [iso(a), iso(b)]
}

/* ── Tiles ──────────────────────────────────────────────────────────────────────────── */

function Tile({ on, onClick, icon: Icon, label, sub, mark }: {
  on?: boolean; onClick: () => void; icon?: LucideIcon; label: string; sub?: string; mark?: React.ReactNode
}) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={onClick}
                   className={cn('relative flex min-h-[104px] flex-col items-start justify-between gap-3 rounded-2xl border p-4 text-left transition-colors duration-200',
                                 on ? 'border-transparent' : 'border-white/10 bg-[#111] hover:border-white/30')}
                   style={on ? { background: LIME } : undefined}>
      <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', on ? 'bg-black/10' : 'bg-white/[0.07] text-white/80')}>
        {mark || (Icon && <Icon className="h-5 w-5" />)}
      </span>
      <span>
        <span className="block text-[15px] font-semibold leading-tight">{label}</span>
        {sub && <span className={cn('mt-0.5 block text-[12px]', on ? 'opacity-70' : 'text-white/45')}>{sub}</span>}
      </span>
      <AnimatePresence>
        {on && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                       className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-black">
            <Check className="h-3 w-3" style={{ color: LIME }} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

function Tiles({ children, cols = 3 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  return <div className={cn('grid grid-cols-2 gap-2.5', cols === 3 && 'sm:grid-cols-3')}>{children}</div>
}

function Pill({ children, onClick, on }: { children: React.ReactNode; onClick: () => void; on?: boolean }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={onClick}
                   className={cn('w-full rounded-2xl border px-5 py-4 text-left text-[16px] font-medium transition-colors duration-200',
                                 on ? 'border-transparent' : 'border-white/10 bg-[#111] hover:border-white/30')}
                   style={on ? { background: LIME } : undefined}>
      {children}
    </motion.button>
  )
}

function Question({ title, sub, children, next = true, canNext, onNext }: {
  title: string; sub?: string; children: React.ReactNode; next?: boolean; canNext: boolean; onNext: () => void
}) {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]">{title}</h1>
        {sub && <p className="text-[15px] text-white/45">{sub}</p>}
      </div>
      <div>{children}</div>
      {next && (
        <motion.button type="button" disabled={!canNext} onClick={onNext} whileTap={{ scale: 0.97 }}
                       className="inline-flex h-12 items-center gap-2 rounded-full px-7 text-[15px] font-semibold disabled:opacity-30"
                       style={{ background: LIME }}>
          Next<ArrowRight className="h-4 w-4" />
        </motion.button>
      )}
    </div>
  )
}

/* ── The run ────────────────────────────────────────────────────────────────────────── */

export function Quick({ a, set, startKey, onDone, onDetail, onExit }: Props) {
  /* A tap moves on a beat later, from an older render: read the answers as they are by then,
     so a follow-up the tap itself created (a visit needs a place) is not skipped. */
  const aRef = useRef(a)
  aRef.current = a
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [history, setHistory] = useState<string[]>([])
  const pending = (ans: BriefAnswers, skip: Set<string>, not?: string | null) =>
    ORDER.filter(q => q.ask(ans) && !skip.has(q.key) && q.key !== not).map(q => q.key)
  const [current, setCurrent] = useState<string | null>(() => startKey || pending(a, new Set())[0] || null)
  const [picked, setPicked] = useState<string | null>(null)
  const [custom, setCustom] = useState(false)

  const advance = (skip = skipped) => {
    const n = pending(aRef.current, skip, current)[0] ?? null
    setPicked(null); setCustom(false)
    if (!n) { onDone(); return }
    if (current) setHistory(h => [...h, current])
    setCurrent(n)
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }
  const tap = (id: string, apply: () => void) => { setPicked(id); apply(); setTimeout(() => advance(), 320) }
  const skip = () => { const s = new Set(skipped); if (current) s.add(current); setSkipped(s); advance(s) }
  const back = () => {
    const h = [...history]; const prev = h.pop()
    setHistory(h); setPicked(null); setCustom(false)
    if (prev) setCurrent(prev); else onExit()
  }
  const toggle = (path: string, list: string[] | undefined, key: string) =>
    set(path, (list || []).includes(key) ? (list || []).filter(x => x !== key) : [...(list || []), key])

  if (!current) return null
  const required = new Set(briefGaps(a).map(g => g.key))
  const isRequired = required.has(current)
  const answered = !ORDER.find(q => q.key === current)?.ask(a)
  const canNext = answered || !isRequired
  const total = history.length + 1 + pending(a, skipped, current).length
  const n = history.length + 1
  const Q = (p: { title: string; sub?: string; next?: boolean; children: React.ReactNode }) =>
    <Question {...p} canNext={canNext} onNext={() => (answered ? advance() : skip())} />

  let body: React.ReactNode
  switch (current) {
    case 'campaign.name':
      body = Q({ title: 'What is the campaign called?', children: <TextInput value={a.campaign?.name} onChange={v => set('campaign.name', v)} placeholder="Winter Menu Launch" /> })
      break
    case 'campaign.product':
      body = Q({ title: 'What are we promoting?', children: <TextInput value={a.campaign?.product} onChange={v => set('campaign.product', v)} placeholder="Our new winter menu" /> })
      break
    case 'campaign.objectives':
      body = Q({ title: 'What is the goal?', sub: 'Pick all that apply.', children: (
        <Tiles>{OBJECTIVES.map(o => <Tile key={o.key} icon={o.icon} label={o.label} on={a.campaign?.objectives?.includes(o.key)} onClick={() => toggle('campaign.objectives', a.campaign?.objectives, o.key)} />)}</Tiles>
      ) })
      break
    case 'audience.markets':
      body = Q({ title: 'Which countries?', children: (
        <Tiles>{MARKETS.map(m => <Tile key={m} label={m} mark={<span className="text-[13px] font-bold">{m.slice(0, 3).toUpperCase()}</span>} on={a.audience?.markets?.includes(m)} onClick={() => toggle('audience.markets', a.audience?.markets, m)} />)}</Tiles>
      ) })
      break
    case 'creators.categories':
      body = Q({ title: 'What type of creators?', sub: 'Pick all that fit.', children: (
        <Tiles>{CATEGORY_OPTS.map(o => <Tile key={o.key} icon={o.icon} label={o.label} on={a.creators?.categories?.includes(o.key)} onClick={() => toggle('creators.categories', a.creators?.categories, o.key)} />)}</Tiles>
      ) })
      break
    case 'creators.tiers':
      body = Q({ title: 'How big?', sub: 'By followers. Mixing sizes works well.', children: (
        <Tiles>{TIERS.map(t => (
          <Tile key={t.key} label={t.label} sub={t.range} on={a.creators?.tiers?.includes(t.key)}
                onClick={() => toggle('creators.tiers', a.creators?.tiers, t.key)}
                mark={<span className="flex items-end gap-[3px]">{Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className={cn('w-[3px] rounded-full bg-current', i >= t.dots && 'opacity-20')} style={{ height: 6 + i * 3 }} />
                ))}</span>} />
        ))}</Tiles>
      ) })
      break
    case 'platforms': {
      const list = a.platforms || []
      body = Q({ title: 'Which platforms?', sub: 'Instagram is standard. The others are priced separately.', children: (
        <Tiles cols={2}>{PLATFORM_ORDER.map(p => (
          <Tile key={p} label={PLATFORM_LABEL[p]} sub={p === 'instagram' ? 'Standard' : 'Priced separately'}
                mark={<PlatformMark p={p} className="h-5 w-5" />} on={list.includes(p)}
                onClick={() => set('platforms', list.includes(p) ? list.filter(x => x !== p) : [...list, p])} />
        ))}</Tiles>
      ) })
      break
    }
    case 'deliverables': {
      const chosen = (a.platforms?.length ? a.platforms : ['instagram']) as Platform[]
      const presets = DELIVERABLE_PRESETS.filter(p => p.items.every(i => chosen.includes(i.platform)))
      body = Q({ title: 'What does each creator post?', next: false, children: (
        <div className="space-y-2.5">
          {presets.map(p => (
            <Pill key={p.label} on={picked === p.label}
                  onClick={() => tap(p.label, () => set('deliverables', p.items))}>
              <span className="flex items-center gap-3">
                <span className="flex gap-1">{Array.from(new Set(p.items.map(i => i.platform))).map(pl => <PlatformMark key={pl} p={pl} className="h-4 w-4" />)}</span>
                {p.label}
              </span>
            </Pill>
          ))}
          <button type="button" onClick={() => onDetail('content')}
                  className="pt-2 text-[14px] text-white/50 underline underline-offset-4 hover:text-white">Something else</button>
        </div>
      ) })
      break
    }
    case 'content.styles':
      body = Q({ title: 'What style of content?', sub: 'Pick any that fit.', children: (
        <Tiles>{STYLES.map(o => <Tile key={o.key} icon={o.icon} label={o.label} on={a.content?.styles?.includes(o.key)} onClick={() => toggle('content.styles', a.content?.styles, o.key)} />)}</Tiles>
      ) })
      break
    case 'content.tones':
      body = Q({ title: 'What should it feel like?', children: (
        <Tiles>{TONE_OPTS.map(o => <Tile key={o.key} icon={o.icon} label={o.label} on={a.content?.tones?.includes(o.key)} onClick={() => toggle('content.tones', a.content?.tones, o.key)} />)}</Tiles>
      ) })
      break
    case 'content.shoot_locations':
      body = Q({ title: 'Where should they shoot?', children: (
        <div className="space-y-4">
          <Tiles>{SHOOT.map(o => <Tile key={o.key} icon={o.icon} label={o.label} on={a.content?.shoot_locations?.includes(o.key)} onClick={() => toggle('content.shoot_locations', a.content?.shoot_locations, o.key)} />)}</Tiles>
          <TextInput value={a.content?.shoot_notes} onChange={v => set('content.shoot_notes', v)} placeholder="Anything specific? e.g. by the pool at sunset" />
        </div>
      ) })
      break
    case 'tagging.accounts':
      body = Q({ title: 'Which account do they tag?', children: <TagInput prefix="@" value={a.tagging?.accounts} onChange={v => set('tagging.accounts', v)} placeholder="@yourbrand" /> })
      break
    case 'visit.needed':
      body = Q({ title: 'Do creators visit you?', next: false, children: (
        <Tiles cols={2}>
          <Tile icon={Store} label="Yes" sub="Store, restaurant, hotel, event" on={picked === 'y'} onClick={() => tap('y', () => set('visit.needed', true))} />
          <Tile icon={Ban} label="No" sub="Content made anywhere" on={picked === 'n'} onClick={() => tap('n', () => set('visit.needed', false))} />
        </Tiles>
      ) })
      break
    case 'visit.locations': {
      const l = a.visit?.locations?.[0] || {}
      const put = (k: string, v: string) => set('visit.locations', [{ ...l, [k]: v }, ...(a.visit?.locations || []).slice(1)])
      body = Q({ title: 'Where do they visit?', children: (
        <div className="space-y-2.5">
          <TextInput value={l.name} onChange={v => put('name', v)} placeholder="Branch, e.g. Dubai Mall" />
          <TextInput value={l.address} onChange={v => put('address', v)} placeholder="Address or Google Maps link" />
        </div>
      ) })
      break
    }
    case 'compensation.mode':
      body = Q({ title: 'How are creators rewarded?', next: false, children: (
        <Tiles>
          <Tile icon={Banknote} label="Paid" on={picked === 'paid'} onClick={() => tap('paid', () => set('compensation.mode', 'paid'))} />
          <Tile icon={Gift} label="Barter" on={picked === 'barter'} onClick={() => tap('barter', () => set('compensation.mode', 'barter'))} />
          <Tile icon={Layers} label="Both" on={picked === 'both'} onClick={() => tap('both', () => set('compensation.mode', 'both'))} />
        </Tiles>
      ) })
      break
    case 'compensation.budget_aed':
      body = Q({ title: 'What is the budget?', children: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            {[10000, 25000, 50000, 100000].map(v => (
              <Pill key={v} on={picked === String(v)} onClick={() => tap(String(v), () => set('compensation.budget_aed', v))}>AED {v.toLocaleString('en')}</Pill>
            ))}
          </div>
          <TextInput prefix="AED" inputMode="numeric" placeholder="Or type it"
                     value={a.compensation?.budget_aed ? Number(a.compensation.budget_aed).toLocaleString('en') : ''}
                     onChange={v => set('compensation.budget_aed', Number(v.replace(/[^\d]/g, '')) || null)} />
        </div>
      ) })
      break
    case 'compensation.barter_items': {
      const it = a.compensation?.barter_items?.[0] || { name: '' }
      const put = (k: string, v: unknown) => set('compensation.barter_items', [{ ...it, [k]: v }, ...(a.compensation?.barter_items || []).slice(1)])
      body = Q({ title: 'What does each creator get?', children: (
        <div className="grid gap-2.5 sm:grid-cols-[1fr_170px]">
          <TextInput value={it.name} onChange={v => put('name', v)} placeholder="Dinner for two" />
          <TextInput prefix="AED" inputMode="numeric" value={it.value_aed ?? ''} placeholder="Value"
                     onChange={v => put('value_aed', Number(v.replace(/[^\d]/g, '')) || null)} />
        </div>
      ) })
      break
    }
    case 'usage.rights':
      body = Q({ title: 'How will you use the content?', next: false, children: (
        <div className="space-y-2.5">
          {USAGE.map(u => (
            <Pill key={u.key} on={picked === u.key} onClick={() => tap(u.key, () => set('usage.rights', u.key))}>
              <span className="block">{u.label}</span><span className="block text-[13px] font-normal opacity-60">{u.sub}</span>
            </Pill>
          ))}
        </div>
      ) })
      break
    case 'timeline.live_from':
      body = Q({ title: 'When should it go live?', next: custom, children: !custom ? (
        <div className="space-y-2.5">
          {([['soon', 'In the next 2 to 3 weeks'], ['month', 'This month'], ['next', 'Next month']] as const).map(([k, label]) => (
            <Pill key={k} on={picked === k} onClick={() => tap(k, () => { const [f, t] = windowFor(k); set('timeline.live_from', f); set('timeline.live_to', t) })}>{label}</Pill>
          ))}
          <Pill onClick={() => setCustom(true)}>Pick dates</Pill>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(['live_from', 'live_to'] as const).map(k => (
            <input key={k} type="date" value={a.timeline?.[k] || ''} onChange={e => set(`timeline.${k}`, e.target.value)}
                   className="h-12 rounded-2xl border border-white/10 bg-[#111] px-4 text-[15px] text-white outline-none focus:border-white/60" />
          ))}
        </div>
      ) })
      break
    case 'content.references':
      body = Q({ title: 'Anything to show us?', sub: 'Posts you love, a mood board, or what must be in it.', children: (
        <div className="space-y-3">
          <TagInput value={a.content?.references} onChange={v => set('content.references', v)} placeholder="Paste a link, then enter" />
          <TextArea rows={3} value={a.content?.dos} onChange={v => set('content.dos', v)} placeholder="Must show the pool, no competitor logos..." />
        </div>
      ) })
      break
    default:
      body = Q({ title: 'One more thing', children: null })
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-36 pt-8 sm:px-8 sm:pt-12">
      <div className="mb-8 flex items-center gap-3">
        <button type="button" onClick={back} aria-label="Back"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:bg-white/[0.08]">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <motion.span key={i} layout className={cn('h-1.5 rounded-full', i < n ? '' : 'bg-white/15')}
                         animate={{ width: i === n - 1 ? 24 : 8 }}
                         style={i < n ? { background: LIME } : undefined} />
          ))}
        </div>
        <span className="shrink-0 text-[13px] tabular-nums text-white/40">{n}/{total}</span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={current} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE }}>
          {body}
        </motion.div>
      </AnimatePresence>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.08] bg-black/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-xl items-center justify-between gap-3 px-5 sm:px-8">
          <button type="button" onClick={back}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-white/[0.08]">
            <ArrowLeft className="h-4 w-4" />Back
          </button>
          <button type="button" onClick={skip}
                  className="h-12 rounded-full px-4 text-[15px] font-medium text-white/50 transition-colors hover:bg-white/[0.07] hover:text-white">
            {isRequired ? 'Not sure, skip' : 'Skip'}
          </button>
        </div>
      </div>
    </div>
  )
}
