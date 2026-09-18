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
  /** Will this creator consider product instead of a fee. Gates the barter switch. */
  accepts_barter?: boolean | null
  /** What they said they would take, or the condition. Internal, never shown to a brand. */
  barter_note?: string | null
}

export interface DeliverableAssignment {
  type: string
  quantity: number
}

/**
 * One creator on this proposal, paid in product rather than cash.
 *
 * Kept per creator and not per proposal, because that is how these deals are actually
 * agreed: a managed client's roster is usually part cash and part product, and a switch on
 * the whole proposal would force an operator to build two proposals for one campaign.
 *
 * `valueAed` is what the product is WORTH. It is never money the client owes - they hand
 * the product over themselves - so it is totalled separately everywhere it appears.
 */
export interface BarterLine {
  paidInProduct: boolean
  product: string
  valueAed: number | null
}

/** influencer_db_id -> how that creator is being paid, when it is not cash */
export type BarterMap = Record<string, BarterLine>

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

/** The currency mark, spelled out. U+20C3 has no glyph in any system font, so in a plain
 *  string like this one it renders as an empty box; only the `Aed` primitive, which names the
 *  Dirham face on the element itself, can draw the sign. */
export const AED = "AED"

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
  assignments: DeliverableAssignment[] | undefined,
  barter?: BarterLine
): number {
  // A creator paid in product adds nothing to the cash total. Their product value is summed
  // by `barterSubtotal` and reported as product: a client who serves the dinner themselves
  // is not invoiced for it, and a builder that quietly added it would quote a number nobody
  // agreed to pay.
  if (barter?.paidInProduct) return 0
  return (assignments || []).reduce((sum, d) => {
    const unit = unitSellPrice(inf, d.type)
    if (unit == null) return sum
    return sum + unit * d.quantity
  }, 0)
}

/** What the client hands over in product across the whole roster. */
export function barterSubtotal(barter: BarterMap, ids?: string[]): number {
  const keys = ids ?? Object.keys(barter)
  return keys.reduce((sum, id) => {
    const line = barter[id]
    if (!line?.paidInProduct) return sum
    return sum + (line.valueAed || 0)
  }, 0)
}
