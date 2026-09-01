/**
 * Shared vocabulary for the proposal builder (`/superadmin/proposals/create`).
 *
 * The builder is an operator tool. It only ever handles SELL prices — the
 * `sell_*_aed_cents` columns off `influencer_database`. Cost and margin are
 * leadership-only and are decided server-side by `app/core/field_policy.py`;
 * nothing in this folder may ever read or render a `cost_*` field.
 */

export interface BrandUser {
  id: string
  email: string
  full_name?: string
  company?: string
  role?: string
}

export interface MasterInfluencer {
  id: string
  username: string
  full_name?: string
  profile_image_url?: string
  followers_count: number
  engagement_rate: number
  categories: string[]
  tier?: string
  sell_post_aed_cents?: number | null
  sell_story_aed_cents?: number | null
  sell_reel_aed_cents?: number | null
  sell_carousel_aed_cents?: number | null
  sell_video_aed_cents?: number | null
  sell_bundle_aed_cents?: number | null
  sell_monthly_aed_cents?: number | null
}

export interface DeliverableAssignment {
  type: string
  quantity: number
}

/** influencer_db_id -> the deliverables assigned to that creator */
export type DeliverableAssignmentMap = Record<string, DeliverableAssignment[]>

export const DELIVERABLE_TYPES = [
  { key: "post", label: "Post", priceField: "sell_post_aed_cents" },
  { key: "story", label: "Story", priceField: "sell_story_aed_cents" },
  { key: "reel", label: "Reel", priceField: "sell_reel_aed_cents" },
  { key: "carousel", label: "Carousel", priceField: "sell_carousel_aed_cents" },
  { key: "video", label: "Video", priceField: "sell_video_aed_cents" },
  { key: "bundle", label: "Bundle", priceField: "sell_bundle_aed_cents" },
  { key: "monthly", label: "Monthly", priceField: "sell_monthly_aed_cents" },
] as const

export const TIER_OPTIONS = ["all", "nano", "micro", "mid", "macro", "mega"]

export const CATEGORY_OPTIONS = [
  "all", "Fashion", "Beauty", "Fitness", "Food", "Travel",
  "Tech", "Lifestyle", "Entertainment", "Sports", "Business",
]

/** The dirham sign (U+20C3), used everywhere else in the product. */
export const AED = "⃃"

/**
 * A follower count we are willing to put on screen.
 *
 * A creator in the master database with zero followers has not been measured —
 * that is a failed scrape, not a measurement. Printing "0" states a fact we do
 * not have. An em-dash says the honest thing: we do not know yet.
 */
export function followersLabel(n?: number | null): string {
  if (n == null || n <= 0) return "—"
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return String(n)
}

/** Same rule for engagement: 0.00% is what a failed analysis looks like. */
export function engagementLabel(rate?: number | null): string {
  if (rate == null || rate <= 0) return "—"
  return rate.toFixed(2) + "%"
}

/** The sell price, in whole dirhams, of one unit of `type` for this creator. */
export function unitSellPrice(
  inf: MasterInfluencer,
  type: string
): number | null {
  const field = DELIVERABLE_TYPES.find((d) => d.key === type)?.priceField
  if (!field) return null
  const cents = (inf as unknown as Record<string, number | null | undefined>)[field]
  if (cents == null) return null
  return cents / 100
}

/** What this creator adds to the proposal, given their assigned deliverables. */
export function creatorSubtotal(
  inf: MasterInfluencer,
  assignments: DeliverableAssignment[] | undefined
): number {
  return (assignments || []).reduce((sum, d) => {
    const unit = unitSellPrice(inf, d.type)
    if (unit == null) return sum
    return sum + unit * d.quantity
  }, 0)
}
