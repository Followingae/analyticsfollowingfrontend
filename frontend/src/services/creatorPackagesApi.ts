/**
 * A creator's packages, and what can be booked from a creator.
 *
 * Mirrors section 14 of app/api/admin/influencer_database_routes.py. Prices come back in
 * whole AED and follow the caller's role: talent see cost, account management see sell,
 * leadership see both. A value the caller may not see is null, never absent.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import type { CreatorPackage } from '@/types/influencerDatabase'
import type { DeliverableKey, Platform } from '@/lib/deliverables'
import type { PlatformMeasured } from '@/services/adminProposalMasterApi'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin`

async function call(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const res = await fetchWithAuth(url, {
    ...options,
    headers: {
      ...(['POST', 'PUT', 'PATCH'].includes(method) ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(typeof err.detail === 'string' ? err.detail : `API error: ${res.status}`)
  }
  return res.json()
}

export interface PackageInput {
  name: string
  includes: { type: DeliverableKey; quantity: number }[]
  cost_aed?: number | null
  sell_aed?: number | null
  note?: string | null
}

export interface BookableDeliverable {
  type: DeliverableKey
  platform: Platform
  label: string
  cost_aed: number | null
  sell_aed: number | null
}

export interface BookableCreator {
  username: string
  tiktok_username: string | null
  youtube_handle: string | null
  accepts_barter: boolean
  platforms: Platform[]
  deliverables: BookableDeliverable[]
  packages: CreatorPackage[]
}

export const creatorPackagesApi = {
  list: (influencerId: string): Promise<{ data: { packages: CreatorPackage[] } }> =>
    call(`${BASE}/influencers/${influencerId}/packages`),

  create: (influencerId: string, body: PackageInput): Promise<{ data: { package: CreatorPackage } }> =>
    call(`${BASE}/influencers/${influencerId}/packages`, { method: 'POST', body: JSON.stringify(body) }),

  update: (influencerId: string, packageId: string, body: Partial<PackageInput>):
    Promise<{ data: { package: CreatorPackage } }> =>
    call(`${BASE}/influencers/${influencerId}/packages/${packageId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  archive: (influencerId: string, packageId: string) =>
    call(`${BASE}/influencers/${influencerId}/packages/${packageId}`, { method: 'DELETE' }),

  /** Platforms, priced deliverables and packages for each creator, keyed by id. */
  bookable: (influencerIds: string[]): Promise<{ data: { creators: Record<string, BookableCreator> } }> =>
    call(`${BASE}/influencers/bookable`, { method: 'POST', body: JSON.stringify({ influencer_ids: influencerIds }) }),

  /** What we measured on their TikTok and YouTube, each with its status. */
  platformAnalytics: (influencerId: string): Promise<{ data: { platforms: Partial<Record<'tiktok' | 'youtube', PlatformAnalyticsRow>> } }> =>
    call(`${BASE}/influencers/${influencerId}/platform-analytics`),

  /** Measure one platform again (leadership; it spends money at Apify). */
  refreshPlatform: (influencerId: string, platform: 'tiktok' | 'youtube') =>
    call(`${BASE}/influencers/${influencerId}/platform-analytics/${platform}/refresh`, { method: 'POST' }),
}

export interface PlatformAnalyticsRow {
  handle: string
  status: 'queued' | 'running' | 'complete' | 'partial' | 'no_content' | 'failed' | 'unavailable'
  error: string | null
  collected_at: string | null
  payload: PlatformMeasured | null
}
