'use client'

/**
 * The quotes we have sent this client, on their dashboard.
 *
 * A sales quote is a share link (`/p/{token}`): a few creators to preview, an agreement to
 * sign and an advance to pay, after which the full line-up opens in the app. It used to be
 * reachable only from Documents, as the row of its advance invoice, so a client who had
 * just been sent one had to know to look there (founder, 4 Nov 2026).
 *
 * Read from the same paperwork feed as Documents, so the two can never disagree. Renders
 * nothing when there is no quote.
 */

import { ArrowUpRight, ScrollText } from 'lucide-react'
import { usePaperwork, type PaperItem } from '@/components/billing/PaperworkGrid'

const shortTitle = (t: string) => (t.includes(' × ') ? t.split(' × ').slice(1).join(' × ') : t)
const aed = (n?: number | null) =>
  n == null ? null : `AED ${Number(n).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`

export function OpenQuotesCard() {
  const { items, loading, failed } = usePaperwork()
  if (loading || failed) return null

  // One card per quote link, newest first. A quote can carry several invoices.
  const byLink = new Map<string, PaperItem[]>()
  for (const it of items) {
    if (it.module !== 'sales_link' || !it.href) continue
    byLink.set(it.href, [...(byLink.get(it.href) || []), it])
  }
  const quotes = [...byLink.entries()]
    .map(([href, rows]) => {
      const sorted = [...rows].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      const open = sorted.find((r) => r.kind === 'invoice' && r.status !== 'paid')
      return { href, title: shortTitle(sorted[0].title), open, date: sorted[0].date || '' }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
  if (quotes.length === 0) return null

  return (
    <section className="flex flex-col gap-ds-3" aria-label="Your quotes">
      {quotes.map((q) => (
        <a
          key={q.href}
          href={q.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-wrap items-center gap-4 rounded-ds-2xl border border-black/[0.06] bg-card p-5 shadow-[0_1px_2px_rgba(16,20,12,0.04),0_12px_28px_-16px_rgba(16,20,12,0.18)] transition hover:border-black/15 dark:border-white/[0.07] sm:flex-nowrap"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#d3ff02] text-[#111]">
            <ScrollText className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your quote</span>
            <span className="truncate text-[19px] font-bold tracking-tight">{q.title}</span>
            <span className="text-[13.5px] text-muted-foreground">
              {q.open
                ? `Sign the agreement and pay the advance${aed(q.open.amount) ? ` of ${aed(q.open.amount)}` : ''} to see every creator`
                : 'Paid. Your full line-up is open.'}
            </span>
          </span>
          <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#111] px-5 text-[14px] font-semibold text-white transition group-hover:bg-black dark:bg-white dark:text-[#111]">
            View quote<ArrowUpRight className="size-4" />
          </span>
        </a>
      ))}
    </section>
  )
}
