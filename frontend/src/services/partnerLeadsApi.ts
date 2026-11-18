/**
 * Partner leads: everyone who applied through a marketing landing page.
 * Mirrors app/api/admin/partner_leads_routes.py.
 *
 * WHAT THIS REPLACES. The RFM terminal offer took seventy-five applications and stored none
 * of them: the route rendered a notification email and ended. The pipeline lived in an inbox,
 * where it could not be sorted, counted, assigned, or answered "where are we with this one"
 * about. Seventy-three were recovered from Resend's sent mail; this is the screen that makes
 * them workable.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import type {
  MerchantCampaign, MerchantEvent, MerchantLog, MerchantQuote, MerchantStage, MerchantTrial,
} from '@/services/merchantAdminApi'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/partner-leads`

async function jfetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const needsCT = ['POST', 'PUT', 'PATCH'].includes(method)
  const res = await fetchWithAuth(url, {
    ...options,
    headers: { ...(needsCT ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Something went wrong (${res.status})`)
  }
  return res.json()
}

/** The ladder. `lost` can be reached from anywhere; the rest run in order. */
export const LEAD_STATUSES = ['new', 'contacted', 'applied', 'approved', 'live', 'lost'] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  applied: 'Applied',
  approved: 'Approved',
  live: 'Live',
  lost: 'Lost',
}

export interface PartnerLead {
  id: string
  source: string | null
  campaign: string | null
  business_name: string | null
  business_type: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  turnover_aed: string | null
  website: string | null
  needs: string[]
  status: LeadStatus
  status_note: string | null
  lost_reason: string | null
  assigned_to: string | null
  assigned_name: string | null
  assigned_email: string | null
  utm: Record<string, string>
  /**
   * Trade licences were email attachments and Resend does not return attachment bodies, so
   * the recovered leads have none. Saying which ones have a licence sitting in the inbox is
   * the difference between "go and look" and "we never had it".
   */
  has_licence_in_email: boolean
  licence_filename: string | null
  /**
   * Since 9 Nov 2026 the lead goes to the RFM platform the moment it arrives, instead of to
   * an inbox, and the licence is a file we hold. This is the log of that hand-off.
   */
  has_licence: boolean
  consent_at: string | null
  rfm_sent_at: string | null
  rfm_status: string | null
  rfm_contact_id: string | null
  rfm_error: string | null
  rfm_attempts: number
  rfm_last_attempt_at: string | null
  created_at: string | null
  updated_at: string | null
  contacted_at: string | null
  approved_at: string | null
  lost_at: string | null
  /**
   * The merchant this lead became, if it was onboarded, and where that merchant is. Filled by
   * the list so the row can wear a stage chip without opening the panel. Older servers send
   * none of the three, so each is optional.
   */
  merchant_id?: string | null
  stage?: MerchantStage | null
  campaign_status?: string | null
  /** What the capture or the entry form put on the lead that has no column: area, card_sales,
   *  branches, wants, rfm_ref, rfm_owner, rfm_stage, entered_by. The panel reads these. */
  raw?: Record<string, unknown>
}

/**
 * Everything about one lead and the merchant it became, in one read
 * (GET /{lead_id}/full, or GET /admin/merchants/{merchant_id}/full for a merchant that has no
 * lead). `stage`, `log` and `timeline` are exactly what the merchants list carries for that
 * merchant; `campaigns` are in the review queue's shape; `quotes` in the admin quotes shape.
 */
export interface LeadFullView {
  lead: PartnerLead | null
  merchant: {
    id: string
    name: string
    logo_url: string | null
    category: string | null
    cover_image_url: string | null
    team_id: string | null
    user_id: string | null
    email: string | null
    contact_name: string | null
    contact_phone: string | null
    address: string | null
    partner_lead_id: string | null
    last_login: string | null
    on_programme: boolean
    created_at: string | null
  } | null
  stage: MerchantStage | null
  log: MerchantLog
  timeline: MerchantEvent[]
  trial: MerchantTrial & { on_programme?: boolean }
  campaigns: MerchantCampaign[]
  quotes: MerchantQuote[]
  actions: { can_onboard: boolean; can_resend_welcome: boolean; can_send_reminder: boolean }
}

export interface PartnerLeadsPayload {
  leads: PartnerLead[]
  /** Computed over ALL leads, not the filtered set: a chip reading "Contacted 12" has to say
   *  twelve whether or not you are currently looking at them. */
  counts: Record<LeadStatus, number>
  total: number
  campaigns: string[]
  statuses: LeadStatus[]
}

export interface LeadFilters {
  status?: string
  campaign?: string
  search?: string
}

function qs(f: LeadFilters): string {
  const p = new URLSearchParams()
  if (f.status && f.status !== 'all') p.set('status', f.status)
  if (f.campaign && f.campaign !== 'all') p.set('campaign', f.campaign)
  if (f.search?.trim()) p.set('search', f.search.trim())
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const partnerLeadsApi = {
  list: (f: LeadFilters = {}): Promise<{ data: PartnerLeadsPayload }> =>
    jfetch(`${BASE}${qs(f)}`),

  update: (
    id: string,
    patch: {
      status?: LeadStatus
      status_note?: string
      lost_reason?: string
      assigned_to?: string
      unassign?: boolean
    },
  ): Promise<{ data: PartnerLead }> =>
    jfetch(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  /** Hand the lead to RFM now, or again. RFM dedupes on our id, so nobody is rung twice. */
  sendToRfm: (id: string): Promise<{ data: PartnerLead; rfm: { ok: boolean; status: string; error: string | null } }> =>
    jfetch(`${BASE}/${id}/send-to-rfm`, { method: 'POST' }),

  /** One lead and the merchant it became, in one read. */
  full: (id: string): Promise<{ data: LeadFullView }> =>
    jfetch(`${BASE}/${id}/full`),

  /** A ten-minute link to the trade licence in the private bucket. */
  licenceUrl: (id: string): Promise<{ data: { url: string } }> =>
    jfetch(`${BASE}/${id}/licence-url`),

  /**
   * Download the rows currently on screen.
   *
   * Fetched rather than linked: the endpoint needs the auth header and a plain <a href>
   * carries none, which saves a 401 HTML page as a .csv — a failure that looks exactly like
   * a successful download until somebody opens it.
   */
  async exportCsv(f: LeadFilters = {}) {
    const res = await fetchWithAuth(`${BASE}/export.csv${qs(f)}`)
    if (!res.ok) throw new Error(`Could not export: ${res.statusText}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'partner-leads.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
}
