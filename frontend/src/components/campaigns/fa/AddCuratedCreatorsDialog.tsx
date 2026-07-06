"use client"

import { useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UserPlus, Loader2 } from "lucide-react"
import { faCampaignApi } from "@/services/faAdminApi"
import { toast } from "sonner"

/**
 * Add "Team Suggested" (curated) creators to a live FA campaign. Reusable across the
 * admin FA console and the manager campaign view — the backend scopes the action to
 * the caller's clients and every added creator lands in pending_brand_approval, so the
 * BRAND still decides who is approved. Managers curate; they never approve/reject.
 */
export function AddCuratedCreatorsDialog({
  campaignId,
  campaignName,
  onAdded,
  triggerLabel = "Add creators",
  triggerVariant = "default",
  triggerSize = "sm",
}: {
  campaignId: string
  campaignName?: string
  onAdded?: () => void
  triggerLabel?: string
  triggerVariant?: "default" | "outline" | "secondary"
  triggerSize?: "sm" | "default"
}) {
  const [open, setOpen] = useState(false)
  const [handles, setHandles] = useState("")
  const [adding, setAdding] = useState(false)

  const submit = async () => {
    const lines = handles
      .split(/[\n,]+/)
      .map((h) => h.trim().replace(/^@/, ""))
      .filter(Boolean)
    if (!lines.length) {
      toast.error("Add at least one Instagram handle")
      return
    }
    setAdding(true)
    try {
      const res = await faCampaignApi.addCurated(
        campaignId,
        lines.map((h) => ({ instagram_username: h })),
      )
      const added = (res?.data?.added_online ?? 0) + (res?.data?.added_offline ?? 0)
      toast.success(`Added ${added} creator(s) for brand approval`)
      setHandles("")
      setOpen(false)
      onAdded?.()
    } catch (e: any) {
      toast.error(e?.message || "Failed to add creators")
    } finally {
      setAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setHandles("") }}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize}>
          <UserPlus className="h-4 w-4 mr-1.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add creators{campaignName ? ` — ${campaignName}` : ""}</DialogTitle>
          <DialogDescription>
            Suggest Instagram creators for this campaign. Each lands as &quot;Team Suggested&quot; in
            pending review — the brand decides who gets approved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Instagram handles (one per line or comma-separated)</Label>
          <textarea
            value={handles}
            onChange={(e) => setHandles(e.target.value)}
            placeholder={"@hudabeauty\n@negin_mirsalehi\n@tamarakalinic"}
            className="w-full min-h-[140px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Handles that match FA-app members are linked automatically — others are managed offline by the Following team.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); setHandles("") }} disabled={adding}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={adding}>
            {adding ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1.5" />}
            Submit for brand review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
