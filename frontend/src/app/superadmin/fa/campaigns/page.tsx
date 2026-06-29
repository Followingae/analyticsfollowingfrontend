"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Megaphone, QrCode, Coins, Gift, UserPlus, XCircle, Loader2, Plus, Ticket, Share2, Copy, Download, ImagePlus } from "lucide-react"
import { CouponManagerDialog } from "@/components/superadmin/fa/CouponManagerDialog"
import { MasterPackageDialog } from "@/components/superadmin/fa/MasterPackageDialog"
import { CreateMasterDialog } from "@/components/superadmin/fa/CreateMasterDialog"
import { Layers } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { faCampaignApi } from "@/services/faAdminApi"
import { toast } from "sonner"

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  cashback: { icon: QrCode, label: "Cashback", color: "bg-green-500/10 text-green-600" },
  paid_deal: { icon: Coins, label: "Paid Deal", color: "bg-purple-500/10 text-purple-600" },
  barter: { icon: Gift, label: "Barter", color: "bg-blue-500/10 text-blue-600" },
}

export default function FACampaignsPage() {
  const router = useRouter()
  const [tab, setTab] = useState("all")
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Close-campaign dialog state
  const [closeTarget, setCloseTarget] = useState<any | null>(null)
  const [closing, setClosing] = useState(false)

  // Add curated creators dialog state
  const [addTarget, setAddTarget] = useState<any | null>(null)
  const [addHandles, setAddHandles] = useState("")
  const [adding, setAdding] = useState(false)

  // Coupon manager dialog state
  const [couponTarget, setCouponTarget] = useState<any | null>(null)

  // Share dialog state — canonical creatorapp.following.ae link + QR
  const [packageTarget, setPackageTarget] = useState<any | null>(null)
  const [createMasterOpen, setCreateMasterOpen] = useState(false)
  const [shareTarget, setShareTarget] = useState<any | null>(null)
  const [shareUrl, setShareUrl] = useState("")
  const [shareQr, setShareQr] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  // Dynamic landing visuals — the cover + brand logo shown on creatorapp.following.ae/c/<id>
  const [shareHero, setShareHero] = useState<string | null>(null)
  const [shareLogo, setShareLogo] = useState<string | null>(null)
  const [uploading, setUploading] = useState<null | "hero" | "logo">(null)

  const uploadShareImage = async (kind: "hero" | "logo", file: File) => {
    if (!shareTarget) return
    setUploading(kind)
    try {
      const up = await faCampaignApi.uploadImage(file)
      const url = up?.data?.url
      if (!url) throw new Error("Upload failed")
      const field = kind === "hero" ? "hero_image_url" : "brand_logo_url"
      await faCampaignApi.update(shareTarget.id, { [field]: url })
      if (kind === "hero") setShareHero(url); else setShareLogo(url)
      setCampaigns((prev) => prev.map((c) => (c.id === shareTarget.id ? { ...c, [field]: url } : c)))
      toast.success(kind === "hero" ? "Cover image updated" : "Brand logo updated")
    } catch (e: any) {
      toast.error(e?.message || "Upload failed")
    } finally {
      setUploading(null)
    }
  }

  const openShare = async (c: any) => {
    setShareTarget(c)
    setShareUrl(`https://creatorapp.following.ae/c/${c.id}`)
    setShareQr(null)
    setShareHero(c.hero_image_url ?? null)
    setShareLogo(c.brand_logo_url ?? null)
    setShareLoading(true)
    try {
      const res = await faCampaignApi.share(c.id)
      if (res?.url) setShareUrl(res.url)
      setShareQr(res?.qr_png_base64 ?? null)
    } catch {
      // URL is already set from the id; QR just won't render
    } finally {
      setShareLoading(false)
    }
  }

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Link copied")
    } catch {
      toast.error("Couldn't copy — select and copy manually")
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const type = tab === "all" ? undefined : tab
      const res = await faCampaignApi.list(type)
      // BE returns data:{campaigns:[...], total, ...}; tolerate a bare array too.
      if (res.success) {
        const payload: any = res.data
        setCampaigns(Array.isArray(payload?.campaigns) ? payload.campaigns : (Array.isArray(payload) ? payload : []))
      }
    } catch { toast.error("Failed to load campaigns") }
    finally { setLoading(false) }
  }, [tab])

  const handleClose = async () => {
    if (!closeTarget) return
    setClosing(true)
    try {
      await faCampaignApi.close(closeTarget.id)
      toast.success(`Closed "${closeTarget.name}"`)
      setCloseTarget(null)
      load()
    } catch (e: any) {
      toast.error(e?.message || "Failed to close campaign")
    } finally {
      setClosing(false)
    }
  }

  const handleAddCurated = async () => {
    if (!addTarget) return
    const lines = addHandles
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
        addTarget.id,
        lines.map((h) => ({ instagram_username: h }))
      )
      const added = (res?.data?.added_online ?? 0) + (res?.data?.added_offline ?? 0)
      toast.success(`Added ${added} creator(s) for brand approval`)
      setAddTarget(null)
      setAddHandles("")
      load()
    } catch (e: any) {
      toast.error(e?.message || "Failed to add creators")
    } finally {
      setAdding(false)
    }
  }

  useEffect(() => { load() }, [load])

  // Re-fetch when page becomes visible (after navigating back from create)
  useEffect(() => {
    const handleFocus = () => { load() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [load])

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">FA Campaigns</h1>
              <p className="text-muted-foreground text-sm">Create and manage cashback, paid deal, and barter campaigns</p>
            </div>
            {/* One create entry - type is chosen in the wizard's first step */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setCreateMasterOpen(true)}>
                <Layers className="h-4 w-4 mr-1" />New package
              </Button>
              <Link href="/superadmin/fa/campaigns/new">
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Create Campaign</Button>
              </Link>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="cashback">Cashback</TabsTrigger>
              <TabsTrigger value="paid_deal">Paid Deals</TabsTrigger>
              <TabsTrigger value="barter">Barter</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-3">
            {campaigns.map((c: any) => {
              const cfg = TYPE_CONFIG[c.campaign_type] || TYPE_CONFIG.cashback
              const Icon = cfg.icon
              const isActive = c.status === "active"
              return (
                <Card key={c.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/campaigns/${c.id}/posts`)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{c.brand_name}</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                      <Badge variant={isActive ? "default" : "secondary"}>{c.status}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); openShare(c) }}
                      >
                        <Share2 className="h-3.5 w-3.5 mr-1.5" />
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); setCouponTarget(c) }}
                      >
                        <Ticket className="h-3.5 w-3.5 mr-1.5" />
                        Coupons
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); setPackageTarget(c) }}
                      >
                        <Layers className="h-3.5 w-3.5 mr-1.5" />
                        Package
                      </Button>
                      {isActive && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); setAddTarget(c) }}
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                            Add creators
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); setCloseTarget(c) }}
                            className="text-destructive hover:text-destructive"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1.5" />
                            Close
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Close campaign confirmation */}
          <AlertDialog open={!!closeTarget} onOpenChange={(o: boolean) => { if (!o) setCloseTarget(null) }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close &quot;{closeTarget?.name}&quot;?</AlertDialogTitle>
                <AlertDialogDescription>
                  Once closed, creators can no longer apply and admins can no longer suggest creators for brand approval. Applications already in review will stay visible to the brand.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={closing}>Keep open</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClose}
                  disabled={closing}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Close campaign"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Add curated creators (Team Suggested) */}
          <Dialog open={!!addTarget} onOpenChange={(o: boolean) => { if (!o) { setAddTarget(null); setAddHandles("") } }}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Suggest creators - {addTarget?.name}</DialogTitle>
                <DialogDescription>
                  Add Instagram handles the Following team is suggesting. Each will land as &quot;Team
                  Suggested&quot; in pending review - the brand decides who gets approved.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Instagram handles (one per line or comma-separated)</Label>
                <textarea
                  value={addHandles}
                  onChange={(e) => setAddHandles(e.target.value)}
                  placeholder="@hudabeauty&#10;@negin_mirsalehi&#10;@tamarakalinic"
                  className="w-full min-h-[140px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Handles that match FA-app members are linked automatically - others are managed offline by the Following team.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setAddTarget(null); setAddHandles("") }} disabled={adding}>
                  Cancel
                </Button>
                <Button onClick={handleAddCurated} disabled={adding}>
                  {adding ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1.5" />}
                  Submit for brand review
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Share — dynamic link + cashback QR */}
          <Dialog open={!!shareTarget} onOpenChange={(o: boolean) => { if (!o) setShareTarget(null) }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Share &quot;{shareTarget?.name}&quot;</DialogTitle>
                <DialogDescription>
                  One link for everything — send it to creators or print the QR for cashback. It opens the app if installed, otherwise the store.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4">
                {/* Dynamic landing visuals — pulled from the campaign (cover + brand
                    logo). These feed the public /c/<id> page and the in-app cards, so
                    there's nothing to fill in when the campaign already has them. */}
                <div className="grid w-full grid-cols-2 gap-3">
                  {([
                    { kind: "hero" as const, label: "Cover image", url: shareHero, fit: "object-cover" },
                    { kind: "logo" as const, label: "Brand logo", url: shareLogo, fit: "object-contain p-2" },
                  ]).map(({ kind, label, url, fit }) => (
                    <div key={kind}>
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
                      {url ? (
                        // Already on the campaign — show it as a preview, with a quiet
                        // hover affordance to replace it (no required input).
                        <label className="group relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-md border bg-muted/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={label} className={`h-full w-full ${fit}`} />
                          <div className="absolute inset-0 hidden place-items-center bg-background/60 group-hover:grid">
                            <span className="flex items-center gap-1 text-xs font-medium"><ImagePlus className="h-3.5 w-3.5" />Change</span>
                          </div>
                          {uploading === kind && <div className="absolute inset-0 grid place-items-center bg-background/60"><Loader2 className="h-4 w-4 animate-spin" /></div>}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadShareImage(kind, f); e.currentTarget.value = "" }} />
                        </label>
                      ) : (
                        // Genuinely missing on the campaign — fall back to a manual upload.
                        <label className="relative flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-dashed bg-muted/40 hover:bg-muted">
                          <ImagePlus className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Upload {label.toLowerCase()}</span>
                          {uploading === kind && <div className="absolute inset-0 grid place-items-center bg-background/60"><Loader2 className="h-4 w-4 animate-spin" /></div>}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadShareImage(kind, f); e.currentTarget.value = "" }} />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex h-[200px] w-[200px] items-center justify-center rounded-lg border bg-white">
                  {shareLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : shareQr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`data:image/png;base64,${shareQr}`} alt="Campaign QR" className="h-[184px] w-[184px]" />
                  ) : (
                    <QrCode className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex w-full items-center gap-2">
                  <Input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
                  <Button size="sm" variant="outline" onClick={copyShareUrl}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <DialogFooter>
                {shareQr && (
                  <a href={`data:image/png;base64,${shareQr}`} download={`campaign-${shareTarget?.id}-qr.png`}>
                    <Button variant="outline"><Download className="h-4 w-4 mr-1.5" />Download QR</Button>
                  </a>
                )}
                <Button onClick={() => setShareTarget(null)}>Done</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Coupon manager */}
          <CouponManagerDialog
            campaignId={couponTarget?.id ?? null}
            campaignName={couponTarget?.name}
            open={!!couponTarget}
            onOpenChange={(o) => { if (!o) setCouponTarget(null) }}
          />

          {/* Master package management */}
          <MasterPackageDialog
            campaign={packageTarget}
            onClose={() => setPackageTarget(null)}
            onChanged={load}
          />
          <CreateMasterDialog
            open={createMasterOpen}
            onClose={() => setCreateMasterOpen(false)}
            onCreated={load}
          />

          {!loading && campaigns.length === 0 && (
            <Card><CardContent className="text-center py-12"><Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No campaigns yet</p></CardContent></Card>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
