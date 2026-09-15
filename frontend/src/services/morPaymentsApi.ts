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
  fees: { settlement_fee_pct: string; included_in_manage: boolean; summary: string }
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
