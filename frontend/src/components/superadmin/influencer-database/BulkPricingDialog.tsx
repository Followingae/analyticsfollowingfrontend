"use client"

/**
 * Set one set of rates across every ticked creator. Density tier: WORKING.
 *
 * Two things were wrong here and both were about money rather than looks. The dialog said
 * "Set prices in dollars" and printed a $ in front of every field, on a database whose
 * columns are all `*_aed_cents`: an operator typing 1,500 was told they had entered 1,500
 * dollars and had in fact entered 1,500 dirhams, across every creator they had ticked.
 *
 * And it showed both sides of the money to anyone who could open it. Talent negotiate cost
 * and must not learn sell; account management quote sell and must not learn cost. A column
 * outside your scope is not rendered and is not sent on submit, so a form you were never
 * shown cannot write over prices you cannot read.
 */
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DELIVERABLES } from "@/types/influencerDatabase"
import { useMoneyColumns } from "./useMoneyColumns"
import { cn } from "@/lib/utils"

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
  const { canSeeCost, canSeeSell } = useMoneyColumns()
  const [prices, setPrices] = useState<Record<string, string>>({})

  function handleSubmit() {
    // Build per-influencer updates matching backend BulkPricingRequest format
    const costUpdates: Record<string, number> = {}
    const sellUpdates: Record<string, number> = {}

    DELIVERABLES.forEach((f) => {
      const costVal = prices[`cost_${f.label}`]
      if (canSeeCost && costVal) {
        costUpdates[f.costKey] = Math.round(parseFloat(costVal) * 100)
      }
      const sellVal = prices[`sell_${f.label}`]
      if (canSeeSell && sellVal) {
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

  const column = (side: "cost" | "sell", heading: string) => (
    <div className="flex flex-col gap-ds-2">
      <Label className="text-ds-overline uppercase text-muted-foreground">{heading}</Label>
      {DELIVERABLES.map((f) => (
        <div key={`${side}_${f.label}`} className="flex items-center gap-ds-2">
          <Label className="w-20 flex-shrink-0 text-ds-caption text-muted-foreground">{f.label}</Label>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ds-caption text-muted-foreground">
              AED
            </span>
            <Input
              className="h-8 pl-11 text-right text-sm tabular-nums"
              placeholder="Leave blank"
              value={prices[`${side}_${f.label}`] || ""}
              onChange={(e) =>
                setPrices((prev) => ({ ...prev, [`${side}_${f.label}`]: e.target.value }))
              }
            />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(v: boolean) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Set rates for {selectedIds.length} creator{selectedIds.length === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            In dirhams. Anything left blank is not touched, on any of them.
          </DialogDescription>
        </DialogHeader>

        <div className={cn("grid gap-ds-5 py-ds-2", canSeeCost && canSeeSell ? "grid-cols-2" : "grid-cols-1")}>
          {canSeeCost && column("cost", "What we pay")}
          {canSeeSell && column("sell", "What we charge")}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Apply to all of them</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
