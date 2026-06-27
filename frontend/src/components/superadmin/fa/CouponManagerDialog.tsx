"use client"

/**
 * Upload + manage a campaign's unique coupon codes (brand-supplied). Codes are
 * released one-per-creator automatically on approval - this dialog only loads the
 * pool and shows assignment status. Reusable from create flow + campaigns list.
 */
import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload, Trash2, Ticket } from "lucide-react"
import { faCampaignApi } from "@/services/faAdminApi"
import { toast } from "sonner"

interface Coupon { id: string; code: string; status: string; assigned_username?: string | null; assigned_at?: string | null }

export function CouponManagerDialog({ campaignId, campaignName, open, onOpenChange }: {
  campaignId: string | null; campaignName?: string; open: boolean; onOpenChange: (o: boolean) => void
}) {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [stats, setStats] = useState({ total: 0, available: 0, assigned: 0 })
  const [loading, setLoading] = useState(false)
  const [paste, setPaste] = useState("")
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    if (!campaignId) return
    setLoading(true)
    try {
      const res = await faCampaignApi.listCoupons(campaignId)
      const d = res?.data || {}
      setCoupons(Array.isArray(d.coupons) ? d.coupons : [])
      setStats({ total: d.total || 0, available: d.available || 0, assigned: d.assigned || 0 })
    } catch { toast.error("Failed to load coupons") }
    finally { setLoading(false) }
  }, [campaignId])

  useEffect(() => { if (open && campaignId) load() }, [open, campaignId, load])

  const upload = async () => {
    if (!campaignId) return
    const codes = paste.split(/[\n,]+/).map((c) => c.trim()).filter(Boolean)
    if (!codes.length) { toast.error("Paste at least one code"); return }
    setUploading(true)
    try {
      const res = await faCampaignApi.uploadCoupons(campaignId, codes)
      const d = res?.data || {}
      toast.success(`Added ${d.inserted ?? 0} code(s)${d.skipped ? `, ${d.skipped} duplicate(s) skipped` : ""}`)
      setPaste("")
      load()
    } catch { toast.error("Upload failed") }
    finally { setUploading(false) }
  }

  const remove = async (id: string) => {
    if (!campaignId) return
    try { await faCampaignApi.deleteCoupon(campaignId, id); load() }
    catch { toast.error("Could not remove (already assigned?)") }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Ticket className="h-5 w-5" />Coupon codes</DialogTitle>
          <DialogDescription>
            {campaignName ? `${campaignName} - ` : ""}unique codes are released to creators automatically the moment they&apos;re approved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">{stats.total} total</Badge>
          <Badge className="bg-green-500/10 text-green-600">{stats.available} available</Badge>
          <Badge className="bg-blue-500/10 text-blue-600">{stats.assigned} assigned</Badge>
        </div>

        <div className="space-y-2">
          <Textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={"Paste codes - one per line or comma-separated\nTHAIFIRE-A1B2\nTHAIFIRE-C3D4"}
            className="min-h-[110px] font-mono text-sm"
          />
          <Button onClick={upload} disabled={uploading} className="w-full">
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload codes
          </Button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : coupons.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No codes uploaded yet</p>
          ) : (
            coupons.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="min-w-0">
                  <p className="font-mono text-sm truncate">{c.code}</p>
                  {c.status === "assigned" && <p className="text-[11px] text-muted-foreground truncate">→ @{c.assigned_username || "creator"}</p>}
                </div>
                {c.status === "assigned" ? (
                  <Badge className="bg-blue-500/10 text-blue-600 shrink-0">assigned</Badge>
                ) : (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 shrink-0" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
