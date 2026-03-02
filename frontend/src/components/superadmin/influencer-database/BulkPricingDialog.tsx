"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DELIVERABLES, parseToCents } from "@/types/influencerDatabase"

interface BulkPricingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: string[]
  onSubmit: (updates: any[]) => void
}

export function BulkPricingDialog({
  open,
  onOpenChange,
  selectedIds,
  onSubmit,
}: BulkPricingDialogProps) {
  const [prices, setPrices] = useState<Record<string, string>>({})

  function handleSubmit() {
    // Build per-influencer updates matching backend BulkPricingRequest format
    const costUpdates: Record<string, number> = {}
    const sellUpdates: Record<string, number> = {}

    DELIVERABLES.forEach((f) => {
      const costVal = prices[`cost_${f.label}`]
      if (costVal) {
        costUpdates[f.costKey] = Math.round(parseFloat(costVal) * 100)
      }
      const sellVal = prices[`sell_${f.label}`]
      if (sellVal) {
        sellUpdates[f.sellKey] = Math.round(parseFloat(sellVal) * 100)
      }
    })

    const updates = selectedIds.map((id) => ({
      influencer_id: id,
      ...(Object.keys(costUpdates).length > 0 ? { cost_pricing: costUpdates } : {}),
      ...(Object.keys(sellUpdates).length > 0 ? { sell_pricing: sellUpdates } : {}),
    }))

    onSubmit(updates)
    onOpenChange(false)
  }

  function reset() {
    setPrices({})
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Pricing for {selectedIds.length} Influencers</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Set prices in dollars. Leave blank to skip. These values will be applied to all selected influencers.
          </p>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">Cost Prices</Label>
              {DELIVERABLES.map((f) => (
                <div key={`cost_${f.label}`} className="flex items-center gap-2 mb-2">
                  <Label className="text-xs w-20 flex-shrink-0">{f.label}</Label>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                      className="pl-6 h-8 text-sm"
                      placeholder="Skip"
                      value={prices[`cost_${f.label}`] || ""}
                      onChange={(e) =>
                        setPrices((prev) => ({ ...prev, [`cost_${f.label}`]: e.target.value }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">Sell Prices</Label>
              {DELIVERABLES.map((f) => (
                <div key={`sell_${f.label}`} className="flex items-center gap-2 mb-2">
                  <Label className="text-xs w-20 flex-shrink-0">{f.label}</Label>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                      className="pl-6 h-8 text-sm"
                      placeholder="Skip"
                      value={prices[`sell_${f.label}`] || ""}
                      onChange={(e) =>
                        setPrices((prev) => ({ ...prev, [`sell_${f.label}`]: e.target.value }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Apply Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
