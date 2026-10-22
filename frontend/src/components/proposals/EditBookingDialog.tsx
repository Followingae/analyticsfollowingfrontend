"use client"

/**
 * Change what we are booking from a creator who is already on the proposal.
 *
 * "She'll cross-post to TikTok at the same price" arrives after the creator is on the
 * roster, so this is where it is recorded. Prices the client was already sent stay as they
 * were sent; a one-off deal holds for this proposal only.
 */
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookingPicker, useBookable, type BookingLine } from "@/components/proposals/BookingPicker"
import { proposalApprovalApi } from "@/services/proposalApprovalApi"

export interface EditBookingRow {
  id: string
  influencer_db_id: string
  username?: string | null
  assigned_deliverables?: BookingLine[] | null
  /** Paid in product on a mixed deal: no rate is needed to book a deliverable. */
  paid_in_product?: boolean
}

export function EditBookingDialog({
  proposalId, row, productMode = false, onOpenChange, onSaved,
}: {
  proposalId: string
  row: EditBookingRow | null
  productMode?: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [lines, setLines] = useState<BookingLine[]>([])
  const [saving, setSaving] = useState(false)
  const bookable = useBookable(row ? [row.influencer_db_id] : [])

  useEffect(() => {
    setLines((row?.assigned_deliverables ?? []).map((l) => ({ ...l, quantity: l.quantity || 1 })))
  }, [row])

  async function save() {
    if (!row) return
    if (!lines.length) return toast.error("Book at least one thing from this creator")
    setSaving(true)
    try {
      await proposalApprovalApi.setLines(proposalId, row.id, lines)
      toast.success(`Booking for @${row.username || "this creator"} updated`)
      onSaved()
      onOpenChange(false)
    } catch (e) {
      toast.error((e as Error).message || "Could not change the booking")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>What we are booking from @{row?.username}</DialogTitle>
          <DialogDescription>
            Pick from their platforms and rates, a saved package, or a one-off deal for this proposal.
          </DialogDescription>
        </DialogHeader>
        {row && (
          <BookingPicker
            creator={bookable[row.influencer_db_id]}
            value={lines}
            onChange={setLines}
            productMode={productMode}
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !lines.length}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Save booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
