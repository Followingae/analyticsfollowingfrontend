/**
 * The shape of a deal, as the API describes it.
 *
 * Three ways a proposal can be sold, and they are not variations on a theme: a budget deal
 * is bought by the dirham, a tier deal is bought by the head, and a retainer is the same
 * places repeating one month at a time. Mirrors get_brand_visible_proposal's `selection`.
 */
export interface TierRow {
  tier: string
  label: string
  allowed: number
  picked: number
  full?: boolean
}

export interface RetainerMonth {
  period: string
  label: string
  is_open: boolean
  is_locked: boolean
  complete: boolean
  tiers: TierRow[]
  total_picked?: number
}

export interface ProposalSelection {
  /** budget: they spend dirhams. tiers: they spend places per band. count: they spend
   *  creators, which is how a barter deal is sold - there is no money in it at all. */
  mode: "budget" | "tiers" | "count"
  /** count mode: how many creators they may take, how many they have, and what each one
   *  receives in exchange. */
  slots?: number | null
  taken?: number
  remaining?: number | null
  product?: string | null
  product_value_aed?: number | null
  bands?: Record<string, { label?: string }>
  allowances?: Record<string, number>
  state?: { tiers: TierRow[]; complete: boolean; total_picked: number; total_allowed: number }
  can_confirm?: boolean
  hint?: string
  periods?: RetainerMonth[]
  current_period?: string
  months_total?: number
  opens_days_before?: number
}
