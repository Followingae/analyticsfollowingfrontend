"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, Megaphone, QrCode, Coins, Gift } from "lucide-react"
import { faCampaignApi } from "@/services/faAdminApi"
import { toast } from "sonner"

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  cashback: { icon: QrCode, label: "Cashback", color: "bg-green-500/10 text-green-600" },
  paid_deal: { icon: Coins, label: "Paid Deal", color: "bg-purple-500/10 text-purple-600" },
  barter: { icon: Gift, label: "Barter", color: "bg-blue-500/10 text-blue-600" },
}

export default function FACampaignsPage() {
  const [tab, setTab] = useState("all")
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createType, setCreateType] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const type = tab === "all" ? undefined : tab
      const res = await faCampaignApi.list(type)
      if (res.success) setCampaigns(Array.isArray(res.data) ? res.data : [])
    } catch { toast.error("Failed to load campaigns") }
    finally { setLoading(false) }
  }, [tab])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    try {
      const data = { ...form, deliverable_requirements: form.deliverable_requirements ? [{ type: form.deliverable_requirements, quantity: 1 }] : [] }
      if (createType === "cashback") await faCampaignApi.createCashback(data)
      else if (createType === "paid_deal") await faCampaignApi.createPaidDeal(data)
      else await faCampaignApi.createBarter(data)
      toast.success("Campaign created")
      setCreateType(null)
      setForm({})
      load()
    } catch { toast.error("Failed to create campaign") }
  }

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">FA Campaigns</h1>
              <p className="text-muted-foreground text-sm">Create and manage cashback, paid deal, and barter campaigns</p>
            </div>
            <Dialog open={!!createType} onOpenChange={(o) => { if (!o) { setCreateType(null); setForm({}) } }}>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setCreateType("cashback")}><QrCode className="h-4 w-4 mr-1" />Cashback</Button>
                <Button size="sm" variant="outline" onClick={() => setCreateType("paid_deal")}><Coins className="h-4 w-4 mr-1" />Paid Deal</Button>
                <Button size="sm" variant="outline" onClick={() => setCreateType("barter")}><Gift className="h-4 w-4 mr-1" />Barter</Button>
              </div>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Create {createType?.replace("_", " ")} Campaign</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Campaign name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <Input placeholder="Brand name" value={form.brand_name || ""} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} />
                  <Input placeholder="Brand User ID (UUID)" value={form.brand_user_id || ""} onChange={(e) => setForm({ ...form, brand_user_id: e.target.value })} />
                  {createType === "cashback" && (
                    <>
                      <Input placeholder="Merchant ID (UUID)" value={form.merchant_id || ""} onChange={(e) => setForm({ ...form, merchant_id: e.target.value })} />
                      <Input type="number" placeholder="Cashback % (e.g. 10)" value={form.cashback_percentage || ""} onChange={(e) => setForm({ ...form, cashback_percentage: parseFloat(e.target.value) })} />
                      <Input placeholder="Pool ID (UUID)" value={form.pool_id || ""} onChange={(e) => setForm({ ...form, pool_id: e.target.value })} />
                    </>
                  )}
                  {createType === "paid_deal" && (
                    <>
                      <Input type="number" placeholder="Payout AED (e.g. 500)" value={form.payout_aed || ""} onChange={(e) => setForm({ ...form, payout_aed: parseFloat(e.target.value) })} />
                      <Input placeholder="Pool ID (UUID)" value={form.pool_id || ""} onChange={(e) => setForm({ ...form, pool_id: e.target.value })} />
                      <Input type="number" placeholder="Max participants" value={form.max_participants || ""} onChange={(e) => setForm({ ...form, max_participants: parseInt(e.target.value) })} />
                    </>
                  )}
                  {createType === "barter" && (
                    <Input placeholder="Barter item description" value={form.barter_item || ""} onChange={(e) => setForm({ ...form, barter_items: { item: e.target.value } })} />
                  )}
                  <Input placeholder="Deliverable requirement (e.g. 3 IG Stories in 7 days)" value={form.deliverable_requirements || ""} onChange={(e) => setForm({ ...form, deliverable_requirements: e.target.value })} />
                  <Input placeholder="Min tier (BRONZE/SILVER/GOLD/PLATINUM)" value={form.min_tier || ""} onChange={(e) => setForm({ ...form, min_tier: e.target.value })} />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => { setCreateType(null); setForm({}) }}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={!form.name}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
              return (
                <Card key={c.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-sm text-muted-foreground">{c.brand_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                      <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {!loading && campaigns.length === 0 && (
            <Card><CardContent className="text-center py-12"><Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No campaigns yet</p></CardContent></Card>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
