/**
 * Published posts on a campaign: what we see, and what the client sees.
 *
 * ONE SHAPE FOR BOTH AUDIENCES, because the server computes both from one function with one
 * filter changed. Two shapes is how a client's report and ours quietly disagree about what a
 * campaign did, and then nobody can work out which screen is lying.
 *
 * `null` IS A REAL VALUE HERE AND IT IS NOT ZERO. Instagram hides like counts when a creator
 * asks it to, so `likes` comes back null on those posts and `unmeasured.likes` says how many.
 * Anything rendering these must print a dash, never a nought: a zero on this screen tells a
 * brand their campaign produced nothing.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

export type PostStatus = 'analysing' | 'measured' | 'approved' | 'rejected' | 'failed'

export interface PerfPost {
  link_id: string
  /** Absent on the brand's copy: which of our internal states a post is in is not theirs. */
  status?: PostStatus
  url: string
  added_at: string
  approved_at: string | null
  failure_reason?: string | null
  refresh_count: number
  last_refreshed_at: string | null
  refresh_until?: string | null
  post_id: string | null
  shortcode: string | null
  media_type: string | null
  is_video: boolean | null
  likes_count: number | null
  comments_count: number | null
  plays: number | null
  video_duration: number | null
  engagement_rate: number | null
  hashtags: string[] | null
  mentions: string[] | null
  location_name: string | null
  cdn_thumbnail_url: string | null
  display_url: string | null
  posted_at: string | null
  caption: string | null
  username: string | null
  full_name: string | null
  followers_count: number | null
  profile_pic_url: string | null
  tagged_users: unknown[] | null
  coauthor_producers: unknown[] | null
  is_carousel: boolean | null
  carousel_media_count: number | null
  has_audio: boolean | null
  width: number | null
  height: number | null
  accessibility_caption: string | null
  /** ⚠️ The only honest basis for the words "hidden by the creator". When this is true
   *  the counts are switched off on Instagram itself. When it is false and we still have
   *  no number, the gap is ours and the card says so instead. */
  like_and_view_counts_disabled: boolean | null
  comments_disabled: boolean | null
  ai_content_category: string | null
  ai_sentiment: string | null
  ai_language_code: string | null
}

export interface PerfTotals {
  posts: number
  creators: number
  likes: number | null
  comments: number | null
  engagement: number | null
  plays: number | null
  followers: number | null
  engagement_rate_by_followers: number | null
  engagement_rate_by_plays: number | null
  unmeasured: { likes: number; comments: number; plays: number }
}

export interface PerfReport {
  posts: PerfPost[]
  totals: PerfTotals
  pending?: number
  failed?: number
  can_decide?: boolean
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}${path}`, init)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.detail || 'That did not work')
  return json.data as T
}

const body = (v: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(v),
})

export const campaignPerformanceApi = {
  /** Ours: every post, in every state. */
  team: (campaignId: string) =>
    call<PerfReport>(`/api/v1/admin/campaigns/${campaignId}/performance`),

  /** Theirs: approved only, enforced in SQL rather than here. */
  brand: (campaignId: string) =>
    call<PerfReport>(`/api/v1/campaigns/${campaignId}/performance`),

  add: (campaignId: string, url: string, campaignCreatorId?: string) =>
    call<{ id: string; status: PostStatus; already_here: boolean }>(
      `/api/v1/admin/campaigns/${campaignId}/performance`,
      body({ url, campaign_creator_id: campaignCreatorId ?? null })),

  decide: (linkId: string, approve: boolean, note?: string) =>
    call<{ ok: boolean }>(`/api/v1/admin/campaign-posts/${linkId}/decide`,
                          body({ approve, note: note ?? null })),

  retry: (linkId: string) =>
    call<{ status: PostStatus }>(`/api/v1/admin/campaign-posts/${linkId}/retry`, { method: 'POST' }),

  remove: (linkId: string) =>
    call<unknown>(`/api/v1/admin/campaign-posts/${linkId}`, { method: 'DELETE' }),
}

/** A count we could not read is a dash. Never a zero. */
export const num = (n: number | null | undefined): string =>
  n == null ? '—' : n.toLocaleString()

/** 12,345 -> 12.3K. For tiles, where the exact figure is one hover away. */
export function compact(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
