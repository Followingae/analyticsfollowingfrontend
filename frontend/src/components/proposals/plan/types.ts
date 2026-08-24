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
  mode: "budget" | "tiers"
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
