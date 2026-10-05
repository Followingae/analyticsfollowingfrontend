/**
 * Rule 1, made structural: never render `0` for a request that did not answer.
 *
 * The rule is easy to state and easy to break, because `{offer.engagement_rate}%` and
 * `{n ?? 0}` and `{n || "-"}` all look correct in review. A creator whose scrape failed
 * then shows "0% engagement", which does not read as "we don't know" — it reads as a
 * measured fact, and it is the single most damaging thing this product can print,
 * because it is a number a brand will make a decision on.
 *
 * So the module does not render numbers. It renders these components. Each one takes
 * `number | null | undefined`, and there is no prop that turns a missing value into a
 * zero. To print "0%" for a failed scrape you would have to stop using them.
 *
 * A genuine measured zero still renders as 0, which is the point of the distinction:
 * `runApi.readNumber` is the only way a number gets in, and it never invents one.
 */
import * as React from "react"
import { cn } from "@/lib/utils"

/** Not a hyphen. An em dash reads as "nothing here", a hyphen reads as a minus sign. */
const NOTHING = "—"

/**
 * The absence itself, as a thing you can see. Carries a title so hovering says why the
 * value is missing rather than leaving the reader to assume it is a bug.
 */
export function Missing({
  reason = "Not answered",
  className,
}: {
  reason?: string
  className?: string
}) {
  return (
    <span
      title={reason}
      aria-label={reason}
      className={cn("text-muted-foreground/60 tabular-nums select-none", className)}
    >
      {NOTHING}
    </span>
  )
}

type ValueProps = {
  value: number | null | undefined
  /** Said aloud on hover when the value is missing. */
  missingReason?: string
  className?: string
}

/** A plain count. 1,240. */
export function Num({ value, missingReason, className }: ValueProps) {
  if (value === null || value === undefined) return <Missing reason={missingReason} className={className} />
  return <span className={cn("tabular-nums", className)}>{value.toLocaleString("en-US")}</span>
}

/** A follower count, abbreviated the way every other surface in the app abbreviates. */
export function Followers({ value, missingReason, className }: ValueProps) {
  if (value === null || value === undefined) return <Missing reason={missingReason} className={className} />
  const abbreviated =
    value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
      : value >= 1_000
        ? `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`
        : String(value)
  return (
    <span className={cn("tabular-nums", className)} title={value.toLocaleString("en-US")}>
      {abbreviated}
    </span>
  )
}

/**
 * A percentage. The one that matters most: engagement rate.
 *
 * `missingReason` defaults to the honest sentence rather than something vague, because
 * this is exactly the field where a failed scrape used to print 0%.
 */
export function Pct({
  value,
  digits = 2,
  missingReason = "We hold no successful measurement for this creator",
  className,
}: ValueProps & { digits?: number }) {
  if (value === null || value === undefined) return <Missing reason={missingReason} className={className} />
  return <span className={cn("tabular-nums", className)}>{value.toFixed(digits)}%</span>
}

/**
 * Money. Always AED, always a SELL price — Run has no other kind of number, because
 * the price on an offer is the creator's own asking price.
 *
 * Takes fils (integer cents) to match `sell_post_aed_cents` and the rest of the app,
 * so no float ever touches a total.
 */
export function Money({
  fils,
  missingReason = "No price given",
  className,
}: {
  fils: number | null | undefined
  missingReason?: string
  className?: string
}) {
  if (fils === null || fils === undefined) return <Missing reason={missingReason} className={className} />
  const dirhams = Math.round(fils / 100)
  return (
    <span className={cn("tabular-nums", className)}>
      <span className="text-muted-foreground me-1">AED</span>
      {dirhams.toLocaleString("en-US")}
    </span>
  )
}

/**
 * Sorting is the other half of rule 1, and the half that is usually missed.
 *
 * The compare screen is sortable. If a missing engagement rate sorts as 0, then sorting
 * by engagement puts every creator we failed to measure at one end of the table as
 * though that were a finding — "worst" creators ascending and, with one click of the
 * other arrow, "best" creators descending. Either way the brand reads a ranking that is
 * really a list of our own scrape failures.
 *
 * A custom comparator cannot fix this on its own: TanStack inverts the comparator's
 * result for descending, so whichever end you pin nulls to, the other direction unpins
 * them. The mechanism that survives inversion is `sortUndefined`, which TanStack applies
 * outside the direction flip — but it keys on `undefined`, not `null`.
 *
 * Hence this pair. `sortValue` maps a missing number to `undefined` for the accessor,
 * and `SORT_MISSING_LAST` is spread into the column so the absence is unrankable in
 * both directions. Cells keep reading the real `null` off the row.
 */
export function sortValue(value: number | null | undefined): number | undefined {
  return value === null || value === undefined ? undefined : value
}

/** Spread into a numeric column def alongside an accessor that uses `sortValue`. */
export const SORT_MISSING_LAST = { sortUndefined: "last" } as const
