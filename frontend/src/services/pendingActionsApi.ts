/**
 * The approval gate, over HTTP.
 *
 * Everything a member of staff does that moves money, reaches a client, or deletes
 * something is held here until the superadmin answers. Approving REPLAYS the original
 * request on his authority; it does not hand the requester a permission they did not have.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/pending-actions`

async function j(path = '', init?: RequestInit) {
  const res = await fetchWithAuth(`${BASE}${path}`, {
    ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Request failed')
  return res.json()
}

/** The five classes a request can fall into. `internal` is the one that flows. */
export type ActionClass = 'delete' | 'money' | 'client' | 'access' | 'internal'

export interface PendingAction {
  id: string
  actor_email: string | null
  actor_role: string | null
  method: string
  path: string
  action_class: ActionClass
  label: string
  summary: string | null
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed' | 'expired'
  decision_note: string | null
  decided_by_email: string | null
  result_status: number | null
  created_at: string
  decided_at: string | null
  executed_at: string | null
  /** Only on the single-action read. The body exactly as it was submitted. */
  body?: string | null
  query?: string | null
}

export interface GateSettings {
  enabled: boolean
  held_message: string | null
  updated_at: string | null
  /** staff_role -> the classes that role may do without asking. */
  allowances: Record<string, ActionClass[]>
  classes: ActionClass[]
  rules: {
    id: string; pattern: string; is_regex: boolean
    action_class: ActionClass; label: string; priority: number; enabled: boolean
  }[]
}

export const pendingActionsApi = {
  list: (status: 'pending' | 'answered' | 'all' = 'pending'): Promise<{
    data: { actions: PendingAction[]; counts: Record<string, number>; can_answer: boolean }
  }> => j(`?status=${status}`),

  get: (id: string): Promise<{ data: PendingAction }> => j(`/${id}`),

  /** Says yes AND carries it out. A 409 means the thing underneath refused. */
  approve: (id: string, note?: string) =>
    j(`/${id}/approve`, { method: 'POST', body: JSON.stringify({ note: note || '' }) }),

  /** A reason is required on the server: a refusal nobody can read gets asked again. */
  reject: (id: string, note: string) =>
    j(`/${id}/reject`, { method: 'POST', body: JSON.stringify({ note }) }),

  settings: (): Promise<{ data: GateSettings }> => j('/settings/state'),

  saveSettings: (body: Partial<Pick<GateSettings, 'enabled' | 'held_message' | 'allowances'>>) =>
    j('/settings/state', { method: 'POST', body: JSON.stringify(body) }),
}

/** What each class means, in the words the manual uses. */
export const CLASS_LABEL: Record<ActionClass, string> = {
  money: 'Money',
  client: 'Reaches a client',
  delete: 'Deletes something',
  access: 'Who can do what',
  internal: 'Internal',
}

export const ROLE_LABEL: Record<string, string> = {
  cofounder: 'Co-founder',
  ceo: 'CEO',
  talent_manager: 'Talent',
  account_manager: 'Account management',
  business_development: 'Business development',
}
