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
  created_at: string | null
  updated_at: string | null
  contacted_at: string | null
  approved_at: string | null
  lost_at: string | null
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
