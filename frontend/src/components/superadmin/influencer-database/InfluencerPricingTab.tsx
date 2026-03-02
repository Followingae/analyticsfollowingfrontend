"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Save } from "lucide-react"
import type { MasterInfluencer, CostPricing, SellPricing, PricingTier } from "@/types/influencerDatabase"
import {
  DELIVERABLES,
  TIER_OPTIONS,
  formatCents,
  parseToCents,
  computeMarginPercent,
  extractCostPricing,
  extractSellPricing,
} from "@/types/influencerDatabase"

interface InfluencerPricingTabProps {
  influencer: MasterInfluencer
  onSave: (data: { cost_pricing: Partial<CostPricing>; sell_pricing: Partial<SellPricing>; auto_calculate_sell?: boolean; default_markup_percentage?: number; tier?: string }) => void
}

function centsToInputVal(cents: number | null): string {
  if (cents === null || cents === undefined) return ""
  return (cents / 100).toString()
}

export function InfluencerPricingTab({ influencer, onSave }: InfluencerPricingTabProps) {
  const [costPricing, setCostPricing] = useState<CostPricing>(extractCostPricing(influencer))
  const [sellPricing, setSellPricing] = useState<SellPricing>(extractSellPricing(influencer))
  const [autoCalc, setAutoCalc] = useState(influencer.auto_calculate_sell || false)
  const [markup, setMarkup] = useState(influencer.default_markup_percentage || 30)
  const [tier, setTier] = useState(influencer.tier || "")

  function handleCostChange(key: keyof CostPricing, value: string) {
    const cents = parseToCents(value)
    setCostPricing((prev) => ({ ...prev, [key]: cents }))
    if (autoCalc) {
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
    onSave({
      cost_pricing: costPricing,
      sell_pricing: sellPricing,
      auto_calculate_sell: autoCalc,
      default_markup_percentage: markup,
      tier: tier || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Cost Price Column */}
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-sm">Cost Price</h3>
            <p className="text-xs text-muted-foreground">What we pay the influencer</p>
          </div>

          <div className="space-y-3">
            {DELIVERABLES.map((d) => (
              <div key={d.costKey} className="flex items-center gap-2">
                <Label className="text-xs w-24 flex-shrink-0">{d.label}</Label>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                  <Input
                    className="pl-6 h-8 text-sm"
                    placeholder="0"
                    value={centsToInputVal(costPricing[d.costKey])}
                    onChange={(e) => handleCostChange(d.costKey, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs w-24 flex-shrink-0">Tier</Label>
              <Select
                value={tier}
                onValueChange={(v) => setTier(v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select tier" />
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
          </div>
        </div>

        {/* Sell Price Column */}
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-sm">Sell Price</h3>
            <p className="text-xs text-muted-foreground">What we charge brands</p>
          </div>

          <div className="space-y-3 mb-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Auto-calculate from cost</Label>
              <Switch
                checked={autoCalc}
                onCheckedChange={handleAutoCalcToggle}
              />
            </div>
            {autoCalc && (
              <div className="flex items-center gap-2">
                <Label className="text-xs w-24 flex-shrink-0">Markup</Label>
                <div className="relative flex-1">
                  <Input
                    className="pr-6 h-8 text-sm"
                    value={markup?.toString() || ""}
                    onChange={(e) => handleMarkupChange(e.target.value)}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {DELIVERABLES.map((d) => (
              <div key={d.sellKey} className="flex items-center gap-2">
                <Label className="text-xs w-24 flex-shrink-0">{d.label}</Label>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                  <Input
                    className="pl-6 h-8 text-sm"
                    placeholder="0"
                    disabled={autoCalc}
                    value={centsToInputVal(sellPricing[d.sellKey])}
                    onChange={(e) => handleSellChange(d.sellKey, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Margin Summary Table */}
      <Separator />
      <div className="space-y-3">
        <h3 className="font-medium text-sm">Margin Summary</h3>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium text-xs">Deliverable</th>
                <th className="text-right p-2 font-medium text-xs">Cost</th>
                <th className="text-right p-2 font-medium text-xs">Sell</th>
                <th className="text-right p-2 font-medium text-xs">Margin</th>
              </tr>
            </thead>
            <tbody>
              {DELIVERABLES.map((d) => {
                const cost = costPricing[d.costKey]
                const sell = sellPricing[d.sellKey]
                const margin = computeMarginPercent(cost, sell)
                if (cost === null && sell === null) return null
                return (
                  <tr key={d.label} className="border-b last:border-0">
                    <td className="p-2 text-xs">{d.label}</td>
                    <td className="p-2 text-xs text-right">{formatCents(cost)}</td>
                    <td className="p-2 text-xs text-right">{formatCents(sell)}</td>
                    <td className="p-2 text-xs text-right">
                      {margin !== null ? (
                        <span className={margin >= 20 ? "text-green-600" : margin >= 0 ? "text-yellow-600" : "text-red-600"}>
                          {margin.toFixed(1)}%
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave}>
          <Save className="h-3.5 w-3.5 mr-1.5" />
          Save Pricing
        </Button>
      </div>
    </div>
  )
}
