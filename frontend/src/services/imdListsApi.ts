/**
 * Superadmin curated lists of master-database creators.
 * Mirrors app/api/admin/imd_lists_routes.py.
 *
 * Distinct from src/services/listsApi.ts, which is the brand-facing /my-lists feature keyed
 * on profiles. These lists hold influencer_database rows — the same thing a proposal holds.
 */
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin`

async function jfetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const needsCT = ['POST', 'PUT', 'PATCH'].includes(method)
  const res = await fetchWithAuth(url, {
    ...options,
    headers: { ...(needsCT ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API error: ${res.status}`)
  }
  return res.json()
}

/** The three platforms we can brief, price and verify. Same words as fa_deliverables.platform. */
export type BriefPlatform = 'instagram' | 'tiktok' | 'snapchat'

/** One ask, on one platform, with a number attached. "2 Instagram reels" is a deliverable;
 *  "reel" is a category of deliverable and does not tell a creator what to quote. */
export interface BriefDeliverable {
  platform: BriefPlatform
  format: string
  quantity: number
}

/**
 * One thing in a barter package. Same shape as `campaigns.barter_items`, which the FA barter
 * campaign already writes and the creator app already reads: `{name, value_aed, description}`,
 * values in whole AED, never cents.
 */
export interface BriefBarterItem {
  name: string
  value_aed?: number
  description?: string
}

/**
 * The brief, structured so the next round can filter by the same terms.
 *
 * Everything here is optional and every reader tolerates its absence, because areas released
 * before a field existed will never have it. Rendering lives in `src/lib/areaBrief.ts`.
 */
export interface AreaBrief {
  /* Who the client wants. */
  categories?: string[]
  market?: string
  followers_min?: number
  followers_max?: number
  /** Who the brand wants REACHED, which is a different question from how big the creator is. */
  audience?: string
  /** How many we are looking for. Mirrored onto the area itself as target_count. */
  target_count?: number

  /* What we are offering. Absent means cash, because every area written before this was cash. */
  comp_mode?: 'cash' | 'barter' | 'both'
  /**
   * What the client told us they have, and which kind of number it is: the whole campaign,
   * or every month on a retainer.
   *
   * This is a fact the client said out loud, which makes it business development's to
   * record and sell-side by nature. It is the only money a brief carries.
   */
  client_budget?: number
  client_budget_kind?: 'campaign' | 'monthly'
  /**
   * RETIRED. What we would pay one creator.
   *
   * Read, never written. A rate per creator already exists per creator in the master
   * database, with the margin a superadmin set on it, and a creator soft-added by the talent
   * team is waiting on a superadmin for a sell price. A number typed into a brief was a
   * second source for the same fact with nothing reconciling the two, which is how four
   * disagreeing tier tables happened elsewhere in this product. Areas released before the
   * ruling still carry it and still render it, so nothing already written is lost.
   */
  budget_per_creator?: number
  /**
   * The band talent sources inside, in AED per creator. Not the retired single figure: a
   * range the founder sets on the brief so a list is built at the right price the first
   * time. The Minimalist list came back "way out of budget, we need 3.5k to 4k" a day after
   * it was built, because this was nowhere on the brief.
   */
  budget_min?: number
  budget_max?: number
  barter_items?: BriefBarterItem[]
  /** How the barter reaches them. Same two words as campaigns.fulfilment_mode. */
  fulfilment_mode?: 'delivery' | 'dine_in'

  /* What we need back. */
  /**
   * The old, Instagram-shaped list: ['reel', 'story']. Still written on every save so that
   * any reader not yet updated keeps working, and still read for areas that predate
   * `deliverable_specs`. `deliverable_specs` wins where both are present.
   */
  deliverables?: string[]
  deliverable_specs?: BriefDeliverable[]
  usage_rights?: 'organic' | 'paid_ads' | 'full_buyout'
  usage_days?: number
  exclusivity_days?: number
  /** Brands a creator must not have posted for, and must not post for during the term. */
  avoid_brands?: string[]
  /** When the content must go live, and whether that window can move. */
  live_from?: string
  live_to?: string
  dates_firm?: boolean

  notes?: string
}

export interface ImdListSummary {
  id: string
  name: string
  description?: string | null
  items_count: number
  created_at: string
  updated_at: string
  created_by_email?: string | null
  /** 'client' — one brand's roster · 'sample' — a standing pack anyone can send. */
  kind?: 'client' | 'sample'
  team_id?: string | null
  team_name?: string | null
  /**
   * Set only when an area has been handed to one named person, which is an action on the
   * area and no longer part of releasing it. A release goes to the talent team.
   */
  owner_user_id?: string | null
  owner_email?: string | null
  /**
   * How the area came to be, from records that already existed: business development
   * logged the brand (`teams.created_by`), a founder released it (`imd_lists.created_by`),
   * and it went to the talent team (their client grants). Area detail only.
   */
  logged_by_email?: string | null
  logged_at?: string | null
  released_by_email?: string | null
  handed_to?: string[]
  brief?: AreaBrief | null
  due_at?: string | null
  target_count?: number | null
  archived_at?: string | null
  /**
   * Which pass we are on, and whether it is closed. A second round is this same area with a
   * higher number, not a copy of it: one row per creator, ever, so last round's rejections
   * are still sitting here wearing their reason.
   */
  round_no?: number
  locked_at?: string | null
  locked_by_email?: string | null
  /** How much we have found, how much the client may see, how much they turned down. */
  cleared_count?: number
  dropped_count?: number
  /** Stocked and waiting on a yes or no from us. The inbox queue. */
  awaiting_count?: number
  picked_count?: number
  live_links?: number
  client_note?: string | null
}

export interface ImdListCreator {
  id: string
  item_id: string
  username: string
  full_name?: string | null
  profile_image_url?: string | null
  followers_count?: number | null
  engagement_rate?: number | null
  tier?: string | null
  status?: string | null
  categories?: string[] | null
  country?: string | null
  sell_reel_aed_cents?: number | null
  sell_post_aed_cents?: number | null
  /** 'complete' | 'partial' | null — null means we hold no analytics row at all. */
  analytics_status?: string | null
  analytics_collected_at?: string | null
  /** Cleared to leave the building. A share link shows only these. */
  cleared_at?: string | null
  cleared_by_email?: string | null
  struck_at?: string | null
  struck_reason?: string | null
  /** The round they came in on, so round three can see who is new since round two. */
  added_in_round?: number | null
  /**
   * Their no, not ours. Struck is us taking someone off the table; dropped is the client
   * looking and passing. Always carries a reason, and never deletes the row.
   */
  dropped_at?: string | null
  dropped_reason?: string | null
  dropped_in_round?: number | null
  dropped_by_email?: string | null
  /** What the client said, straight onto the row we researched. */
  client_verdict?: 'selected' | 'rejected' | null
  client_reason?: string | null
  client_decided_at?: string | null
  /* ── the sheet ─────────────────────────────────────────────────────────────────── */
  /** Talent's own pass: sent to a founder, or let go for THIS campaign (still in the database). */
  talent_state?: 'new' | 'shortlisted' | 'passed'
  talent_reason?: string | null
  talent_decided_at?: string | null
  /** What they asked and what we agreed, in their currency, for this campaign. */
  quote_asked?: number | null
  quote_agreed?: number | null
  quote_currency?: string | null
  quote_asked_aed_cents?: number | null
  quote_agreed_aed_cents?: number | null
  quote_bundle?: string | null
  quote_usage_monthly?: number | null
  quote_note?: string | null
  quoted_at?: string | null
  /** A founder's word on the row. */
  review_note?: string | null
  added_by_email?: string | null
  tiktok_username?: string | null
  youtube_handle?: string | null
  gender?: string | null
  relationship_tags?: string[] | null
  has_contact?: boolean
  cost_reel_aed_cents?: number | null
  sell_story_aed_cents?: number | null
  sell_tiktok_video_aed_cents?: number | null
  sell_youtube_short_aed_cents?: number | null
  has_package_price?: boolean
  /** The last price we AGREED with them on another campaign, and which one. */
  last_agreed_aed_cents?: number | null
  last_agreed_context?: string | null
  /** Let go on another roster, and why. Travels with the creator. */
  passed_elsewhere_reason?: string | null
  /** The live public link, when one has been minted. Null until an operator shares. */
  share_token?: string | null
  share_path?: string | null
  share_expires_at?: string | null
  share_views?: number | null
}

/**
 * A creator this client has already turned down, held back from a proposal.
 *
 * `client_reason` is the client's own sentence, not our paraphrase of it. That is the whole
 * value of the object: it is what lets whoever is adding them decide in two seconds whether
 * the rejection still applies, rather than being told a count and guessing.
 */
export interface ClientRejection {
  influencer_db_id: string
  username: string
  client_reason: string | null
  rejected_at: string | null
  area: string | null
  round_no: number | null
}

/** Why a creator has no measured analytics — see availability.py. */
export interface Unavailability {
  reason: string
  fault: 'instagram' | 'ours'
  retryable: boolean
  headline: string
  detail: string
  instagram_url: string | null
}

export const creatorShareApi = {
  /** Mint or reuse the live public link. 400 when the gap is ours to fix. */
  create: (username: string, expires_in_days?: number): Promise<{
    data: { token: string; share_path: string; created: boolean; unavailable: Unavailability | null }
  }> =>
    jfetch(`${BASE}/creator-shares/${encodeURIComponent(username)}`, {
      method: 'POST', body: JSON.stringify({ expires_in_days: expires_in_days ?? null }),
    }),

  revoke: (username: string): Promise<{ data: { revoked: number } }> =>
    jfetch(`${BASE}/creator-shares/${encodeURIComponent(username)}/revoke`, {
      method: 'POST', body: '{}',
    }),

  list: () => jfetch(`${BASE}/creator-shares`),
}

export interface PasteRow {
  handle: string
  state: 'new' | 'known' | 'already_here'
  asked: number | null
  agreed: number | null
  currency: string | null
  bundle: string | null
  usage_monthly: number | null
  asked_aed: number | null
  agreed_aed: number | null
  tiktok?: string | null
  youtube?: string | null
}

export interface ReadyRow { influencer_id: string; username: string; reason: string | null; line: { type: string; quantity: number } | null }

export interface CreatorHistory {
  creator: { id: string; username: string; relationship_tags: string[]; gender: string | null; languages: string[]; internal_notes: string | null; has_contact: boolean }
  quotes: { id: string; context: string | null; asked: number | null; agreed: number | null; currency: string; asked_aed_cents: number | null; agreed_aed_cents: number | null; bundle: string | null; usage_monthly: number | null; note: string | null; source: string; captured_at: string; captured_by_email: string | null; roster: string | null }[]
  campaigns: { campaign: string; agreed_rate_cents: number | null; stage: string | null; added_at: string | null }[]
  rosters: { roster: string; brand: string | null; talent_state: string; talent_reason: string | null; struck_reason: string | null; dropped_reason: string | null; client_verdict: string | null; added_at: string }[]
  last_agreed_aed_cents: number | null
  fx_as_of: string
}

export const rosterSheetApi = {
  meta: (): Promise<{ data: { currencies: string[]; aed_per: Record<string, number>; fx_as_of: string; bundles: { key: string; label: string }[] } }> =>
    jfetch(`${BASE}/roster-sheet/meta`),
  paste: (id: string, text: string, dry_run: boolean):
    Promise<{ data: { rows?: PasteRow[]; added?: number; quoted?: number; new?: number; already_here?: number; message?: string } }> =>
    jfetch(`${BASE}/imd-lists/${id}/paste`, { method: 'POST', body: JSON.stringify({ text, dry_run }) }),
  quote: (id: string, influencerId: string, q: { asked?: number | null; agreed?: number | null; currency: string; bundle?: string | null; usage_monthly?: number | null; note?: string | null }) =>
    jfetch(`${BASE}/imd-lists/${id}/items/${influencerId}/quote`, { method: 'PUT', body: JSON.stringify(q) }),
  talent: (id: string, influencer_ids: string[], action: 'shortlist' | 'pass' | 'reset', reason?: string):
    Promise<{ data: { updated: number; state: string } }> =>
    jfetch(`${BASE}/imd-lists/${id}/talent`, { method: 'POST', body: JSON.stringify({ influencer_ids, action, reason }) }),
  reviewNote: (id: string, influencer_ids: string[], note: string, send_back = true) =>
    jfetch(`${BASE}/imd-lists/${id}/review-note`, { method: 'POST', body: JSON.stringify({ influencer_ids, note, send_back }) }),
  priceAndClear: (id: string, items: { influencer_id: string; sell_aed: number | null }[]):
    Promise<{ data: { priced: number; cleared: number; problems: { influencer_id: string; username?: string; reason: string }[] } }> =>
    jfetch(`${BASE}/imd-lists/${id}/price-and-clear`, { method: 'POST', body: JSON.stringify({ items, clear: true }) }),
  proposalCheck: (id: string, proposalId: string, influencer_ids: string[]):
    Promise<{ data: { proposal: { id: string; title: string; status: string }; ready: ReadyRow[]; blocked: ReadyRow[] } }> =>
    jfetch(`${BASE}/imd-lists/${id}/proposal-check/${proposalId}`, { method: 'POST', body: JSON.stringify({ influencer_ids }) }),
  toProposal: (id: string, proposalId: string, influencer_ids: string[], ack?: { reason: string }):
    Promise<{ data: { added: number; blocked: ReadyRow[]; skipped_detail: { username: string; reason: string }[]; client_rejected: ClientRejection[] } }> =>
    jfetch(`${BASE}/imd-lists/${id}/to-proposal/${proposalId}`, {
      method: 'POST',
      body: JSON.stringify({ influencer_ids, acknowledge_client_rejections: !!ack, override_reason: ack?.reason }),
    }),
  history: (influencerId: string): Promise<{ data: CreatorHistory }> =>
    jfetch(`${BASE}/influencers/${influencerId}/history`),
  getContact: (influencerId: string): Promise<{ data: { contact_phone: string | null; contact_email: string | null; contact_updated_at: string | null; updated_by: string | null } }> =>
    jfetch(`${BASE}/influencers/${influencerId}/contact`),
  setContact: (influencerId: string, c: { phone?: string; email?: string }) =>
    jfetch(`${BASE}/influencers/${influencerId}/contact`, { method: 'PUT', body: JSON.stringify(c) }),
  setRelationship: (influencerId: string, r: { tags: string[]; gender?: string | null; languages?: string[] }) =>
    jfetch(`${BASE}/influencers/${influencerId}/relationship`, { method: 'PUT', body: JSON.stringify(r) }),
}

export const imdListsApi = {
  list: (params: { kind?: 'client' | 'sample'; team_id?: string; mine?: boolean } = {}):
    Promise<{ data: { lists: ImdListSummary[] } }> => {
    const q = new URLSearchParams()
    if (params.kind) q.set('kind', params.kind)
    if (params.team_id) q.set('team_id', params.team_id)
    if (params.mine) q.set('mine', 'true')
    const qs = q.toString()
    return jfetch(`${BASE}/imd-lists${qs ? `?${qs}` : ''}`)
  },

  get: (id: string): Promise<{ data: ImdListSummary & { items: ImdListCreator[] } }> =>
    jfetch(`${BASE}/imd-lists/${id}`),

  create: (payload: {
    name: string; description?: string; influencer_ids?: string[]
    kind?: 'client' | 'sample'; team_id?: string | null; brief?: AreaBrief
    owner_user_id?: string | null; due_at?: string | null; target_count?: number | null
  }) => jfetch(`${BASE}/imd-lists`, { method: 'POST', body: JSON.stringify(payload) }),

  update: (id: string, payload: {
    name?: string; description?: string; kind?: 'client' | 'sample'
    team_id?: string | null; brief?: AreaBrief; owner_user_id?: string | null
    due_at?: string | null; target_count?: number | null; archived?: boolean
  }) => jfetch(`${BASE}/imd-lists/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  /**
   * Release a brand to the talent team with the brief. Founders only — this is the gate
   * between business development logging interest and anyone researching creators.
   *
   * No owner. It is released to the talent team, and the release grants them the client;
   * handing the area to one named person is a later action on the area (`update`).
   */
  startSourcing: (payload: {
    team_id: string; name?: string; brief?: AreaBrief
    due_at?: string | null; target_count?: number | null
  }): Promise<{ data: { id: string; name: string; brand: string } }> =>
    jfetch(`${BASE}/imd-lists/start-sourcing`, { method: 'POST', body: JSON.stringify(payload) }),

  /** Clear creators to be shown to the client. Founders only; refuses anyone unpriced. */
  clear: (id: string, influencer_ids: string[]): Promise<{ data: { cleared: number } }> =>
    jfetch(`${BASE}/imd-lists/${id}/clear`, {
      method: 'POST', body: JSON.stringify({ influencer_ids }),
    }),

  /** Take creators back off the table. The row and the research stay; the reason is kept. */
  strike: (id: string, influencer_ids: string[], reason: string): Promise<{ data: { struck: number } }> =>
    jfetch(`${BASE}/imd-lists/${id}/strike`, {
      method: 'POST', body: JSON.stringify({ influencer_ids, reason }),
    }),

  /**
   * The client turned these creators down. The reason is required, here and in the database:
   * a drop with no reason is the one thing the round loop exists to record, thrown away.
   */
  drop: (id: string, influencer_ids: string[], reason: string):
    Promise<{ data: { dropped: number; round_no: number } }> =>
    jfetch(`${BASE}/imd-lists/${id}/drop`, {
      method: 'POST', body: JSON.stringify({ influencer_ids, reason }),
    }),

  /** Put a dropped creator back. People record the wrong name, and clients change their mind. */
  undrop: (id: string, influencer_ids: string[]): Promise<{ data: { restored: number } }> =>
    jfetch(`${BASE}/imd-lists/${id}/undrop`, {
      method: 'POST', body: JSON.stringify({ influencer_ids }),
    }),

  /** Close this round. Nothing in it changes again, and the client link stops taking answers. */
  lock: (id: string): Promise<{ data: { round_no: number; picked: number; dropped: number; standing: number } }> =>
    jfetch(`${BASE}/imd-lists/${id}/lock`, { method: 'POST', body: '{}' }),

  /** Go round again. Same area, one number higher, every rejection still in it. */
  nextRound: (id: string): Promise<{ data: { round_no: number; already_rejected: number; still_standing: number } }> =>
    jfetch(`${BASE}/imd-lists/${id}/next-round`, { method: 'POST', body: '{}' }),

  remove: (id: string) => jfetch(`${BASE}/imd-lists/${id}`, { method: 'DELETE' }),

  /**
   * Share the whole list with someone who has no login. The link carries an expiry and can
   * be revoked; minting again while one is live returns the same token rather than issuing
   * a second, so revoking really does close the list.
   */
  share: (id: string, payload: { expires_in_days?: number; reveal?: 'with_prices' | 'no_prices' } = {}) =>
    jfetch(`${BASE}/imd-lists/${id}/share`, { method: 'POST', body: JSON.stringify(payload) }),

  shareStatus: (id: string) => jfetch(`${BASE}/imd-lists/${id}/share`),

  revokeShare: (id: string) =>
    jfetch(`${BASE}/imd-lists/${id}/share`, { method: 'DELETE' }),

  /** Returns { added, skipped } — skipped are those already in the list. */
  addItems: (id: string, influencer_ids: string[]): Promise<{ data: { added: number; skipped: number } }> =>
    jfetch(`${BASE}/imd-lists/${id}/items`, { method: 'POST', body: JSON.stringify({ influencer_ids }) }),

  removeItem: (id: string, influencerId: string) =>
    jfetch(`${BASE}/imd-lists/${id}/items/${influencerId}`, { method: 'DELETE' }),

  /** Returns { added, skipped, list_size } — skipped were already on the proposal. */
  addToProposal: (id: string, proposalId: string): Promise<{
    data: {
      added: number; skipped: number; list_size: number;
      /** Why each one was skipped — "no sell price" far more often than a duplicate. */
      skipped_detail?: { influencer_db_id: string; username?: string | null; reason: string }[];
      unpriced?: (string | null)[]; duplicates?: (string | null)[];
      /**
       * Held back because this client turned them down. The area's own drops are already
       * filtered out of the id list, so these are rejections recorded on a DIFFERENT area
       * belonging to the same client.
       */
      client_rejected?: ClientRejection[];
    }
  }> =>
    jfetch(`${BASE}/imd-lists/${id}/add-to-proposal/${proposalId}`, { method: 'POST', body: '{}' }),

  /**
   * Put a hand-picked selection straight onto a proposal, without making a list first.
   * Only creators with a sell price go on; the rest come back named so we can say why.
   */
  addSelectionToProposal: (
    proposalId: string, influencerIds: string[],
    deliverable: { type: string; quantity: number } = { type: 'reel', quantity: 1 },
    /**
     * Go ahead with creators this client has already turned down. Requires a reason, which
     * is written onto the proposal row and flags them for review, so an approver reads it
     * before the proposal reaches the client.
     */
    override?: { reason: string },
    /** What was picked per creator in the shared picker; wins over `deliverable`. */
    linesByCreator?: Record<string, unknown[]>,
  ): Promise<{
    data: {
      added: number; already_on_proposal: number; unpriced: string[]; no_cost: string[]
      deliverable: { type: string; quantity: number }; without_deliverable: string[]
      client_rejected: ClientRejection[]
      overridden: { influencer_db_id: string; username: string; note: string }[]
    }
  }> =>
    jfetch(`${BASE}/imd-lists/selection/add-to-proposal/${proposalId}`, {
      method: 'POST',
      body: JSON.stringify({
        influencer_ids: influencerIds,
        deliverable_type: deliverable.type,
        quantity: deliverable.quantity,
        ...(linesByCreator ? { lines_by_creator: linesByCreator } : {}),
        ...(override ? {
          acknowledge_client_rejections: true,
          override_reason: override.reason,
        } : {}),
      }),
    }),

  /** Download the list as CSV. Streams a file, so it does NOT go through jfetch's
   *  res.json(). Cost pricing is off by default — the file is built to be forwarded. */
  async exportCsv(id: string, name: string, includeCost = false): Promise<void> {
    const res = await fetchWithAuth(
      `${BASE}/imd-lists/${id}/export.csv${includeCost ? '?include_cost=true' : ''}`
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Export failed: ${res.status}`)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(name || 'list').replace(/[^A-Za-z0-9_-]+/g, '_')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
}
