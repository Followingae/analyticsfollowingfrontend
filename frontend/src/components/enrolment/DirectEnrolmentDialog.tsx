"use client"

/**
 * An enrolment link with no proposal behind it.
 *
 * Everywhere else a link is the paperwork for a booking that already exists: the creator is
 * on a confirmed proposal, leadership has settled their cost, and this popup only fetches
 * those facts. That covers the normal job and nothing else. A creator we are booking
 * directly, an agency job, somebody being papered ahead of a deal - none of them have a
 * proposal row to read, so none of them could be enrolled at all.
 *
 * THE FEE IS TYPED HERE, AND THAT IS WHY THIS IS LEADERSHIP ONLY. The rule everywhere else
 * is that talent may not move the number; it is kept by restricting who may raise one of
 * these rather than by fetching. The link records whoever typed it as its approver, which
 * is the same trail a settled cost leaves.
 *
 * The creator's side is identical: same agreement, same emailed code, same signature, same
 * bank details, same four eyes on the payee before a dirham moves.
 */

import { useEffect, useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Check, Copy, Loader2, Send, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { enrolmentApi, type EnrolmentStatus } from "@/services/enrolmentApi"

type Made = {
  id: string
  url: string
  creator_handle?: string | null
  other_open_links?: { id: string; status: EnrolmentStatus; campaign?: string | null }[]
}

export function DirectEnrolmentDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated?: () => void
}) {
  const [handle, setHandle] = useState("")
  const [brand, setBrand] = useState("")
  const [job, setJob] = useState("")
  const [deliverables, setDeliverables] = useState("")
  const [fee, setFee] = useState("")
  const [submitBy, setSubmitBy] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [made, setMade] = useState<Made | null>(null)
  const [copied, setCopied] = useState(false)

  /* Cleared on open rather than on close, so the link stays readable while the popup is
     fading out and nobody loses it to an animation. */
  useEffect(() => {
    if (!open) return
    setHandle(""); setBrand(""); setJob(""); setDeliverables("")
    setFee(""); setSubmitBy(""); setNote(""); setMade(null); setCopied(false)
  }, [open])

  const feeCents = Math.round(parseFloat(fee) * 100)
  const ready = handle.trim().length > 0 && brand.trim().length > 0 && Number.isFinite(feeCents) && feeCents >= 0

  const submit = async () => {
    setSaving(true)
    try {
      const res = await enrolmentApi.createDirect({
        creator_handle: handle.trim().replace(/^@/, ""),
        brand_display_name: brand.trim(),
        campaign_display_name: job.trim() || null,
        deliverables_summary: deliverables.trim() || null,
        fee_aed_cents: feeCents,
        submit_by: submitBy || null,
        note: note.trim() || null,
      })
      setMade(res)
      toast.success("Link created")
      onCreated?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That link could not be created")
    } finally {
      setSaving(false)
    }
  }

  const copy = async () => {
    if (!made) return
    try {
      await navigator.clipboard.writeText(made.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy. Select the link and copy it by hand.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{made ? "Link ready" : "New link, no proposal"}</DialogTitle>
          <DialogDescription>
            {made
              ? "Send this to the creator yourself. It expires 48 hours after they first open it, not 48 hours from now."
              : "For a creator we are booking directly. You can tag it to a campaign later, or leave it standing on its own."}
          </DialogDescription>
        </DialogHeader>

        {made ? (
          <div className="space-y-4">
            {/* Not a blocker. Two open links for one creator is wrong on a proposal booking
                and normal here, so it is said out loud and left to the person reading it. */}
            {(made.other_open_links?.length ?? 0) > 1 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  {made.creator_handle} already had{" "}
                  {(made.other_open_links?.length ?? 1) - 1} other open link
                  {(made.other_open_links?.length ?? 1) - 1 === 1 ? "" : "s"}. Worth checking
                  you are not papering the same job twice.
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
              <code className="min-w-0 flex-1 truncate text-xs">{made.url}</code>
              <Button size="sm" variant="outline" onClick={copy}>
                {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="direct-handle">Creator</Label>
                <Input id="direct-handle" value={handle} onChange={(e) => setHandle(e.target.value)}
                  placeholder="@handle" autoComplete="off" />
                <p className="text-[11px] text-muted-foreground">
                  Matched to our database if we already know them.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="direct-fee">We pay them (AED)</Label>
                <Input id="direct-fee" value={fee} onChange={(e) => setFee(e.target.value)}
                  inputMode="decimal" placeholder="3500" className="tabular-nums" />
                <p className="text-[11px] text-muted-foreground">
                  Final, and what the agreement will carry.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="direct-brand">Brand they see</Label>
                <Input id="direct-brand" value={brand} onChange={(e) => setBrand(e.target.value)}
                  placeholder="Barakat" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="direct-job">Job name</Label>
                <Input id="direct-job" value={job} onChange={(e) => setJob(e.target.value)}
                  placeholder="Summer launch" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="direct-dels">What they are doing</Label>
              <Input id="direct-dels" value={deliverables} onChange={(e) => setDeliverables(e.target.value)}
                placeholder="1 Reel, 3 Stories" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="direct-due">Live by</Label>
                <Input id="direct-due" type="date" value={submitBy}
                  onChange={(e) => setSubmitBy(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="direct-note">Why, for the record</Label>
                <Textarea id="direct-note" value={note} onChange={(e) => setNote(e.target.value)}
                  rows={1} placeholder="Direct booking, no proposal" className="min-h-[38px]" />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Payment is split the standard way unless the campaign it is later tagged to says
              otherwise, and the creator signs the same agreement as everybody else.
            </p>
          </div>
        )}

        <DialogFooter>
          {made ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Badge variant="outline" className="mr-auto self-center text-[11px] font-normal">
                Leadership only
              </Badge>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={submit} disabled={!ready || saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Create link
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
