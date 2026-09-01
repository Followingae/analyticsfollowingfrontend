'use client'

/**
 * One invoice list, two sources.
 *
 * A client is billed by us in two entirely different ways and has never been
 * told which is which, because there is no reason they should care:
 *
 *   - Stripe raises the subscription invoice when a card is on file.
 *   - We raise the campaign invoice ourselves — advance, interim, final, and
 *     now module subscriptions — in `campaign_invoices`, settled by transfer.
 *
 * Every managed client in the system is billed the second way, and until this
 * hook existed the billing page could only ever show the first. This merges
 * both into one chronological list of the same shape.
 *
 * Three states, kept distinct on purpose: `loading`, loaded (which may be
 * genuinely empty), and failed. A source that did not answer is recorded in
 * `failedSources` and its numbers are `null` — never 0. A zero on an invoice
 * line is a statement that nothing is owed, and we do not get to say that
 * about a request that never came back.
 */

import { useCallback, useEffect, useState } from 'react'
import { API_CONFIG, ENDPOINTS, getAuthHeaders } from '@/config/api'

export type InvoiceSource = 'stripe' | 'campaign'

/** Honest states. `sent` is "raised and awaiting payment"; `overdue` is that
 *  same invoice past its due date. Neither is inferred when we lack a date. */
export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'void'
  | 'uncollectible'
  | 'unknown'

export interface UnifiedInvoice {
  key: string
  source: InvoiceSource
  /** The invoice number where one exists. Campaign invoices carry no number
   *  column, so this is null for them and renders as an em dash rather than a
   *  reference we made up. */
  reference: string | null
  /** What the money is for, in the client's language. */
  what: string
  /** Sort key. ISO date string. */
  dateIso: string
  /** Period covered, when the source knows one. */
  period: string | null
  currency: string
  /** Major units (AED / USD), never cents. `null` = the source does not carry
   *  this figure — a legacy invoice with no VAT breakdown, for instance. */
  net: number | null
  vat: number | null
  gross: number | null
  outstanding: number | null
  status: InvoiceStatus
  dueDateIso: string | null
  paymentReference: string | null
  /** A PDF to download, if there is one. */
  fileUrl: string | null
  /** A page to open — Stripe's hosted invoice, or a payment link. */
  viewUrl: string | null
  receiptCount: number
}

interface StripeInvoice {
  id: string
  number: string | null
  status: string
  amount_due: number
  amount_paid: number
  currency: string
  created: number
  period_start: number
  period_end: number
  invoice_pdf: string | null
  hosted_invoice_url: string | null
  description: string | null
  lines_description: string | null
}

interface CampaignInvoice {
  id: string
  invoice_type: string | null
  label: string | null
  campaign_name: string | null
  currency: string
  net: number | null
  vat: number | null
  vat_rate: number | null
  gross: number | null
  amount_paid: number | null
  outstanding: number | null
  status: string | null
  due_date: string | null
  paid_at: string | null
  created_at: string | null
  period_start: string | null
  period_end: string | null
  payment_reference: string | null
  payment_link_url: string | null
  file_url: string | null
  receipt_count: number
}

const isPast = (iso: string | null): boolean => {
  if (!iso) return false
  const due = new Date(iso)
  if (Number.isNaN(due.getTime())) return false
  // End of the due day — an invoice is not late on the morning it falls due.
  due.setHours(23, 59, 59, 999)
  return due.getTime() < Date.now()
}

const shortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const TYPE_LABEL: Record<string, string> = {
  advance: 'Advance payment',
  interim: 'Interim payment',
  final: 'Final payment',
  subscription: 'Subscription',
}

function fromStripe(inv: StripeInvoice): UnifiedInvoice {
  const status: InvoiceStatus =
    inv.status === 'paid' ? 'paid'
    : inv.status === 'draft' ? 'draft'
    : inv.status === 'void' ? 'void'
    : inv.status === 'uncollectible' ? 'uncollectible'
    : inv.status === 'open' ? 'sent'
    : 'unknown'

  const gross = (inv.amount_due ?? 0) / 100
  const paid = (inv.amount_paid ?? 0) / 100
  const settled = status === 'paid' || status === 'void'

  return {
    key: `stripe:${inv.id}`,
    source: 'stripe',
    reference: inv.number || null,
    what: inv.lines_description || inv.description || 'Subscription',
    dateIso: new Date((inv.created || 0) * 1000).toISOString(),
    period:
      inv.period_start && inv.period_end
        ? `${shortDate(new Date(inv.period_start * 1000).toISOString())} – ${shortDate(new Date(inv.period_end * 1000).toISOString())}`
        : null,
    currency: (inv.currency || 'usd').toUpperCase(),
    // Stripe does not break VAT out on this payload. Null, not zero: we do not
    // know what tax was on it, so we do not print a tax line.
    net: null,
    vat: null,
    gross: status === 'paid' ? paid : gross,
    outstanding: settled ? 0 : Math.max(gross - paid, 0),
    status,
    dueDateIso: null,
    paymentReference: null,
    fileUrl: inv.invoice_pdf || null,
    viewUrl: inv.hosted_invoice_url || null,
    receiptCount: 0,
  }
}

function fromCampaign(inv: CampaignInvoice): UnifiedInvoice {
  const overdue = isPast(inv.due_date) && inv.status !== 'paid'
  const status: InvoiceStatus =
    inv.status === 'paid' ? 'paid'
    : overdue ? 'overdue'
    : inv.status === 'partial' ? 'partial'
    : inv.status === 'unpaid' ? 'sent'
    : 'unknown'

  // "Advance" on its own tells a client nothing — every one of them is called
  // that. The campaign or proposal name is what makes the row identifiable.
  const kind = inv.label || TYPE_LABEL[inv.invoice_type || ''] || 'Invoice'
  const what = inv.campaign_name ? `${kind} — ${inv.campaign_name}` : kind

  return {
    key: `campaign:${inv.id}`,
    source: 'campaign',
    // No number column on campaign_invoices. An em dash is the truth.
    reference: null,
    what,
    dateIso: inv.due_date || inv.created_at || new Date(0).toISOString(),
    period:
      inv.period_start && inv.period_end
        ? `${shortDate(inv.period_start)} – ${shortDate(inv.period_end)}`
        : null,
    currency: inv.currency || 'AED',
    net: inv.net,
    vat: inv.vat,
    gross: inv.gross,
    outstanding: inv.status === 'paid' ? 0 : inv.outstanding,
    status,
    dueDateIso: inv.due_date,
    paymentReference: inv.payment_reference,
    fileUrl: inv.file_url,
    viewUrl: inv.payment_link_url,
    receiptCount: inv.receipt_count || 0,
  }
}

export interface AccountInvoicesResult {
  invoices: UnifiedInvoice[]
  loading: boolean
  /** Which sources did not answer. Empty list + no failures = genuinely empty. */
  failedSources: InvoiceSource[]
  /** Both sources failed: we know nothing, so the screen must say so. */
  failed: boolean
  /** Sum of what is still owed, in AED-major units per currency group. `null`
   *  when any contributing source failed — a partial total is a wrong total. */
  outstandingByCurrency: Record<string, number> | null
  reload: () => void
}

export function useAccountInvoices(enabled: boolean): AccountInvoicesResult {
  const [invoices, setInvoices] = useState<UnifiedInvoice[]>([])
  const [loading, setLoading] = useState(enabled)
  const [failedSources, setFailedSources] = useState<InvoiceSource[]>([])

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    // getAuthHeaders returns a union: the signed-out shape has no Authorization
    // key at all, so reading it directly does not typecheck. Widen rather than
    // assert, because the whole point of the check is that it may be absent.
    const headers = getAuthHeaders() as Record<string, string>
    if (!headers.Authorization) {
      setInvoices([])
      setFailedSources(['stripe', 'campaign'])
      setLoading(false)
      return
    }

    const get = async (path: string) => {
      const res = await fetch(`${API_CONFIG.BASE_URL}${path}`, { headers })
      if (!res.ok) throw new Error(`${res.status}`)
      return res.json()
    }

    const [stripeRes, campaignRes] = await Promise.allSettled([
      get(ENDPOINTS.billing.invoices),
      get(ENDPOINTS.billing.accountInvoices),
    ])

    const rows: UnifiedInvoice[] = []
    const failures: InvoiceSource[] = []

    if (stripeRes.status === 'fulfilled') {
      rows.push(...((stripeRes.value?.invoices || []) as StripeInvoice[]).map(fromStripe))
    } else {
      failures.push('stripe')
    }
    if (campaignRes.status === 'fulfilled') {
      rows.push(...((campaignRes.value?.invoices || []) as CampaignInvoice[]).map(fromCampaign))
    } else {
      failures.push('campaign')
    }

    rows.sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime())
    setInvoices(rows)
    setFailedSources(failures)
    setLoading(false)
  }, [enabled])

  useEffect(() => { void load() }, [load])

  const outstandingByCurrency = failedSources.length > 0
    ? null
    : invoices.reduce<Record<string, number>>((acc, inv) => {
        if (inv.outstanding && inv.outstanding > 0) {
          acc[inv.currency] = Math.round(((acc[inv.currency] || 0) + inv.outstanding) * 100) / 100
        }
        return acc
      }, {})

  return {
    invoices,
    loading,
    failedSources,
    failed: failedSources.length === 2,
    outstandingByCurrency,
    reload: () => { void load() },
  }
}

/** Money, or an em dash. There is no third answer. */
export const money = (value: number | null, currency: string): string =>
  value === null || value === undefined
    ? '—'
    : new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
      }).format(value)

export const invoiceDate = (iso: string | null): string =>
  iso ? shortDate(iso) : '—'

export const STATUS_COPY: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-0' },
  sent: { label: 'Awaiting payment', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0' },
  partial: { label: 'Partially paid', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-0' },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-0' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-0' },
  void: { label: 'Void', className: 'bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border-0' },
  uncollectible: { label: 'Uncollectible', className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-0' },
  unknown: { label: 'Unknown', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border-0' },
}

/** CSV of exactly what is on screen. Empty cells where a figure is unknown —
 *  a spreadsheet full of zeros would be read as "nothing owed". */
export function invoicesToCsv(rows: UnifiedInvoice[]): string {
  const head = [
    'Number', 'Description', 'Raised by', 'Date', 'Due date',
    'Currency', 'Net', 'VAT', 'Gross', 'Outstanding', 'Status', 'Payment reference',
  ]
  const cell = (v: string | number | null) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = rows.map((r) => [
    r.reference,
    r.what,
    r.source === 'stripe' ? 'Subscription' : 'Following',
    invoiceDate(r.dateIso),
    invoiceDate(r.dueDateIso),
    r.currency,
    r.net,
    r.vat,
    r.gross,
    r.outstanding,
    STATUS_COPY[r.status].label,
    r.paymentReference,
  ].map(cell).join(','))
  return [head.join(','), ...lines].join('\n')
}
