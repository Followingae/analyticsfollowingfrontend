/**
 * Run — the brief-and-offer engine, brand side.
 *
 * A brand posts a BRIEF (what they want made). It reaches two populations of creators.
 * Creators reply with OFFERS (their own price, and what they will make for it). The brand
 * compares the offers and AWARDS some of them, which creates a campaign with every price
 * locked at the awarded number.
 *
 * ── STATUS OF THE BACKEND ──────────────────────────────────────────────────────
 * It exists. `app/api/brief_routes.py` serves briefs, offers and the award, and it
 * landed in parallel with these screens — with its own field names and its own path
 * prefix. The two halves did not meet: this module called /api/v1/run/briefs and the
 * server answers /api/v1/briefs, and three of the calls below had no route at all.
 *
 * That is reconciled at THE WIRE, near the bottom of this file, which is the only
 * place in the module that knows a URL or a server field name. Every type in between
 * is unchanged, so no screen had to learn the server's vocabulary — and no live API
 * surface had to be renamed to match a client that was written before it.
 *
 * A mismatch of that kind cannot recur silently: scripts/check_api_contract.py in the
 * backend repo reads FastAPI's own OpenAPI schema, resolves every path this frontend
 * builds against it, and fails on one that nobody serves.
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
   THE WIRE

   The server exists. It does not speak the names above, and it should not have to.

   This module was written as the contract before the backend landed, and the
   backend landed with its own vocabulary: `country` where this module says
   `market`, `niches` where it says `categories`, `budget_max_aed_cents` where it
   says `budget_fils`, `open` where it says `live`. Both are internally consistent;
   neither is wrong. What would be wrong is renaming a live API surface to match a
   client, or renaming every field in five screens to match a server.

   So the translation happens here, in the one file that was always allowed to know
   about transport. Above this line nothing changed. Below it, every call goes to a
   path the backend actually serves — checked by scripts/check_api_contract.py in
   the backend repo, which reads FastAPI's own OpenAPI schema and fails a build that
   calls a route nobody answers. That check is the reason this comment can be short.

   PATHS, and why each is what it is:

     POST   /briefs                        the prefix was /run/, and nothing served it
     GET    /briefs
     GET    /briefs/{id}
     POST   /briefs/reach                  new; runs the fan-out's own matching
     POST   /briefs/{id}/cancel            this module called it 'close'
     GET    /briefs/{id}/offers
     POST   /briefs/{id}/award/preview     new; the total comes from the server
     POST   /briefs/{id}/award
     GET    /campaigns/{id}/workspace      new; a brand-shaped read of the ladder
     POST   /campaigns/{cid}/deliverables/{id}/approve-content   already existed
     POST   /campaigns/{cid}/deliverables/{id}/request-edit      already existed

   The last two are the important ones. Approving a deliverable has been a real
   endpoint for a long time — it carries the revision budget, notifies the creator
   and writes the audit line. A second pair of endpoints under /run/ would have been
   a second ladder drifting away from the first. So the workspace calls the existing
   ones, which is why approve() and requestChange() take the campaign id: the
   deliverable is addressed within its campaign, as it always has been.
   ══════════════════════════════════════════════════════════════════════════════ */

const BASE = `${API_CONFIG.BASE_URL}/api/v1`

/** Server envelopes. Only the fields this module reads are named. */
interface WireBrief {
  id: string
  title: string
  brief_text: string | null
  deliverables: DeliverableAsk[]
  country: string | null
  niches: string[]
  min_followers: number | null
  max_followers: number | null
  content_deadline: string | null
  budget_mode: BudgetMode
  budget_max_aed_cents: number | null
  status: "open" | "awarded" | "expired" | "cancelled"
  expires_at: string | null
  reach: { following: number | null; inflink: number | null; inflink_status: string | null }
  awarded_offer_ids: string[]
  awarded_campaign_id: string | null
  closed_reason: string | null
  created_at: string
  live_offer_count?: number
}

/**
 * The server has four brief states; this module has four; they are not the same four.
 *
 * `open` is what this module calls `live`. There is no `draft` on the server at all —
 * a brief is written and posted in one action, so nothing can be in that state, and
 * the composer's local draft never has an id to be in a state with.
 *
 * `cancelled` and `expired` both land on `expired` here, because from the brand's side
 * both mean "this is over and you did not award it". The difference is not lost: it is
 * exactly what `expiry_reason` carries, which is the field that turns a list of dead
 * briefs into something a person can read.
 */
function readStatus(status: WireBrief["status"]): BriefStatus {
  if (status === "open") return "live"
  if (status === "awarded") return "awarded"
  return "expired"
}

function readExpiryReason(wire: WireBrief, offers: number | null): ExpiryReason | null {
  if (wire.status === "cancelled") return "closed_by_brand"
  if (wire.status !== "expired") return null
  // The server's `closed_reason` is free text written for a person, not an enum, so
  // it is not parsed for meaning. The one thing that IS known is whether anybody
  // replied, and that is the difference between the two honest reasons.
  return offers === 0 ? "no_offers" : "deadline_passed"
}

function readBriefSummary(wire: WireBrief): BriefSummary {
  const offers = readNumber(wire.live_offer_count)
  return {
    id: wire.id,
    title: wire.title,
    status: readStatus(wire.status),
    market: wire.country ?? null,
    deliverables: wire.deliverables || [],
    deadline_at: wire.content_deadline ?? wire.expires_at ?? null,
    created_at: wire.created_at,
    budget_mode: wire.budget_mode,
    budget_fils: readNumber(wire.budget_max_aed_cents),
    reached_count: readNumber(wire.reach?.following),
    offers_count: offers,
    expiry_reason: readExpiryReason(wire, offers),
    campaign_id: wire.awarded_campaign_id ?? null,
    awarded_count: wire.awarded_offer_ids?.length ?? null,
  }
}

/**
 * The reach a brief was posted with, rebuilt from the two counts the brief row keeps.
 *
 * `inflink_status` is why this is not simply two numbers. 'skipped' means we never
 * asked — there is no Inflink transport configured — and 'failed' means we asked and
 * got nothing. Neither is a zero, so both read null and the total is withheld. A total
 * that quietly omits one population is the single most misleading number this module
 * could print, which is why `partial` exists at all.
 */
function readReachFromBrief(wire: WireBrief): ReachEstimate | null {
  if (!wire.reach) return null
  const counted = wire.reach.inflink_status === "acked"
  const inflink = counted ? readNumber(wire.reach.inflink) : null
  const following = readNumber(wire.reach.following)
  return {
    slices: [
      { population: "following", creators: following, followers: null, median_price_fils: null },
      { population: "inflink", creators: inflink, followers: null, median_price_fils: null },
    ],
    total_creators: following !== null && inflink !== null ? following + inflink : null,
    partial: inflink === null,
  }
}

function readBriefDetail(wire: WireBrief): BriefDetail {
  return {
    ...readBriefSummary(wire),
    description: wire.brief_text ?? null,
    categories: wire.niches || [],
    followers_min: readNumber(wire.min_followers),
    followers_max: readNumber(wire.max_followers),
    reach: readReachFromBrief(wire),
    // Every brief reaches both populations; the server does not take a subset and
    // there is no honest way to report one it did not act on.
    populations: ["following", "inflink"],
  }
}

/** The composer's draft → what POST /briefs validates. */
function writeBrief(draft: Partial<BriefDraft>) {
  return {
    title: draft.title,
    brief_text: draft.description,
    deliverables: draft.deliverables,
    country: draft.market,
    niches: draft.categories,
    min_followers: draft.followers_min,
    max_followers: draft.followers_max,
    content_deadline: draft.deadline_at,
    budget_mode: draft.budget_mode,
    budget_max_aed_cents: draft.budget_fils,
  }
}

interface WireReachSlice {
  population: Population
  creators: number | null
  followers: number | null
  median_price_aed_cents: number | null
  status: string
}

interface WireReach {
  slices: WireReachSlice[]
  total_creators: number | null
  partial: boolean
}

function readReach(wire: WireReach): ReachEstimate {
  return {
    slices: (wire.slices || []).map((slice) => ({
      population: slice.population,
      creators: readNumber(slice.creators),
      followers: readNumber(slice.followers),
      median_price_fils: readNumber(slice.median_price_aed_cents),
    })),
    total_creators: readNumber(wire.total_creators),
    partial: Boolean(wire.partial),
  }
}

interface WireOffer {
  id: string
  brief_id: string
  status: "offered" | "accepted" | "rejected" | "withdrawn" | "expired"
  origin: Population
  creator: {
    display_name: string | null
    username: string | null
    avatar_url: string | null
    followers: number | null
    engagement_rate: number | null
    influencer_db_id: string | null
    fa_member_id: string | null
    inflink_influencer_id: string | null
  }
  price_aed_cents: number
  deliverables: DeliverableAsk[]
  pitch: string | null
  created_at: string
  reliability: { score: number; resolved_count: number } | null
}

/**
 * The server's five offer states collapse to the four a brand acts on. `expired` and
 * `withdrawn` are both "this is no longer on the table"; `rejected` is `declined`,
 * which is the word the comparison screen uses because the brand is the one who did it.
 */
function readOfferStatus(status: WireOffer["status"]): OfferStatus {
  if (status === "offered") return "open"
  if (status === "accepted") return "awarded"
  if (status === "rejected") return "declined"
  return "withdrawn"
}

function readOffer(wire: WireOffer): Offer {
  const creator = wire.creator || ({} as WireOffer["creator"])
  const engagement = readNumber(creator.engagement_rate)
  return {
    id: wire.id,
    brief_id: wire.brief_id,
    status: readOfferStatus(wire.status),
    population: wire.origin,
    // Whichever id this creator has. An Inflink creator has no row in our tables at
    // all, so their own id is the only one that exists — falling back to the offer id
    // keeps the row keyed and never invents a creator we do not have.
    creator_id:
      creator.influencer_db_id || creator.fa_member_id || creator.inflink_influencer_id || wire.id,
    username: creator.username || "",
    full_name: creator.display_name ?? null,
    avatar_url: creator.avatar_url ?? null,
    price_fils: readNumber(wire.price_aed_cents),
    offering: wire.deliverables || [],
    note: wire.pitch ?? null,
    followers: readNumber(creator.followers),
    engagement_rate: engagement,
    // A null engagement rate here means we hold no successful measurement. It is not
    // a slow join and not a missing field: the offer row carries the number that was
    // measured when the offer was made, or nothing.
    analytics_failed: engagement === null,
    reliability_score: readNumber(wire.reliability?.score),
    campaigns_completed: readNumber(wire.reliability?.resolved_count),
    submitted_at: wire.created_at,
  }
}

interface WireWorkItem {
  id: string
  step: WorkStep
  creator_id: string | null
  username: string | null
  full_name: string | null
  avatar_url: string | null
  deliverable: DeliverableType
  quantity: number
  due_at: string | null
  submission_url: string | null
  submission_kind: "image" | "video" | null
  submitted_at: string | null
  posted_url: string | null
  posted_at: string | null
  change_reason: string | null
  change_requested_at: string | null
  price_aed_cents: number | null
}

function readWorkItem(wire: WireWorkItem): WorkItem {
  return {
    id: wire.id,
    step: wire.step,
    creator_id: wire.creator_id || wire.id,
    username: wire.username || "",
    full_name: wire.full_name ?? null,
    avatar_url: wire.avatar_url ?? null,
    deliverable: wire.deliverable,
    quantity: wire.quantity,
    due_at: wire.due_at,
    submission_url: wire.submission_url,
    submission_kind: wire.submission_kind,
    submitted_at: wire.submitted_at,
    posted_url: wire.posted_url,
    posted_at: wire.posted_at,
    change_reason: wire.change_reason,
    change_requested_at: wire.change_requested_at,
    price_fils: readNumber(wire.price_aed_cents),
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   THE CALLS
   ══════════════════════════════════════════════════════════════════════════════ */
export const runApi = {
  /** Screen 1. Every brief, with how many it reached and how many replied. */
  listBriefs: async (status?: BriefStatus): Promise<{ items: BriefSummary[] }> => {
    // The UI's `live` is the server's `open`, and its `expired` covers two server
    // states. Rather than ask for one and silently drop the other, an `expired`
    // filter is applied here over the unfiltered list.
    const wireStatus = status === "live" ? "open" : status === "awarded" ? "awarded" : undefined
    const data = await jfetch<{ briefs: WireBrief[] }>(
      `${BASE}/briefs${wireStatus ? `?status=${wireStatus}` : ""}`
    )
    let items = (data.briefs || []).map(readBriefSummary)
    if (status === "expired" || status === "draft") {
      items = items.filter((brief) => brief.status === status)
    }
    return { items }
  },

  getBrief: async (briefId: string): Promise<{ brief: BriefDetail }> => ({
    brief: readBriefDetail(await jfetch<WireBrief>(`${BASE}/briefs/${briefId}`)),
  }),

  /**
   * Screen 2, step 2. Who this brief would reach, split by population, answered
   * BEFORE it is posted. Takes the draft rather than an id, because at this point
   * the brief does not exist yet.
   *
   * The Following slice is not an estimate. The server runs the fan-out's own
   * matching call — same validator, same query, same ceiling — so the number shown
   * here is the set of creators the brief goes to when it is posted.
   */
  previewReach: async (draft: Partial<BriefDraft>): Promise<{ reach: ReachEstimate }> => {
    const data = await jfetch<{ reach: WireReach }>(`${BASE}/briefs/reach`, {
      method: "POST",
      body: JSON.stringify(writeBrief(draft)),
    })
    return { reach: readReach(data.reach) }
  },

  /** Screen 2, step 3. Posting it is what sends it to creators. */
  postBrief: async (draft: BriefDraft): Promise<{ brief: BriefDetail }> => ({
    brief: readBriefDetail(
      await jfetch<WireBrief>(`${BASE}/briefs`, {
        method: "POST",
        body: JSON.stringify(writeBrief(draft)),
      })
    ),
  }),

  /**
   * Pulling a brief. The server calls this `cancel`, and the word matters on the
   * creator's side: their live offers become `withdrawn` rather than `expired`,
   * which in their own history reads as "the brand pulled it" instead of "nobody
   * decided". This module keeps `closeBrief` as the name every screen already uses.
   */
  closeBrief: async (briefId: string): Promise<{ brief: BriefSummary }> => ({
    brief: readBriefSummary(
      await jfetch<WireBrief>(`${BASE}/briefs/${briefId}/cancel`, {
        method: "POST",
        body: JSON.stringify({}),
      })
    ),
  }),

  /** Screen 3. Every offer against a brief. */
  listOffers: async (briefId: string): Promise<{ offers: Offer[]; brief: BriefSummary }> => {
    const data = await jfetch<{ brief: WireBrief; offers: WireOffer[] }>(
      `${BASE}/briefs/${briefId}/offers`
    )
    return {
      brief: readBriefSummary(data.brief),
      offers: (data.offers || []).map(readOffer),
    }
  },

  /**
   * Screen 4, before. What awarding these would cost and who it covers.
   *
   * The total is the server's, not a sum taken in the browser. Awarding cannot be
   * undone, so the number a person agrees to is produced from the same rows and the
   * same budget rule the award applies a second later — and a reason the award would
   * be refused surfaces here, as an error on this call, rather than on the click.
   */
  previewAward: async (briefId: string, offerIds: string[]): Promise<{ preview: AwardPreview }> => {
    const data = await jfetch<{
      preview: {
        offers: { offer_id: string; username: string | null; price_aed_cents: number }[]
        count: number
        total_aed_cents: number
        budget_remaining_aed_cents: number | null
      }
    }>(`${BASE}/briefs/${briefId}/award/preview`, {
      method: "POST",
      body: JSON.stringify({ offer_ids: offerIds }),
    })
    return {
      preview: {
        offers: (data.preview.offers || []).map((offer) => ({
          offer_id: offer.offer_id,
          username: offer.username || "",
          price_fils: readNumber(offer.price_aed_cents),
        })),
        total_fils: readNumber(data.preview.total_aed_cents),
        budget_remaining_fils: readNumber(data.preview.budget_remaining_aed_cents),
        count: data.preview.count,
      },
    }
  },

  /** Screen 4. Creates the campaign and locks every awarded price. Not undoable. */
  award: async (briefId: string, offerIds: string[]): Promise<AwardResult> => {
    const data = await jfetch<{ campaign_id: string; awarded_offer_ids: string[] }>(
      `${BASE}/briefs/${briefId}/award`,
      { method: "POST", body: JSON.stringify({ offer_ids: offerIds }) }
    )
    return {
      campaign_id: data.campaign_id,
      awarded_count: data.awarded_offer_ids?.length ?? 0,
      // The award response reports what was created, not what it cost. The total the
      // brand agreed to is the one previewAward returned; deriving it again from a
      // different shape risks printing a second, different number for one decision.
      total_fils: null,
    }
  },

  /** Screen 5. The awarded campaign, as four steps. */
  getWorkspace: async (campaignId: string): Promise<{ workspace: Workspace }> => {
    const data = await jfetch<{
      workspace: Omit<Workspace, "items"> & { items: WireWorkItem[] }
    }>(`${BASE}/campaigns/${campaignId}/workspace`)
    return {
      workspace: {
        ...data.workspace,
        items: (data.workspace.items || []).map(readWorkItem),
      },
    }
  },

  /**
   * Approve submitted content. The campaign id is part of the address because this
   * is the platform's own deliverable endpoint, which has always scoped a deliverable
   * to its campaign — and which carries the creator notification and the audit line
   * that a second, Run-only endpoint would not have.
   */
  approve: (campaignId: string, itemId: string) =>
    jfetch<{ id: string }>(
      `${BASE}/campaigns/${campaignId}/deliverables/${itemId}/approve-content`,
      { method: "POST" }
    ),

  /**
   * Send content back with a reason. A change request without a reason is not a
   * change request, so `reason` is required here even though the server's `note` is
   * optional — the creator reads it verbatim, and an empty one tells them nothing.
   *
   * The revision budget lives on the server (paid campaigns get two). Once it is
   * spent this call answers 409 and the only move left is Approve.
   */
  requestChange: (campaignId: string, itemId: string, reason: string) =>
    jfetch<{ id: string }>(
      `${BASE}/campaigns/${campaignId}/deliverables/${itemId}/request-edit`,
      { method: "POST", body: JSON.stringify({ note: reason }) }
    ),
}
