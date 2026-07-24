import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const ADMIN = `${API_CONFIG.BASE_URL}/api/v1/admin/report-campaigns`
const PUBLIC = `${API_CONFIG.BASE_URL}/api/v1/public/campaign-reports`

/** Operator calls — must go through the shared interceptor, which owns token storage
 *  and refresh. Reading localStorage directly here guessed the wrong key and 401'd. */
async function jfetch(url: string, init: RequestInit = {}) {
  const method = (init.method || 'GET').toUpperCase()
  const needsCT = ['POST', 'PUT', 'PATCH'].includes(method)
  const res = await fetchWithAuth(url, {
    ...init,
    headers: { ...(needsCT ? { 'Content-Type': 'application/json' } : {}), ...(init.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.detail || body?.message || `Request failed (${res.status})`)
  return body
}

/** The client report is UNAUTHENTICATED by design. It must never go through
 *  fetchWithAuth: on a logged-out browser that can trigger a refresh/redirect, and a
 *  client opening a shared link has no session to refresh. */
async function pfetch(url: string) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.detail || body?.message || `Request failed (${res.status})`)
  return body
}

export interface ReportPost {
  id: string
  shortcode: string
  url: string
  media_type: string | null
  is_video: boolean
  likes: number
  comments: number
  engagement: number
  /** Video only. Null on an image — not zero, so the UI can omit rather than imply nobody watched. */
  plays: number | null
  thumbnail: string | null
  posted_at: string | null
  caption: string | null
  creator: {
    username: string
    full_name: string | null
    followers: number | null
    avatar: string | null
  } | null
}

export interface ReportCreator {
  username: string
  full_name: string | null
  avatar: string | null
  followers: number | null
  posts: number
  likes: number
  comments: number
  engagement: number
  plays: number
  engagement_rate: number | null
}

export interface CampaignReport {
  campaign: {
    id: string
    name: string
    brand_name: string
    brand_logo_url: string | null
    description: string | null
    status: string
    created_at: string | null
    start_date: string | null
    end_date: string | null
  }
  totals: {
    posts: number
    creators: number
    video_posts: number
    likes: number
    comments: number
    engagement: number
    /** Measured plays. Deliberately NOT called reach — true reach isn't visible to us. */
    views: number | null
    combined_followers: number | null
    engagement_rate_by_followers: number | null
    engagement_rate_by_views: number | null
  }
  posts: ReportPost[]
  creators: ReportCreator[]
  measurement: { source: string; note: string }
}

export interface ReportCampaignSummary {
  id: string
  name: string
  brand_name: string
  brand_logo_url: string | null
  status: string
  created_at: string | null
  posts: number
  share_token: string | null
  share_views: number
}

export const reportCampaignApi = {
  list: (): Promise<{ data: { campaigns: ReportCampaignSummary[] } }> => jfetch(ADMIN),

  create: (body: {
    name: string
    brand_name: string
    description?: string
    brand_logo_url?: string
  }): Promise<{ data: { id: string } }> =>
    jfetch(ADMIN, { method: 'POST', body: JSON.stringify(body) }),

  report: (id: string): Promise<{ data: CampaignReport }> => jfetch(`${ADMIN}/${id}/report`),

  /** Idempotent — returns the existing live link rather than minting a second URL. */
  createShare: (id: string): Promise<{ data: { token: string; created: boolean } }> =>
    jfetch(`${ADMIN}/${id}/share`, { method: 'POST', body: '{}' }),

  revokeShare: (id: string): Promise<{ data: { revoked: number } }> =>
    jfetch(`${ADMIN}/${id}/share`, { method: 'DELETE' }),

  /** Unauthenticated — possession of the token is the authorisation. */
  publicReport: (token: string): Promise<{ data: CampaignReport }> => pfetch(`${PUBLIC}/${token}`),
}

export const shareUrlFor = (token: string) =>
  typeof window !== 'undefined' ? `${window.location.origin}/r/${token}` : `/r/${token}`
