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
}
