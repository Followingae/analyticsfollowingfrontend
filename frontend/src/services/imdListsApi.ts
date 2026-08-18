/**
 * Superadmin curated lists of master-database creators.
 * Mirrors app/api/admin/imd_lists_routes.py.
 *
 * Distinct from src/services/listsApi.ts, which is the brand-facing /my-lists feature keyed
 * on profiles. These lists hold influencer_database rows — the same thing a proposal holds.
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

export interface ImdListSummary {
  id: string
  name: string
  description?: string | null
  items_count: number
  created_at: string
  updated_at: string
  created_by_email?: string | null
}

export interface ImdListCreator {
  id: string
  item_id: string
  username: string
  full_name?: string | null
  profile_image_url?: string | null
  followers_count?: number | null
  engagement_rate?: number | null
  tier?: string | null
  status?: string | null
  categories?: string[] | null
  country?: string | null
  sell_reel_aed_cents?: number | null
  sell_post_aed_cents?: number | null
  /** 'complete' | 'partial' | null — null means we hold no analytics row at all. */
  analytics_status?: string | null
  analytics_collected_at?: string | null
  /** The live public link, when one has been minted. Null until an operator shares. */
  share_token?: string | null
  share_path?: string | null
  share_expires_at?: string | null
  share_views?: number | null
}

/** Why a creator has no measured analytics — see availability.py. */
export interface Unavailability {
  reason: string
  fault: 'instagram' | 'ours'
  retryable: boolean
  headline: string
  detail: string
  instagram_url: string | null
}

export const creatorShareApi = {
  /** Mint or reuse the live public link. 400 when the gap is ours to fix. */
  create: (username: string, expires_in_days?: number): Promise<{
    data: { token: string; share_path: string; created: boolean; unavailable: Unavailability | null }
  }> =>
    jfetch(`${BASE}/creator-shares/${encodeURIComponent(username)}`, {
      method: 'POST', body: JSON.stringify({ expires_in_days: expires_in_days ?? null }),
    }),

  revoke: (username: string): Promise<{ data: { revoked: number } }> =>
    jfetch(`${BASE}/creator-shares/${encodeURIComponent(username)}/revoke`, {
      method: 'POST', body: '{}',
    }),

  list: () => jfetch(`${BASE}/creator-shares`),
}

export const imdListsApi = {
  list: (): Promise<{ data: { lists: ImdListSummary[] } }> => jfetch(`${BASE}/imd-lists`),

  get: (id: string): Promise<{ data: ImdListSummary & { items: ImdListCreator[] } }> =>
    jfetch(`${BASE}/imd-lists/${id}`),

  create: (payload: { name: string; description?: string; influencer_ids?: string[] }) =>
    jfetch(`${BASE}/imd-lists`, { method: 'POST', body: JSON.stringify(payload) }),

  update: (id: string, payload: { name?: string; description?: string }) =>
    jfetch(`${BASE}/imd-lists/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  remove: (id: string) => jfetch(`${BASE}/imd-lists/${id}`, { method: 'DELETE' }),

  /**
   * Share the whole list with someone who has no login. The link carries an expiry and can
   * be revoked; minting again while one is live returns the same token rather than issuing
   * a second, so revoking really does close the list.
   */
  share: (id: string, payload: { expires_in_days?: number; reveal?: 'with_prices' | 'no_prices' } = {}) =>
    jfetch(`${BASE}/imd-lists/${id}/share`, { method: 'POST', body: JSON.stringify(payload) }),

  shareStatus: (id: string) => jfetch(`${BASE}/imd-lists/${id}/share`),

  revokeShare: (id: string) =>
    jfetch(`${BASE}/imd-lists/${id}/share`, { method: 'DELETE' }),

  /** Returns { added, skipped } — skipped are those already in the list. */
  addItems: (id: string, influencer_ids: string[]): Promise<{ data: { added: number; skipped: number } }> =>
    jfetch(`${BASE}/imd-lists/${id}/items`, { method: 'POST', body: JSON.stringify({ influencer_ids }) }),

  removeItem: (id: string, influencerId: string) =>
    jfetch(`${BASE}/imd-lists/${id}/items/${influencerId}`, { method: 'DELETE' }),

  /** Returns { added, skipped, list_size } — skipped were already on the proposal. */
  addToProposal: (id: string, proposalId: string): Promise<{ data: { added: number; skipped: number; list_size: number } }> =>
    jfetch(`${BASE}/imd-lists/${id}/add-to-proposal/${proposalId}`, { method: 'POST', body: '{}' }),

  /**
   * Put a hand-picked selection straight onto a proposal, without making a list first.
   * Only creators with a sell price go on; the rest come back named so we can say why.
   */
  addSelectionToProposal: (
    proposalId: string, influencerIds: string[],
    deliverable: { type: string; quantity: number } = { type: 'reel', quantity: 1 },
  ): Promise<{
    data: {
      added: number; already_on_proposal: number; unpriced: string[]; no_cost: string[]
      deliverable: { type: string; quantity: number }; without_deliverable: string[]
    }
  }> =>
    jfetch(`${BASE}/imd-lists/selection/add-to-proposal/${proposalId}`, {
      method: 'POST',
      body: JSON.stringify({
        influencer_ids: influencerIds,
        deliverable_type: deliverable.type,
        quantity: deliverable.quantity,
      }),
    }),

  /** Download the list as CSV. Streams a file, so it does NOT go through jfetch's
   *  res.json(). Cost pricing is off by default — the file is built to be forwarded. */
  async exportCsv(id: string, name: string, includeCost = false): Promise<void> {
    const res = await fetchWithAuth(
      `${BASE}/imd-lists/${id}/export.csv${includeCost ? '?include_cost=true' : ''}`
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Export failed: ${res.status}`)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(name || 'list').replace(/[^A-Za-z0-9_-]+/g, '_')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
}
