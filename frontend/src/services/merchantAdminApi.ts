/**
 * Self-serve merchants, the staff side.
 * Mirrors the admin merchant routes under /api/v1/admin/merchants and
 * /api/v1/admin/merchant-campaigns.
 *
 * THE FLOW THIS SERVES. RFM Loyalty tells us a merchant is onboarded. A superadmin enters
 * the merchant's email, business, logo and contact, and the platform creates the account
 * and emails a welcome with a set-password link. The merchant then builds a barter campaign
 * which lands in review; a superadmin approves it (creators nearby get a push) or sends it
 * back with a reason in plain words, which the merchant reads word for word.
 *
 * Programme rules, for the screens to state rather than invent: five creators a month for
 * three months, AED 350 minimum per creator, deliverable tier by value.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const MERCHANTS = `${API_CONFIG.BASE_URL}/api/v1/admin/merchants`
const CAMPAIGNS = `${API_CONFIG.BASE_URL}/api/v1/admin/merchant-campaigns`
const QUOTES = `${API_CONFIG.BASE_URL}/api/v1/admin/merchant-quotes`

/** Thrown with the status on it, so a screen can tell "not built yet" (404) from "broken". */
export class MerchantApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function jfetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const needsCT = ['POST', 'PUT', 'PATCH'].includes(method)
  const res = await fetchWithAuth(url, {
    ...options,
    headers: { ...(needsCT ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    const detail = typeof err.detail === 'string' ? err.detail : err.detail?.message || err.message
    throw new MerchantApiError(detail || `Something went wrong (${res.status})`, res.status)
  }
  return res.json()
}

/** The envelope varies between routers: some wrap in `data`, some do not. Accept both. */
type Loose = Record<string, unknown>
const isObj = (v: unknown): v is Loose => !!v && typeof v === 'object' && !Array.isArray(v)

function unwrap<T>(j: unknown): T {
  return (isObj(j) && 'data' in j && j.data !== undefined ? j.data : j) as T
}

/* ─── Onboarding ─────────────────────────────────────────────────────────────── */

/** Matches the business types a partner lead arrives with. */
export const MERCHANT_CATEGORIES = [
  'Restaurant', 'Café', 'Retail', 'Clinic', 'Salon', 'Gym', 'Supermarket', 'Other',
] as const
export type MerchantCategory = (typeof MERCHANT_CATEGORIES)[number]

/** A lead's free-text business type, folded onto one of our categories. */
export function categoryFromBusinessType(type: string | null | undefined): MerchantCategory | '' {
  const t = (type || '').toLowerCase()
  if (!t) return ''
  const hit = MERCHANT_CATEGORIES.find(c => c.toLowerCase() === t)
  if (hit) return hit
  if (/caf|coffee|bakery|dessert/.test(t)) return 'Café'
  if (/restaur|dining|food|kitchen|grill|eater/.test(t)) return 'Restaurant'
  if (/retail|shop|store|boutique|fashion/.test(t)) return 'Retail'
  if (/clinic|dental|medical|aesthetic|derma|health/.test(t)) return 'Clinic'
  if (/salon|barber|spa|beauty|nail|hair/.test(t)) return 'Salon'
  if (/gym|fitness|yoga|pilates|studio/.test(t)) return 'Gym'
  if (/supermarket|grocer|hypermarket|mart/.test(t)) return 'Supermarket'
  return 'Other'
}

export interface OnboardMerchantBody {
  email: string
  business_name: string
  category: string
  logo_url?: string
  cover_image_url?: string
  contact_name?: string
  phone?: string
  address?: string
  /** Defaults on the server to the current RFM Loyalty programme. */
  programme_slug?: string
  partner_lead_id?: string
  send_email?: boolean
}

export interface OnboardMerchantResult {
  merchant_id: string
  team_id: string
  user_id: string
  email_sent: boolean
  /** For support only: the link the welcome email carries. */
  set_password_url: string
  created: boolean
}

export type TrialStatus = 'pending' | 'active' | 'complete'

export interface MerchantTrial {
  status: TrialStatus
  /** 1-based month of the programme, 0 before the first campaign goes live. */
  month: number
  months: number
  used_this_month: number
  creators_per_month: number
  used_total: number
  total_creators: number
}

export type MerchantCampaignStatus = 'draft' | 'in_review' | 'live' | 'active' | 'approved' | 'rejected' | 'completed' | 'closed' | string

/** The moments the server logs on a merchant (merchant_events). Order is the order they happen. */
export type MerchantEventKind =
  | 'invited' | 'welcome_resent' | 'reminder_sent' | 'password_set' | 'first_login'
  | 'campaign_submitted' | 'campaign_approved' | 'campaign_sent_back' | 'quote_requested'
  | string

export interface MerchantEvent {
  kind: MerchantEventKind
  at: string | null
  campaign_id?: string | null
  payload: Record<string, unknown>
}

/** One timestamp per moment; null when it has not happened (or was never recorded). */
export interface MerchantLog {
  invited_at: string | null
  welcome_resent_at: string | null
  reminder_sent_at: string | null
  password_set_at: string | null
  first_login_at: string | null
  campaign_submitted_at: string | null
  campaign_approved_at: string | null
  campaign_sent_back_at: string | null
}

/** Where a merchant is, as the server works it out from the log and the latest campaign. */
export type MerchantStage = 'invited' | 'reminded' | 'signed_up' | 'campaign_in_review' | 'sent_back' | 'live'
export const MERCHANT_STAGES: MerchantStage[] = ['invited', 'reminded', 'signed_up', 'campaign_in_review', 'sent_back', 'live']

export interface OnboardedMerchant {
  merchant_id: string
  business_name: string
  logo_url: string | null
  category: string | null
  email: string
  contact_name: string | null
  team_id: string
  user_id: string
  created_at: string
  last_login: string | null
  trial: MerchantTrial
  campaign: { id: string; name: string; status: MerchantCampaignStatus; submitted_at: string | null; review_note?: string | null } | null
  log: MerchantLog
  stage: MerchantStage
  timeline: MerchantEvent[]
  /** The partner lead this merchant came from, however it was linked. `has_lead` false puts
   *  the merchant in the "Merchants without a lead" table on Partners. */
  lead_id?: string | null
  has_lead?: boolean
}

export const EMPTY_LOG: MerchantLog = {
  invited_at: null, welcome_resent_at: null, reminder_sent_at: null, password_set_at: null,
  first_login_at: null, campaign_submitted_at: null, campaign_approved_at: null, campaign_sent_back_at: null,
}

/** An older server answers without the log: the stage is then read off what it does send. */
function stageFallback(m: Partial<OnboardedMerchant>): MerchantStage {
  const st = m.campaign?.status
  if (st === 'in_review') return 'campaign_in_review'
  if (st && ['live', 'active', 'approved', 'paused', 'completed', 'closed'].includes(st)) return 'live'
  if (st === 'rejected') return 'sent_back'
  return m.last_login ? 'signed_up' : 'invited'
}

/* ─── Review queue ───────────────────────────────────────────────────────────── */

export interface BarterItem {
  name: string
  value_aed: number
  description?: string | null
}

export interface DeliverableRequirement {
  type: string
  quantity: number
  required: boolean
  note?: string | null
}

export interface MerchantCampaign {
  id: string
  name: string
  status: MerchantCampaignStatus
  merchant: { id: string; name: string; logo_url: string | null; category: string | null; email: string | null }
  value_per_creator_aed: number
  deliverable_tier: string | null
  /** The programme floor the value is judged against. */
  min_value: number
  barter_items: BarterItem[]
  deliverable_requirements: DeliverableRequirement[]
  hero_image_url: string | null
  fulfilment_mode: string | null
  visit_location: string | null
  guests_allowed: number | null
  entitlement_cap_aed: number | null
  max_participants: number | null
  start_date: string | null
  end_date: string | null
  description: string | null
  mandatory_tags: string[]
  mandatory_hashtags: string[]
  content_requirements: string[]
  things_to_avoid: string[]
  creator_approval_mode: string | null
  submitted_at: string | null
  trial_month: number | null
  reviewed_at?: string | null
  review_note?: string | null
}

export interface MerchantCampaignsPayload {
  items: MerchantCampaign[]
  counts: { in_review: number; all: number }
}

/* ─── Quote requests ─────────────────────────────────────────────────────────── */

export type QuoteStatus = 'new' | 'quoted' | 'won' | 'lost'
export const QUOTE_STATUSES: QuoteStatus[] = ['new', 'quoted', 'won', 'lost']

export interface MerchantQuote {
  id: string
  status: QuoteStatus
  /** The website's product slug: campaigns-barter, campaigns-paid, influencer-cashback, ugc. */
  offering: string
  offering_label: string
  /** Question id to the chosen option, options, or typed text. */
  answers: Record<string, string | string[]>
  notes: string | null
  contact: { name: string | null; email: string | null; phone: string | null }
  merchant: { id: string | null; name: string | null; logo_url: string | null; category: string | null }
  team_id: string | null
  quoted_at: string | null
  quote_note: string | null
  handled_by: string | null
  created_at: string
  updated_at: string | null
}

export interface MerchantQuotesPayload {
  items: MerchantQuote[]
  counts: Record<QuoteStatus | 'all', number>
}

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

/** Every list field arrives as a list, whatever the server sent. */
export function normaliseCampaign(raw: unknown): MerchantCampaign {
  const c = (isObj(raw) ? raw : {}) as Partial<MerchantCampaign> & Loose
  return {
    ...(c as MerchantCampaign),
    merchant: c.merchant || { id: '', name: 'Unnamed merchant', logo_url: null, category: null, email: null },
    value_per_creator_aed: Number(c.value_per_creator_aed ?? 0),
    min_value: Number(c.min_value ?? 350),
    barter_items: arr<BarterItem>(c.barter_items),
    deliverable_requirements: arr<DeliverableRequirement>(c.deliverable_requirements),
    mandatory_tags: arr<string>(c.mandatory_tags),
    mandatory_hashtags: arr<string>(c.mandatory_hashtags),
    content_requirements: arr<string>(c.content_requirements),
    things_to_avoid: arr<string>(c.things_to_avoid),
  }
}

export function normaliseQuote(raw: unknown): MerchantQuote {
  const q = (isObj(raw) ? raw : {}) as Partial<MerchantQuote> & Loose
  const answers = isObj(q.answers) ? (q.answers as Record<string, string | string[]>) : {}
  return {
    ...(q as MerchantQuote),
    status: (QUOTE_STATUSES.includes(q.status as QuoteStatus) ? q.status : 'new') as QuoteStatus,
    offering: String(q.offering ?? ''),
    offering_label: String(q.offering_label ?? q.offering ?? ''),
    answers,
    notes: q.notes ?? null,
    contact: q.contact || { name: null, email: null, phone: null },
    merchant: q.merchant || { id: null, name: null, logo_url: null, category: null },
    quote_note: q.quote_note ?? null,
    quoted_at: q.quoted_at ?? null,
  }
}

export const merchantAdminApi = {
  onboard: async (body: OnboardMerchantBody): Promise<OnboardMerchantResult> =>
    unwrap<OnboardMerchantResult>(await jfetch(`${MERCHANTS}/onboard`, {
      method: 'POST', body: JSON.stringify(body),
    })),

  listOnboarded: async (opts: { withoutLead?: boolean } = {}): Promise<OnboardedMerchant[]> => {
    const j = unwrap<unknown>(await jfetch(`${MERCHANTS}/onboarded${opts.withoutLead ? '?without_lead=true' : ''}`))
    const rows = Array.isArray(j)
      ? (j as (Partial<OnboardedMerchant> & Loose)[])
      : arr<Partial<OnboardedMerchant> & Loose>(isObj(j) ? (j.items ?? j.merchants) : [])
    return rows.map(m => ({
      ...(m as OnboardedMerchant),
      trial: m.trial || {
        status: 'pending', month: 0, months: 3, used_this_month: 0,
        creators_per_month: 5, used_total: 0, total_creators: 15,
      },
      campaign: m.campaign ?? null,
      log: { ...EMPTY_LOG, ...(isObj(m.log) ? (m.log as Partial<MerchantLog>) : {}), invited_at: (m.log?.invited_at ?? m.created_at) || null },
      stage: MERCHANT_STAGES.includes(m.stage as MerchantStage) ? (m.stage as MerchantStage) : stageFallback(m),
      timeline: arr<MerchantEvent>(m.timeline).filter(e => isObj(e) && typeof e.kind === 'string'),
      has_lead: typeof m.has_lead === 'boolean' ? m.has_lead : !!m.lead_id,
    }))
  },

  /** Everything about one merchant and the lead it came from. Same shape as partnerLeadsApi.full. */
  full: async (merchantId: string): Promise<unknown> =>
    unwrap<unknown>(await jfetch(`${MERCHANTS}/${merchantId}/full`)),

  /** The 72-hour set-password reminder to this one merchant, now. 409 when it already went. */
  sendReminder: async (merchantId: string): Promise<{ email: string; email_sent: boolean }> =>
    unwrap(await jfetch(`${MERCHANTS}/${merchantId}/send-reminder`, { method: 'POST' })),

  resendWelcome: async (merchantId: string): Promise<{ ok: boolean }> =>
    unwrap(await jfetch(`${MERCHANTS}/${merchantId}/resend-welcome`, { method: 'POST' })),

  /** `in_review` by default: the queue. `all` for the merchants page to look one up. */
  listCampaigns: async (status: 'in_review' | 'all' = 'in_review'): Promise<MerchantCampaignsPayload> => {
    const j = unwrap<unknown>(await jfetch(`${CAMPAIGNS}?status=${status}`))
    const items = (Array.isArray(j) ? j : arr<unknown>(isObj(j) ? j.items : [])).map(normaliseCampaign)
    const counts = isObj(j) && isObj(j.counts) ? j.counts : {}
    const inReview = typeof counts.in_review === 'number'
      ? counts.in_review
      : items.filter(c => c.status === 'in_review').length
    const all = typeof counts.all === 'number' ? counts.all : items.length
    return { items, counts: { in_review: inReview, all } }
  },

  approveCampaign: async (id: string): Promise<{ ok: boolean; pushed_to: number }> => {
    const r = unwrap<unknown>(await jfetch(`${CAMPAIGNS}/${id}/approve`, { method: 'POST' }))
    const o = isObj(r) ? r : {}
    return { ok: o.ok !== false, pushed_to: Number(o.pushed_to ?? 0) }
  },

  rejectCampaign: async (id: string, reason: string): Promise<{ ok: boolean }> =>
    unwrap(await jfetch(`${CAMPAIGNS}/${id}/reject`, {
      method: 'POST', body: JSON.stringify({ reason }),
    })),

  /** `new` by default: the ones nobody has quoted yet. `all` for the full history. */
  listQuotes: async (status: QuoteStatus | 'all' = 'new'): Promise<MerchantQuotesPayload> => {
    const j = unwrap<unknown>(await jfetch(`${QUOTES}?status=${status}`))
    const raw = Array.isArray(j) ? j : arr<unknown>(isObj(j) ? (j.quotes ?? j.items) : [])
    const items = raw.map(normaliseQuote)
    const c = isObj(j) && isObj(j.counts) ? j.counts : {}
    const n = (k: string, fallback: number) => (typeof c[k] === 'number' ? (c[k] as number) : fallback)
    const by = (st: QuoteStatus) => items.filter(q => q.status === st).length
    return {
      items,
      counts: {
        new: n('new', by('new')), quoted: n('quoted', by('quoted')),
        won: n('won', by('won')), lost: n('lost', by('lost')), all: n('all', items.length),
      },
    }
  },

  updateQuote: async (id: string, patch: { status?: QuoteStatus; quote_note?: string }): Promise<MerchantQuote> =>
    normaliseQuote(unwrap<unknown>(await jfetch(`${QUOTES}/${id}`, {
      method: 'PATCH', body: JSON.stringify(patch),
    }))),
}
