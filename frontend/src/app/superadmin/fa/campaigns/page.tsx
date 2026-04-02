"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Megaphone, QrCode, Coins, Gift } from "lucide-react"
import Link from "next/link"
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
            <Link href="/superadmin/fa/campaigns/create">
              <Button size="sm"><QrCode className="h-4 w-4 mr-1" />Create Cashback Campaign</Button>
            </Link>
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
