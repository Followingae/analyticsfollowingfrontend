/**
 * Creator intake — the waiting room.
 *
 * Anyone on the team can add a creator the moment they find one; only a superadmin can
 * attach a sell price and release them into the master database. Mirrors the intake
 * endpoints in app/api/admin/influencer_database_routes.py.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin`

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

export interface PendingCreator {
  id: string
  username: string
  full_name: string | null
  followers_count: number | null
  engagement_rate: number | null
  categories: string[] | null
  country: string | null
  tier: string | null
  status: string
  submitted_note: string | null
  submitted_at: string | null
  submitted_by_email: string | null
  analytics_status: string | null
  /** Already held for most of them from the import; served from our CDN, never hotlinked. */
  profile_image_url?: string | null
  cost_reel_aed_cents: number | null
  cost_post_aed_cents: number | null
  cost_story_aed_cents: number | null
  /** Every deliverable added up, so "has any pricing at all" is one check. */
  cost_total_cents?: number
  sell_total_cents?: number
  /** Why this creator is in the queue, in words. */
  waiting_for?: string
  /** Which area they were sourced for, and the brand behind it. */
  sourced_for_list_id?: string | null
  sourced_for?: string | null
  sourced_for_brand?: string | null
  sourced_brief?: Record<string, any> | null
  /** Analytics are held until approval — nothing has been spent on them yet. */
  analytics_waiting_on_approval?: boolean
}

export const creatorIntakeApi = {
  /**
   * Add creators by handle alone. No pricing fields exist on this path, by design.
   *
   * `list_id` is which area they were found for. Carrying it is what lets approval put them
   * back into that area in the same motion, instead of the approver having to remember which
   * brand the handle was researched for.
   */
  add: (payload: { usernames: string[]; categories?: string[]; country?: string; note?: string
                   list_id?: string }) =>
    call(`${BASE}/influencers/intake`, { method: 'POST', body: JSON.stringify(payload) }),

  /** Everyone who cannot be quoted yet: new arrivals, and anyone still missing a sell price. */
  reviewQueue: (): Promise<{ data: { items: PendingCreator[]; count: number } }> =>
    call(`${BASE}/influencers/review-queue`),

  /** Price and release into the master database. Refused without a sell price. */
  approve: (id: string, payload: { sell_pricing?: Record<string, number>; tier?: string }) =>
    call(`${BASE}/influencers/${id}/approve`, { method: 'POST', body: JSON.stringify(payload) }),

  /** Turn down — the row and every researched rate are kept. */
  reject: (id: string, reason?: string) =>
    call(`${BASE}/influencers/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
}
