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

export type Strategy = 'mix' | 'reach' | 'value' | 'ours'

export const STRATEGIES: { key: Strategy; label: string; note: string }[] = [
  { key: 'mix', label: 'Best mix', note: 'Engagement first, and no more than two creators from one category.' },
  { key: 'reach', label: 'Most reach', note: 'The most people your budget can put this in front of.' },
  { key: 'value', label: 'Best value', note: 'The most engaged audience per dirham.' },
  { key: 'ours', label: 'Our pick', note: "Our team's own order for this brief." },
]

/** What a creator costs on THIS proposal: the deliverables we assigned them, at the
 *  quantities we assigned, at their frozen price. Never a single headline rate. */
export function creatorCost(c: BrandInfluencer): number {
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
 */
export async function optimise(
  pool: BrandInfluencer[],
  budget: number,
  strategy: Strategy,
  onTick?: (p: { tested: number; total: number; best: BrandInfluencer[]; spend: number }) => void,
  pace = 34,
): Promise<PickResult> {
  const live = pool.filter(c => !c.declined_at)
  const n = Math.min(live.length, 20)          // 2^20 is the practical ceiling
  const total = 1 << n
  const score = scorer(strategy, live)
  const costs = live.map(creatorCost)
  const scores = live.map(score)
  const cats = live.map(cat)

  const candidates: { m: number; cost: number; s: number }[] = []
  let maxSpend = 0
  let best: BrandInfluencer[] = []
  const CHUNK = Math.max(16, Math.floor(total / 90))

  for (let start = 1; start < total; start += CHUNK) {
    const end = Math.min(total, start + CHUNK)
    for (let m = start; m < end; m++) {
      let cost = 0, s = 0, ok = true
      const seen: Record<string, number> = {}
      for (let i = 0; i < n; i++) {
        if (!(m >> i & 1)) continue
        cost += costs[i]
        s += scores[i]
        if (strategy === 'mix') {
          const k = cats[i]
          seen[k] = (seen[k] || 0) + 1
          if (seen[k] > 2) { ok = false; break }
        }
      }
      if (!ok || cost > budget) continue
      if (cost > maxSpend) {
        maxSpend = cost
        best = live.filter((_, i) => m >> i & 1)
      }
      candidates.push({ m, cost, s })
    }
    onTick?.({ tested: end, total, best, spend: maxSpend })
    await new Promise(r => requestAnimationFrame(() => r(null)))
    if (pace) await new Promise(r => setTimeout(r, pace))
  }

  // Among the line-ups that spend within a whisker of the most we can spend, take the
  // strongest. Maximising spend alone would buy expensive mediocrity.
  const shortlist = candidates.filter(c => c.cost >= maxSpend * 0.985)
  shortlist.sort((a, b) => b.s - a.s)
  const win = shortlist[0] ?? candidates.sort((a, b) => b.s - a.s)[0]
  if (!win) return { picks: [], spend: 0, leftover: budget, tested: total }

  const picks = live.filter((_, i) => win.m >> i & 1)
  return { picks, spend: win.cost, leftover: budget - win.cost, tested: total }
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
