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

  /** Returns { added, skipped } — skipped are those already in the list. */
  addItems: (id: string, influencer_ids: string[]): Promise<{ data: { added: number; skipped: number } }> =>
    jfetch(`${BASE}/imd-lists/${id}/items`, { method: 'POST', body: JSON.stringify({ influencer_ids }) }),

  removeItem: (id: string, influencerId: string) =>
    jfetch(`${BASE}/imd-lists/${id}/items/${influencerId}`, { method: 'DELETE' }),

  /** Returns { added, skipped, list_size } — skipped were already on the proposal. */
  addToProposal: (id: string, proposalId: string): Promise<{ data: { added: number; skipped: number; list_size: number } }> =>
    jfetch(`${BASE}/imd-lists/${id}/add-to-proposal/${proposalId}`, { method: 'POST', body: '{}' }),
}
