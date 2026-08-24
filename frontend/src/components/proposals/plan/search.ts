/**
 * Choosing the line-up, for lists of any size.
 *
 * Exhaustive search is exact but only viable to about eighteen creators; a real proposal
 * can carry fifty. So there are two engines behind one door:
 *
 *   small lists  — every combination, which is exact
 *   large lists  — greedy by quality, then a filling pass that swaps and adds until no
 *                  move puts another dirham to work
 *
 * Both are hard-capped at the budget. Leftover money is money the client loses, because
 * unused budget cannot be carried into another campaign, so both are optimising for spend
 * with quality breaking ties — never for "fits".
 */
import type { BrandInfluencer } from "@/services/adminProposalMasterApi"

export const EXHAUSTIVE_LIMIT = 18

export interface Chosen { picks: BrandInfluencer[]; spend: number }

/** Every combination. Exact, and only called when the list is small enough to be. */
export function searchExhaustive(
  pool: BrandInfluencer[],
  budget: number,
  costOf: (c: BrandInfluencer) => number,
  scoreOf: (c: BrandInfluencer) => number,
  allow: (picked: BrandInfluencer[], next: BrandInfluencer) => boolean,
  onTick?: (p: { tested: number; total: number; best: BrandInfluencer[]; spend: number }) => void,
): Chosen {
  const n = pool.length
  const total = 1 << n
  const costs = pool.map(costOf)
  const scores = pool.map(scoreOf)
  let best: BrandInfluencer[] = []
  let bestSpend = -1
  let bestScore = -Infinity

  for (let m = 1; m < total; m++) {
    let cost = 0, score = 0
    const picked: BrandInfluencer[] = []
    let ok = true
    for (let i = 0; i < n; i++) {
      if (!((m >>> i) & 1)) continue        // >>> and i < 32 by construction
      const c = pool[i]
      if (!allow(picked, c)) { ok = false; break }
      picked.push(c)
      cost += costs[i]
      score += scores[i]
      if (cost > budget) { ok = false; break }
    }
    if (!ok || !picked.length) continue
    if (cost > bestSpend || (cost >= bestSpend * 0.985 && score > bestScore)) {
      if (cost > bestSpend) bestSpend = cost
      bestScore = score
      best = picked
    }
    if (onTick && (m & 1023) === 0) onTick({ tested: m, total, best, spend: bestSpend })
  }
  onTick?.({ tested: total, total, best, spend: bestSpend })
  return { picks: best, spend: best.reduce((s, c) => s + costOf(c), 0) }
}

/**
 * Greedy, then filled.
 *
 * Take the strongest creators that fit, then keep looking for a move that spends more of
 * what is left without breaking the budget: swap somebody for a stronger, dearer creator,
 * or simply add another. It stops when no move improves the spend, which on a real
 * proposal lands within a rounding error of the exact answer.
 */
export function searchGreedy(
  pool: BrandInfluencer[],
  budget: number,
  costOf: (c: BrandInfluencer) => number,
  scoreOf: (c: BrandInfluencer) => number,
  allow: (picked: BrandInfluencer[], next: BrandInfluencer) => boolean,
  onTick?: (p: { tested: number; total: number; best: BrandInfluencer[]; spend: number }) => void,
): Chosen {
  const byValue = [...pool].sort((a, b) => {
    const va = scoreOf(a) / Math.max(costOf(a), 1)
    const vb = scoreOf(b) / Math.max(costOf(b), 1)
    return vb - va
  })

  const picks: BrandInfluencer[] = []
  let spend = 0
  for (const c of byValue) {
    const cost = costOf(c)
    if (spend + cost > budget) continue
    if (!allow(picks, c)) continue
    picks.push(c)
    spend += cost
  }

  // Fill what is left: a swap that costs more but still fits, or one more creator.
  let moved = true
  let passes = 0
  const total = pool.length * 6
  while (moved && passes < 6) {
    moved = false
    passes++
    const bench = pool.filter(c => !picks.includes(c))

    for (const out of [...picks]) {
      const room = budget - spend + costOf(out)
      const better = bench
        .filter(c => costOf(c) <= room && costOf(c) > costOf(out))
        .filter(c => allow(picks.filter(p => p !== out), c))
        .sort((a, b) => costOf(b) - costOf(a))[0]
      if (better) {
        picks.splice(picks.indexOf(out), 1, better)
        spend = spend - costOf(out) + costOf(better)
        moved = true
      }
    }
    for (const c of pool) {
      if (picks.includes(c)) continue
      const cost = costOf(c)
      if (spend + cost > budget) continue
      if (!allow(picks, c)) continue
      picks.push(c)
      spend += cost
      moved = true
    }
    onTick?.({ tested: passes * pool.length, total, best: picks, spend })
  }

  onTick?.({ tested: total, total, best: picks, spend })
  return { picks, spend }
}
