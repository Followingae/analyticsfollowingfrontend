/**
 * Jobs and Needs me. Mirrors app/api/admin/job_routes.py.
 *
 * A Job is one brand brief (a client roster) followed from the first creator found to the
 * last one paid. Every creator on it carries one step, who it waits on, and the one action
 * that moves it on.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin`

async function jfetch(url: string, options: RequestInit = {}) {
  const res = await fetchWithAuth(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API error: ${res.status}`)
  }
  return res.json()
}

export type Who = 'founder' | 'talent' | 'client' | 'creator' | 'scout' | 'nobody'
export type Viewer = 'founder' | 'talent'
export type Source = 'talent' | 'scoutai' | 'scoutoutreach' | 'scout'
export type StageKey = 'find' | 'price' | 'propose' | 'book' | 'deliver' | 'paid'

export type Step =
  | 'found' | 'dm_queued' | 'dm_sent' | 'chatting' | 'applied' | 'needs_rate' | 'needs_price' | 'ready'
  | 'on_proposal' | 'client_picked' | 'booked' | 'send_enrolment' | 'enrolment_approve' | 'enrolment_sent'
  | 'payee' | 'enrolled' | 'briefed' | 'content_in' | 'content_approved' | 'posted' | 'paid' | 'out'

export interface JobStage { key: StageKey; label: string; count: number }
export interface LiveLine { kind: string; text: string }
export interface JobProposal { id: string; name: string | null; status: string; created_at?: string; pinned?: boolean }
export interface JobCampaign { id: string; name: string | null; status: string | null }
export type WaitingOn = Partial<Record<Who, number>>

export interface JobPerson {
  username: string
  full_name: string | null
  followers: number | null
  avatar: string | null
  imd_id: string | null
  item_id: string | null
  proposal_influencer_id: string | null
  proposal_id: string | null
  conversation_id: string | null
  enrolment_id: string | null
  sources: Source[]
  step: Step
  label: string
  who: Who
  action: string | null
  note: string | null
  rank: number
}

export interface JobSummary {
  id: string
  name: string
  brand: string | null
  team_id: string | null
  created_at: string
  due_at: string | null
  need: number | null
  stages: JobStage[]
  waiting_on: WaitingOn
  total: number
  out: number
  needs_me: number
  live: LiveLine[]
  proposals: JobProposal[]
  campaign: JobCampaign | null
}

export interface JobDetail {
  job: {
    id: string
    name: string
    brand: string | null
    team_id: string | null
    brief: Record<string, unknown> | null
    due_at: string | null
    created_at?: string
    open_call_id: string | null
    open_call_status: string | null
  }
  stages: JobStage[]
  waiting_on: WaitingOn
  total: number
  out: number
  sources: Partial<Record<Source, number>>
  people: JobPerson[]
  proposals: JobProposal[]
  campaign: JobCampaign | null
  live: LiveLine[]
  you_are: Viewer
}

export type NeedsMeItem = JobPerson & { job_id: string; job: string; brand: string | null; campaign_id?: string | null }
export interface NeedsMeGroup { action: string; who: Who; items: NeedsMeItem[] }
export interface NeedsMeData { groups: NeedsMeGroup[]; total: number; you_are: Viewer }

type Envelope<T> = { success: boolean; data: T }

export const jobsApi = {
  list: (): Promise<Envelope<{ jobs: JobSummary[] }>> => jfetch(`${BASE}/jobs`),
  get: (id: string): Promise<Envelope<JobDetail>> => jfetch(`${BASE}/jobs/${encodeURIComponent(id)}`),
  needsMe: (): Promise<Envelope<NeedsMeData>> => jfetch(`${BASE}/needs-me`),
}
