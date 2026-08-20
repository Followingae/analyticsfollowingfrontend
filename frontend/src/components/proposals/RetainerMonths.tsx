"use client"

/**
 * A retainer, month by month.
 *
 * Three months of four creators is not a list of twelve. It is the same four places, three
 * times, and the client should see exactly which month they are filling, what is already
 * agreed, and when the next one opens. Handing them one long roster instead is how a client
 * spends their whole retainer in week one.
 *
 * The rule this exists to make obvious: a month is confirmed whole. There is no confirming
 * three of four and coming back, so the button stays out of reach until the month is full,
 * and it says what is still missing rather than just being grey.
 */

import { Check, Lock } from "lucide-react"

import { cn } from "@/lib/utils"

export interface RetainerMonth {
  period: string
  label: string
  index: number
  starts_on: string
  opens_on: string
  status: "upcoming" | "open" | "current" | "past"
  is_open: boolean
  is_locked: boolean
  locked_at?: string | null
  tiers: { tier: string; label: string; allowed: number; picked: number; full: boolean }[]
  complete: boolean
  total_allowed: number
  total_picked: number
  note: string
}

export function RetainerMonths({
  months,
  active,
  onSelect,
  liveTiers,
  className,
}: {
  months: RetainerMonth[]
  active: string | null
  onSelect: (period: string) => void
  /** Live counts for the month being filled, so this reads what is on screen rather than
   *  what was last saved. */
  liveTiers?: { tier: string; label: string; allowed: number; picked: number }[]
  className?: string
}) {
  if (!months.length) return null

  const confirmed = months.filter((m) => m.is_locked).length
  const current = months.find((m) => m.period === active) || null

  return (
    <div className={cn("rounded-xl border border-border/60 bg-card p-5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Your retainer</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {months[0].total_allowed} creators a month for {months.length} months
            {confirmed > 0 && ` · ${confirmed} of ${months.length} confirmed`}
          </p>
        </div>
        {current && !current.is_locked && (
          <span className="text-[13px] text-muted-foreground">
            You are choosing for{" "}
            <span className="font-medium text-foreground">{current.label}</span>
          </span>
        )}
      </div>

      {/* The months themselves. Each one says where it stands in its own words. */}
      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        {months.map((m) => {
          const isActive = m.period === active
          const selectable = m.is_open || m.is_locked
          return (
            <button
              key={m.period}
              type="button"
              disabled={!selectable}
              onClick={() => selectable && onSelect(m.period)}
              className={cn(
                "rounded-xl border p-3.5 text-left transition-all",
                isActive && "border-primary bg-primary/5",
                !isActive && selectable && "hover:bg-muted/50",
                !selectable && "cursor-not-allowed opacity-60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Month {m.index}
                </span>
                {m.is_locked ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : m.status === "upcoming" ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                ) : null}
              </div>
              <div className="mt-1 truncate text-[15px] font-semibold">{m.label}</div>

              <div className="mt-2.5 flex items-center gap-1.5">
                {(isActive && liveTiers?.length ? liveTiers.map((t) => ({
                  ...t, full: t.picked >= t.allowed,
                })) : m.tiers).map((t) => (
                  <span
                    key={t.tier}
                    title={`${t.label}: ${t.picked} of ${t.allowed}`}
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      t.full
                        ? "bg-emerald-500"
                        : t.picked > 0
                          ? "bg-primary/60"
                          : "bg-muted",
                    )}
                  />
                ))}
              </div>

              <div
                className={cn(
                  "mt-2 text-[12px]",
                  m.is_locked
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground",
                )}
              >
                {m.is_locked
                  ? `Confirmed · ${m.total_allowed} creators`
                  : m.status === "upcoming"
                    ? m.note
                    : `${
                        isActive && liveTiers?.length
                          ? liveTiers.reduce((n, t) => n + Math.min(t.picked, t.allowed), 0)
                          : m.total_picked
                      } of ${m.total_allowed} chosen`}
              </div>
            </button>
          )
        })}
      </div>

      {current?.is_locked && (
        <p className="mt-4 border-t border-border/60 pt-4 text-[13px] text-muted-foreground">
          {current.label} is confirmed and running. You can still look, but these picks are
          locked in.
        </p>
      )}
    </div>
  )
}
