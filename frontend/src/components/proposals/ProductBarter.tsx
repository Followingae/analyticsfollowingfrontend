"use client"

/**
 * The offer on a barter campaign: what the creator receives, and what it is worth.
 *
 * WHY THIS IS NOT A PRICE TAG
 * ---------------------------
 * On a paid proposal the client reads a number and decides whether it is worth it. Here the
 * number is not a decision they are making - they are not paying it, they are GIVING the
 * thing. So the product leads and the value follows it in a quieter voice, which is the
 * opposite weighting to a price.
 *
 * The value still has to be there. A client sending eight hampers out of a warehouse is
 * committing real money, and a screen that only said "skincare set" would let them agree to
 * a number they never saw. It reads as worth, never as owed.
 *
 * TWO SIZES, one truth.
 *   `ribbon` sits on a creator card in a wall of creators: one line, no box.
 *   `panel`  states the offer once, at the top of the page or in a summary.
 *
 * A creator whose row names its own product overrides the campaign's - that is a creator who
 * was promised something different, and the exception is the whole reason the row can carry
 * one. When nothing is named at all the component renders NOTHING rather than the word
 * "barter": a client cannot agree to give away a thing nobody has described.
 */
import { Gift } from "lucide-react"
import { cn } from "@/lib/utils"

function worth(value?: number | null): string | null {
  if (value == null || !Number.isFinite(Number(value)) || Number(value) <= 0) return null
  return "AED " + Number(value).toLocaleString("en-US")
}

export function ProductBarter({
  product, value, variant = "ribbon", className,
}: {
  product?: string | null
  value?: number | null
  variant?: "ribbon" | "panel"
  className?: string
}) {
  const name = (product || "").trim()
  if (!name) return null
  const w = worth(value)

  if (variant === "panel") {
    return (
      <div className={cn(
        "flex items-start gap-3.5 rounded-2xl border bg-card px-4 py-3.5",
        className,
      )}>
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-muted">
          <Gift className="size-4.5 text-foreground/70" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Every creator receives
          </p>
          <p className="mt-0.5 text-[15px] font-semibold leading-snug">{name}</p>
          {w && (
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Worth {w} each. You provide this directly, so there is nothing to invoice.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-[12.5px] leading-tight text-muted-foreground",
      className,
    )}>
      <Gift className="size-3.5 shrink-0" />
      <span className="truncate font-medium text-foreground">{name}</span>
      {w && <span className="shrink-0 tabular-nums">· {w}</span>}
    </span>
  )
}

/**
 * How many of their allowance the client has used.
 *
 * The same job the budget bar does on a paid proposal, counting the only currency this deal
 * has. It says what is LEFT rather than what is spent, because the question a client asks
 * themselves on this screen is "how many more can I take".
 */
export function SlotCounter({
  taken, slots, className,
}: { taken: number; slots?: number | null; className?: string }) {
  if (!slots || slots < 1) return null
  const left = Math.max(0, slots - taken)
  const full = taken >= slots
  const over = taken > slots
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: Math.min(slots, 12) }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-colors duration-200",
              i < taken ? "w-5 bg-foreground" : "w-5 bg-foreground/15",
            )}
          />
        ))}
        {slots > 12 && <span className="ml-1 text-[11px] text-muted-foreground">+{slots - 12}</span>}
      </div>
      <p className="text-[13px] tabular-nums">
        <span className="font-semibold">{taken}</span>
        <span className="text-muted-foreground"> of {slots} chosen</span>
        {!full && <span className="text-muted-foreground"> · {left} left</span>}
        {over && <span className="text-destructive"> · {taken - slots} too many</span>}
      </p>
    </div>
  )
}
