/**
 * Sourcing rounds — one client request for sample creators.
 *
 * Mirrors app/api/admin/sourcing_rounds_routes.py. The states are
 *   requested → sourcing → internal_review → sent_to_client → feedback
 *            → more_requested | locked | dropped
 * and reopening carries every prior rejection forward as an exclusion.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/sourcing`

async function call(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const res = await fetchWithAuth(url, {
    ...options,
    headers: {
      ...(['POST', 'PUT', 'PATCH'].includes(method) ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API error: ${res.status}`)
  }
  return res.json()
}

export type RoundStatus =
  | 'requested' | 'sourcing' | 'internal_review' | 'sent_to_client'
  | 'feedback' | 'more_requested' | 'locked' | 'dropped'

export const OPEN_STATUSES: RoundStatus[] = [
  'requested', 'sourcing', 'internal_review', 'sent_to_client', 'feedback', 'more_requested',
]

export const STATUS_LABEL: Record<RoundStatus, string> = {
  requested: 'Requested',
  sourcing: 'Sourcing',
  internal_review: 'Internal review',
  sent_to_client: 'Sent to client',
  feedback: 'Feedback in',
  more_requested: 'More requested',
  locked: 'Locked',
  dropped: 'Dropped',
}

export interface RoundSummary {
  id: string
  title: string
  round_no: number
  status: RoundStatus
  due_at: string | null
  target_count: number | null
  criteria: Record<string, unknown>
  client_name: string | null
  owner_email: string | null
  /** Only present on the detail fetch — the list does not need it. */
  owner_user_id?: string | null
  /** The brand this round belongs to, so the round can link back to it. */
  team_id?: string | null
  proposed: number
  approved: number
  selected: number
  share_token: string | null
}

export interface RoundItem {
  id: string
  username: string
  internal_verdict: 'pending' | 'approved' | 'struck'
  internal_reason: string | null
  client_verdict: 'pending' | 'selected' | 'rejected'
  client_reason: string | null
  influencer_id: string | null
  full_name: string | null
  followers_count: number | null
  engagement_rate: number | null
  categories: string[] | null
  country: string | null
  creator_status: string | null
  analytics_status: string | null
  cost_reel_aed_cents: number | null
  sell_reel_aed_cents: number | null
  internal_by_email: string | null
}

export const sourcingApi = {
  listRounds: (params?: { status?: string; mine?: boolean }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.mine) q.set('mine', 'true')
    const s = q.toString()
    return call(`${BASE}/rounds${s ? `?${s}` : ''}`) as Promise<{ data: { items: RoundSummary[] } }>
  },

  /**
   * Step into a round that is already running — change owner, date, target, title or
   * criteria. Founders only; the server enforces that, this is just the call.
   */
  amendRound: (roundId: string, payload: {
    title?: string; owner_user_id?: string | null; due_at?: string | null
    target_count?: number | null; criteria?: Record<string, unknown>
  }) => call(`${BASE}/rounds/${roundId}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  createRound: (payload: {
    title: string; team_id?: string; proposal_id?: string
    due_at?: string; target_count?: number; criteria?: Record<string, unknown>
  }) => call(`${BASE}/rounds`, { method: 'POST', body: JSON.stringify(payload) }),

  getRound: (id: string) => call(`${BASE}/rounds/${id}`) as Promise<{
    data: { round: RoundSummary & { criteria: Record<string, unknown> }
            items: RoundItem[]; excluded: string[] }
  }>,

  addItems: (id: string, usernames: string[]) =>
    call(`${BASE}/rounds/${id}/items`, { method: 'POST', body: JSON.stringify({ usernames }) }),

  /** Approve or strike one creator. A strike requires a reason — the server enforces it. */
  review: (roundId: string, itemId: string, verdict: 'approved' | 'struck' | 'pending', reason?: string) =>
    call(`${BASE}/rounds/${roundId}/items/${itemId}/review`, {
      method: 'POST', body: JSON.stringify({ verdict, reason }),
    }),

  removeItem: (roundId: string, itemId: string) =>
    call(`${BASE}/rounds/${roundId}/items/${itemId}`, { method: 'DELETE' }),

  setStatus: (id: string, status: RoundStatus) =>
    call(`${BASE}/rounds/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),

  /** Client wants more: opens round N+1, pre-excluding everything already rejected. */
  reopen: (id: string, payload?: { due_at?: string; target_count?: number; client_note?: string }) =>
    call(`${BASE}/rounds/${id}/reopen`, { method: 'POST', body: JSON.stringify(payload || {}) }),

  lock: (id: string) => call(`${BASE}/rounds/${id}/lock`, { method: 'POST', body: '{}' }),
}
