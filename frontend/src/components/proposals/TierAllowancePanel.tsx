"use client"

/**
 * What the plan includes, and how much of it is filled.
 *
 * On a tier deal the client is not shopping against a price, they are filling places: three
 * macro and one micro, say. Telling them that only at the moment they overfill a band ("your
 * Macro places are full") is telling them the rule by punishing them with it. This panel
 * sits beside the roster the whole time, so the shape of the deal is visible before the
 * first tick and the last place left is obvious.
 *
 * The ring is one number, taken in at a glance from across a desk. The rows underneath are
 * where the actual decision lives, because "two of three macro" is the thing that tells you
 * what to look for next.
 */

import { useMemo } from "react"
import { Cell, Pie, PieChart } from "recharts"
import { Check, Sparkles } from "lucide-react"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

export interface TierRow {
  tier: string
  label: string
  allowed: number
  picked: number
}

const CHART: ChartConfig = {
  filled: { label: "Chosen", color: "var(--primary)" },
  left: { label: "Still to choose", color: "var(--muted)" },
}

export function TierAllowancePanel({
  rows,
  className,
}: {
  rows: TierRow[]
  className?: string
}) {
  const totals = useMemo(() => {
    const allowed = rows.reduce((n, r) => n + r.allowed, 0)
    const picked = rows.reduce((n, r) => n + Math.min(r.picked, r.allowed), 0)
    return { allowed, picked, left: Math.max(allowed - picked, 0) }
  }, [rows])

  const data = useMemo(
    () => [
      { key: "filled", value: totals.picked, fill: "var(--color-filled)" },
      { key: "left", value: totals.left, fill: "var(--color-left)" },
    ].filter((d) => d.value > 0),
    [totals],
  )

  if (!rows.length) return null
  const complete = totals.picked >= totals.allowed && totals.allowed > 0

  return (
    <div className={cn("border-b border-border/40 p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Your plan
          </span>
        </div>
        {complete && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <Check className="h-3 w-3" />All chosen
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4">
        {/* One number, readable at arm's length. */}
        <div className="relative shrink-0">
          <ChartContainer config={CHART} className="h-[92px] w-[92px]">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="key"
                innerRadius={30}
                outerRadius={44}
                strokeWidth={2}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={d.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold leading-none tabular-nums">
              {totals.picked}
              <span className="text-muted-foreground">/{totals.allowed}</span>
            </span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">places</span>
          </div>
        </div>

        {/* Where the decision actually is. */}
        <div className="min-w-0 flex-1 space-y-2.5">
          {rows.map((r) => {
            const pct = r.allowed ? Math.min(r.picked / r.allowed, 1) * 100 : 0
            const full = r.picked >= r.allowed
            return (
              <div key={r.tier}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[12.5px] font-medium">{r.label}</span>
                  <span
                    className={cn(
                      "shrink-0 text-[12px] tabular-nums",
                      full ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                    )}
                  >
                    {r.picked} of {r.allowed}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      full ? "bg-emerald-500" : "bg-primary",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
        {complete
          ? "Every place is filled. Confirm below and we will get started."
          : totals.left === 1
            ? "One place left to choose."
            : `${totals.left} places left to choose.`}{" "}
        Pricing is already agreed in your plan.
      </p>
    </div>
  )
}
