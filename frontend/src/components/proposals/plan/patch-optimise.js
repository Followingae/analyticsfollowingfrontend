/* Replaces the broken exhaustive-only optimise() with the two-engine search. */
const fs = require("fs")
const p = "src/components/proposals/plan/optimiser.ts"
let s = fs.readFileSync(p, "utf8")

const a = s.indexOf("/**\n * Runs the search in slices")
const b = s.indexOf("/**\n * A tier deal is bought by the head")
if (a < 0 || b < 0) { console.log("markers", a, b); process.exit(1) }

const REPLACEMENT = `/**
 * Runs the search in slices so the page can show it happening, and so a long search never
 * blocks the main thread. \`onTick\` gets the best line-up found so far.
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
  // Best mix keeps a line-up from becoming six of the same thing.
  const allow = (picked: BrandInfluencer[], next: BrandInfluencer) => {
    if (strategy !== "mix") return true
    const k = cats.get(next.id)
    return picked.filter(x => cats.get(x.id) === k).length < 2
  }

  const tick = onTick
    ? (x: { tested: number; total: number; best: BrandInfluencer[]; spend: number }) => onTick(x)
    : undefined

  let result: Chosen
  if (live.length <= EXHAUSTIVE_LIMIT) {
    result = searchExhaustive(live, budget, creatorCost, score, allow, tick)
  } else {
    result = searchGreedy(live, budget, creatorCost, score, allow, tick)
  }

  // Never hand back something the client cannot afford. If this ever trips, drop the
  // dearest until it fits rather than showing a plan that is over.
  let picks = result.picks
  let spend = picks.reduce((s2, c) => s2 + creatorCost(c), 0)
  while (spend > budget && picks.length) {
    const dearest = picks.reduce((m, c) => (creatorCost(c) > creatorCost(m) ? c : m), picks[0])
    picks = picks.filter(c => c !== dearest)
    spend -= creatorCost(dearest)
  }

  if (pace) await new Promise(r => setTimeout(r, pace))
  return { picks, spend, leftover: budget - spend, tested: live.length <= EXHAUSTIVE_LIMIT ? 1 << live.length : live.length * 6 }
}

`

s = s.slice(0, a) + REPLACEMENT + s.slice(b)
s = s.replace(
  'import type { BrandInfluencer } from "@/services/adminProposalMasterApi"',
  'import type { BrandInfluencer } from "@/services/adminProposalMasterApi"\n' +
  'import { EXHAUSTIVE_LIMIT, searchExhaustive, searchGreedy, type Chosen } from "./search"',
)
fs.writeFileSync(p, s)
console.log("optimise replaced")
