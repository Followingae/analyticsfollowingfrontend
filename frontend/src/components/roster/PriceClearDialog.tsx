"use client"

/**
 * A founder prices the shortlist and clears it, in one step.
 *
 * Each row shows what the creator costs us (agreed, else asked, in AED) and takes the sell
 * price for exactly what the quote was for. A creator who becomes sellable is made active at
 * the same time, which was the step that used to need another screen, and the reason priced
 * creators still could not be put on a proposal.
 */
import * as React from "react"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { rosterSheetApi, type ImdListCreator } from "@/services/imdListsApi"
import { BUNDLE_LABEL, aed } from "./rosterFormat"

function currentSell(c: ImdListCreator): number | null {
  const b = c.quote_bundle
  const cents = b === "story" ? c.sell_story_aed_cents
    : b === "post" ? c.sell_post_aed_cents
    : b === "tiktok" ? c.sell_tiktok_video_aed_cents
    : c.sell_reel_aed_cents
  return cents ? Math.round(cents / 100) : null
}

export function PriceClearDialog({ open, onOpenChange, listId, rows, onDone }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  listId: string
  rows: ImdListCreator[]
  onDone: () => void
}) {
  const [sell, setSell] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setSell(Object.fromEntries(rows.map(r => [r.id, currentSell(r) != null ? String(currentSell(r)) : ""])))
  }, [open, rows])

  const save = async () => {
    setBusy(true)
    try {
      const res = await rosterSheetApi.priceAndClear(listId, rows.map(r => ({
        influencer_id: r.id,
        sell_aed: sell[r.id]?.trim() ? Number(sell[r.id].replace(/,/g, "")) : null,
      })))
      const { priced, cleared, problems } = res.data
      toast.success(`${cleared} cleared${priced ? `, ${priced} priced` : ""}`, {
        description: problems.length ? problems.map(p => `${p.username ? "@" + p.username + ": " : ""}${p.reason}`).join(" · ") : undefined,
      })
      onOpenChange(false)
      onDone()
    } catch (e) {
      toast.error((e as Error).message || "Could not price them")
    } finally {
      setBusy(false)
    }
  }

  const missing = rows.filter(r => !sell[r.id]?.trim() && currentSell(r) == null && !r.has_package_price).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Price and clear {rows.length} creator{rows.length === 1 ? "" : "s"}</DialogTitle>
          <DialogDescription>
            The sell price is for what their quote covers. Once cleared they can go on a
            proposal from this roster.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[56vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-ds-caption text-muted-foreground">
              <tr>
                <th className="py-2 pr-3 font-medium">Creator</th>
                <th className="py-2 pr-3 font-medium">For</th>
                <th className="py-2 pr-3 text-right font-medium">Costs us</th>
                <th className="py-2 text-right font-medium">Sell (AED)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const cost = r.quote_agreed_aed_cents ?? r.quote_asked_aed_cents ?? r.cost_reel_aed_cents
                const s = Number((sell[r.id] || "").replace(/,/g, ""))
                const margin = cost && s ? Math.round(((s - cost / 100) / s) * 100) : null
                return (
                  <tr key={r.id} className="border-t align-middle">
                    <td className="py-2 pr-3 font-medium">@{r.username}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{BUNDLE_LABEL[r.quote_bundle || "reel"]}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{cost ? aed(cost) : <span className="text-muted-foreground">no price yet</span>}</td>
                    <td className="py-2 text-right">
                      <span className="inline-flex items-center gap-2">
                        {margin != null && (
                          <span className={`text-ds-caption tabular-nums ${margin < 20 ? "text-[var(--tone-warn-ink)]" : "text-muted-foreground"}`}>
                            {margin}%
                          </span>
                        )}
                        <Input inputMode="decimal" className="h-8 w-28 text-right" value={sell[r.id] ?? ""}
                               onChange={e => setSell(p => ({ ...p, [r.id]: e.target.value }))} />
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {missing > 0 && (
          <p className="text-ds-caption text-muted-foreground">
            {missing} without a sell price will stay on the shortlist rather than be cleared.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Price and clear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
