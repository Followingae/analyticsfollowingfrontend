/**
 * Enrolment links — the staff side.
 *
 * One place that knows the endpoint shapes, so a screen never assembles a URL by hand and
 * the two file downloads (the agreement and the record pack) go through the same
 * authenticated blob path rather than a bare <a href>. An <a> cannot carry the bearer
 * token, so linking straight at those endpoints returns a 403 and looks like a broken
 * button.
 */
import { API_CONFIG, getAuthHeaders } from '@/config/api'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/enrolments`

export type EnrolmentStatus =
  | 'pending_approval' | 'live' | 'retracted' | 'rejected' | 'completed' | 'expired'

export interface EnrolmentRow {
  id: string
  token: string
  status: EnrolmentStatus
  url: string
  creator_handle?: string | null
  creator_name?: string | null
  creator_email?: string | null
  brand_display_name?: string | null
  campaign_display_name?: string | null
  deliverables_summary?: string | null
  fee_aed_cents?: number | null
  submit_by?: string | null
  created_at?: string | null
  approved_at?: string | null
  expires_at?: string | null
  first_opened_at?: string | null
  open_count?: number
  reported_at?: string | null
  talent_name?: string | null
  created_by_name?: string | null
  completed_at?: string | null
  signed_at?: string | null
  email_verified_at?: string | null
  address_at?: string | null
  bank_status?: string | null
}

export interface TalentOption { id: string; full_name?: string | null; email?: string | null; staff_role?: string | null }

export interface Prefill {
  proposal_influencer_id: string
  proposal_id?: string | null
  campaign_id?: string | null
  team_id?: string | null
  creator_handle?: string | null
  creator_name?: string | null
  creator_avatar?: string | null
  followers?: number | null
  brand_display_name?: string | null
  campaign_display_name?: string | null
  deliverables?: unknown[]
  deliverables_summary?: string | null
  fee_aed_cents?: number | null
  payment_terms?: { pct?: number; label?: string; amount_aed_cents?: number }[]
  submit_by?: string | null
  usage_terms?: string | null
  agreement_body?: string
  field_config?: Record<string, { on: boolean; required: boolean; locked?: boolean }>
  talent_options?: TalentOption[]
  creates_live?: boolean
  fee_is_negotiated?: boolean
  fee_agreed_at?: string | null
  fee_agreed_by_name?: string | null
  rate_note?: string | null
  ready?: boolean
  not_ready_reason?: string | null
  existing_link?: { id: string; token: string; status: EnrolmentStatus } | null
}

export interface BulkResult {
  created: { handle: string; url: string }[]
  already_had_one: string[]
  skipped_no_cost: string[]
  summary: string
}

export interface Instalment {
  id: string
  seq: number
  label?: string | null
  pct?: number | null
  /** What the signed agreement promised for this instalment. */
  due_aed_cents: number
  /** What it is worth NOW, after any earlier over or under payment. Null once paid. */
  now_due_aed_cents?: number | null
  paid_aed_cents?: number | null
  paid_on?: string | null
  reference?: string | null
  marked_by_label?: string | null
  marked_at?: string | null
  /** This is a creator_payables id: the board acts on it through the payment book. */
  payable_id: string
  status: 'owed' | 'approved' | 'paid' | 'cancelled'
  approved: boolean
  paid: boolean
}

export interface PaymentState {
  status: 'none' | 'unpaid' | 'part_paid' | 'paid'
  fee_aed_cents: number
  paid_aed_cents: number
  /** Derived, never stored. Negative means we overpaid. */
  outstanding_aed_cents: number
  overpaid: boolean
  next?: Instalment | null
  instalments: Instalment[]
}

export interface PayableCreator {
  link_id: string
  creator_name?: string | null
  creator_handle?: string | null
  brand?: string | null
  campaign?: string | null
  campaign_id?: string | null
  talent_name?: string | null
  signed_at?: string | null
  /** Whether a human re-keyed the bank details with the creator. */
  payee_confirmed: boolean
  bank_holder?: string | null
  bank_last4?: string | null
  payments: PaymentState
}

export interface EnrolmentDetail {
  link: Record<string, unknown>
  submission: Record<string, unknown>
  events: { kind: string; actor_label?: string | null; detail?: unknown; at: string }[]
  url: string
  has_signature: boolean
  payments?: PaymentState | null
}

/** The payment book lives under its own prefix; enrolment only reads from it. */
async function payablesCall<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/api/v1/admin/payables${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof body?.detail === 'string' ? body.detail : `Request failed (${res.status})`)
  }
  return body?.data as T
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    // getAuthHeaders() already sets Content-Type, so listing it here as well made TypeScript
    // (correctly) point out that one of the two was dead. The caller's own headers still win.
    headers: { ...getAuthHeaders(), ...(init?.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    // The API writes `detail` to be read by the person who triggered it, so it is surfaced
    // rather than swallowed behind a generic failure line.
    throw new Error(typeof body?.detail === 'string' ? body.detail : `Request failed (${res.status})`)
  }
  return body?.data as T
}

/** Fetch a file with the bearer token attached, then hand the browser a blob to save. */
async function download(path: string, fallbackName: string) {
  const res = await fetch(`${BASE}${path}`, { headers: getAuthHeaders() })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(typeof body?.detail === 'string' ? body.detail : 'That file could not be produced.')
  }
  const blob = await res.blob()
  const disp = res.headers.get('content-disposition') || ''
  const named = /filename="?([^"]+)"?/.exec(disp)?.[1]
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = named || fallbackName
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoked on the next tick: revoking synchronously races the click in Safari and the
  // download silently produces a zero byte file.
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export const enrolmentApi = {
  prefill: (proposalInfluencerId: string) =>
    call<Prefill>(`/prefill/${proposalInfluencerId}`),

  list: (params?: { status?: string; proposal_id?: string; mine?: boolean }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.proposal_id) q.set('proposal_id', params.proposal_id)
    if (params?.mine) q.set('mine', 'true')
    const qs = q.toString()
    return call<EnrolmentRow[]>(qs ? `?${qs}` : '')
  },

  detail: (id: string) => call<EnrolmentDetail>(`/${id}`),

  create: (body: Record<string, unknown>) =>
    call<{ id: string; token: string; status: EnrolmentStatus; url: string }>('', {
      method: 'POST', body: JSON.stringify(body),
    }),

  bulkCreate: (campaignId: string, body?: { assigned_talent_id?: string | null; product_sent?: boolean }) =>
    call<BulkResult>(`/campaigns/${campaignId}/bulk`, {
      method: 'POST', body: JSON.stringify(body ?? {}),
    }),

  approve: (id: string) => call<{ status: string; url: string }>(`/${id}/approve`, { method: 'POST' }),
  reject: (id: string, reason: string) =>
    call<{ status: string }>(`/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  retract: (id: string, reason: string) =>
    call<{ status: string }>(`/${id}/retract`, { method: 'POST', body: JSON.stringify({ reason }) }),

  confirmPayee: (id: string, holder_name: string, last4: string) =>
    call<{ bank_status: string }>(`/${id}/confirm-payee`, {
      method: 'POST', body: JSON.stringify({ holder_name, last4 }),
    }),

  paymentsBoard: (params?: { campaign_id?: string; proposal_id?: string; only?: 'owed' | 'paid' | 'all' }) => {
    const q = new URLSearchParams()
    if (params?.campaign_id) q.set('campaign_id', params.campaign_id)
    if (params?.proposal_id) q.set('proposal_id', params.proposal_id)
    if (params?.only) q.set('only', params.only)
    const qs = q.toString()
    return call<{ creators: PayableCreator[]; totals: { paid_aed_cents: number; owed_aed_cents: number } }>(
      `/payments/board${qs ? `?${qs}` : ''}`)
  },

  /**
   * Approving and paying go through the PAYMENT BOOK, not through an enrolment endpoint.
   *
   * `creator_payables` carries the funded-balance guard, the founders-only rule and the
   * team notifications. An enrolment instalment is a row in that book, so it is acted on
   * the same way every other payment is and inherits every control automatically. A second
   * route here would be a way to move money without them.
   */
  setPayableStatus: (payableId: string, status: 'owed' | 'approved' | 'paid' | 'cancelled',
                     payment_reference?: string) =>
    payablesCall(`/${payableId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, payment_reference: payment_reference || null }),
    }),

  /** The file the bank transfer is actually made from. Leadership only, logged per creator. */
  payoutXlsx: (params?: { campaign_id?: string; proposal_id?: string }) => {
    const q = new URLSearchParams()
    if (params?.campaign_id) q.set('campaign_id', params.campaign_id)
    if (params?.proposal_id) q.set('proposal_id', params.proposal_id)
    const qs = q.toString()
    return download(`/exports/payouts.xlsx${qs ? `?${qs}` : ''}`, 'Payouts.xlsx')
  },

  agreementPdf: (id: string) => download(`/${id}/agreement.pdf`, 'agreement.pdf'),
  recordPdf: (id: string) => download(`/${id}/record.pdf`, 'enrolment-record.pdf'),
  rosterXlsx: (params?: { proposal_id?: string; campaign_id?: string; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.proposal_id) q.set('proposal_id', params.proposal_id)
    if (params?.campaign_id) q.set('campaign_id', params.campaign_id)
    if (params?.status) q.set('status', params.status)
    const qs = q.toString()
    return download(`/exports/roster.xlsx${qs ? `?${qs}` : ''}`, 'Enrolments.xlsx')
  },
}
