/**
 * Run — the brief-and-offer engine, brand side.
 *
 * A brand posts a BRIEF (what they want made). It reaches two populations of creators.
 * Creators reply with OFFERS (their own price, and what they will make for it). The brand
 * compares the offers and AWARDS some of them, which creates a campaign with every price
 * locked at the awarded number.
 *
 * ── STATUS OF THE BACKEND ──────────────────────────────────────────────────────
 * None of this exists on the server yet. Searched wave0/safety-and-fixes end to end:
 * there is no brief entity, no offer entity, no award action and no table for any of
 * them. The nearest things are `sourcing_rounds` (an internal, operator-run version of
 * the same idea) and proposals (`POST /api/v1/admin/proposals/{id}/open-campaign` is the
 * existing "this becomes a campaign" primitive) — both agency-mediated rather than
 * creator-bid-driven.
 *
 * So this file IS the contract. It is deliberately the only file in the module that
 * knows a URL; every screen imports from here. When the server lands, the shapes below
 * are what it has to answer, and nothing above this file should need to change.
 *
 * Conventions taken from the existing services so the server side is not a surprise:
 *   • envelope `{ success: true, data: {...} }` on every response
 *   • errors as HTTPException with a plain-English `detail`
 *   • money in AED *fils* (integer cents), matching `sell_post_aed_cents` and friends
 *   • the brief's own fields reuse the de-facto brief schema already used by
 *     `sourcing_rounds.criteria` and `imd_lists.brief`: categories, market,
 *     followers_min/max, deliverables, budget_per_creator_*
 *
 * ── TWO RULES THIS FILE ENFORCES FOR THE WHOLE MODULE ──────────────────────────
 * 1. A number that was not answered is `null`, never `0`. `readNumber` below maps
 *    undefined/""/NaN to null and NEVER falls back to a zero. A zero that survives to
 *    the UI is therefore a measured zero, and the UI is free to render it as a fact.
 * 2. A brand never sees our cost or our margin. `scrubInternal` strips any key that
 *    looks like cost or margin from every response before it reaches a component, so a
 *    server that over-shares cannot leak through this module even by accident.
 */
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"

const BASE = `${API_CONFIG.BASE_URL}/api/v1/run`

/* ────────────────────────────────────────────────────────────────────────────
   Rule 3, structurally: cost and margin cannot reach a brand screen.

   The types below simply have no cost fields, so TypeScript offers nothing to
   render. But types vanish at runtime, and `{...row}` spreads survive, so the
   response is also scrubbed on the way in. Anything a future server adds whose
   key contains cost/margin/markup/profit is deleted before a component sees it.
   ──────────────────────────────────────────────────────────────────────────── */
const INTERNAL_KEY = /(^|_)(cost|margin|markup|profit|internal)(_|$)/i

function scrubInternal<T>(value: T): T {
  if (Array.isArray(value)) return value.map(scrubInternal) as unknown as T
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (INTERNAL_KEY.test(key)) continue
      out[key] = scrubInternal(entry)
    }
    return out as T
  }
  return value
}

/* ────────────────────────────────────────────────────────────────────────────
   Rule 1, structurally: a request that did not answer is null, never zero.

   Read every numeric field off the wire through this. It is the only reason the
   UI is allowed to render a plain `0` — by the time a zero reaches a component
   it can only have come from the server as a real, measured zero.
   ──────────────────────────────────────────────────────────────────────────── */
export function readNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null
  const value = typeof raw === "number" ? raw : Number(raw)
  return Number.isFinite(value) ? value : null
}

async function jfetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase()
  const needsCT = ["POST", "PUT", "PATCH"].includes(method)
  const res = await fetchWithAuth(url, {
    ...options,
    headers: {
      ...(needsCT ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API error: ${res.status}`)
  }
  const body = await res.json()
  return scrubInternal(body?.data ?? body) as T
}

/* ══════════════════════════════════════════════════════════════════════════════
   BRIEFS
   ══════════════════════════════════════════════════════════════════════════════ */

/** What a creator is being asked to make. Same seven the rest of the app uses. */
export type DeliverableType =
  | "post"
  | "story"
  | "reel"
  | "carousel"
  | "video"
  | "bundle"
  | "monthly"

export const DELIVERABLE_LABELS: Record<DeliverableType, string> = {
  post: "Post",
  story: "Story",
  reel: "Reel",
  carousel: "Carousel",
  video: "Video",
  bundle: "Bundle",
  monthly: "Monthly",
}

export interface DeliverableAsk {
  type: DeliverableType
  /** How many of this thing each creator makes. */
  quantity: number
}

/**
 * Money on a brief is either a number per creator, or one pot split across however
 * many are awarded. The brand picks which, and the two are not interchangeable —
 * a pot with no headcount cannot be turned into a per-creator number.
 */
export type BudgetMode = "per_creator" | "pot"

export type BriefStatus = "draft" | "live" | "awarded" | "expired"

/**
 * Why a brief stopped. A list of dead briefs with no reasons is a graveyard; this is
 * the field that makes it a list. The server must always send one when status is
 * 'expired' — there is no honest default, so the UI says so rather than guessing.
 */
export type ExpiryReason =
  | "deadline_passed"
  | "no_offers"
  | "closed_by_brand"
  | "budget_withdrawn"
  | "awarded_elsewhere"

export const EXPIRY_REASONS: Record<ExpiryReason, string> = {
  deadline_passed: "The deadline passed before you awarded it",
  no_offers: "It reached creators but nobody offered before the deadline",
  closed_by_brand: "You closed it",
  budget_withdrawn: "The budget was withdrawn",
  awarded_elsewhere: "The work was awarded on another brief",
}

/** The two populations. This split is the whole two-product argument, so it is a type. */
export type Population = "following" | "inflink"

export const POPULATION_LABELS: Record<Population, string> = {
  following: "Following creators",
  inflink: "Inflink creators",
}

export const POPULATION_BLURBS: Record<Population, string> = {
  following: "Creators we represent. Priced, verified, and reliability-scored by us.",
  inflink: "Creators on Inflink who match and can reply with their own price.",
}

/** One population's share of the reach, answered before the brief is posted. */
export interface ReachSlice {
  population: Population
  /** Creators who match and would be reached. null = we could not count them. */
  creators: number | null
  /** Summed followers across those creators. null = not answerable. */
  followers: number | null
  /** Median asking price in AED fils for this brief's deliverables, if known. */
  median_price_fils: number | null
}

export interface ReachEstimate {
  slices: ReachSlice[]
  /** Total creators reached. null when either slice failed — a partial total is a lie. */
  total_creators: number | null
  /** True when at least one population could not be counted. */
  partial: boolean
}

export interface BriefSummary {
  id: string
  title: string
  status: BriefStatus
  market: string | null
  deliverables: DeliverableAsk[]
  deadline_at: string | null
  created_at: string
  budget_mode: BudgetMode
  /** Per-creator ceiling, or the whole pot, in AED fils. Which one `budget_mode` says. */
  budget_fils: number | null
  /** How many creators it reached when it was posted. */
  reached_count: number | null
  /** How many replied with an offer. */
  offers_count: number | null
  /** Set only when status === 'expired'. */
  expiry_reason: ExpiryReason | null
  /** Set only when status === 'awarded'. */
  campaign_id: string | null
  awarded_count: number | null
}

export interface BriefDetail extends BriefSummary {
  description: string | null
  categories: string[]
  followers_min: number | null
  followers_max: number | null
  /** The reach as measured at post time, kept so the list can show what it promised. */
  reach: ReachEstimate | null
  populations: Population[]
}

/** What step 3 posts. Mirrors the three steps of the composer exactly. */
export interface BriefDraft {
  title: string
  description?: string | null
  deliverables: DeliverableAsk[]
  market?: string | null
  categories?: string[]
  followers_min?: number | null
  followers_max?: number | null
  deadline_at?: string | null
  budget_mode: BudgetMode
  budget_fils: number | null
  populations: Population[]
}

/* ══════════════════════════════════════════════════════════════════════════════
   OFFERS
   ══════════════════════════════════════════════════════════════════════════════ */

export type OfferStatus = "open" | "awarded" | "declined" | "withdrawn"

/**
 * One creator's reply to a brief.
 *
 * Note what is NOT here: no cost, no margin, no internal note. `price_fils` is the
 * creator's own asking price, which is a sell price by construction — there is no
 * second number to leak.
 *
 * Every measurement is `number | null` on purpose. A creator whose scrape failed has
 * `engagement_rate: null`, and the module renders that as "not measured", never 0%.
 */
export interface Offer {
  id: string
  brief_id: string
  status: OfferStatus
  population: Population

  creator_id: string
  username: string
  full_name: string | null
  /** Always a cdn.following.ae URL. Instagram's own scontent-* hosts block hotlinking. */
  avatar_url: string | null

  /** What the creator is asking, in AED fils. Their number, not ours. */
  price_fils: number | null
  /** What they are offering to make — may differ from what the brief asked for. */
  offering: DeliverableAsk[]
  /** Free text the creator added with the offer. */
  note: string | null

  followers: number | null
  /** Real measured engagement. null when the scrape failed; NEVER 0 as a stand-in. */
  engagement_rate: number | null
  /** True when we hold no successful measurement — the reason `engagement_rate` is null. */
  analytics_failed: boolean

  /**
   * Past reliability, 0–100, from the deliverable ladder: how often this creator
   * delivered on time. null for a creator who has not worked a campaign yet, which is
   * a different thing from a creator who has and scored zero.
   */
  reliability_score: number | null
  /** Campaigns completed with us. Gives the score its weight. */
  campaigns_completed: number | null

  submitted_at: string
}

/* ══════════════════════════════════════════════════════════════════════════════
   AWARD
   ══════════════════════════════════════════════════════════════════════════════ */

export interface AwardPreview {
  offers: { offer_id: string; username: string; price_fils: number | null }[]
  /** Sum of the awarded prices in AED fils. null if any awarded price is unknown. */
  total_fils: number | null
  /** The pot minus the total, when the brief has a pot. */
  budget_remaining_fils: number | null
  count: number
}

export interface AwardResult {
  campaign_id: string
  awarded_count: number
  total_fils: number | null
}

/* ══════════════════════════════════════════════════════════════════════════════
   CAMPAIGN WORKSPACE — the brand's four steps
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * The internal ladder has eight rungs (see services/ladderApi.ts): enrolled,
 * rate_agreed, contracted, briefed, content_in, content_approved, posted, paid.
 *
 * Four of those are ours: rate_agreed, contracted and paid are money and paperwork
 * between us and the creator, and enrolled is a queue state. The brand sees the four
 * that are actually about the work, which is also why no cost can appear on this
 * screen — the rungs that carry money are not in the union.
 */
export type WorkStep = "briefed" | "submitted" | "approved" | "live"

export const WORK_STEPS: { key: WorkStep; label: string; blurb: string }[] = [
  { key: "briefed", label: "Briefed", blurb: "The creator has the brief and is making it." },
  { key: "submitted", label: "Submitted", blurb: "Content is in and waiting on you." },
  { key: "approved", label: "Approved", blurb: "You approved it. It is scheduled to post." },
  { key: "live", label: "Live", blurb: "It is posted." },
]

export interface WorkItem {
  id: string
  step: WorkStep
  creator_id: string
  username: string
  full_name: string | null
  avatar_url: string | null

  deliverable: DeliverableType
  quantity: number

  /** When the content is due from the creator. */
  due_at: string | null
  /** Submitted content, on our CDN. Images and video both arrive here. */
  submission_url: string | null
  submission_kind: "image" | "video" | null
  submitted_at: string | null
  /** The live post, once it is up. */
  posted_url: string | null
  posted_at: string | null

  /** The reason the brand last sent it back. Shown to the creator verbatim. */
  change_reason: string | null
  change_requested_at: string | null

  /** The awarded, locked price in AED fils. A sell price — there is no other number. */
  price_fils: number | null
}

export interface Workspace {
  campaign_id: string
  name: string
  brief_id: string | null
  starts_at: string | null
  ends_at: string | null
  items: WorkItem[]
  counts: Record<WorkStep, number>
}

/* ══════════════════════════════════════════════════════════════════════════════
   THE CALLS

   Every one of these is NEW. None of these paths answer today.
   ══════════════════════════════════════════════════════════════════════════════ */
export const runApi = {
  /** Screen 1. Every brief, with how many it reached and how many replied. */
  listBriefs: (status?: BriefStatus) =>
    jfetch<{ items: BriefSummary[] }>(
      `${BASE}/briefs${status ? `?status=${status}` : ""}`
    ),

  getBrief: (briefId: string) => jfetch<{ brief: BriefDetail }>(`${BASE}/briefs/${briefId}`),

  /**
   * Screen 2, step 2. Who this brief would reach, split by population, answered
   * BEFORE it is posted. Takes the draft rather than an id, because at this point
   * the brief does not exist yet.
   */
  previewReach: (draft: Partial<BriefDraft>) =>
    jfetch<{ reach: ReachEstimate }>(`${BASE}/briefs/reach`, {
      method: "POST",
      body: JSON.stringify(draft),
    }),

  /** Screen 2, step 3. Posting it is what sends it to creators. */
  postBrief: (draft: BriefDraft) =>
    jfetch<{ brief: BriefDetail }>(`${BASE}/briefs`, {
      method: "POST",
      body: JSON.stringify(draft),
    }),

  closeBrief: (briefId: string) =>
    jfetch<{ brief: BriefSummary }>(`${BASE}/briefs/${briefId}/close`, { method: "POST" }),

  /** Screen 3. Every offer against a brief. */
  listOffers: (briefId: string) =>
    jfetch<{ offers: Offer[]; brief: BriefSummary }>(`${BASE}/briefs/${briefId}/offers`),

  /** Screen 4, before. What awarding these would cost and who it covers. */
  previewAward: (briefId: string, offerIds: string[]) =>
    jfetch<{ preview: AwardPreview }>(`${BASE}/briefs/${briefId}/award/preview`, {
      method: "POST",
      body: JSON.stringify({ offer_ids: offerIds }),
    }),

  /** Screen 4. Creates the campaign and locks every awarded price. Not undoable. */
  award: (briefId: string, offerIds: string[]) =>
    jfetch<AwardResult>(`${BASE}/briefs/${briefId}/award`, {
      method: "POST",
      body: JSON.stringify({ offer_ids: offerIds }),
    }),

  /** Screen 5. The awarded campaign, as four steps. */
  getWorkspace: (campaignId: string) =>
    jfetch<{ workspace: Workspace }>(`${BASE}/campaigns/${campaignId}/workspace`),

  approve: (itemId: string) =>
    jfetch<{ item: WorkItem }>(`${BASE}/deliverables/${itemId}/approve`, { method: "POST" }),

  /** A change request without a reason is not a change request. `reason` is required. */
  requestChange: (itemId: string, reason: string) =>
    jfetch<{ item: WorkItem }>(`${BASE}/deliverables/${itemId}/request-change`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
}
