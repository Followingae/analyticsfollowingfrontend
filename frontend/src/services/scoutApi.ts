/**
 * ScoutOutreach and the whole creator network. Mirrors app/api/admin/scout_routes.py.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin`

async function jfetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const res = await fetchWithAuth(url, {
    ...options,
    headers: { ...(['POST', 'PUT', 'PATCH'].includes(method) ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API error: ${res.status}`)
  }
  return res.json()
}

export interface ScoutGoal {
  id: string
  scope: 'roster' | 'network' | 'daily'
  list_id: string | null
  list_name: string | null
  brand: string | null
  category: string | null
  market: string | null
  metric: 'relevant_applicants' | 'new_creators' | 'contacted' | 'light_analysed'
  target: number
  progress: number
  round_no: number
  status: 'active' | 'paused' | 'done'
  created_at: string
  note: string | null
}

export interface ScoutEvent {
  id: number
  kind: string
  channel: string | null
  username: string | null
  list_id: string | null
  detail: Record<string, any>
  created_at: string
  avatar: string | null
  followers: number | null
}

export interface ScoutOverview {
  goals: ScoutGoal[]
  counts: Record<string, number>
  network: { database: number; light_only: number; app: number; light_new_week: number }
  light_spend_30d_usd: number | null
  events: ScoutEvent[]
}

export interface NetworkCreator {
  stage: 'database' | 'light'
  id: string
  username: string
  full_name: string | null
  followers_count: number | null
  engagement_rate: number | null
  categories: string[] | null
  country: string | null
  city: string | null
  languages: string[] | null
  avatar: string | null
  biography: string | null
  is_verified: boolean | null
  public_email: string | boolean | null
  found_via: string | null
  nationality: string | null
  analytics_status: string | null
  ai_summary: string | null
  posts_per_week: number | null
  avg_likes: number | null
  avg_views: number | null
  on_app: boolean
}

export interface NetworkQuery {
  segment?: 'all' | 'database' | 'light' | 'app'
  search?: string
  keywords?: string
  min_followers?: number
  max_followers?: number
  min_engagement?: number
  country?: string
  city?: string
  category?: string
  language?: string
  has_email?: boolean
  sort?: 'followers' | 'engagement' | 'newest' | 'name'
  page?: number
  page_size?: number
}

/** A creator as the per-roster outreach shows them (network match or a proposed new creator). */
export interface ScoutCreator {
  username: string
  full_name: string | null
  avatar: string | null
  followers: number | null
  engagement_rate: number | null
  city: string | null
  categories: string[]
  summary: string | null
}

export interface ScoutCriteria {
  cities: string[]
  min_followers: number | null
  max_followers: number | null
  categories: string[]
  languages: string[]
}

export interface ScoutWorker {
  online: boolean
  last_seen: string | null
  state: string | null
  ig_username: string | null
  paused: boolean
  daily_cap: number
  sent_today: number
  queue: number
  warning: { kind: string; text: string; at: string } | null
}

export type DmStatus = 'proposed' | 'approved' | 'sending' | 'sent' | 'replied' | 'skipped' | 'failed'

export interface ScoutOutreachItem extends ScoutCreator {
  id: string
  status: DmStatus
  message: string | null
  sent_at: string | null
  replied_at: string | null
  reply_text: string | null
  error: string | null
}

export interface ScoutRosterPlan {
  open_call: { id: string; code: string; title: string; status: string; comp_mode: string } | null
  criteria: ScoutCriteria
  criteria_options: { cities: string[]; categories: string[]; languages: string[] }
  contacts: { matching: number; already_alerted: number; to_send: number; sample: ScoutCreator[] }
  template_approved: boolean
  dm_message_preview: string | null
  dm: { proposed: number; approved: number; sent: number; replied: number; skipped: number; failed: number }
  sourcing: { running: boolean; last_note: string | null }
  worker: ScoutWorker
}

export const scoutApi = {
  overview: (): Promise<{ data: ScoutOverview }> => jfetch(`${BASE}/scout/overview`),
  events: (after?: number, listId?: string): Promise<{ data: { events: ScoutEvent[] } }> => {
    const q = new URLSearchParams()
    if (after) q.set('after', String(after))
    if (listId) q.set('list_id', listId)
    return jfetch(`${BASE}/scout/events?${q}`)
  },
  createGoal: (body: Partial<Pick<ScoutGoal, 'scope' | 'list_id' | 'category' | 'market' | 'metric' | 'target' | 'note'>>):
    Promise<{ data: { id: string; target: number; round: number } }> =>
    jfetch(`${BASE}/scout/goals`, { method: 'POST', body: JSON.stringify(body) }),
  setGoal: (id: string, status: 'active' | 'paused' | 'done') =>
    jfetch(`${BASE}/scout/goals/${id}`, { method: 'POST', body: JSON.stringify({ status }) }),
  roster: (listId: string): Promise<{ data: { goal: ScoutGoal | null; need: number | null; suggested_target: number | null
                                               funnel: Record<string, number>; events: ScoutEvent[] } }> =>
    jfetch(`${BASE}/scout/roster/${listId}`),
  light: (body: { source: 'handles' | 'contacts' | 'app' | 'applicants' | 'lookalikes'; handles?: string[]; seeds?: string[]
                  list_id?: string; cap_usd?: number }): Promise<{ data: { queued: number; cap_usd: number } }> =>
    jfetch(`${BASE}/scout/light`, { method: 'POST', body: JSON.stringify(body) }),
  network: (q: NetworkQuery): Promise<{ data: { creators: NetworkCreator[]; total: number; page: number; page_size: number
                                                 segments: { database: number; light: number; app: number } } }> => {
    const p = new URLSearchParams()
    Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, String(v)) })
    return jfetch(`${BASE}/creator-network?${p}`)
  },
  addToDatabase: (usernames: string[]): Promise<{ data: { added: string[]; already_in_database: string[]; failed: { username: string; reason: string }[] } }> =>
    jfetch(`${BASE}/creator-network/add-to-database`, { method: 'POST', body: JSON.stringify({ usernames }) }),

  // Per-roster outreach: the network on WhatsApp and new creators by Instagram DM.
  plan: (listId: string): Promise<{ data: ScoutRosterPlan }> => jfetch(`${BASE}/scout/roster/${listId}/plan`),
  setCriteria: (listId: string, criteria: ScoutCriteria): Promise<{ data: { matching: number; to_send: number } }> =>
    jfetch(`${BASE}/scout/roster/${listId}/criteria`, { method: 'POST', body: JSON.stringify({ criteria }) }),
  sendWhatsApp: (listId: string): Promise<{ data: { queued: number } }> =>
    jfetch(`${BASE}/scout/roster/${listId}/whatsapp`, { method: 'POST', body: JSON.stringify({}) }),
  source: (listId: string, body: { lookalikes: boolean; hashtags: string[]; max_new: number }): Promise<{ data: { started: boolean } }> =>
    jfetch(`${BASE}/scout/roster/${listId}/source`, { method: 'POST', body: JSON.stringify(body) }),
  outreach: (listId: string, status: 'proposed' | 'approved' | 'sent' | 'replied' | 'all' = 'all'):
    Promise<{ data: { items: ScoutOutreachItem[] } }> =>
    jfetch(`${BASE}/scout/roster/${listId}/outreach?status=${status}`),
  decide: (ids: string[], decision: 'approve' | 'skip'): Promise<{ data: { updated: number } }> =>
    jfetch(`${BASE}/scout/outreach/decide`, { method: 'POST', body: JSON.stringify({ ids, decision }) }),
  worker: (): Promise<{ data: ScoutWorker }> => jfetch(`${BASE}/scout/worker`),
  setWorker: (body: { paused?: boolean; daily_cap?: number }): Promise<{ data?: ScoutWorker }> =>
    jfetch(`${BASE}/scout/worker`, { method: 'POST', body: JSON.stringify(body) }),
}
