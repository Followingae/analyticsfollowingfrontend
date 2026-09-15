/**
 * Merchant of Record — paying a creator.
 * Mirrors app/api/mor_payment_routes.py.
 *
 * There is no campaign anywhere in this file, deliberately. A brand arrives having already
 * agreed terms with a creator and wants us to contract and pay them; the older payout
 * screens hang off a campaign id and are a different thing.
 *
 * MONEY. Every amount comes back twice: `*_cents` as an integer of fils, and `*_aed` for
 * display. Do arithmetic on cents if you must do any at all, and render the AED. Never add
 * up the AED numbers: they are already rounded.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/mor`

async function jfetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const needsCT = ['POST', 'PUT', 'PATCH'].includes(method)
  const res = await fetchWithAuth(url, {
    ...options,
    headers: { ...(needsCT ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Something went wrong (${res.status})`)
  }
  return res.json()
}

export type MorStatus = 'draft' | 'awaiting_payment' | 'funded' | 'paid' | 'cancelled'
export type AgreementStatus = 'pending' | 'sent' | 'signed'

export interface MorDeliverable {
  what: string
  quantity: number
}

/** What this client has left on a fee waiver. Drives the lime badge. */
export interface FeeFreeState {
  active: boolean
  allowed: number
  used: number
  remaining: number
  valid_until: string | null
  waiver_id: string | null
  /** They had one and it ran out. Worth saying differently from never having had one. */
  expired: boolean
}

export interface MorQuote {
  creator_fee_cents: number
  creator_fee_aed: number
  our_fee_pct: string
  our_fee_cents: number
  our_fee_aed: number
  fee_waived: boolean
  fee_waived_reason: string | null
  /** What the fee WOULD have been. Shown struck through beside a waiver. */
  standard_fee_pct: string
  net_aed: number
  vat_rate: string
  vat_label: string
  vat_aed: number
  total_cents: number
  total_aed: number
  currency: string
  fee_free: FeeFreeState
}

export interface MorPayment {
  id: string
  reference: string | null
  /** Set when this creator was instructed as part of a batch. Null for a payment on its own. */
  batch_id: string | null
  creator_name: string
  creator_handle: string | null
  creator_email: string | null
  creator_whatsapp: string | null
  deliverables: MorDeliverable[]
  posting_dates: string | null
  usage_terms: string | null
  brand_notes: string | null
  creator_fee_cents: number
  creator_fee_aed: number
  our_fee_pct: string
  our_fee_aed: number
  fee_waived: boolean
  vat_label?: string
  vat_aed: number
  total_cents: number
  total_aed: number
  currency: string
  status: MorStatus
  status_label: string
  agreement_status: AgreementStatus
  agreement_label: string
  agreement_url: string | null
  agreement_sent_at: string | null
  agreement_signed_at: string | null
  payment_method: 'card' | 'transfer' | null
  funded_at: string | null
  creator_paid_at: string | null
  payment_reference: string | null
  submitted_at: string | null
  cancelled_at: string | null
  cancelled_reason: string | null
  created_at: string | null
}

export interface MorSummary {
  awaiting_payment: { n: number; cents: number; aed: number }
  paying_creator: { n: number; cents: number; aed: number }
  paid: { n: number; cents: number; aed: number }
  creators_total: number
  fee_free: FeeFreeState
}

export interface MorOverview {
  summary: MorSummary
  payments: MorPayment[]
  batches: MorBatch[]
  fees: { settlement_fee_pct: string; included_in_manage: boolean; summary: string }
}

/* ── Paying several creators at once ─────────────────────────────────────────────────
 *
 * A batch owns the shared invoice and nothing else. Every creator on it is still a full
 * MorPayment with its own agreement, its own payout date and its own cancel button, which is
 * why `payments` here is the same type the single-payment screens already render.
 */

export type MorBatchStatus = 'draft' | 'awaiting_payment' | 'funded' | 'cancelled'

/** One priced creator inside a quote. Never assembled in the browser. */
export interface MorBatchLine {
  position: number
  creator_name: string
  creator_handle: string | null
  creator_fee_cents: number
  creator_fee_aed: number
  our_fee_pct: string
  our_fee_cents: number
  our_fee_aed: number
  fee_waived: boolean
  fee_waived_reason: string | null
  vat_cents: number
  vat_aed: number
  total_cents: number
  total_aed: number
}

export interface MorBatchQuote {
  lines: MorBatchLine[]
  creators: number
  creator_fee_aed: number
  our_fee_aed: number
  standard_fee_pct: string
  /** How many of this batch's creators the waiver covers, and what that is worth in money. */
  waived_count: number
  waived_saving_aed: number
  vat_label: string
  vat_aed: number
  total_cents: number
  total_aed: number
  currency: string
  fee_free: FeeFreeState
  /** Fee-free creators they would have left afterwards. */
  fee_free_after: number
}

export interface MorBatch {
  id: string
  reference: string | null
  label: string | null
  creators: number
  creators_paid: number
  creator_fee_aed: number
  our_fee_aed: number
  vat_label: string
  vat_aed: number
  total_cents: number
  total_aed: number
  currency: string
  status: MorBatchStatus
  status_label: string
  waived_count: number
  payment_method: 'card' | 'transfer' | null
  funded_at: string | null
  submitted_at: string | null
  cancelled_at: string | null
  cancelled_reason: string | null
  created_at: string | null
  payments: MorPayment[]
}

/** One row of the table the brand types into. */
export interface MorBatchCreatorInput {
  creator_name: string
  creator_handle?: string
  creator_email?: string
  creator_whatsapp?: string
  deliverables?: Array<MorDeliverable | string>
  posting_dates?: string
  creator_fee_aed?: number | string
  creator_fee_cents?: number
}

export interface MorDraftInput {
  creator_name: string
  creator_handle?: string
  creator_email?: string
  creator_whatsapp?: string
  deliverables?: Array<MorDeliverable | string>
  posting_dates?: string
  usage_terms?: string
  brand_notes?: string
  creator_fee_aed?: number | string
  creator_fee_cents?: number
}

export const morPaymentsApi = {
  overview: (): Promise<{ data: MorOverview }> => jfetch(`${BASE}/overview`),

  quote: (creator_fee_aed: number | string): Promise<{ data: MorQuote }> =>
    jfetch(`${BASE}/quote`, { method: 'POST', body: JSON.stringify({ creator_fee_aed }) }),

  create: (input: MorDraftInput): Promise<{ data: MorPayment }> =>
    jfetch(`${BASE}/payments`, { method: 'POST', body: JSON.stringify(input) }),

  read: (id: string): Promise<{ data: MorPayment }> => jfetch(`${BASE}/payments/${id}`),

  update: (id: string, input: MorDraftInput): Promise<{ data: MorPayment }> =>
    jfetch(`${BASE}/payments/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),

  /** Commit. The price is re-resolved server-side at this moment, not taken from the draft. */
  submit: (id: string, payment_method: 'card' | 'transfer'): Promise<{ data: MorPayment }> =>
    jfetch(`${BASE}/payments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ payment_method }),
    }),

  checkout: (
    id: string,
    success_url: string,
    cancel_url: string,
  ): Promise<{ data: { checkout_url: string; session_id: string } }> =>
    jfetch(`${BASE}/payments/${id}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ success_url, cancel_url }),
    }),

  cancel: (id: string, reason?: string): Promise<{ data: MorPayment }> =>
    jfetch(`${BASE}/payments/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  /* ── Several creators at once ──────────────────────────────────────────────────── */
  batches: {
    list: (): Promise<{ data: { batches: MorBatch[] } }> => jfetch(`${BASE}/batches`),

    /** Price a whole list while they are still typing it. Writes nothing, claims no waiver. */
    quote: (creators: MorBatchCreatorInput[]): Promise<{ data: MorBatchQuote }> =>
      jfetch(`${BASE}/batches/quote`, {
        method: 'POST',
        body: JSON.stringify({ creators }),
      }),

    create: (
      creators: MorBatchCreatorInput[],
      label?: string,
    ): Promise<{ data: MorBatch }> =>
      jfetch(`${BASE}/batches`, { method: 'POST', body: JSON.stringify({ creators, label }) }),

    read: (id: string): Promise<{ data: MorBatch }> => jfetch(`${BASE}/batches/${id}`),

    /** Commit the whole list. Every price is re-resolved server-side at this moment. */
    submit: (id: string, payment_method: 'card' | 'transfer'): Promise<{ data: MorBatch }> =>
      jfetch(`${BASE}/batches/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ payment_method }),
      }),

    checkout: (
      id: string,
      success_url: string,
      cancel_url: string,
    ): Promise<{ data: { checkout_url: string; session_id: string } }> =>
      jfetch(`${BASE}/batches/${id}/checkout`, {
        method: 'POST',
        body: JSON.stringify({ success_url, cancel_url }),
      }),

    cancel: (id: string, reason?: string): Promise<{ data: MorBatch }> =>
      jfetch(`${BASE}/batches/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },
}

/** AED, grouped, no decimals on whole amounts. One formatter so screens cannot drift. */
export function aed(amount: number | null | undefined): string {
  if (amount == null) return '—'
  const whole = Math.round(amount) === amount
  return `AED ${amount.toLocaleString('en-AE', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}
