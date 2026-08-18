/**
 * The delivery ladder — a booked creator's journey after the client says go.
 * Mirrors app/api/admin/creator_ladder_routes.py.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin`

async function jfetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const needsCT = ['POST', 'PUT', 'PATCH'].includes(method)
  const res = await fetchWithAuth(url, {
    ...options,
    headers: { ...(needsCT ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API error: ${res.status}`)
  }
  return res.json()
}

export type Stage =
  | 'enrolled' | 'rate_agreed' | 'contracted' | 'briefed'
  | 'content_in' | 'content_approved' | 'posted' | 'paid' | 'dropped'

/** The rungs in order, with who does each one. The order is the ladder. */
export const STAGES: { key: Stage; label: string; who: string }[] = [
  { key: 'enrolled', label: 'Enrolled', who: 'Talent' },
  { key: 'rate_agreed', label: 'Rate agreed', who: 'Founder' },
  { key: 'contracted', label: 'Agreement on file', who: 'Talent' },
  { key: 'briefed', label: 'Guide sent', who: 'Talent' },
  { key: 'content_in', label: 'Content in', who: 'The creator' },
  { key: 'content_approved', label: 'Content approved', who: 'Accounts' },
  { key: 'posted', label: 'Posted', who: 'Accounts' },
  { key: 'paid', label: 'Paid', who: 'Founder' },
]

export interface LadderCreator {
  id: string
  stage: Stage
  stage_label: string
  stage_note?: string | null
  username: string
  full_name?: string | null
  avatar?: string | null
  followers_count?: number | null
  agreed_rate_cents?: number | null
  rate_note?: string | null
  rate_proposed_at?: string | null
  rate_proposed_by_email?: string | null
  rate_agreed_at?: string | null
  rate_agreed_by_email?: string | null
  agreement_url?: string | null
  agreement_name?: string | null
  agreement_at?: string | null
  guide_url?: string | null
  guide_note?: string | null
  guide_sent_at?: string | null
  content_due?: string | null
  content_url?: string | null
  content_at?: string | null
  content_approved_at?: string | null
  posted_url?: string | null
  posted_at?: string | null
  paid_at?: string | null
  defaulted_at?: string | null
  cost_price_snapshot?: Record<string, number | null> | null
  sell_price_snapshot?: Record<string, number | null> | null
}

export const ladderApi = {
  get: (campaignId: string): Promise<{
    data: { creators: LadderCreator[]; counts: Record<string, number>; stages: Stage[] }
  }> => jfetch(`${BASE}/campaigns/${campaignId}/ladder`),

  /** Talent records what was negotiated. It stays a proposal until a founder confirms. */
  proposeRate: (rowId: string, amount_aed: number, note?: string) =>
    jfetch(`${BASE}/campaign-creators/${rowId}/rate`, {
      method: 'POST', body: JSON.stringify({ amount_aed, note }),
    }),

  /** Founders only. */
  confirmRate: (rowId: string, note?: string) =>
    jfetch(`${BASE}/campaign-creators/${rowId}/rate/confirm`, {
      method: 'POST', body: JSON.stringify({ note }),
    }),

  agreement: (rowId: string, url: string, name?: string) =>
    jfetch(`${BASE}/campaign-creators/${rowId}/agreement`, {
      method: 'POST', body: JSON.stringify({ url, name }),
    }),

  /** The due date is the point: it is what the platform chases on. */
  guide: (rowId: string, content_due: string, url?: string, note?: string) =>
    jfetch(`${BASE}/campaign-creators/${rowId}/guide`, {
      method: 'POST', body: JSON.stringify({ content_due, url, note }),
    }),

  content: (rowId: string, url: string, note?: string) =>
    jfetch(`${BASE}/campaign-creators/${rowId}/content`, {
      method: 'POST', body: JSON.stringify({ url, note }),
    }),

  approveContent: (rowId: string, note?: string) =>
    jfetch(`${BASE}/campaign-creators/${rowId}/content/approve`, {
      method: 'POST', body: JSON.stringify({ note }),
    }),

  posted: (rowId: string, url: string) =>
    jfetch(`${BASE}/campaign-creators/${rowId}/posted`, {
      method: 'POST', body: JSON.stringify({ url }),
    }),

  /** Founders only. Writes the payment from the confirmed rate, not from typing. */
  paid: (rowId: string, reference?: string, note?: string) =>
    jfetch(`${BASE}/campaign-creators/${rowId}/paid`, {
      method: 'POST', body: JSON.stringify({ reference, note }),
    }),

  drop: (rowId: string, reason: string) =>
    jfetch(`${BASE}/campaign-creators/${rowId}/drop`, {
      method: 'POST', body: JSON.stringify({ reason }),
    }),
}
