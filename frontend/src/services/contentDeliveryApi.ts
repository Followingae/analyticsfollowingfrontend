/**
 * Content delivery — one client for both sides of the platform.
 *
 * TWO SETS OF ENDPOINTS, ONE SET OF TYPES. The internal wall and the brand's wall are built
 * from the same rows and returned in the same shape; what differs is that the brand's copy
 * has our internal notes and anything we have not sent for review removed, on the SERVER.
 * Sharing the types here is what keeps the two screens honest about being the same thing:
 * if they drifted into separate shapes, the client would sooner or later be looking at
 * something we were not.
 *
 * Nothing in here ever sees a Frame.io token, folder id or project id on the brand path. The
 * only Frame.io URL a brand can receive is the share link a superadmin chose to set.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = API_CONFIG.BASE_URL

/** Throws with the server's own message. "You can view Content delivery but not change it"
 *  tells somebody what to do next; "Request failed" does not. */
async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithAuth(`${BASE}${path}`, init)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.detail || body?.message || `That did not work (${res.status}).`)
  return body?.data as T
}
async function post<T>(path: string, body?: unknown): Promise<T> {
  return call<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
}

// ── Types ────────────────────────────────────────────────────────────────────────────────
export type ContentStatus = 'pending' | 'in_review' | 'approved' | 'changes_requested'
/** How a creator's whole delivery reads at a glance. A client thinks in creators, not files. */
export type CreatorContentState =
  | 'waiting_on_you' | 'changes_requested' | 'with_us' | 'in_production' | 'approved' | 'awaited'

export interface ContentItem {
  id: string
  campaign_creator_id: string | null
  frameio_file_id: string
  name: string
  media_type: string | null
  file_size: number | null
  poster_url: string | null
  status: ContentStatus
  version_no: number
  superseded_by: string | null
  sent_for_review_at: string | null
  approved_at: string | null
  approved_by_name: string | null
  /** What was actually approved, frozen. Present even when the file has changed since. */
  approved_snapshot: Record<string, unknown> | null
  /** Set when the file moved in Frame.io after a client had approved it. */
  changed_after_approval_at: string | null
  review_note: string | null
  review_note_at: string | null
  review_note_by_name: string | null
  first_seen_at: string
  frameio_updated_at: string | null
  /** Internal only. Never present on a brand response. */
  internal_note?: string | null
  comment_count?: number
}

export interface CreatorContentGroup {
  campaign_creator_id: string
  username: string | null
  full_name: string | null
  avatar: string | null
  followers_count: number | null
  stage: string | null
  content_due: string | null
  state: CreatorContentState
  items: ContentItem[]
  /** Brand side only: how many pieces are with us, counted but not shown. */
  in_production?: number
  counts: {
    total: number; in_review: number; pending: number
    approved: number; changes_requested: number
  }
}

export interface ContentWall {
  source: { linked: boolean; folder_name?: string | null; share_url?: string | null; last_sync_at?: string | null }
  creators: CreatorContentGroup[]
  /** Content in a folder nobody has matched to a creator. Internal only. */
  unfiled: ContentItem[]
  totals: {
    awaiting_client: number; with_us?: number; approved: number
    changes_requested: number; creators_awaited: number
  }
}

/** Signed, short-lived, minted per request. Never cached, never stored. */
export interface Playback {
  id: string
  name: string
  media_type: string | null
  poster: string | null
  /** Plays a .MOV and a 4K master that a bare <video> would refuse. Prefer it. */
  hls: string | null
  mp4: string | null
  preview: string | null
  expires_in: number
}

export interface ContentSource {
  linked: boolean
  can_link: boolean
  folder_name?: string | null
  share_url?: string | null
  last_sync_at?: string | null
  last_sync_error?: string | null
  last_sync_counts?: Record<string, number>
  // Superadmin only.
  frameio_folder_id?: string
  frameio_project_id?: string
  folder_view_url?: string | null
  linked_at?: string
  connection?: { connected: boolean; last_ok_at: string | null; last_error: string | null }
}

export interface FrameioConnection {
  connected: boolean
  configured: boolean
  reason?: string | null
  account_email?: string | null
  account_id?: string | null
  connected_at?: string | null
  expires_at?: string | null
  last_ok_at?: string | null
  last_error?: string | null
  last_error_at?: string | null
  campaigns_linked?: number
}

export interface UnmatchedFolder { folder_id: string; name: string; parent_id: string }
export interface MatchCandidate { id: string; username: string | null; full_name: string | null; avatar: string | null }

export interface ContentEvent {
  event: string
  actor_side: string | null
  actor_name: string | null
  item_name: string | null
  detail: Record<string, unknown>
  created_at: string
}

export interface FrameComment {
  frameio_comment_id: string
  author_name: string | null
  body: string | null
  timestamp_ms: number | null
  frameio_created_at: string | null
}

// ── Internal ─────────────────────────────────────────────────────────────────────────────
// Not `/admin/content`: that prefix already means creator profiles elsewhere in the API.
const A = '/api/v1/admin/content-delivery'

export const contentAdminApi = {
  // Connection. Superadmin only, and reached from inside the campaigns module.
  connection: () => call<FrameioConnection>(`${A}/connection`),
  authorizeUrl: (redirectUri: string) =>
    call<{ url: string }>(`${A}/connection/authorize-url?redirect_uri=${encodeURIComponent(redirectUri)}`),
  connect: (code: string, redirectUri: string) =>
    post<FrameioConnection>(`${A}/connection`, { code, redirect_uri: redirectUri }),
  disconnect: () => call<void>(`${A}/connection`, { method: 'DELETE' }),

  // The picker. Requires a search term server-side, so opening the dialog never enumerates
  // the account.
  searchProjects: (q: string) =>
    call<{ id: string; name: string; root_folder_id: string }[]>(`${A}/projects?q=${encodeURIComponent(q)}`),
  browse: (projectId: string, folderId?: string) =>
    call<{ folder_id: string; folders: { id: string; name: string }[]; file_count: number }>(
      `${A}/projects/${projectId}/folders${folderId ? `?folder_id=${folderId}` : ''}`),

  // Per campaign.
  source: (campaignId: string) => call<ContentSource>(`${A}/campaigns/${campaignId}`),
  link: (campaignId: string, body: { url?: string; project_id?: string; folder_id?: string; share_url?: string }) =>
    post<{ source: ContentSource; counts: Record<string, number>; unmatched: UnmatchedFolder[] }>(
      `${A}/campaigns/${campaignId}/link`, body),
  unlink: (campaignId: string, purge = false) =>
    call<void>(`${A}/campaigns/${campaignId}/link?purge=${purge}`, { method: 'DELETE' }),
  sync: (campaignId: string) =>
    post<{ counts: Record<string, number>; unmatched: UnmatchedFolder[] }>(`${A}/campaigns/${campaignId}/sync`),
  unmatched: (campaignId: string) =>
    call<{ unmatched: UnmatchedFolder[]; creators: MatchCandidate[] }>(`${A}/campaigns/${campaignId}/unmatched`),
  resolveFolder: (campaignId: string, body: { folder_id: string; folder_name?: string; campaign_creator_id?: string | null; ignored?: boolean }) =>
    post<void>(`${A}/campaigns/${campaignId}/resolve-folder`, body),
  setShareLink: (campaignId: string, shareUrl: string | null) =>
    post<void>(`${A}/campaigns/${campaignId}/share-link`, { share_url: shareUrl }),

  wall: (campaignId: string) => call<ContentWall>(`${A}/campaigns/${campaignId}/wall`),
  playback: (campaignId: string, itemId: string) =>
    call<Playback>(`${A}/campaigns/${campaignId}/items/${itemId}/playback`),
  comments: (campaignId: string, itemId: string) =>
    call<FrameComment[]>(`${A}/campaigns/${campaignId}/items/${itemId}/comments`),
  sendForReview: (campaignId: string, body: { item_ids?: string[]; campaign_creator_id?: string }) =>
    post<{ sent: number }>(`${A}/campaigns/${campaignId}/send-for-review`, body),
  note: (campaignId: string, itemId: string, note: string | null) =>
    post<void>(`${A}/campaigns/${campaignId}/items/${itemId}/note`, { note }),
  unapprove: (campaignId: string, itemId: string, reason?: string) =>
    post<void>(`${A}/campaigns/${campaignId}/items/${itemId}/unapprove`, { reason }),
  history: (campaignId: string, itemId?: string) =>
    call<ContentEvent[]>(`${A}/campaigns/${campaignId}/history${itemId ? `?item_id=${itemId}` : ''}`),
}

// ── Brand ────────────────────────────────────────────────────────────────────────────────
/** Content across every campaign a brand can open, for their home screen. */
export interface ContentSummary {
  awaiting_you: number
  approved: number
  changes_requested: number
  creators_working: number
  live_campaigns: number
  /** The campaign with the most waiting, and the creators waiting on it. Null when nothing
   *  is waiting anywhere, which is the signal to render no panel at all. */
  focus: {
    campaign_id: string
    campaign_name: string
    waiting: number
    creators: CreatorContentGroup[]
  } | null
}

export const contentBrandApi = {
  summary: () => call<ContentSummary>('/api/v1/campaigns/content/summary'),
  wall: (campaignId: string) => call<ContentWall>(`/api/v1/campaigns/${campaignId}/content`),
  playback: (campaignId: string, itemId: string) =>
    call<Playback>(`/api/v1/campaigns/${campaignId}/content/${itemId}/playback`),
  approve: (campaignId: string, body: { item_ids?: string[]; campaign_creator_id?: string }) =>
    post<{ approved: number }>(`/api/v1/campaigns/${campaignId}/content/approve`, body),
  requestChanges: (campaignId: string, body: { note: string; item_ids?: string[]; campaign_creator_id?: string }) =>
    post<{ flagged: number }>(`/api/v1/campaigns/${campaignId}/content/request-changes`, body),
}

// ── Shared display helpers ───────────────────────────────────────────────────────────────
/** One sentence per state, written for the person reading it. The brand and the team see
 *  different words for the same row, which is the only place the two are allowed to differ. */
export const STATE_COPY: Record<CreatorContentState, { label: string; brand: string; team: string }> = {
  waiting_on_you:   { label: 'Waiting on you',   brand: 'Ready for your review',      team: 'With the client' },
  changes_requested:{ label: 'Changes needed',   brand: 'You asked for changes',      team: 'Client asked for changes' },
  with_us:          { label: 'With us',          brand: 'Being filmed',               team: 'Not sent to the client yet' },
  in_production:    { label: 'Being filmed',     brand: 'Being filmed',               team: 'Not sent to the client yet' },
  approved:         { label: 'Approved',         brand: 'Approved',                   team: 'Approved by the client' },
  awaited:          { label: 'Not delivered yet',brand: 'Not delivered yet',          team: 'Nothing delivered yet' },
}

export function isVideo(mediaType?: string | null): boolean {
  return !!mediaType && mediaType.startsWith('video')
}

export function prettySize(bytes?: number | null): string {
  if (!bytes) return ''
  const mb = bytes / 1024 / 1024
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`
}
