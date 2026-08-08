"use client"

/**
 * Upload or generate a campaign's unique codes. Codes are released one-per-creator
 * automatically on approval - this dialog only manages the pool.
 *
 * Two sources, because there are two kinds of campaign:
 *   Paste    - the BRAND supplies codes from their own ordering system, and their
 *              checkout burns them. We never see a redemption.
 *   Generate - a dine-in venue with no system of its own. We mint the codes, and
 *              staff confirm the walk-in at the venue by scanning the creator's QR.
 *              Only these codes ever reach a "redeemed" state.
 */
import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Upload, Trash2, Ticket, Sparkles, UtensilsCrossed } from "lucide-react"
import { faCampaignApi } from "@/services/faAdminApi"
import { toast } from "sonner"

interface Coupon {
  id: string
  code: string
  status: string
  source?: string
  assigned_username?: string | null
  assigned_at?: string | null
  redeemed_at?: string | null
  party_size?: number | null
  bill_amount_aed?: number | null
}

export function CouponManagerDialog({ campaignId, campaignName, open, onOpenChange }: {
  campaignId: string | null; campaignName?: string; open: boolean; onOpenChange: (o: boolean) => void
}) {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [stats, setStats] = useState({ total: 0, available: 0, assigned: 0, redeemed: 0 })
  const [loading, setLoading] = useState(false)
  const [paste, setPaste] = useState("")
  const [uploading, setUploading] = useState(false)
  const [count, setCount] = useState("20")
  const [prefix, setPrefix] = useState("")
  const [generating, setGenerating] = useState(false)

  const load = useCallback(async () => {
    if (!campaignId) return
    setLoading(true)
    try {
      const res = await faCampaignApi.listCoupons(campaignId)
      const d = res?.data || {}
      setCoupons(Array.isArray(d.coupons) ? d.coupons : [])
      setStats({ total: d.total || 0, available: d.available || 0, assigned: d.assigned || 0, redeemed: d.redeemed || 0 })
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

  const generate = async () => {
    if (!campaignId) return
    const n = parseInt(count, 10)
    if (!n || n < 1) { toast.error("How many codes?"); return }
    setGenerating(true)
    try {
      const res = await faCampaignApi.generateCoupons(campaignId, n, prefix.trim() || undefined)
      toast.success(`Generated ${res?.data?.generated ?? 0} code(s)`)
      load()
    } catch (e: unknown) {
      // The common failure is a campaign with no merchant linked: the venue code
      // lives on the merchant, so there would be nowhere to confirm the visit.
      const msg = (e as { message?: string })?.message
      toast.error(msg || "Generation failed")
    }
    finally { setGenerating(false) }
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
          <DialogTitle className="flex items-center gap-2"><Ticket className="h-5 w-5" />Codes</DialogTitle>
          <DialogDescription>
            {campaignName ? `${campaignName} — ` : ""}codes are released to creators automatically the moment they&apos;re approved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{stats.total} total</Badge>
          <Badge className="bg-green-500/10 text-green-600">{stats.available} available</Badge>
          <Badge className="bg-blue-500/10 text-blue-600">{stats.assigned} issued</Badge>
          {stats.redeemed > 0 && (
            <Badge className="bg-purple-500/10 text-purple-600">{stats.redeemed} visited</Badge>
          )}
        </div>

        <Tabs defaultValue="generate">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="gap-1.5">
              <UtensilsCrossed className="h-3.5 w-3.5" />Dine-in
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />Brand codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-2 pt-3">
            <p className="text-xs text-muted-foreground">
              For venues with no ordering system. We generate the codes; staff confirm the
              walk-in by scanning the creator&apos;s QR and typing the venue code.
            </p>
            <div className="flex gap-2">
              <Input
                type="number" min={1} max={500} value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-24" placeholder="20"
              />
              <Input
                value={prefix} onChange={(e) => setPrefix(e.target.value)}
                placeholder="Prefix (optional) — e.g. BRK" className="flex-1 font-mono text-sm"
              />
            </div>
            <Button onClick={generate} disabled={generating} className="w-full">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate codes
            </Button>
          </TabsContent>

          <TabsContent value="paste" className="space-y-2 pt-3">
            <p className="text-xs text-muted-foreground">
              For campaigns where the brand issues codes from their own delivery or
              ordering platform, and their checkout burns them.
            </p>
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
          </TabsContent>
        </Tabs>

        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : coupons.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No codes yet</p>
          ) : (
            coupons.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="min-w-0">
                  <p className="font-mono text-sm truncate">{c.code}</p>
                  {c.status !== "available" && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      → @{c.assigned_username || "creator"}
                      {c.redeemed_at ? ` · visited ${new Date(c.redeemed_at).toLocaleDateString()}` : ""}
                      {c.party_size ? ` · ${c.party_size} guests` : ""}
                    </p>
                  )}
                </div>
                {c.status === "redeemed" ? (
                  <Badge className="bg-purple-500/10 text-purple-600 shrink-0">visited</Badge>
                ) : c.status === "assigned" ? (
                  <Badge className="bg-blue-500/10 text-blue-600 shrink-0">issued</Badge>
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
