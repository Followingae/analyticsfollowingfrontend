/**
 * The pipeline, and the queue of things people are waiting on.
 *
 * Both live here because they meet at one button: asking talent to start creates a request
 * and a roster, and that is the whole reason the pipeline is in the product rather than in
 * a spreadsheet.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

export type Stage =
  | 'new' | 'meeting_due' | 'meeting_done' | 'proposal_due' | 'proposal_sent'
  | 'agreement_sent' | 'agreement_signed' | 'won' | 'lost'

export const STAGE_LABEL: Record<Stage, string> = {
  new: 'New',
  meeting_due: 'Meeting to book',
  meeting_done: 'Met them',
  proposal_due: 'Proposal to send',
  proposal_sent: 'Proposal sent',
  agreement_sent: 'Agreement sent',
  agreement_signed: 'Agreement signed',
  won: 'Won',
  lost: 'Lost',
}

export type Model = 'paid' | 'barter' | 'ugc' | 'cashback'

export interface Deal {
  id: string
  title: string
  stage: Stage
  model: Model | null
  budget_aed: number | null
  budget_note: string | null
  note: string | null
  next_step: string | null
  next_step_at: string | null
  outcome_note: string | null
  closed_at: string | null
  sourcing_asked_at: string | null
  sourcing_brief: string | null
  sourcing_list_id: string | null
  brand_id: string
  brand: string
  contact_name: string | null
  industry: string | null
  team_id: string | null
  owner_email: string | null
  open_requests: number
}

export interface Board {
  stages: { key: Stage; label: string; deals: Deal[] }[]
  totals: { open: number; value_aed: number | null; without_a_budget: number }
  can_edit: boolean
  /** Founders only: asking talent opens a roster and sends the team to work. */
  can_ask_talent?: boolean
}

export interface WorkRequest {
  id: string
  title: string
  detail: string | null
  source: 'client' | 'internal'
  status: 'open' | 'doing' | 'done' | 'dropped'
  due_on: string | null
  created_at: string
  closed_at: string | null
  close_note: string | null
  team_id: string | null
  campaign_id: string | null
  deal_id: string | null
  client: string | null
  owner_email: string | null
  raised_by_email: string | null
  notes: number
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}${path}`, init)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.detail || 'That did not work')
  return json.data as T
}
const send = (method: string, v?: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: v === undefined ? undefined : JSON.stringify(v),
})

export const crmApi = {
  board: (includeClosed = false) =>
    call<Board>(`/api/v1/admin/crm/board?include_closed=${includeClosed}`),

  brand: (id: string) =>
    call<{ brand: Record<string, unknown>; deals: Deal[]; history: unknown[]; can_edit: boolean }>(
      `/api/v1/admin/crm/brands/${id}`),

  createBrand: (body: Record<string, unknown>) =>
    call<{ id: string; name: string }>('/api/v1/admin/crm/brands', send('POST', body)),

  createDeal: (body: Record<string, unknown>) =>
    call<{ id: string }>('/api/v1/admin/crm/deals', send('POST', body)),

  updateDeal: (id: string, body: Record<string, unknown>) =>
    call<{ id: string; stage: Stage }>(`/api/v1/admin/crm/deals/${id}`, send('PATCH', body)),

  /** The button that closes the lapse: raises a request AND opens a roster. */
  askTalent: (dealId: string, brief: string, ownerId?: string, dueOn?: string) =>
    call<{ request_id: string; roster_id: string }>(
      `/api/v1/admin/crm/deals/${dealId}/sourcing`,
      send('POST', { brief, owner_id: ownerId ?? null, due_on: dueOn ?? null })),
}

export const requestsApi = {
  list: (params: { mine?: boolean; status?: string; team_id?: string } = {}) => {
    const q = new URLSearchParams()
    if (params.mine) q.set('mine', 'true')
    if (params.status) q.set('status', params.status)
    if (params.team_id) q.set('team_id', params.team_id)
    return call<{ requests: WorkRequest[]; mine: number; unclaimed: number }>(
      `/api/v1/admin/requests?${q}`)
  },

  raise: (body: Record<string, unknown>) =>
    call<{ id: string }>('/api/v1/admin/requests', send('POST', body)),

  update: (id: string, body: Record<string, unknown>) =>
    call<{ id: string; status: string }>(`/api/v1/admin/requests/${id}`, send('PATCH', body)),

  notes: (id: string) =>
    call<{ notes: { body: string; created_at: string; actor: string | null }[] }>(
      `/api/v1/admin/requests/${id}/notes`),

  addNote: (id: string, body: string) =>
    call<unknown>(`/api/v1/admin/requests/${id}/notes`, send('POST', { body })),
}

/** `hajar.m@following.ae` reads as "Hajar M". An address is not an answer to who. */
export function person(email: string | null | undefined): string {
  if (!email) return 'nobody'
  const local = email.split('@')[0]
  if (!local) return email
  return local.split(/[._+-]+/).filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
}

export const aed = (n: number | null | undefined): string =>
  n == null ? '—' : `AED ${Math.round(n).toLocaleString()}`
