"use client"

/**
 * Which columns of the master database this person is allowed to be shown.
 *
 * The database carries both sides of every rate: what we pay a creator and what we charge a
 * brand for them, plus the margin between. Those are two different secrets. Talent negotiate
 * cost and must never learn the sell price; account management and business development quote
 * sell and must never learn cost; margin is leadership only.
 *
 * The rule is ABSENCE, not blanking. A column rendered empty still tells a reader that a
 * number exists and that they are the one not being shown it, and an emptied cell is one
 * inspector away from the value behind it. So the columns are removed from the definition
 * list before anything is drawn: the table never lays them out, the column picker never
 * offers them, and the DOM never carries them.
 *
 * Gated on the resolved scope from `useAdminAccess`, never on "is this an admin". Our
 * co-founder is stored as role='user' with staff_role='cofounder'; an is-admin test locks her
 * out of her own company's pricing. `canSeeCost` / `canSeeSell` / `canSeeMargin` mirror
 * app/core/field_policy.py, which is what actually enforces this on the server. This only
 * stops us drawing a number the person is not entitled to read.
 *
 * While the hook is still resolving, everyone is treated as entitled to nothing. Widening
 * once we know who somebody is shows a column late; guessing the other way shows a rate to
 * the wrong person for a second, which is not recoverable.
 */
import { useMemo } from "react"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { COLUMN_DEFINITIONS, type ColumnDefinition, type ColumnKey } from "@/types/influencerDatabase"

const COST_COLUMNS: ColumnKey[] = [
  "ig_post_cost", "ig_reel_cost", "ig_story_cost", "video_cost",
]
const SELL_COLUMNS: ColumnKey[] = [
  "ig_post_sell", "ig_reel_sell", "video_sell",
]

export interface MoneyScope {
  canSeeCost: boolean
  canSeeSell: boolean
  canSeeMargin: boolean
  /** The column definitions this viewer may be shown, in the order the table lays them out. */
  columns: ColumnDefinition[]
  /** Membership test for a key, for callers that hold their own list of visible columns. */
  allows: (key: ColumnKey) => boolean
}

export function useMoneyColumns(): MoneyScope {
  const { canSeeCost, canSeeSell, canSeeMargin, loading } = useAdminAccess()

  const cost = !loading && canSeeCost
  const sell = !loading && canSeeSell
  const margin = !loading && canSeeMargin

  return useMemo(() => {
    const columns = COLUMN_DEFINITIONS.filter((col) => {
      if (COST_COLUMNS.includes(col.key)) return cost
      if (SELL_COLUMNS.includes(col.key)) return sell
      if (col.key === "margin") return margin
      return true
    })
    const allowed = new Set(columns.map((c) => c.key))
    return {
      canSeeCost: cost,
      canSeeSell: sell,
      canSeeMargin: margin,
      columns,
      allows: (key: ColumnKey) => allowed.has(key),
    }
  }, [cost, sell, margin])
}
