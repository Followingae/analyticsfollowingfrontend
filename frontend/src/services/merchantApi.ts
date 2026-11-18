/**
 * The merchant's side of the self-serve barter trial.
 *
 * One merchant account owns at most one campaign at a time, three months of
 * five creators each, and this file is everything the merchant screens read or
 * write. The staff side (onboarding, review queue) lives elsewhere; nothing
 * here takes an id in the URL because the server resolves the merchant from
 * the caller.
 *
 * `GET /merchant/home` answering 404 is not a failure: it means the signed-in
 * account is a brand, not a merchant, and /dashboard falls back to the brand
 * dashboard. That is why `NotMerchantError` exists as its own class.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = API_CONFIG.BASE_URL

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export type DeliverableType = 'story' | 'post' | 'reel' | 'tiktok_video' | 'carousel' | 'video' | string

export interface DeliverableCount {
  type: DeliverableType
  qty: number
}

export interface ProgrammeTier {
  key: string
  min: number
  /** null means "and up". */
  max: number | null
  label: string
  guaranteed: DeliverableCount[]
  attempted: DeliverableCount[]
}

export interface Programme {
  min_value_per_creator_aed: number
  tiers: ProgrammeTier[]
  creators_per_month: number
  months: number
}

export type TrialStatus = 'pending' | 'active' | 'complete'

export interface Trial {
  on_programme: boolean
  status: TrialStatus
  month: number
  months: number
  started_at: string | null
  ends_at: string | null
  creators_per_month: number
  used_this_month: number
  left_this_month: number
  used_total: number
  total_creators: number
  programme: Programme
}

export type CampaignStatus = 'draft' | 'in_review' | 'active' | 'completed' | 'paused' | 'rejected'
export type ApprovalMode = 'auto' | 'manual'
export type FulfilmentMode = 'dine_in' | 'delivery' | 'brand_ships'

export interface HomeCampaign {
  id: string
  status: CampaignStatus
  name: string
  hero_image_url: string | null
  value_per_creator_aed: number | null
  deliverable_tier: string | null
  max_participants: number | null
  accepted_count: number
  start_date: string | null
  end_date: string | null
  submitted_at: string | null
  review_note: string | null
  creator_approval_mode: ApprovalMode
}

export interface NeedsYouItem {
  kind: 'application' | 'content' | 'visit'
  id: string
  title: string
  subtitle: string | null
  href: string | null
}

export interface VisitDay {
  date: string
  count: number
}

export interface ContentThumb {
  id: string
  thumb_url: string | null
  creator: string | null
  type: string | null
  views?: number | null
}

export type CreatorState = 'done' | 'posting' | 'coming' | 'applied'

export interface HomeCreator {
  id: string
  name: string
  avatar_url: string | null
  state: CreatorState
  note?: string | null
  would_return?: boolean | null
}

export interface MerchantHomeData {
  merchant: {
    id: string
    name: string
    logo_url: string | null
    cover_image_url: string | null
    category: string | null
  }
  trial: Trial
  campaign: HomeCampaign | null
  needs_you: NeedsYouItem[]
  visits: { last14: VisitDay[]; total: number; upcoming: number }
  content: {
    reels: number
    stories: number
    posts: number
    views: number
    likes: number
    latest: ContentThumb[]
  }
  creators: HomeCreator[]
  settings: { creator_approval_mode: ApprovalMode }
}

export interface BarterItem {
  name: string
  value_aed: number
  description?: string | null
}

/** Everything the wizard writes. Every field optional: the draft autosaves one step at a time. */
export interface CampaignBrief {
  name?: string | null
  description?: string | null
  category?: string | null
  barter_items?: BarterItem[]
  fulfilment_mode?: FulfilmentMode | null
  visit_location?: string | null
  visit_required?: boolean | null
  guests_allowed?: number | null
  entitlement_cap_aed?: number | null
  start_date?: string | null
  end_date?: string | null
  max_participants?: number | null
  creator_approval_mode?: ApprovalMode | null
  mandatory_tags?: string[]
  mandatory_hashtags?: string[]
  content_requirements?: string[]
  things_to_avoid?: string[]
  reference_links?: string[]
  hero_image_url?: string | null
  swap_reel_for_tiktok?: boolean | null
}

export interface CampaignProblem {
  field?: string | null
  step?: number | null
  message: string
}

export interface MerchantCampaign extends CampaignBrief {
  id: string
  status: CampaignStatus
  review_note?: string | null
  submitted_at?: string | null
  accepted_count?: number
  value_per_creator_aed?: number | null
  deliverable_tier?: string | null
  problems?: CampaignProblem[]
  tier?: ProgrammeTier | null
}

export interface SaveCampaignResult {
  campaign: MerchantCampaign
  problems: CampaignProblem[]
  tier: ProgrammeTier | null
  value_per_creator_aed: number
}

export type QuoteRequestStatus = 'new' | 'quoted' | 'won' | 'lost'

/** One answer set: question id to the chosen option, options, or typed text. */
export type QuoteAnswers = Record<string, string | string[]>

export interface QuoteRequest {
  id: string
  offering: string
  offering_label: string
  answers: QuoteAnswers
  notes: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  status: QuoteRequestStatus
  quoted_at: string | null
  created_at: string
}

export interface QuotePrefill {
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
}

/** `request` is null until the merchant has asked. `prefill` is what we already know about them. */
export interface QuoteRequestState {
  request: QuoteRequest | null
  prefill: QuotePrefill
}

export interface QuoteRequestBody {
  offering: string
  answers: QuoteAnswers
  notes?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
}

export interface AccessLink {
  valid: boolean
  email: string | null
  business_name: string | null
  logo_url: string | null
  expires_at: string | null
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** The signed-in account is not a merchant. /dashboard shows the brand screens. */
export class NotMerchantError extends Error {
  constructor() {
    super('Not a merchant account')
  }
}

/** The server read the brief and found it incomplete. The wizard shows these inline. */
export class CampaignProblemsError extends Error {
  problems: CampaignProblem[]
  constructor(problems: CampaignProblem[]) {
    super(problems[0]?.message || 'The campaign is not ready to send')
    this.problems = problems
  }
}

function readProblems(detail: unknown): CampaignProblem[] {
  if (Array.isArray(detail)) {
    return detail.map((p) =>
      typeof p === 'string'
        ? { message: p }
        : { field: p?.field ?? p?.loc?.[p.loc.length - 1] ?? null, step: p?.step ?? null, message: String(p?.message ?? p?.msg ?? '') },
    )
  }
  if (typeof detail === 'string') return [{ message: detail }]
  return [{ message: 'The campaign is not ready to send' }]
}

/** The API answers `{ success, data }` on newer routes and a bare object on older ones. */
function unwrap<T>(payload: unknown): T {
  const body = payload as { data?: unknown } | null
  return (body && typeof body === 'object' && 'data' in body ? body.data : payload) as T
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetchWithAuth(`${BASE}${path}`, init)
  if (res.status === 404) throw new NotMerchantError()
  if (res.status === 422) {
    const body = await res.json().catch(() => null)
    throw new CampaignProblemsError(readProblems(body?.detail))
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail || body?.message || `That did not go through (${res.status})`)
  }
  if (res.status === 204) return null as T
  return unwrap<T>(await res.json())
}

const json = (body: unknown): RequestInit => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body ?? {}),
})

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

export const merchantApi = {
  home: () => request<MerchantHomeData>('/api/v1/merchant/home'),

  campaign: () => request<MerchantCampaign | null>('/api/v1/merchant/campaign'),

  saveCampaign: (brief: CampaignBrief) =>
    request<SaveCampaignResult>('/api/v1/merchant/campaign', { method: 'PUT', ...json(brief) }),

  submitCampaign: () =>
    request<MerchantCampaign>('/api/v1/merchant/campaign/submit', { method: 'POST', ...json({}) }),

  uploadCover: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ url: string }>('/api/v1/merchant/campaign/cover', { method: 'POST', body: form })
  },

  saveSettings: (settings: { creator_approval_mode: ApprovalMode }) =>
    request<{ creator_approval_mode: ApprovalMode }>('/api/v1/merchant/settings', { method: 'PUT', ...json(settings) }),

  /**
   * The team's latest quote request, or null. A 404 here is "not switched on yet" as much
   * as "not a merchant", and either way the card simply shows the form, so it is swallowed.
   */
  getQuoteRequest: async (): Promise<QuoteRequestState | null> => {
    try {
      return await request<QuoteRequestState>('/api/v1/merchant/quote-request')
    } catch (e) {
      if (e instanceof NotMerchantError) return null
      throw e
    }
  },

  submitQuoteRequest: (body: QuoteRequestBody) =>
    request<QuoteRequestState>('/api/v1/merchant/quote-request', { method: 'POST', ...json(body) }),

  // Public, no auth header. The token in the URL is the only authorisation.
  accessLink: async (token: string): Promise<AccessLink> => {
    const res = await fetch(`${BASE}/api/v1/merchant/access/${encodeURIComponent(token)}`)
    if (res.status === 404 || res.status === 410) {
      return { valid: false, email: null, business_name: null, logo_url: null, expires_at: null }
    }
    if (!res.ok) throw new Error(`That did not go through (${res.status})`)
    return unwrap<AccessLink>(await res.json())
  },

  setPassword: async (token: string, password: string): Promise<{ ok: boolean; email: string }> => {
    const res = await fetch(`${BASE}/api/v1/merchant/access/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) throw new Error(body?.detail || body?.message || `That did not go through (${res.status})`)
    return unwrap<{ ok: boolean; email: string }>(body)
  },
}

// ---------------------------------------------------------------------------
// Derivations shared by the home tiles and the wizard
// ---------------------------------------------------------------------------

export function totalValue(items: BarterItem[] | undefined | null): number {
  return (items || []).reduce((sum, item) => sum + (Number(item.value_aed) || 0), 0)
}

/** Which tier a value lands in. null below the minimum. */
export function tierFor(programme: Programme | null | undefined, value: number): ProgrammeTier | null {
  if (!programme) return null
  const tiers = [...programme.tiers].sort((a, b) => a.min - b.min)
  let match: ProgrammeTier | null = null
  for (const tier of tiers) {
    if (value >= tier.min && (tier.max == null || value < tier.max)) match = tier
  }
  if (!match && tiers.length && value >= tiers[tiers.length - 1].min) match = tiers[tiers.length - 1]
  return match
}

const DELIVERABLE_NAMES: Record<string, [string, string]> = {
  story: ['story', 'stories'],
  post: ['post', 'posts'],
  reel: ['reel', 'reels'],
  carousel: ['carousel', 'carousels'],
  video: ['video', 'videos'],
  tiktok_video: ['TikTok video', 'TikTok videos'],
}

export function deliverableName(type: string, qty = 1): string {
  const names = DELIVERABLE_NAMES[type] || [type.replace(/_/g, ' '), `${type.replace(/_/g, ' ')}s`]
  return qty === 1 ? names[0] : names[1]
}

/** "Reel and 2 stories" from a tier's guaranteed list. */
export function deliverablesLine(counts: DeliverableCount[] | undefined | null): string {
  if (!counts || counts.length === 0) return ''
  const parts = counts.map((c) => (c.qty > 1 ? `${c.qty} ${deliverableName(c.type, c.qty)}` : deliverableName(c.type, 1)))
  if (parts.length === 1) return capitalise(parts[0])
  return capitalise(`${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`)
}

export function capitalise(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}
