"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Megaphone, QrCode, Coins, Gift, UserPlus, XCircle, Loader2 } from "lucide-react"
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

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const type = tab === "all" ? undefined : tab
      const res = await faCampaignApi.list(type)
      if (res.success) setCampaigns(Array.isArray(res.data) ? res.data : [])
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">FA Campaigns</h1>
              <p className="text-muted-foreground text-sm">Create and manage cashback, paid deal, and barter campaigns</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/superadmin/fa/campaigns/create">
                <Button size="sm" variant="default"><QrCode className="h-4 w-4 mr-1" />Cashback</Button>
              </Link>
              <Link href="/superadmin/fa/campaigns/create-paid-deal">
                <Button size="sm" variant="outline">Paid Deal</Button>
              </Link>
              <Link href="/superadmin/fa/campaigns/create-barter">
                <Button size="sm" variant="outline">Barter</Button>
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
                  <CardContent className="p-4 flex items-center justify-between gap-3">
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
                <DialogTitle>Suggest creators — {addTarget?.name}</DialogTitle>
                <DialogDescription>
                  Add Instagram handles the Following team is suggesting. Each will land as &quot;Team
                  Suggested&quot; in pending review — the brand decides who gets approved.
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
                  Handles that match FA-app members are linked automatically — others are managed offline by the Following team.
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

          {!loading && campaigns.length === 0 && (
            <Card><CardContent className="text-center py-12"><Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No campaigns yet</p></CardContent></Card>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
