"use client"

/**
 * What a creator costs and what we sell them for. Density tier: WORKING.
 *
 * This tab used to print both columns and a margin table to anybody who could open the
 * record, which on this screen includes talent managers, account managers and business
 * developers. Those are three different scopes:
 *
 *   cost    what we pay the creator. Talent negotiate it. Leadership see it.
 *   sell    what we charge the brand. Account management and business development quote it.
 *   margin  the difference. Leadership only.
 *
 * A column outside your scope is not rendered, and its values are not sent back on save
 * either, so nothing you were not shown can be overwritten by your own form. The server
 * enforces the same rule in app/core/field_policy.py; this stops us drawing the number.
 *
 * The gate is `useAdminAccess`'s resolved scope, never an is-admin test: our co-founder is
 * stored as role='user' with staff_role='cofounder' and must keep every side of the money.
 */
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Save } from "lucide-react"
import type { MasterInfluencer, CostPricing, SellPricing } from "@/types/influencerDatabase"
import {
  DELIVERABLES,
  TIER_OPTIONS,
  parseToCents,
  computeMarginPercent,
  extractCostPricing,
  extractSellPricing,
} from "@/types/influencerDatabase"
import { Money } from "./Money"
import { useMoneyColumns } from "./useMoneyColumns"
import { cn } from "@/lib/utils"

interface InfluencerPricingTabProps {
  influencer: MasterInfluencer
  onSave: (data: { cost_pricing?: Partial<CostPricing>; sell_pricing?: Partial<SellPricing>; auto_calculate_sell?: boolean; default_markup_percentage?: number; tier?: string }) => void
}

function centsToInputVal(cents: number | null): string {
  if (cents === null || cents === undefined) return ""
  return (cents / 100).toString()
}

/**
 * One deliverable's price field: label, 6px, input, and nothing drawn around either.
 *
 * Declared at module level rather than inside the tab. A component defined in a render body
 * is a new type on every keystroke, so React unmounts and remounts the input and the caret
 * jumps out of the field after the first character.
 */
function PriceField({
  label, value, disabled, onChange,
}: {
  label: string
  value: number | null
  disabled?: boolean
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-ds-2">
      <Label className="w-24 flex-shrink-0 text-ds-caption text-muted-foreground">{label}</Label>
      <div className="relative flex-1">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ds-caption text-muted-foreground">AED</span>
        <Input
          className="h-8 pl-11 text-right tabular-nums"
          placeholder="Not set"
          disabled={disabled}
          value={centsToInputVal(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export function InfluencerPricingTab({ influencer, onSave }: InfluencerPricingTabProps) {
  const { canSeeCost, canSeeSell, canSeeMargin } = useMoneyColumns()

  const [costPricing, setCostPricing] = useState<CostPricing>(extractCostPricing(influencer))
  const [sellPricing, setSellPricing] = useState<SellPricing>(extractSellPricing(influencer))
  const [autoCalc, setAutoCalc] = useState(influencer.auto_calculate_sell || false)
  const [markup, setMarkup] = useState(influencer.default_markup_percentage || 30)
  const [tier, setTier] = useState(influencer.tier || "")

  // Deriving sell from cost means holding both, so it is offered only to somebody who holds
  // both. For everyone else the two sides are simply typed independently.
  const canDerive = canSeeCost && canSeeSell

  function handleCostChange(key: keyof CostPricing, value: string) {
    const cents = parseToCents(value)
    setCostPricing((prev) => ({ ...prev, [key]: cents }))
    if (autoCalc && canDerive) {
      const matchingDel = DELIVERABLES.find((d) => d.costKey === key)
      if (matchingDel && cents !== null) {
        const sellCents = Math.round(cents * (1 + markup / 100))
        setSellPricing((prev) => ({ ...prev, [matchingDel.sellKey]: sellCents }))
      }
    }
  }

  function handleSellChange(key: keyof SellPricing, value: string) {
    const cents = parseToCents(value)
    setSellPricing((prev) => ({ ...prev, [key]: cents }))
  }

  function handleAutoCalcToggle(checked: boolean) {
    setAutoCalc(checked)
    if (checked) {
      recalculateSellFromCost(markup)
    }
  }

  function handleMarkupChange(value: string) {
    const m = parseFloat(value) || 0
    setMarkup(m)
    if (autoCalc) {
      recalculateSellFromCost(m)
    }
  }

  function recalculateSellFromCost(markupPct: number) {
    const updated = { ...sellPricing }
    DELIVERABLES.forEach((d) => {
      const costVal = costPricing[d.costKey]
      if (typeof costVal === "number" && costVal !== null) {
        ;(updated as any)[d.sellKey] = Math.round(costVal * (1 + markupPct / 100))
      }
    })
    setSellPricing(updated)
  }

  function handleSave() {
    // Only the side that was actually on screen is sent. Posting back a column somebody was
    // never shown would let a form they could not read write over prices they cannot see.
    onSave({
      ...(canSeeCost ? { cost_pricing: costPricing } : {}),
      ...(canSeeSell ? { sell_pricing: sellPricing } : {}),
      ...(canDerive ? { auto_calculate_sell: autoCalc, default_markup_percentage: markup } : {}),
      tier: tier || undefined,
    })
  }

  const marginRows = canSeeMargin
    ? DELIVERABLES.map((d) => ({
        label: d.label,
        cost: costPricing[d.costKey],
        sell: sellPricing[d.sellKey],
        margin: computeMarginPercent(costPricing[d.costKey], sellPricing[d.sellKey]),
      })).filter((r) => r.cost !== null || r.sell !== null)
    : []

  return (
    <div className="flex max-w-[720px] flex-col gap-ds-5">
      <div className={cn("grid gap-ds-5", canSeeCost && canSeeSell ? "sm:grid-cols-2" : "grid-cols-1")}>
        {canSeeCost && (
          <div className="flex flex-col gap-ds-3">
            <div>
              <h3 className="text-ds-label">What we pay</h3>
              <p className="text-ds-caption text-muted-foreground">The creator's own rate</p>
            </div>
            <div className="flex flex-col gap-ds-2">
              {DELIVERABLES.map((d) => (
                <PriceField
                  key={d.costKey}
                  label={d.label}
                  value={costPricing[d.costKey]}
                  onChange={(v) => handleCostChange(d.costKey, v)}
                />
              ))}
            </div>
          </div>
        )}

        {canSeeSell && (
          <div className="flex flex-col gap-ds-3">
            <div>
              <h3 className="text-ds-label">What we charge</h3>
              <p className="text-ds-caption text-muted-foreground">The price a brand sees</p>
            </div>

            {canDerive && (
              <div className="flex flex-col gap-ds-2">
                <div className="flex items-center justify-between gap-ds-2">
                  <Label className="text-ds-caption text-muted-foreground">Work it out from what we pay</Label>
                  <Switch
                    checked={autoCalc}
                    onCheckedChange={handleAutoCalcToggle}
                  />
                </div>
                {autoCalc && (
                  <div className="flex items-center gap-ds-2">
                    <Label className="w-24 flex-shrink-0 text-ds-caption text-muted-foreground">Markup</Label>
                    <div className="relative flex-1">
                      <Input
                        className="h-8 pr-6 text-right tabular-nums"
                        value={markup?.toString() || ""}
                        onChange={(e) => handleMarkupChange(e.target.value)}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ds-caption text-muted-foreground">%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-ds-2">
              {DELIVERABLES.map((d) => (
                <PriceField
                  key={d.sellKey}
                  label={d.label}
                  value={sellPricing[d.sellKey]}
                  disabled={canDerive && autoCalc}
                  onChange={(v) => handleSellChange(d.sellKey, v)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tier is not money, so it stands on its own rather than at the foot of the cost
          column where it happened to be sitting. */}
      <div className="flex items-center gap-ds-2">
        <Label className="w-24 flex-shrink-0 text-ds-caption text-muted-foreground">Tier</Label>
        <Select value={tier} onValueChange={(v: string) => setTier(v)}>
          <SelectTrigger className="h-8 w-[220px] text-sm">
            <SelectValue placeholder="Not set" />
          </SelectTrigger>
          <SelectContent>
            {TIER_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Margin is leadership only, and the table is a table: hairlines, right-aligned
          figures, no box drawn around it. */}
      {canSeeMargin && marginRows.length > 0 && (
        <section className="flex flex-col gap-ds-2">
          <h3 className="text-ds-label">Margin</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-ds-overline uppercase text-muted-foreground">
                  <th className="px-3 pb-2 text-left font-medium">Deliverable</th>
                  <th className="px-3 pb-2 text-right font-medium">We pay</th>
                  <th className="px-3 pb-2 text-right font-medium">We charge</th>
                  <th className="px-3 pb-2 text-right font-medium">Margin</th>
                </tr>
              </thead>
              <tbody>
                {marginRows.map((r) => {
                  const tone =
                    r.margin === null ? null
                      : r.margin >= 20 ? { ink: "text-[var(--tone-good-ink)]", word: "healthy" }
                      : r.margin >= 0 ? { ink: "text-[var(--tone-warn-ink)]", word: "thin" }
                      : { ink: "text-[var(--tone-bad-ink)]", word: "at a loss" }
                  return (
                    <tr key={r.label} className="border-b last:border-0">
                      <td className="px-3 py-ds-2">{r.label}</td>
                      <td className="px-3 py-ds-2 text-right tabular-nums"><Money cents={r.cost} /></td>
                      <td className="px-3 py-ds-2 text-right tabular-nums"><Money cents={r.sell} /></td>
                      <td className="px-3 py-ds-2 text-right tabular-nums">
                        {r.margin !== null && tone ? (
                          <span className={cn("font-medium", tone.ink)}>
                            {r.margin.toFixed(1)}%
                            <span className="ml-1 text-[11px] font-normal">{tone.word}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-1.5 h-3.5 w-3.5" />
          Save these rates
        </Button>
      </div>
    </div>
  )
}
