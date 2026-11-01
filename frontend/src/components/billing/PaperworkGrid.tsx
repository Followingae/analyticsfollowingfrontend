'use client'

/**
 * Everything we have issued a client, from every module, drawn two ways.
 *
 * A client buys from us through five doors: a sales link before they have an account, a
 * proposal, a campaign, creator contracting, and the plan. One read
 * (/api/v1/client/paperwork) brings all of it back, each row tagged with its door.
 *
 *   InvoicesView   Billing. Money is the subject, so the page leads with one figure (what
 *                  is outstanding) and one action (what is due next). Invoices to pay are
 *                  large and have real buttons; paid ones are small quiet tiles, because a
 *                  settled invoice is something you look up, not something you act on.
 *   DocumentShelf  Documents. Files are the subject, so each one is drawn as a file: a
 *                  paper thumbnail coloured by type, its name, its state. Nothing else.
 *
 * WHY NOT ONE CARD FOR BOTH. Three passes tried one card and kept adding words to it until
 * it answered both questions, which is how it became a wall of identical boxes each repeating
 * "Invoice" on a page that only holds invoices. A page that knows its subject can say less.
 *
 * Money that did not load is never a zero, and a failed read is never shown as "nothing".
 */

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight, BadgeCheck, Check, ChevronDown, CreditCard, Download, FileSignature, Link2,
  Megaphone, ReceiptText, ScrollText, Wallet,
} from 'lucide-react'
import { LoadFailed, Loading } from '@/components/brand/primitives'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

const KIND: Record<PaperKind, { label: string; plural: string; Icon: typeof Link2; sheet: string; mark: string }> = {
  invoice: { label: 'Invoice', plural: 'Invoices', Icon: ReceiptText,
    sheet: 'bg-[#f7ffd6] dark:bg-[#d3ff02]/10', mark: 'bg-[#d3ff02] text-[#111]' },
  agreement: { label: 'Agreement', plural: 'Agreements', Icon: FileSignature,
    sheet: 'bg-[#f2f2f0] dark:bg-white/[0.06]', mark: 'bg-[#111] text-[#d3ff02] dark:bg-white dark:text-[#111]' },
  receipt: { label: 'Receipt', plural: 'Receipts', Icon: BadgeCheck,
    sheet: 'bg-emerald-50 dark:bg-emerald-950/40', mark: 'bg-emerald-600 text-white' },
}

const figure = (n: number | null | undefined) =>
  n == null ? '—' : Number(n).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const day = (iso?: string | null, year = false) =>
  !iso ? '' : new Date(iso).toLocaleDateString('en-GB',
    year ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' })

const isLate = (it: PaperItem) =>
  it.status === 'unpaid' && !!it.due_date && new Date(it.due_date).setHours(23, 59, 59) < Date.now()

/* "Pizza Hut × Ramadan Iftar 2027" on Pizza Hut's own account: the client's name says
   nothing to them. The part after the × is what tells two documents apart. */
const shortTitle = (t: string) => (t.includes(' × ') ? t.split(' × ').slice(1).join(' × ') : t)

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

type Data = ReturnType<typeof usePaperwork>

const ROUND = 'flex size-10 items-center justify-center rounded-full border border-black/[0.08] text-foreground/70 ' +
  'transition hover:border-black/25 hover:text-foreground dark:border-white/[0.12] dark:hover:border-white/30'

function OpenLink({ href, className, children, label }: {
  href: string; className: string; children: React.ReactNode; label: string
}) {
  return href.startsWith('/p/')
    ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={className}>{children}</a>
    : <Link href={href} aria-label={label} title={label} className={className}>{children}</Link>
}

// ── A quiet source filter, one control instead of a row of chips ────────────────────────
function SourceMenu({ items, pick, setPick }: {
  items: PaperItem[]; pick: PaperModule | 'all'; setPick: (m: PaperModule | 'all') => void
}) {
  const present = (Object.keys(MODULE) as PaperModule[]).filter(m => items.some(i => i.module === m))
  if (present.length < 2) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px]
                                      text-muted-foreground transition hover:bg-black/[0.04] hover:text-foreground">
        {pick === 'all' ? 'Everything' : MODULE[pick].label}<ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {(['all', ...present] as const).map(m => (
          <DropdownMenuItem key={m} onClick={() => setPick(m)} className="justify-between gap-6">
            {m === 'all' ? 'Everything' : MODULE[m].label}
            {pick === m && <Check className="size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// Billing
// ═══════════════════════════════════════════════════════════════════════════════════════

export function InvoicesView({ data }: { data: Data }) {
  const [pick, setPick] = useState<PaperModule | 'all'>('all')
  const invoices = useMemo(() => data.items.filter(i => i.kind === 'invoice'), [data.items])

  if (data.loading) return <Loading rows={3} />
  if (data.failed) return <LoadFailed what="your invoices" onRetry={data.reload} />
  if (!invoices.length) {
    return (
      <div className="rounded-3xl bg-white px-8 py-20 text-center dark:bg-white/[0.03]">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#d3ff02] text-[#111]">
          <ReceiptText className="size-6" strokeWidth={1.75} />
        </span>
        <p className="mt-6 text-[17px] font-medium">No invoices yet</p>
      </div>
    )
  }

  const open = invoices.filter(i => i.status !== 'paid')
  const owed = open.reduce((n, i) => n + Math.max((i.amount || 0) - (i.paid || 0), 0), 0)
  const paidTotal = invoices.reduce((n, i) => n + (i.status === 'paid' ? (i.amount || 0) : (i.paid || 0)), 0)
  const share = owed + paidTotal > 0 ? (paidTotal / (owed + paidTotal)) * 100 : 0
  const next = [...open].sort((a, b) =>
    new Date(a.due_date || '2999').getTime() - new Date(b.due_date || '2999').getTime())[0]

  const shown = (list: PaperItem[]) => (pick === 'all' ? list : list.filter(i => i.module === pick))
  const toPay = shown(open)
  const settled = shown(invoices.filter(i => i.status === 'paid'))

  return (
    <div className="space-y-14">
      {/* One figure, one bar, one next action. */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl bg-white p-8 sm:p-10 dark:bg-white/[0.03]">
          <p className="text-[14px] text-muted-foreground">Outstanding</p>
          <p className="mt-3 flex items-baseline gap-2 tabular-nums">
            <span className="text-[18px] font-medium text-muted-foreground">AED</span>
            <span className="text-[52px] font-semibold leading-none tracking-[-0.035em]">{figure(owed)}</span>
          </p>
          <div className="mt-10 h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
            <div className="h-full rounded-full bg-[#111] dark:bg-white" style={{ width: `${share}%` }} />
          </div>
          <div className="mt-3 flex justify-between text-[13px] tabular-nums text-muted-foreground">
            <span>Paid AED {figure(paidTotal)}</span>
            <span>{open.length} to pay</span>
          </div>
        </div>

        {next ? (
          <div className="flex flex-col rounded-3xl bg-[#d3ff02] p-8 text-[#111] sm:p-10">
            <p className="text-[14px] opacity-70">{isLate(next) ? 'Past due' : 'Next due'}</p>
            <p className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.03em]">
              {next.due_date ? day(next.due_date) : 'Now'}
            </p>
            <p className="mt-3 truncate text-[15px] opacity-80">{shortTitle(next.title)}</p>
            <div className="mt-auto flex items-center justify-between pt-8">
              <span className="text-[17px] font-semibold tabular-nums">AED {figure(next.amount)}</span>
              {next.pay_url ? (
                <a href={next.pay_url} target="_blank" rel="noopener noreferrer"
                   className="rounded-full bg-[#111] px-5 py-2.5 text-[14px] font-medium text-white">Pay</a>
              ) : next.url ? (
                <a href={next.url} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 rounded-full bg-[#111] px-5 py-2.5 text-[14px] font-medium text-white">
                  <Download className="size-4" />Invoice
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center rounded-3xl bg-white p-10 dark:bg-white/[0.03]">
            <Check className="size-6" />
            <p className="mt-4 text-[20px] font-semibold">All settled</p>
          </div>
        )}
      </div>

      {toPay.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-semibold tracking-[-0.01em]">To pay</h2>
            <SourceMenu items={invoices} pick={pick} setPick={setPick} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {toPay.map(it => <DueCard key={it.id} it={it} />)}
          </div>
        </section>
      )}

      {settled.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-semibold tracking-[-0.01em]">Paid</h2>
            {toPay.length === 0 && <SourceMenu items={invoices} pick={pick} setPick={setPick} />}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {settled.map(it => <PaidTile key={it.id} it={it} />)}
          </div>
        </section>
      )}
    </div>
  )
}

/* An invoice somebody still has to pay: large, with its actions spelled out. */
function DueCard({ it }: { it: PaperItem }) {
  const mod = MODULE[it.module] ?? MODULE.campaign
  const late = isLate(it)
  return (
    <article className="flex items-center gap-6 rounded-3xl bg-white p-7 dark:bg-white/[0.03]">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#f2f2f0] dark:bg-white/[0.06]"
            title={mod.label}>
        <mod.Icon className="size-6" strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-medium">{shortTitle(it.title)}</p>
        <p className={cn('mt-1 text-[13px]', late ? 'text-rose-600' : 'text-muted-foreground')}>
          {late ? 'Past due' : it.due_date ? `Due ${day(it.due_date)}` : mod.label}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-3">
        <p className="text-[22px] font-semibold tabular-nums tracking-[-0.02em]">
          <span className="mr-1 text-[13px] font-medium text-muted-foreground">AED</span>{figure(it.amount)}
        </p>
        <div className="flex items-center gap-2">
          {it.url && (
            <a href={it.url} target="_blank" rel="noopener noreferrer" className={ROUND} aria-label="Download invoice" title="Download invoice">
              <Download className="size-4" />
            </a>
          )}
          {it.href && <OpenLink href={it.href} className={ROUND} label="Open"><ArrowUpRight className="size-4" /></OpenLink>}
        </div>
      </div>
    </article>
  )
}

/* A settled invoice: something you look up, so it stays out of the way. */
function PaidTile({ it }: { it: PaperItem }) {
  const mod = MODULE[it.module] ?? MODULE.campaign
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[#f2f2f0] dark:bg-white/[0.06]" title={mod.label}>
          <mod.Icon className="size-4" strokeWidth={1.75} />
        </span>
        <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white" title="Paid">
          <Check className="size-3.5" strokeWidth={2.5} />
        </span>
      </div>
      <p className="mt-6 text-[19px] font-semibold tabular-nums tracking-[-0.02em]">
        <span className="mr-1 text-[12px] font-medium text-muted-foreground">AED</span>{figure(it.amount)}
      </p>
      <p className="mt-1 truncate text-[13px] text-muted-foreground">{shortTitle(it.title)}</p>
    </>
  )
  const cls = 'block rounded-2xl bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-14px_rgba(0,0,0,0.15)] dark:bg-white/[0.03]'
  return it.url
    ? <a href={it.url} target="_blank" rel="noopener noreferrer" className={cls} title="Download invoice">{body}</a>
    : it.href ? <OpenLink href={it.href} className={cls} label="Open">{body}</OpenLink>
      : <div className={cls}>{body}</div>
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// Documents
// ═══════════════════════════════════════════════════════════════════════════════════════

export function DocumentShelf({ data, empty }: { data: Data; empty: string }) {
  if (data.loading) return <Loading rows={3} />
  if (data.failed) return <LoadFailed what="your documents" onRetry={data.reload} />
  if (!data.items.length) {
    return <p className="rounded-3xl bg-white px-8 py-20 text-center text-[15px] text-muted-foreground dark:bg-white/[0.03]">{empty}</p>
  }
  return (
    <div className="space-y-14">
      {(['agreement', 'invoice', 'receipt'] as PaperKind[]).map(k => {
        const list = data.items.filter(i => i.kind === k)
        if (!list.length) return null
        return (
          <section key={k} className="space-y-6">
            <h2 className="text-[20px] font-semibold tracking-[-0.01em]">{KIND[k].plural}</h2>
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
              {list.map(it => <FileTile key={it.id} it={it} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/* One file, drawn as a file: a sheet coloured by type, then its name and its state. */
function FileTile({ it }: { it: PaperItem }) {
  const k = KIND[it.kind]
  const state =
    it.kind === 'agreement' ? (it.status === 'signed' ? ['Signed', 'bg-emerald-500'] : ['To sign', 'bg-amber-400'])
    : it.kind === 'receipt' ? ['Received', 'bg-emerald-500']
    : it.status === 'paid' ? ['Paid', 'bg-emerald-500']
    : isLate(it) ? ['Past due', 'bg-rose-500'] : ['To pay', 'bg-amber-400']

  return (
    <div className="group">
      <div className={cn('relative aspect-[3/4] overflow-hidden rounded-2xl transition duration-300',
                         'group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.25)]', k.sheet)}>
        {/* The sheet, drawn as a document: its mark, a heading, ruled lines, and the total
            where a total sits on the real thing. Reads as paper before it is read as text. */}
        <div className="absolute inset-0 flex flex-col p-4">
          <span className={cn('flex size-8 items-center justify-center rounded-lg', k.mark)}>
            <k.Icon className="size-4" strokeWidth={1.75} />
          </span>
          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 w-3/5 rounded-full bg-black/20 dark:bg-white/25" />
            <div className="h-1 w-full rounded-full bg-black/[0.08] dark:bg-white/10" />
            <div className="h-1 w-11/12 rounded-full bg-black/[0.08] dark:bg-white/10" />
            <div className="h-1 w-4/5 rounded-full bg-black/[0.08] dark:bg-white/10" />
            <div className="h-1 w-full rounded-full bg-black/[0.08] dark:bg-white/10" />
            <div className="h-1 w-2/3 rounded-full bg-black/[0.08] dark:bg-white/10" />
          </div>
          <div className="mt-auto border-t border-black/10 pt-2 text-right dark:border-white/10">
            {it.kind !== 'agreement' && it.amount != null ? (
              <span className="text-[12.5px] font-semibold tabular-nums">{figure(it.amount)}</span>
            ) : (
              <span className="inline-block h-4 w-14 border-b border-black/30 dark:border-white/30" />
            )}
          </div>
        </div>
        {/* Actions appear on the sheet when you reach for it. */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition
                        group-hover:bg-black/[0.04] group-hover:opacity-100">
          {it.url && (
            <a href={it.url} target="_blank" rel="noopener noreferrer"
               className="flex size-11 items-center justify-center rounded-full bg-white text-[#111] shadow-md"
               aria-label="Download" title={it.kind === 'agreement' && it.status === 'to_sign' ? 'Download to sign' : 'Download'}>
              <Download className="size-4" />
            </a>
          )}
          {it.href && (
            <OpenLink href={it.href} label="Open"
                      className="flex size-11 items-center justify-center rounded-full bg-white text-[#111] shadow-md">
              <ArrowUpRight className="size-4" />
            </OpenLink>
          )}
        </div>
      </div>
      <p className="mt-3 truncate text-[14px] font-medium" title={it.title}>{shortTitle(it.title)}</p>
      <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
        <span className={cn('size-1.5 rounded-full', state[1])} />{state[0]}
      </p>
    </div>
  )
}
