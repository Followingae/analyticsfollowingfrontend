/**
 * Brand campaign briefs.
 *
 * `briefLink` is the brand's side at /brief/{token}: no auth header on purpose, the token in
 * the path is the whole authorisation (same rule as the feedback board). `brandBriefs` is our
 * side at /work/briefs, through the authenticated client.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import type { BriefAnswers, Composed, Gap } from '@/lib/brandBrief'

export class BriefError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

async function raw<T>(url: string, init: RequestInit = {}, authed = false): Promise<T> {
  const doFetch = authed ? fetchWithAuth : fetch
  const isForm = init.body instanceof FormData
  const res = await doFetch(url, {
    ...init,
    headers: isForm ? (init.headers || {}) : { 'Content-Type': 'application/json', ...(init.headers || {}) },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new BriefError(res.status, typeof data?.detail === 'string' ? data.detail : 'Something went wrong. Try again.')
  return (data?.data ?? data) as T
}

export interface PublicBrief {
  brand_name: string
  brand_logo_url: string | null
  status: 'sent' | 'opened' | 'in_progress' | 'submitted' | 'sourcing' | 'withdrawn'
  answers: BriefAnswers
  ai_filled: string[]
  composed: Composed | null
  doc_name: string | null
  doc_found: string[]
  note: string | null
  submitted_at: string | null
  gaps: Gap[]
  ai_left: number
}

const pub = (token: string, tail = '') =>
  `${API_CONFIG.BASE_URL}/api/v1/brief-links/${encodeURIComponent(token)}${tail}`

export const briefLink = {
  read: (t: string) => raw<PublicBrief>(pub(t)),
  save: (t: string, answers: BriefAnswers) =>
    raw<{ gaps: Gap[] }>(pub(t), { method: 'PATCH', body: JSON.stringify({ answers }) }),
  attach: (t: string, file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return raw<{ answers: BriefAnswers; ai_filled: string[]; found: string[]; filled: string[]; gaps: Gap[]; doc_name: string }>(
      pub(t, '/attach'), { method: 'POST', body: fd })
  },
  describe: (t: string, text: string, answers: BriefAnswers) =>
    raw<{ answers: BriefAnswers; ai_filled: string[]; found: string[]; filled: string[]; gaps: Gap[] }>(
      pub(t, '/describe'), { method: 'POST', body: JSON.stringify({ text, answers }) }),
  assist: (t: string, field: string, text: string, answers: BriefAnswers) =>
    raw<{ points: string[] }>(pub(t, '/assist'), { method: 'POST', body: JSON.stringify({ field, text, answers }) }),
  compose: (t: string, answers: BriefAnswers) =>
    raw<{ composed: Composed; gaps: Gap[] }>(pub(t, '/compose'), { method: 'POST', body: JSON.stringify({ answers }) }),
  submit: (t: string, answers: BriefAnswers) =>
    raw<PublicBrief>(pub(t, '/submit'), { method: 'POST', body: JSON.stringify({ answers }) }),
}

export interface AdminBrief {
  id: string
  token: string
  url: string
  team_id: string | null
  brand_name: string
  brand_logo_url: string | null
  status: PublicBrief['status']
  answers: BriefAnswers
  ai_filled: string[]
  composed?: Composed | null
  doc_name: string | null
  doc_type: string | null
  doc_found: string[] | null
  doc_url?: string | null
  note_to_brand: string | null
  request_id: string | null
  area_id: string | null
  area_name: string | null
  area_round: number | null
  created_by_email: string | null
  campaign_name: string | null
  gaps: Gap[]
  opened_at: string | null
  submitted_at: string | null
  sourcing_at: string | null
  created_at: string
  updated_at: string
  area_brief?: Record<string, unknown>
  can_source?: boolean
  brand_area?: { id: string; name: string; round_no: number | null; locked: boolean } | null
}

export interface BrandAccount { id: string; name: string; company_name: string | null; logo_url: string | null }

const adm = (tail = '') => `${API_CONFIG.BASE_URL}/api/v1/admin/brand-briefs${tail}`

export const brandBriefs = {
  brands: (q = '') => raw<BrandAccount[]>(adm(`/brands?q=${encodeURIComponent(q)}`), {}, true),
  list: () => raw<AdminBrief[]>(adm(), {}, true),
  get: (id: string) => raw<AdminBrief>(adm(`/${id}`), {}, true),
  create: (body: { team_id?: string | null; brand_name?: string; note?: string; contact_name?: string; contact_email?: string }) =>
    raw<AdminBrief>(adm(), { method: 'POST', body: JSON.stringify(body) }, true),
  update: (id: string, body: { team_id?: string | null; brand_name?: string; note?: string; status?: 'withdrawn' | 'reopen' }) =>
    raw<AdminBrief>(adm(`/${id}`), { method: 'PATCH', body: JSON.stringify(body) }, true),
  toSourcing: (id: string, due_at?: string | null) =>
    raw<{ area_id: string; area_name: string; opened: 'new' | 'updated' | 'next_round' }>(
      adm(`/${id}/sourcing`), { method: 'POST', body: JSON.stringify({ due_at: due_at || null }) }, true),
}
