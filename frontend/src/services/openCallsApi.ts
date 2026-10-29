/**
 * Open calls: the campaign card creators answer in WhatsApp. Mirrors
 * app/api/admin/open_call_routes.py.
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

export interface OpenCall {
  id: string
  list_id: string
  code: string
  title: string
  brand_descriptor: string
  pitch: string
  comp_mode: 'paid' | 'barter' | 'both'
  deliverables?: string | null
  location?: string | null
  dates?: string | null
  image_url?: string | null
  barter_offer?: string | null
  target_aed?: number | null
  ceiling_aed?: number | null
  max_counters?: number
  handover_followers?: number
  faq: { q: string; a: string }[]
  status: 'draft' | 'live' | 'closed'
  number: string
  story_link: string
  my_code: string | null
  my_link: string | null
  counts: { total: number; done: number; talking: number; handover: number; declined: number }
  card: string
  can_edit: boolean
}

export interface OpenCallConversation {
  id: string
  state: 'collecting' | 'countered' | 'done' | 'declined' | 'handover' | 'human' | 'closed'
  handle: string | null
  phone: string | null
  asked: number | null
  currency: string | null
  agreed: number | null
  counter_aed: number | null
  availability: string | null
  email: string | null
  handover_reason: string | null
  declined_reason: string | null
  last_inbound_at: string | null
  updated_at: string
  outcome_sent_at: string | null
  window_open: boolean
  owner_email: string | null
  mine: boolean
  last_message: string | null
}

export const openCallsApi = {
  forList: (listId: string): Promise<{ data: OpenCall | null }> => jfetch(`${BASE}/imd-lists/${listId}/open-call`),
  save: (listId: string, data: Partial<OpenCall>) =>
    jfetch(`${BASE}/imd-lists/${listId}/open-call`, { method: 'POST', body: JSON.stringify(data) }),
  myLink: (id: string): Promise<{ data: { code: string; link: string } }> =>
    jfetch(`${BASE}/open-calls/${id}/my-link`, { method: 'POST', body: '{}' }),
  conversations: (id: string): Promise<{ data: { conversations: OpenCallConversation[] } }> =>
    jfetch(`${BASE}/open-calls/${id}/conversations`),
  conversation: (cid: string): Promise<{ data: { id: string; state: string; handle: string | null; phone: string | null; email: string | null; window_open: boolean; messages: { direction: 'in' | 'out'; author: string; body: string; created_at: string }[] } }> =>
    jfetch(`${BASE}/open-call-conversations/${cid}`),
  reply: (cid: string, body: string) =>
    jfetch(`${BASE}/open-call-conversations/${cid}/reply`, { method: 'POST', body: JSON.stringify({ body }) }),
  handBack: (cid: string) =>
    jfetch(`${BASE}/open-call-conversations/${cid}/hand-back`, { method: 'POST', body: '{}' }),
  outcomes: (id: string): Promise<{ data: { sent: string[]; not_sent: string[] } }> =>
    jfetch(`${BASE}/open-calls/${id}/outcomes`, { method: 'POST', body: '{}' }),
  invite: (id: string, channel: 'app' | 'whatsapp', opts: { min_followers?: number; from_list_id?: string } = {}):
    Promise<{ data: { channel: string; invited: number } }> =>
    jfetch(`${BASE}/open-calls/${id}/invite`, { method: 'POST', body: JSON.stringify({ channel, ...opts }) }),
}
