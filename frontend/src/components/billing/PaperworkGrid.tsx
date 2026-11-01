'use client'

/**
 * Everything we have issued a client, as cards, from every module at once.
 *
 * A client buys from us through five doors: a sales link before they have an account, a
 * proposal, a campaign, creator contracting, and the plan. Each door kept its paperwork in
 * its own table, so Billing showed two of them, Documents showed only signed files, and an
 * account with a sent agreement and two invoices looked empty on one page and buried on the
 * other. One read now (/api/v1/client/paperwork), every row tagged with the door it came
 * through, and both pages draw from it: Billing the money, Documents the files.
 *
 * Same rules as the rest of billing: a row with no file still appears and says so, money
 * that did not load is never a zero, and a failed read is never shown as "nothing".
 */

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight, CreditCard, Download, FileSignature, FileText, Link2, Megaphone, Receipt,
  Wallet,
} from 'lucide-react'
import { LoadFailed, Loading } from '@/components/brand/primitives'
import { Button } from '@/components/ui/button'
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

const MODULE: Record<PaperModule, { label: string; Icon: typeof Link2 }> = {
  sales_link: { label: 'Sales link', Icon: Link2 },
  proposal: { label: 'Proposal', Icon: FileText },
  campaign: { label: 'Campaign', Icon: Megaphone },
  creator_contracting: { label: 'Creator contracting', Icon: Wallet },
  plan: { label: 'Plan', Icon: CreditCard },
}

const KIND: Record<PaperKind, { label: string; plural: string; Icon: typeof Link2 }> = {
  invoice: { label: 'Invoice', plural: 'Invoices', Icon: FileText },
  agreement: { label: 'Agreement', plural: 'Agreements', Icon: FileSignature },
  receipt: { label: 'Receipt', plural: 'Receipts', Icon: Receipt },
}

const STATUS: Record<PaperItem['status'], { label: string; tone: string }> = {
  paid: { label: 'Paid', tone: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]' },
  partial: { label: 'Part paid', tone: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]' },
  unpaid: { label: 'Awaiting payment', tone: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]' },
  signed: { label: 'Signed', tone: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]' },
  to_sign: { label: 'Awaiting your signature', tone: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]' },
}

const money = (n: number | null | undefined, currency = 'AED') =>
  n == null ? '—'
    : `${currency} ${Number(n).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const day = (iso?: string | null) =>
  !iso ? null : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const isLate = (it: PaperItem) =>
  it.status === 'unpaid' && !!it.due_date && new Date(it.due_date).setHours(23, 59, 59) < Date.now()

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

// ── The money at a glance (Billing only) ────────────────────────────────────────────────
export function MoneySummary({ items }: { items: PaperItem[] }) {
  const invoices = items.filter(i => i.kind === 'invoice')
  const owed = invoices.filter(i => i.status !== 'paid')
    .reduce((n, i) => n + Math.max((i.amount || 0) - (i.paid || 0), 0), 0)
  const paid = invoices.reduce((n, i) => n + (i.status === 'paid' ? (i.amount || 0) : (i.paid || 0)), 0)
  const next = invoices.filter(i => i.status !== 'paid' && i.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0]
  const late = invoices.filter(isLate).length

  const cells = [
    { k: 'Outstanding', v: money(owed), s: late ? `${late} past due` : `${invoices.filter(i => i.status !== 'paid').length} open` },
    { k: 'Paid to date', v: money(paid), s: `${invoices.filter(i => i.status === 'paid').length} invoices settled` },
    { k: 'Next due', v: next ? day(next.due_date) : 'Nothing due', s: next ? `${money(next.amount)} · ${next.title}` : 'You are all square' },
  ]
  return (
    <div className="grid overflow-hidden rounded-ds-xl border bg-card sm:grid-cols-3">
      {cells.map((c, i) => (
        <div key={c.k} className={cn('space-y-1 p-ds-4', i > 0 && 'border-t sm:border-l sm:border-t-0')}>
          <p className="text-ds-overline uppercase text-muted-foreground">{c.k}</p>
          <p className="text-[22px] font-semibold leading-tight tracking-[-0.01em] tabular-nums">{c.v}</p>
          <p className="truncate text-ds-caption text-muted-foreground">{c.s}</p>
        </div>
      ))}
    </div>
  )
}

// ── One card ────────────────────────────────────────────────────────────────────────────
function PaperCard({ it }: { it: PaperItem }) {
  const mod = MODULE[it.module] ?? MODULE.campaign
  const st = isLate(it) ? { label: 'Past due', tone: 'bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]' } : STATUS[it.status]
  const KindIcon = KIND[it.kind].Icon
  const external = !!it.href && it.href.startsWith('/p/')
  const when = it.kind === 'invoice'
    ? (it.status === 'paid' ? (it.paid_at ? `Paid ${day(it.paid_at)}` : `Issued ${day(it.date)}`)
      : it.due_date ? `Due ${day(it.due_date)}` : `Issued ${day(it.date)}`)
    : it.kind === 'agreement' ? (it.status === 'signed' ? `Signed ${day(it.date)}` : `Sent ${day(it.date)}`)
      : `Received ${day(it.date)}`

  return (
    <div className="group flex flex-col rounded-ds-xl border bg-card p-ds-4 transition hover:border-foreground/20 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-ds-full bg-muted px-2.5 py-1 text-ds-caption text-muted-foreground">
          <mod.Icon className="h-3.5 w-3.5" />{mod.label}
        </span>
        <span className={cn('shrink-0 rounded-ds-full px-2.5 py-1 text-ds-caption font-medium', st.tone)}>{st.label}</span>
      </div>

      <div className="mt-ds-3 flex items-start gap-ds-2">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-ds-lg bg-muted">
          <KindIcon className="h-4 w-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{it.title}</p>
          <p className="truncate text-ds-body-sm text-muted-foreground">{it.label}</p>
        </div>
      </div>

      {it.kind !== 'agreement' && (
        <p className="mt-ds-3 text-[22px] font-semibold tracking-[-0.01em] tabular-nums">
          {money(it.amount, it.currency)}
        </p>
      )}
      <p className={cn('text-ds-caption text-muted-foreground', it.kind === 'agreement' && 'mt-ds-3')}>{when}</p>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-ds-4">
        {it.url ? (
          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <a href={it.url} target="_blank" rel="noopener noreferrer">
              <Download className="h-3.5 w-3.5" />{it.kind === 'agreement' && it.status === 'to_sign' ? 'Download to sign' : 'Open PDF'}
            </a>
          </Button>
        ) : (
          <span className="text-ds-caption text-muted-foreground">The file is on its way</span>
        )}
        {it.pay_url && it.status !== 'paid' && (
          <Button size="sm" className="gap-1.5" asChild>
            <a href={it.pay_url} target="_blank" rel="noopener noreferrer">Pay now</a>
          </Button>
        )}
        {it.href && (
          <Button size="sm" variant="ghost" className="ml-auto gap-1 text-muted-foreground" asChild>
            {external
              ? <a href={it.href} target="_blank" rel="noopener noreferrer">Open<ArrowUpRight className="h-3.5 w-3.5" /></a>
              : <Link href={it.href}>Open<ArrowUpRight className="h-3.5 w-3.5" /></Link>}
          </Button>
        )}
      </div>
    </div>
  )
}

// ── The grid, with its filter ───────────────────────────────────────────────────────────
export function PaperworkGrid({
  data, kinds, filterBy, empty,
}: {
  data: ReturnType<typeof usePaperwork>
  kinds: PaperKind[]
  /** Billing filters by where the money came from; Documents by what the file is. */
  filterBy: 'module' | 'kind'
  empty: string
}) {
  const [pick, setPick] = useState<string>('all')
  const mine = useMemo(() => data.items.filter(i => kinds.includes(i.kind)), [data.items, kinds])

  const chips = useMemo(() => {
    const keys = filterBy === 'module'
      ? (Object.keys(MODULE) as PaperModule[]).filter(m => mine.some(i => i.module === m))
      : kinds.filter(k => mine.some(i => i.kind === k))
    return keys.map(k => ({
      key: k,
      label: filterBy === 'module' ? MODULE[k as PaperModule].label : KIND[k as PaperKind].plural,
      n: mine.filter(i => (filterBy === 'module' ? i.module : i.kind) === k).length,
    }))
  }, [mine, filterBy, kinds])

  if (data.loading) return <Loading rows={3} />
  if (data.failed) return <LoadFailed what="your paperwork" onRetry={data.reload} />

  const shown = pick === 'all' ? mine : mine.filter(i => (filterBy === 'module' ? i.module : i.kind) === pick)

  if (!mine.length) {
    return <p className="rounded-ds-xl border border-dashed p-ds-5 text-center text-ds-body-sm text-muted-foreground">{empty}</p>
  }

  return (
    <div className="space-y-ds-3">
      {chips.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {[{ key: 'all', label: 'All', n: mine.length }, ...chips].map(c => (
            <button key={c.key} onClick={() => setPick(c.key)}
              className={cn('inline-flex items-center gap-1.5 rounded-ds-full border px-3 py-1.5 text-ds-body-sm transition',
                pick === c.key ? 'border-foreground bg-foreground text-background' : 'bg-card hover:border-foreground/30')}>
              {c.label}<span className={cn('tabular-nums', pick === c.key ? 'opacity-70' : 'text-muted-foreground')}>{c.n}</span>
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-ds-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map(it => <PaperCard key={it.id} it={it} />)}
      </div>
    </div>
  )
}
