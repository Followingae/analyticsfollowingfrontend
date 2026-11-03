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
  target_cap?: number
  accounts?: number
  bots?: ScoutBot[]
}

/** One desktop bot = one Instagram account. */
export interface ScoutBot {
  id: string
  label: string | null
  ig_username: string | null
  state: string | null
  online: boolean
  last_seen: string | null
  paused: boolean
  warning: { kind: string; text: string; at: string } | null
  sent_today: number
  cap_today: number
  daily_cap: number
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
  /** Why the AI fit check passed them (autopilot). */
  fit_reason?: string | null
}

/** What ScoutOutreach is doing right now. Everything on the live bar comes from here. */
export interface ScoutActivity {
  running: { id: string; kind: 'search' | 'check' | string; label: string; phase: string | null; done: number; total: number | null
             started_at: string; list_id: string | null; list_name: string | null }[]
  recent: { id: string; kind: string; label: string; status: 'done' | 'failed'; note: string | null; cost_usd: number | null
            finished_at: string; list_name: string | null }[]
  whatsapp_sending: { list_name: string | null; list_id: string; sent: number; waiting: number; failed: number; total: number }[]
  dm: { online: boolean; paused: boolean; sent_today: number; cap_today: number; queue: number; next_send_at: string | null
        state: string | null; warning: { kind?: string; text: string; at?: string } | string | null }
  todo: { kind: 'attention' | 'dm' | 'search' | string; label: string; list_id?: string | null }[]
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

/* ---- The connected circle: campaigns, people per campaign, one creator in full ---- */

export interface ScoutCampaign {
  list_id: string
  name: string
  brand: string | null
  open_call: { id: string; title: string; status: string } | null
  goal: { target: number; round_no: number; status: string; progress: number } | null
  need: number | null
  funnel: { contacted: number; whatsapp: number; instagram: number; clicked: number; chatting: number
            applied: number; relevant: number; shortlisted: number; in_proposal: number }
  dm_queue: number
  last_activity: string | null
}

export interface ScoutCampaignsData {
  campaigns: ScoutCampaign[]
  general: { funnel: { contacted: number; clicked: number; joined_app: number; in_database: number }; queue: number }
}

export type PersonStage = 'queued' | 'contacted' | 'clicked' | 'chatting' | 'applied' | 'relevant' | 'shortlisted'
  | 'in_proposal' | 'passed' | 'failed' | 'skipped' | 'joined_app' | 'in_database'
export type PersonChannel = 'instagram' | 'whatsapp' | 'link'

export interface ScoutPerson {
  username: string | null
  full_name: string | null
  avatar: string | null
  followers: number | null
  engagement_rate: number | null
  city: string | null
  categories: string[] | null
  channel: PersonChannel
  outreach_id: string | null
  conversation_id: string | null
  stage: PersonStage
  steps: { queued_at: string | null; sent_at: string | null; clicked_at: string | null; chat_at: string | null
           applied_at: string | null; relevant: boolean | null; review: string | null; in_proposal: boolean; joined_app: boolean }
  last_at: string | null
}

export interface ScoutCreatorDetail {
  creator: {
    username: string; full_name: string | null; avatar: string | null; followers: number | null; engagement_rate: number | null
    city: string | null; country: string | null; categories: string[] | null; languages: string[] | null
    summary: string | null; biography: string | null; avg_likes: number | null; avg_views: number | null
    posts_per_week: number | null; last_post_at: string | null; public_email: string | null; is_creator: boolean | null
    on_app: boolean; in_database: boolean; imd_id: string | null; analytics_status: string | null; whatsapp: boolean
  }
  outreach: { id: string; list_id: string | null; list_name: string | null; channel: string; status: string; message: string | null
              sent_at: string | null; clicked_at: string | null; clicks: number | null; replied_at: string | null; reply_text: string | null }[]
  conversations: { id: string; list_id: string; list_name: string | null; title: string | null; state: string
                   review: string | null; fit: string | null; answers: Record<string, any> | null
                   created_at: string; last_inbound_at: string | null
                   applied_at?: string | null; reviewed_at?: string | null }[]
  events: ScoutEvent[]
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
  setWorker: (body: { paused?: boolean; daily_cap?: number; bot_id?: string }): Promise<{ data?: ScoutWorker }> =>
    jfetch(`${BASE}/scout/worker`, { method: 'POST', body: JSON.stringify(body) }),
  /** A new bot account; the token is shown once. */
  addWorker: (label?: string): Promise<{ data: { id: string; token: string } }> =>
    jfetch(`${BASE}/scout/workers`, { method: 'POST', body: JSON.stringify(label ? { label } : {}) }),
  activity: (): Promise<{ data: ScoutActivity }> => jfetch(`${BASE}/scout/activity`),
  suggest: (listId: string): Promise<{ data: { hashtags: string[]; lookalikes: boolean; max_new: number } }> =>
    jfetch(`${BASE}/scout/roster/${listId}/suggest`),

  // The connected circle: filter, DM, track every step, open any creator.
  campaigns: (): Promise<{ data: ScoutCampaignsData }> => jfetch(`${BASE}/scout/campaigns`),
  people: (listId: string | 'general', q: { stage?: string; channel?: string; search?: string } = {}):
    Promise<{ data: { people: ScoutPerson[] } }> => {
    const p = new URLSearchParams()
    Object.entries(q).forEach(([k, v]) => { if (v) p.set(k, v) })
    return jfetch(`${BASE}/scout/campaigns/${listId}/people?${p}`)
  },
  creator: (username: string): Promise<{ data: ScoutCreatorDetail }> =>
    jfetch(`${BASE}/scout/creator/${encodeURIComponent(username)}`),
  /** Straight into the bot's queue as approved. list_id null = General outreach (join the Following network). */
  queue: (usernames: string[], listId: string | null):
    Promise<{ data: { queued: number; skipped: { username: string; reason: string }[] } }> =>
    jfetch(`${BASE}/scout/outreach/queue`, { method: 'POST', body: JSON.stringify({ usernames, list_id: listId }) }),
}
