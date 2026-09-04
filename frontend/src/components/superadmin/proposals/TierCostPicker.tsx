"use client"

/**
 * What taking one creator SPENDS, across bands.
 *
 * A dropdown could say "2 Macro places" and no more. The real negotiation is not always
 * that shaped: somebody can be worth two Macro AND a Micro, and forcing that into one band
 * either overstates the Macro or means dropping the creator, which is what this whole
 * feature exists to stop.
 *
 * So it is a small popover with one stepper per band the deal actually bought. Bands the
 * deal did not buy are not offered at all: spending a place that was never sold produces a
 * creator nobody can pick, and the API refuses it anyway.
 *
 * The common case stays one click. The trigger shows "1 Macro place" until somebody makes
 * it something else, and everything past that is opt-in.
 */

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Minus, Plus, Layers, RotateCcw } from "lucide-react"

type TierKey = "nano" | "micro" | "macro" | "mega"
const ORDER: TierKey[] = ["nano", "micro", "macro", "mega"]

export type TierCost = Partial<Record<TierKey, number>>

/** "2 Macro + 1 Micro", biggest band first, the way somebody says it out loud. */
export function costSentence(
  cost: TierCost,
  bands: Record<string, { label?: string }>,
): string {
  const parts: string[] = []
  for (const k of [...ORDER].reverse()) {
    const n = cost[k]
    if (!n) continue
    parts.push(`${n} ${bands[k]?.label || k}`)
  }
  return parts.join(" + ")
}

export function TierCostPicker({
  cost, tier, allowances, bands, disabled, onChange,
}: {
  cost: TierCost
  /** The band this creator is displayed under; their cost defaults to one of it. */
  tier: TierKey | null
  allowances: Record<string, number>
  bands: Record<string, { label?: string }>
  disabled?: boolean
  onChange: (next: TierCost) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<TierCost>(cost)

  // Re-seed whenever the popover opens, so a draft abandoned last time does not come back.
  useEffect(() => { if (open) setDraft(cost) }, [open, cost])

  // Only bands this deal actually bought. Their own band is always offered even if the
  // allowance is zero, because that is where a plain creator's single place lives.
  const usable = useMemo(
    () => ORDER.filter(k => Number(allowances[k]) > 0 || k === tier),
    [allowances, tier],
  )

  const total = Object.values(draft).reduce((a, b) => a + (b || 0), 0)
  const currentTotal = Object.values(cost).reduce((a, b) => a + (b || 0), 0)
  const label = currentTotal > 0
    ? costSentence(cost, bands)
    : `1 ${bands[tier || ""]?.label || tier || "place"}`

  const bump = (k: TierKey, by: number) => {
    setDraft(p => {
      const next = { ...p }
      const n = (next[k] || 0) + by
      // Capped at what the deal bought for that band. A cost larger than the allowance is a
      // creator nobody could ever pick.
      const ceiling = Math.min(10, Number(allowances[k]) || 10)
      if (n <= 0) delete next[k]
      else next[k] = Math.min(ceiling, n)
      return next
    })
  }

  const apply = () => {
    // An empty draft means "one place of their own band", which is the plain case and is
    // stored as no map at all rather than as {tier: 1}.
    const cleaned: TierCost = {}
    for (const k of ORDER) if (draft[k]) cleaned[k] = draft[k]
    onChange(Object.keys(cleaned).length ? cleaned : (tier ? { [tier]: 1 } : {}))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}
                className="h-9 justify-start gap-1.5 font-normal">
          {currentTotal > 1 && <Layers className="h-3.5 w-3.5 text-amber-600" />}
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[19rem] p-3">
        <div className="text-[13px] font-semibold">Counts as</div>
        <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
          What taking this creator spends. Add more than one band if they are worth places in
          several.
        </p>

        <div className="mt-3 space-y-1">
          {usable.map(k => {
            const n = draft[k] || 0
            const bought = Number(allowances[k]) || 0
            return (
              <div key={k} className="flex items-center gap-2 rounded-lg px-1 py-1.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{bands[k]?.label || k}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {bought ? `${bought} bought` : "not in this deal"}
                  </div>
                </div>
                <Button variant="outline" size="icon" className="h-7 w-7"
                        disabled={n <= 0} onClick={() => bump(k, -1)}>
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-5 text-center text-[13px] font-semibold tabular-nums">{n}</span>
                <Button variant="outline" size="icon" className="h-7 w-7"
                        disabled={n >= Math.min(10, bought || 10)} onClick={() => bump(k, 1)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
        </div>

        <div className="mt-3 rounded-lg bg-muted/50 px-2.5 py-2 text-[12px]">
          {total > 0
            ? <>The client sees <span className="font-semibold">
                {costSentence(draft, bands)}</span> on their card.</>
            : <span className="text-muted-foreground">
                Nothing set, so they count as one {bands[tier || ""]?.label || "place"}.
              </span>}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"
                  onClick={() => setDraft(tier ? { [tier]: 1 } : {})}>
            <RotateCcw className="h-3.5 w-3.5" /> Back to one
          </Button>
          <Button size="sm" onClick={apply}>Save</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
