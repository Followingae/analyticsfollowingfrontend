/**
 * The visit agent on an App Campaign: the AI that messages every approved creator on
 * WhatsApp, answers their questions, confirms their visit time and hands anything it
 * cannot answer to the team. Staff read and steer it from the campaign page.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/fa/campaigns`

export type AgentThreadStatus =
  | 'queued'
  | 'sent'
  | 'confirmed'
  | 'question'
  | 'declined'
  | 'reschedule'
  | 'no_reply'
  | 'visited'
  | 'closed'
  | 'failed'

export interface AgentFlag {
  kind: string
  text: string
  at: string
  resolved_at: string | null
}

export interface AgentMessage {
  who: 'agent' | 'creator' | 'team'
  text: string
  at: string
}

export interface AgentThread {
  id: string
  participant_id: string
  handle: string | null
  name: string | null
  avatar_url: string | null
  status: AgentThreadStatus
  status_label: string
  visit_time: string | null
  when_label: string | null
  attempts: number
  last_outbound_at: string | null
  last_inbound_at: string | null
  next_action: string | null
  next_action_at: string | null
  open_flags: number
  flags: AgentFlag[]
  history: AgentMessage[]
}

export interface AgentSummary {
  total: number
  waiting: number
  confirmed: number
  questions: number
  cant_make_it: number
  no_reply: number
  visited: number
}

export interface AgentState {
  paused: boolean
  template_ready: boolean
  summary: AgentSummary
  threads: AgentThread[]
}

/** The campaign has no agent (not a visit campaign, or the route is not live yet). */
export class NoAgentError extends Error {
  constructor() {
    super('No agent on this campaign')
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetchWithAuth(`${BASE}${path}`, init)
  if (res.status === 404) throw new NoAgentError()
  const body = await res.json().catch(() => null)
  if (!res.ok || body?.success === false) {
    throw new Error(body?.detail || body?.message || `That did not go through (${res.status})`)
  }
  return (body && typeof body === 'object' && 'data' in body ? body.data : body) as T
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body ?? {}),
})

export const faAgentApi = {
  get: (campaignId: string) => call<AgentState>(`/${campaignId}/agent`, { method: 'GET' }),

  setPaused: (campaignId: string, paused: boolean) => call<unknown>(`/${campaignId}/agent/pause`, json({ paused })),

  /** Clears the open flags on one thread. */
  markHandled: (campaignId: string, threadId: string) => call<unknown>(`/${campaignId}/agent/threads/${threadId}/handled`, json({})),
}
