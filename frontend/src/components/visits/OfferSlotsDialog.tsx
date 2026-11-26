'use client'

/**
 * Approving a creator on a campaign with set visit times: pick one to three of the
 * upcoming times to offer them. The visit agent sends them on WhatsApp and the creator
 * confirms one. Full and past times cannot be offered.
 *
 * Shared by the merchant's applicants list and the staff participant sheet.
 */
import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { slotIsPast, slotTimeLabel, sortSlots, visitDayLabel, type SlotBookings, type VisitSlot } from '@/services/merchantApi'

const MAX = 3

export function OfferSlotsDialog({
  open,
  onOpenChange,
  who,
  slots,
  bookings,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** "@handle" or a name, shown above the title. */
  who?: string | null
  slots: VisitSlot[]
  bookings?: SlotBookings | null
  onConfirm: (slotIds: string[]) => Promise<void>
}) {
  const upcoming = useMemo(() => sortSlots(slots || []).filter((s) => !slotIsPast(s)), [slots])
  const isFull = (s: VisitSlot) => s.capacity != null && (bookings?.[s.id]?.confirmed ?? 0) >= s.capacity
  const [picked, setPicked] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  // Each time it opens: the earliest times that still have room, up to three.
  useEffect(() => {
    if (!open) return
    setPicked(upcoming.filter((s) => !(s.capacity != null && (bookings?.[s.id]?.confirmed ?? 0) >= s.capacity)).slice(0, MAX).map((s) => s.id))
    // Only on opening: a background refetch must not undo what they picked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const toggle = (id: string) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= MAX ? cur : [...cur, id]))
  const open_ = upcoming.filter((s) => !isFull(s))

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm(picked)
      onOpenChange(false)
    } catch {
      // The caller has said what went wrong; stay open so they can try again.
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !busy && onOpenChange(v)}>
      <DialogContent className="max-h-[90dvh] gap-5 overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader className="text-left">
          {who ? <span className="text-xs text-muted-foreground">Approving {who}</span> : null}
          <DialogTitle className="text-xl font-medium tracking-[-0.01em]">Offer them 2 or 3 times</DialogTitle>
          <DialogDescription>They confirm one on WhatsApp.</DialogDescription>
        </DialogHeader>

        {open_.length === 0 ? (
          <p className="m-0 flex items-start gap-2 rounded-xl bg-muted/60 p-3.5 text-sm text-muted-foreground">
            <CalendarClock className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            Every time is full or has passed. Add more times to the campaign first.
          </p>
        ) : (
          <div role="group" aria-label="Times to offer" className="flex flex-col gap-2">
            {upcoming.map((s) => {
              const full = isFull(s)
              const on = picked.includes(s.id)
              const capped = !on && picked.length >= MAX
              const booked = bookings?.[s.id]?.confirmed ?? 0
              return (
                <button
                  key={s.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  disabled={full || capped}
                  onClick={() => toggle(s.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border bg-card px-3.5 py-3 text-left transition-colors',
                    on ? 'border-foreground ring-1 ring-foreground' : 'border-border hover:bg-muted/40',
                    (full || capped) && 'cursor-not-allowed opacity-45 hover:bg-card',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'inline-flex size-5 shrink-0 items-center justify-center rounded-md border',
                      on ? 'border-foreground bg-foreground text-background' : 'border-border',
                    )}
                  >
                    {on ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium">{visitDayLabel(s.date)}</span>
                    <span className="text-[13px] text-muted-foreground">{slotTimeLabel(s)}</span>
                  </span>
                  {full ? (
                    <span className="shrink-0 text-xs font-medium text-destructive">Full</span>
                  ) : s.capacity != null ? (
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {booked} booked of {s.capacity}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="rounded-full" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-full" disabled={busy || picked.length < 1 || picked.length > MAX} onClick={confirm}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {picked.length ? `Approve and offer ${picked.length}` : 'Pick at least one'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
