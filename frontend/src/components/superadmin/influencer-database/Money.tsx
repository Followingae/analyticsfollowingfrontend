"use client"

/**
 * A rate, in AED, or an honest dash.
 *
 * `formatCents` in the types module builds its own string with a raw U+20C3 in it. That
 * codepoint has no glyph in any system font, so outside the one element that loads the
 * Dirham face it renders as an empty box, and a page of rates comes out as a page of boxes.
 * The `Aed` primitive names the face on the element itself, which is the only arrangement
 * that survives a screen with its own font stack.
 *
 * A missing rate is an en dash. It is never 0: we hold no price for most of the database and
 * a zero there reads as "this creator works for nothing".
 */
import { Aed } from "@/components/console/primitives"

export function Money({ cents }: { cents: number | null | undefined }) {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) {
    return <span className="text-muted-foreground">–</span>
  }
  return <Aed>{(cents / 100).toLocaleString("en-AE", { maximumFractionDigits: 0 })}</Aed>
}

/** A count we were given, or a dash. `formatCount` returns "0" for an absent number. */
export function count(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "–"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}
