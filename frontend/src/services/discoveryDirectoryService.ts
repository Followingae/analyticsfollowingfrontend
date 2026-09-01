/**
 * The discovery directory — a shallow lookup row per creator.
 *
 * A directory row is deliberately thin. It holds a handle, a picture, a follower
 * count, where they are, what they post about, one INDICATIVE engagement figure,
 * two flags, and nullable pointers at the deep records (profiles /
 * influencer_database / creator_analytics) that exist only once someone has paid
 * attention to that creator. Nothing else is in the table, so nothing else can be
 * rendered from it — anything richer is behind the 25-credit unlock.
 *
 * See migrations/20260831_discovery_directory.sql in the backend for the table and
 * app/services/discovery_directory/ for how rows get there.
 *
 * TWO SOURCES, ONE SHAPE
 * ----------------------
 * The directory endpoint does not exist yet: the migration is written but
 * unapplied and the ingest has never been run, so the table is empty. Rather than
 * ship a screen that can only be developed against a table that does not answer,
 * this module asks for the directory first and falls back to the existing
 * /discovery/browse endpoint (the 491 deeply-analysed profiles) mapped into the
 * SAME row shape. The screen therefore has real creators to render today and
 * switches to the directory the moment the backend endpoint lands, with no
 * component change.
 *
 * The fallback is honest about what it does not know: browse carries no country,
 * no city and no indicative ER, so those come back null and the UI omits them
 * rather than inventing a value.
 */

import { API_CONFIG, ENDPOINTS } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"

/** Exactly the columns a directory row has. Nothing here is an analysis. */
export interface DirectoryRow {
  id: string
  username: string
  full_name: string | null
  /** Serve this. Never profile_pic_url — Instagram origin URLs are hotlink-blocked. */
  cdn_avatar_url: string | null
  followers_count: number
  /** Indicative percent from a free recent-post sample. Null when unknown. */
  engagement_rate: number | null
  country: string | null
  city: string | null
  category: string | null
  is_verified: boolean
  is_business: boolean | null
  /** Set when the deep profile exists — lets the unlock go by id rather than handle. */
  profile_id: string | null
  /** True only when THIS team already holds access. */
  is_unlocked: boolean
  unlock_days_remaining: number | null
}

export interface DirectoryPage {
  rows: DirectoryRow[]
  /**
   * Null when the server did not tell us. A total is a fact or it is absent; it is
   * never zero because a field was missing.
   */
  total: number | null
  page: number
  page_size: number
  total_pages: number | null
  /** Which backend answered. Shown nowhere; used to explain absent facets. */
  source: "directory" | "profiles"
}

export interface DirectoryFacets {
  categories: string[]
  countries: string[]
}

export interface DirectoryQuery {
  search?: string
  category?: string
  country?: string
  min_followers?: number
  max_followers?: number
  sort?: "followers_desc" | "followers_asc" | "engagement_desc" | "alphabetical"
  page?: number
  page_size?: number
}

/**
 * A result that can be pending, answered, or failed — and never collapses the
 * third case into the second. `failed` carries a reason so the screen can say
 * "this did not answer" instead of drawing an empty grid.
 */
export type DirectoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: string }

const DIRECTORY_ENDPOINT = "/api/v1/discovery/directory"
const DIRECTORY_FACETS_ENDPOINT = "/api/v1/discovery/directory/facets"

/** ISO-3166 alpha-2 → a name a person reads. Only the markets we actually sell in. */
export const COUNTRY_NAMES: Record<string, string> = {
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  KW: "Kuwait",
  QA: "Qatar",
  BH: "Bahrain",
  OM: "Oman",
  JO: "Jordan",
  LB: "Lebanon",
  EG: "Egypt",
  IQ: "Iraq",
  MA: "Morocco",
  TN: "Tunisia",
  DZ: "Algeria",
  TR: "Turkey",
  GB: "United Kingdom",
  US: "United States",
  IN: "India",
  PK: "Pakistan",
  PH: "Philippines",
  FR: "France",
  DE: "Germany",
}

export function countryLabel(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code.toUpperCase()
}

/** The bands the business actually talks in. No engagement floor exists, by design. */
export const FOLLOWER_BANDS = [
  { value: "all", label: "Any size", min: undefined, max: undefined },
  { value: "nano", label: "2K – 10K", min: 2000, max: 10000 },
  { value: "micro", label: "10K – 50K", min: 10000, max: 50000 },
  { value: "mid", label: "50K – 250K", min: 50000, max: 250000 },
  { value: "macro", label: "250K – 1M", min: 250000, max: 1000000 },
  { value: "mega", label: "1M+", min: 1000000, max: undefined },
] as const

export type FollowerBand = (typeof FOLLOWER_BANDS)[number]["value"]

async function getJson(path: string): Promise<any> {
  const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    mode: "cors",
    credentials: "omit",
  })

  if (!response.ok) {
    const error: any = new Error(
      response.status === 401
        ? "Your session has expired. Please sign in again."
        : `The directory did not answer (HTTP ${response.status}).`
    )
    error.status = response.status
    throw error
  }

  return response.json()
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** A directory-shaped row straight from the directory endpoint. */
function mapDirectoryRow(raw: any): DirectoryRow {
  return {
    id: String(raw.id ?? raw.username),
    username: String(raw.username ?? ""),
    full_name: raw.full_name ?? null,
    cdn_avatar_url: raw.cdn_avatar_url ?? null,
    followers_count: toNumberOrNull(raw.followers_count) ?? 0,
    engagement_rate: toNumberOrNull(raw.engagement_rate),
    country: raw.country ? String(raw.country).toUpperCase() : null,
    city: raw.city ?? null,
    category: raw.category ?? null,
    is_verified: Boolean(raw.is_verified),
    is_business: raw.is_business ?? null,
    profile_id: raw.profile_id ?? null,
    is_unlocked: Boolean(raw.unlock_status?.is_unlocked ?? raw.is_unlocked),
    unlock_days_remaining: toNumberOrNull(raw.unlock_status?.days_remaining),
  }
}

/**
 * A /discovery/browse profile flattened into a directory row.
 *
 * Everything the directory has and browse does not stays null. In particular there
 * is no indicative engagement rate on this payload, and reporting the profile's
 * measured figure here would be quietly mixing two different numbers.
 */
function mapBrowseProfile(raw: any): DirectoryRow {
  return {
    id: String(raw.id),
    username: String(raw.username ?? ""),
    full_name: raw.full_name ?? null,
    cdn_avatar_url: raw.profile_pic_url ?? null,
    followers_count: toNumberOrNull(raw.followers_count) ?? 0,
    engagement_rate: null,
    country: null,
    city: null,
    category: raw.ai_analysis?.primary_content_type ?? null,
    is_verified: Boolean(raw.is_verified),
    is_business: null,
    profile_id: String(raw.id),
    is_unlocked: Boolean(raw.unlock_status?.is_unlocked),
    unlock_days_remaining: toNumberOrNull(raw.unlock_status?.days_remaining),
  }
}

function buildParams(query: DirectoryQuery): URLSearchParams {
  const params = new URLSearchParams()
  params.set("page", String(query.page ?? 1))
  params.set("page_size", String(query.page_size ?? 24))
  if (query.search) params.set("search", query.search)
  if (query.category) params.set("category", query.category)
  if (query.country) params.set("country", query.country)
  if (query.min_followers !== undefined)
    params.set("min_followers", String(query.min_followers))
  if (query.max_followers !== undefined)
    params.set("max_followers", String(query.max_followers))
  if (query.sort) params.set("sort_by", query.sort)
  return params
}

/**
 * One page of the directory.
 *
 * Throws on failure. The caller (React Query) turns that into the failed state —
 * which is a third thing, distinct from loading and from a genuinely empty result.
 */
export async function browseDirectory(
  query: DirectoryQuery
): Promise<DirectoryPage> {
  const params = buildParams(query)

  try {
    const payload = await getJson(`${DIRECTORY_ENDPOINT}?${params.toString()}`)
    const rows: DirectoryRow[] = (payload.rows ?? payload.creators ?? []).map(
      mapDirectoryRow
    )
    return {
      rows,
      total: toNumberOrNull(payload.total ?? payload.total_count),
      page: toNumberOrNull(payload.page) ?? query.page ?? 1,
      page_size: toNumberOrNull(payload.page_size) ?? query.page_size ?? 24,
      total_pages: toNumberOrNull(payload.total_pages),
      source: "directory",
    }
  } catch (error: any) {
    // 404 / 501 means the directory endpoint is not deployed yet. Anything else is
    // a real failure and must surface as one rather than silently degrading.
    if (error?.status !== 404 && error?.status !== 501) throw error
  }

  const payload = await getJson(
    `${ENDPOINTS.discovery.browse}?${params.toString()}`
  )
  const pagination = payload.pagination ?? {}
  return {
    rows: (payload.profiles ?? []).map(mapBrowseProfile),
    total: toNumberOrNull(pagination.total_profiles),
    page: toNumberOrNull(pagination.page) ?? query.page ?? 1,
    page_size: toNumberOrNull(pagination.page_size) ?? query.page_size ?? 24,
    total_pages: toNumberOrNull(pagination.total_pages),
    source: "profiles",
  }
}

/**
 * The filter options. A facet with nothing in it is returned empty and the screen
 * hides that filter entirely — an empty dropdown is worse than no dropdown.
 */
export async function fetchDirectoryFacets(): Promise<DirectoryFacets> {
  try {
    const payload = await getJson(DIRECTORY_FACETS_ENDPOINT)
    return {
      categories: (payload.categories ?? []).filter(Boolean).map(String),
      countries: (payload.countries ?? [])
        .filter(Boolean)
        .map((c: string) => String(c).toUpperCase()),
    }
  } catch (error: any) {
    if (error?.status !== 404 && error?.status !== 501) throw error
  }

  // The profiles fallback knows categories and nothing about geography.
  const payload = await getJson(ENDPOINTS.discovery.categories)
  const categories = Array.isArray(payload)
    ? payload
    : (payload?.categories ?? [])
  return {
    categories: categories.filter(Boolean).map(String),
    countries: [],
  }
}
