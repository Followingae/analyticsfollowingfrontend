'use client'

/**
 * Everything we have issued a client, as cards, from every module at once.
 *
 * A client buys from us through five doors: a sales link before they have an account, a
 * proposal, a campaign, creator contracting, and the plan. Each door kept its paperwork in
 * its own table, so Billing showed two of them and Documents showed only signed files. One
 * read now (/api/v1/client/paperwork), every row tagged with the door it came through, and
 * both pages draw from it: Billing the money, Documents the files.
 *
 * THE CARD COMES FIRST. One document per card, and the card answers three things in this
 * order: what it is (the type, as an icon and a word), how much and for what, and what it
 * is waiting on. Everything else is a single quiet line or an icon button. The first pass
 * stacked two badges, a label, a date sentence and a footer sentence on every card and
 * read as a wall of text.
 *
 * Same rules as the rest of billing: money that did not load is never a zero, and a failed
 * read is never shown as "nothing".
 */

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight, BadgeCheck, CreditCard, Download, FileSignature, Link2, Megaphone,
  ReceiptText, ScrollText, Wallet,
} from 'lucide-react'
import { LoadFailed, Loading } from '@/components/brand/primitives'
import { API_CONFIG, getAuthHeaders } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cn } from '@/lib/utils'

export type PaperKind = 'invoice' | 'agreement' | 'receipt'
export type PaperModule = 'sales_link' | 'proposal' | 'campaign' | 'creator_contracting' | 'plan'

export interface PaperItem {
  id: string
  kind: PaperKind
  module: PaperModule
  title: string
  label: string
  status: 'paid' | 'partial' | 'unpaid' | 'signed' | 'to_sign'
  amount?: number | null
  paid?: number | null
  currency?: string
  date?: string | null
  due_date?: string | null
  paid_at?: string | null
  url?: string | null
  pay_url?: string | null
  href?: string | null
}

export const MODULE: Record<PaperModule, { label: string; Icon: typeof Link2 }> = {
  sales_link: { label: 'Sales link', Icon: Link2 },
  proposal: { label: 'Proposal', Icon: ScrollText },
  campaign: { label: 'Campaign', Icon: Megaphone },
  creator_contracting: { label: 'Creator contracting', Icon: Wallet },
  plan: { label: 'Plan', Icon: CreditCard },
}

/* The type is the first thing on the card, so each one has its own tile. */
const KIND: Record<PaperKind, { label: string; plural: string; Icon: typeof Link2; tile: string }> = {
  invoice: { label: 'Invoice', plural: 'Invoices', Icon: ReceiptText,
    tile: 'bg-[#d3ff02] text-[#111]' },
  agreement: { label: 'Agreement', plural: 'Agreements', Icon: FileSignature,
    tile: 'bg-[#111] text-[#d3ff02] dark:bg-white dark:text-[#111]' },
  receipt: { label: 'Receipt', plural: 'Receipts', Icon: BadgeCheck,
    tile: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
}

type Tone = 'good' | 'wait' | 'late'
const DOT: Record<Tone, string> = {
  good: 'bg-emerald-500', wait: 'bg-amber-400', late: 'bg-rose-500',
}

const day = (iso?: string | null, withYear = false) =>
  !iso ? null : new Date(iso).toLocaleDateString('en-GB',
    withYear ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' })

const figure = (n: number | null | undefined) =>
  n == null ? '—' : Number(n).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const isLate = (it: PaperItem) =>
  it.status === 'unpaid' && !!it.due_date && new Date(it.due_date).setHours(23, 59, 59) < Date.now()

/** What the document is waiting on, in three words or fewer, with its colour. */
function standing(it: PaperItem): { text: string; tone: Tone } {
  if (it.kind === 'agreement') {
    return it.status === 'signed' ? { text: 'Signed', tone: 'good' } : { text: 'To sign', tone: 'wait' }
  }
  if (it.kind === 'receipt') return { text: 'Received', tone: 'good' }
  if (it.status === 'paid') return { text: 'Paid', tone: 'good' }
  if (isLate(it)) return { text: 'Past due', tone: 'late' }
  if (it.status === 'partial') return { text: 'Part paid', tone: 'wait' }
  return { text: it.due_date ? `Due ${day(it.due_date)}` : 'To pay', tone: 'wait' }
}

export function usePaperwork() {
  const [items, setItems] = useState<PaperItem[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [onATeam, setOnATeam] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/client/paperwork`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error(String(res.status))
      const body = await res.json()
      setItems(body?.data?.items || [])
      setOnATeam(body?.data?.on_a_team !== false)
    } catch {
      setItems([])
      setFailed(true)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])
  return { items, loading, failed, onATeam, reload: load }
}

// ── The card ────────────────────────────────────────────────────────────────────────────
export function PaperCard({ it }: { it: PaperItem }) {
  const kind = KIND[it.kind]
  const mod = MODULE[it.module] ?? MODULE.campaign
  const st = standing(it)
  const external = !!it.href && it.href.startsWith('/p/')
  /* Every title on a client's own account starts with their own name ("Pizza Hut × ..."),
     which says nothing to them. The part after the × is what tells two cards apart. */
  const title = it.title.includes(' × ') ? it.title.split(' × ').slice(1).join(' × ') : it.title

  const openBtn = it.href && (external
    ? <a href={it.href} target="_blank" rel="noopener noreferrer" aria-label="Open" className={iconBtn}><ArrowUpRight className="h-4 w-4" /></a>
    : <Link href={it.href} aria-label="Open" className={iconBtn}><ArrowUpRight className="h-4 w-4" /></Link>)

  return (
    <article className="group flex flex-col rounded-2xl border border-black/[0.06] bg-white p-6
                        shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition duration-200
                        hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.12)]
                        dark:border-white/[0.08] dark:bg-white/[0.03]">
      {/* What it is, and what it is waiting on. Nothing else above the figure. */}
      <div className="flex items-center justify-between">
        <span className={cn('inline-flex items-center gap-1.5 rounded-full py-1.5 pl-2.5 pr-3 text-[12px] font-medium', kind.tile)}>
          <kind.Icon className="h-3.5 w-3.5" strokeWidth={2} />{kind.label}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span className={cn('h-1.5 w-1.5 rounded-full', DOT[st.tone])} />{st.text}
        </span>
      </div>

      {it.kind !== 'agreement' ? (
        <p className="mt-8 flex items-baseline gap-1.5 tabular-nums">
          <span className="text-[13px] font-medium text-muted-foreground">{it.currency || 'AED'}</span>
          <span className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-foreground">{figure(it.amount)}</span>
        </p>
      ) : null}
      <h3 className={cn('truncate text-foreground',
                        it.kind === 'agreement' ? 'mt-8 text-[20px] font-semibold tracking-[-0.01em]' : 'mt-2 text-[15px]')}
          title={it.title}>
        {title}
      </h3>

      <div className="mt-auto flex items-center justify-between pt-8">
        <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <mod.Icon className="h-3.5 w-3.5" strokeWidth={1.75} />{mod.label}
        </span>
        <span className="flex items-center gap-1.5">
          {it.pay_url && it.status !== 'paid' && (
            <a href={it.pay_url} target="_blank" rel="noopener noreferrer"
               className="rounded-full bg-[#d3ff02] px-3.5 py-1.5 text-[13px] font-medium text-[#111] transition hover:brightness-95">
              Pay
            </a>
          )}
          {it.url && (
            <a href={it.url} target="_blank" rel="noopener noreferrer"
               aria-label={it.kind === 'agreement' && it.status === 'to_sign' ? 'Download to sign' : 'Download PDF'}
               title={it.kind === 'agreement' && it.status === 'to_sign' ? 'Download to sign' : 'Download PDF'}
               className={iconBtn}>
              <Download className="h-4 w-4" />
            </a>
          )}
          {openBtn}
        </span>
      </div>
    </article>
  )
}

const iconBtn = 'flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] text-foreground/70 ' +
  'transition hover:border-black/20 hover:text-foreground dark:border-white/[0.12] dark:hover:border-white/30'

// ── The money at a glance (Billing) ─────────────────────────────────────────────────────
export function MoneySummary({ items }: { items: PaperItem[] }) {
  const invoices = items.filter(i => i.kind === 'invoice')
  const open = invoices.filter(i => i.status !== 'paid')
  const owed = open.reduce((n, i) => n + Math.max((i.amount || 0) - (i.paid || 0), 0), 0)
  const paid = invoices.reduce((n, i) => n + (i.status === 'paid' ? (i.amount || 0) : (i.paid || 0)), 0)
  const next = open.filter(i => i.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0]

  const cells = [
    { k: 'Outstanding', v: figure(owed), cur: true, s: `${open.length} to pay` },
    { k: 'Paid', v: figure(paid), cur: true, s: `${invoices.length - open.length} settled` },
    { k: 'Next due', v: next ? day(next.due_date, true)! : 'Nothing', cur: false,
      s: next ? `AED ${figure(next.amount)}` : 'You are all square' },
  ]
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-black/[0.06] bg-black/[0.06]
                    sm:grid-cols-3 dark:border-white/[0.08] dark:bg-white/[0.08]">
      {cells.map(c => (
        <div key={c.k} className="bg-white px-7 py-6 dark:bg-[#0b0b0d]">
          <p className="text-[13px] text-muted-foreground">{c.k}</p>
          <p className="mt-2 flex items-baseline gap-1.5 tabular-nums">
            {c.cur && <span className="text-[13px] font-medium text-muted-foreground">AED</span>}
            <span className="text-[28px] font-semibold leading-none tracking-[-0.02em]">{c.v}</span>
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">{c.s}</p>
        </div>
      ))}
    </div>
  )
}

// ── A titled group of cards ─────────────────────────────────────────────────────────────
function Section({ title, items }: { title: string; items: PaperItem[] }) {
  if (!items.length) return null
  return (
    <section className="space-y-5">
      <h2 className="flex items-baseline gap-2 text-[15px] font-medium text-foreground">
        {title}<span className="text-[13px] font-normal text-muted-foreground tabular-nums">{items.length}</span>
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(it => <PaperCard key={it.id} it={it} />)}
      </div>
    </section>
  )
}

// ── The page body: a quiet filter, then sections ────────────────────────────────────────
export function PaperworkGrid({
  data, kinds, groupBy, empty,
}: {
  data: ReturnType<typeof usePaperwork>
  kinds: PaperKind[]
  /** Billing groups by what is owed; Documents by what the file is. */
  groupBy: 'standing' | 'kind'
  empty: string
}) {
  const [pick, setPick] = useState<PaperModule | 'all'>('all')
  const mine = useMemo(() => data.items.filter(i => kinds.includes(i.kind)), [data.items, kinds])
  const modules = useMemo(
    () => (Object.keys(MODULE) as PaperModule[]).filter(m => mine.some(i => i.module === m)), [mine])

  if (data.loading) return <Loading rows={3} />
  if (data.failed) return <LoadFailed what="your paperwork" onRetry={data.reload} />
  if (!mine.length) {
    return (
      <div className="rounded-2xl border border-dashed border-black/[0.1] px-6 py-16 text-center dark:border-white/[0.12]">
        <p className="text-[15px] text-muted-foreground">{empty}</p>
      </div>
    )
  }

  const shown = pick === 'all' ? mine : mine.filter(i => i.module === pick)
  const sections = groupBy === 'standing'
    ? [
        { title: 'To pay', items: shown.filter(i => i.status !== 'paid') },
        { title: 'Paid', items: shown.filter(i => i.status === 'paid') },
      ]
    : kinds.map(k => ({ title: KIND[k].plural, items: shown.filter(i => i.kind === k) }))

  return (
    <div className="space-y-12">
      {modules.length > 1 && (
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-black/[0.06] bg-white p-1 sm:w-fit
                        dark:border-white/[0.08] dark:bg-white/[0.03]">
          {(['all', ...modules] as const).map(m => {
            const on = pick === m
            const n = m === 'all' ? mine.length : mine.filter(i => i.module === m).length
            return (
              <button key={m} onClick={() => setPick(m)}
                className={cn('rounded-full px-4 py-1.5 text-[13px] transition',
                  on ? 'bg-[#111] text-white dark:bg-white dark:text-[#111]' : 'text-muted-foreground hover:text-foreground')}>
                {m === 'all' ? 'All' : MODULE[m].label}
                <span className={cn('ml-1.5 tabular-nums', on ? 'opacity-60' : 'opacity-70')}>{n}</span>
              </button>
            )
          })}
        </div>
      )}
      {sections.map(s => <Section key={s.title} title={s.title} items={s.items} />)}
    </div>
  )
}
