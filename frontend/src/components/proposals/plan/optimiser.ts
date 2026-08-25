/**
 * Smart pick — the strongest line-up the client's budget actually covers.
 *
 * Every combination is evaluated, not a greedy pass: with a shortlist of this size that is
 * a few thousand subsets and costs nothing, and greedy gets the last few thousand dirhams
 * wrong exactly when it matters most. Leftover budget is money the client loses — it
 * cannot be carried into another campaign — so the objective is to spend it, with quality
 * breaking the tie between equally-spent line-ups.
 */
import type { BrandInfluencer } from '@/services/adminProposalMasterApi'
import { EXHAUSTIVE_LIMIT, searchExhaustive, searchGreedy, type Chosen } from './search'

export type Strategy = 'mix' | 'reach' | 'value' | 'ours'

export const STRATEGIES: { key: Strategy; label: string; note: string }[] = [
  { key: 'mix', label: 'Best mix', note: 'Engagement first, and no more than two creators from one category.' },
  { key: 'reach', label: 'Most reach', note: 'The most people your budget can put this in front of.' },
  { key: 'value', label: 'Best value', note: 'The most engaged audience per dirham.' },
  { key: 'ours', label: 'Our pick', note: "Our team's own order for this brief." },
]

/** The proposal's priced add-on, e.g. "With boosting rights +20%". */
export interface PriceModifier {
  id: string
  label: string
  description?: string | null
  kind: 'percent' | 'fixed'
  percent_value?: number | null
  amount_aed?: number | null
}

/** Can this creator take the add-on at all? Only lines the operator marked eligible. */
export function modifierEligible(c: BrandInfluencer): boolean {
  return (c.assigned_deliverables ?? []).some((d: any) => d?.modifier_eligible)
}

/** What the add-on adds for one creator, on the eligible lines only.
 *  A fixed add-on is charged once for the creator, not once per line. */
export function modifierExtra(c: BrandInfluencer, mod?: PriceModifier | null): number {
  if (!mod || !modifierEligible(c)) return 0
  if (mod.kind === 'fixed') return mod.amount_aed ?? 0
  const pct = (mod.percent_value ?? 0) / 100
  const pricing = c.sell_pricing ?? {}
  return (c.assigned_deliverables ?? []).reduce((sum, d: any) => {
    if (!d?.modifier_eligible) return sum
    const unit = pricing[d.type]
    return unit == null ? sum : sum + unit * (d.quantity || 1) * pct
  }, 0)
}

/** What a creator costs on THIS proposal: the deliverables we assigned them, at the
 *  quantities we assigned, at their frozen price. Never a single headline rate.
 *
 *  `withMod` adds the priced add-on where the client has taken it, so the budget bar and
 *  the optimiser both count the real number rather than the standard one. */
export function creatorCost(c: BrandInfluencer, mod?: PriceModifier | null, withMod?: boolean): number {
  const base = baseCost(c)
  return withMod ? base + modifierExtra(c, mod) : base
}

function baseCost(c: BrandInfluencer): number {
  const pricing = c.sell_pricing ?? {}
  const assigned = c.assigned_deliverables ?? []
  if (assigned.length) {
    return assigned.reduce((sum, d) => {
      const unit = pricing[d.type]
      return unit == null ? sum : sum + unit * (d.quantity || 1)
    }, 0)
  }
  // No assignment means we quoted them open: take the cheapest thing they do, so an
  // unassigned creator never inflates the plan on a guess.
  const values = Object.values(pricing).filter((v): v is number => v != null)
  return values.length ? Math.min(...values) : 0
}

const er = (c: BrandInfluencer) => c.measured?.engagement_rate ?? c.engagement_rate ?? 0
const views = (c: BrandInfluencer) => c.measured?.median_views ?? c.avg_views ?? 0
const cat = (c: BrandInfluencer) => c.measured?.category ?? c.categories?.[0] ?? 'other'

/** Where a value sits among the others on this proposal, 0-100. Missing values are
 *  excluded rather than treated as zero — we do not know is not the same as low. */
function rankPct(v: number, all: number[]): number {
  const s = all.filter(x => x > 0).sort((a, b) => a - b)
  if (!v || !s.length) return 0
  if (s.length === 1) return 100
  return Math.max(8, Math.min(100, (s.filter(x => x < v).length / (s.length - 1)) * 100))
}

function scorer(strategy: Strategy, pool: BrandInfluencer[]) {
  const ers = pool.map(er)
  const vws = pool.map(views)
  const order = new Map(pool.map((c, i) => [c.id, pool.length - i]))
  return (c: BrandInfluencer) => {
    const cost = creatorCost(c) || 1
    switch (strategy) {
      case 'reach': return (c.followers_count ?? 0) / 1000
      case 'value': return ((c.followers_count ?? 0) * er(c)) / cost * 100
      case 'ours': return order.get(c.id) ?? 0
      default: return rankPct(er(c), ers) + rankPct(views(c), vws) * 0.4
    }
  }
}

export interface PickResult {
  picks: BrandInfluencer[]
  spend: number
  leftover: number
  tested: number
}

/**
 * Runs the search in slices so the page can show it happening, and so a long search never
 * blocks the main thread. `onTick` gets the best line-up found so far.
 *
 * Exhaustive below eighteen creators, greedy-and-filled above it — a real proposal can
 * carry fifty, where every-combination is 2^50 and not a plan. Both are hard-capped at the
 * budget: the result can never come back over.
 */
export async function optimise(
  pool: BrandInfluencer[],
  budget: number,
  strategy: Strategy,
  onTick?: (p: { tested: number; total: number; best: BrandInfluencer[]; spend: number }) => void,
  pace = 34,
): Promise<PickResult> {
  const live = pool.filter(c => !c.declined_at && creatorCost(c) > 0)
  if (!live.length || budget <= 0) return { picks: [], spend: 0, leftover: budget, tested: 0 }

  const score = scorer(strategy, live)
  const cats = new Map(live.map(c => [c.id, cat(c)]))
  /* Best mix keeps a line-up from becoming six of the same thing. */
  const allow = (picked: BrandInfluencer[], next: BrandInfluencer) => {
    if (strategy !== "mix") return true
    const k = cats.get(next.id)
    return picked.filter(x => cats.get(x.id) === k).length < 2
  }

  const result: Chosen = live.length <= EXHAUSTIVE_LIMIT
    ? searchExhaustive(live, budget, creatorCost, score, allow, onTick)
    : searchGreedy(live, budget, creatorCost, score, allow, onTick)

  /* Never hand back something the client cannot afford. If this ever trips, drop the
     dearest until it fits rather than showing a plan that is over. */
  let picks = result.picks
  let spend = picks.reduce((sum: number, c: BrandInfluencer) => sum + creatorCost(c), 0)
  while (spend > budget && picks.length) {
    const dearest = picks.reduce((m: BrandInfluencer, c: BrandInfluencer) => (creatorCost(c) > creatorCost(m) ? c : m), picks[0])
    picks = picks.filter(c => c !== dearest)
    spend -= creatorCost(dearest)
  }

  if (pace) await new Promise(r => setTimeout(r, pace))
  return {
    picks,
    spend,
    leftover: budget - spend,
    tested: live.length <= EXHAUSTIVE_LIMIT ? 1 << live.length : live.length * 6,
  }
}

/**
 * A tier deal is bought by the head, not by the dirham: the client bought three micro and
 * two macro, so the job is to fill each band with its strongest creators. There is no
 * budget to fill and no prices on screen, so quality is the only objective.
 */
export function optimiseByPlaces(
  pool: BrandInfluencer[],
  allowances: Record<string, number>,
  tierOf: (c: BrandInfluencer) => string | undefined,
  strategy: Strategy,
): BrandInfluencer[] {
  const live = pool.filter(c => !c.declined_at)
  const score = scorer(strategy, live)
  const out: BrandInfluencer[] = []
  for (const [tier, wanted] of Object.entries(allowances)) {
    if (!wanted) continue
    const band = live
      .filter(c => tierOf(c) === tier)
      .sort((a, b) => score(b) - score(a))
      .slice(0, wanted)
    out.push(...band)
  }
  return out
}

/** The one thing a creator is best at on this proposal, or nothing. A label on everybody
 *  says nothing, and a lukewarm one reads as a mark against them. */
export function whyFor(c: BrandInfluencer, pool: BrandInfluencer[]): { title: string; value: string } | null {
  const live = pool.filter(x => !x.declined_at)
  const top = (fn: (x: BrandInfluencer) => number) =>
    live.slice().sort((a, b) => fn(b) - fn(a))[0]
  const fmt = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`

  if (top(er) === c && er(c) > 0) return { title: 'Best engagement', value: `${er(c).toFixed(2)}%` }
  if (top(x => ((x.followers_count ?? 0) * er(x)) / (creatorCost(x) || 1)) === c)
    return { title: 'Best value', value: `AED ${creatorCost(c).toLocaleString('en-US')}` }
  if (top(views) === c && views(c) > 0) return { title: 'Most views', value: `${fmt(views(c))} a post` }
  if (top(x => x.followers_count ?? 0) === c) return { title: 'Biggest reach', value: fmt(c.followers_count ?? 0) }
  if (c.measured?.standing === 'exceptional') return { title: 'Exceptional for their size', value: `${er(c).toFixed(2)}%` }
  if (top(x => x.measured?.posts_per_week ?? 0) === c && (c.measured?.posts_per_week ?? 0) > 0)
    return { title: 'Posts most often', value: `${c.measured!.posts_per_week} a week` }
  return null
}
