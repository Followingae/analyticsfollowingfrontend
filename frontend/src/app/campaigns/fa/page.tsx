"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { PremiumFeatureGate } from "@/components/ui/premium-feature-gate"
import { QrCode as QrCodeGate, DollarSign as DollarSignGate, Gift as GiftGate } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Users, QrCode, Gift, DollarSign, ArrowRight } from "lucide-react"
import Link from "next/link"
import { brandCampaignApi } from "@/services/faAdminApi"
import { toast } from "sonner"

const TYPE_BADGE: Record<string, { icon: any; label: string; variant: "default" | "secondary" | "outline" }> = {
  cashback: { icon: QrCode, label: "Cashback", variant: "default" },
  paid_deal: { icon: DollarSign, label: "Paid Deal", variant: "secondary" },
  barter: { icon: Gift, label: "Barter", variant: "outline" },
}

function CampaignList({ type }: { type: "cashback" | "paid_deal" | "barter" }) {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await brandCampaignApi.listByType(type)
        if (res.success) setCampaigns(res.data || [])
      } catch {
        toast.error("Failed to load campaigns")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [type])

  if (loading) return <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
  if (campaigns.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No {type.replace("_", " ")} campaigns yet</p>

  return (
    <div className="space-y-3">
      {campaigns.map((c: any) => {
        const badge = TYPE_BADGE[c.campaign_type] || TYPE_BADGE.cashback
        const Icon = badge.icon
        return (
          <Link key={c.id} href={`/campaigns/fa/${c.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                <div className="flex items-center gap-3">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

export default function FACampaignsPage() {
  const { hasRole } = useEnhancedAuth()
  const isFreeTier = hasRole('brand_free')

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Influencer Campaigns</h1>
            <p className="text-muted-foreground text-sm">Cashback, paid deals, and barter campaigns with influencers</p>
          </div>

          {isFreeTier ? (
            <PremiumFeatureGate
              featureName="Influencer Campaigns"
              headline="Run Influencer Campaigns at Scale"
              description="Launch cashback, paid deal, and barter campaigns directly with influencers through the Following App network."
              requiredTier="Standard"
              highlights={[
                { icon: QrCodeGate, title: "Cashback campaigns", description: "Set up QR-based cashback campaigns where influencers earn commission on every purchase they drive." },
                { icon: DollarSignGate, title: "Paid deals & barter", description: "Create paid collaborations or product barter deals with pre-vetted influencers in your market." },
                { icon: GiftGate, title: "Deliverable tracking", description: "Track influencer deliverables, review content, and manage payouts — all from one dashboard." },
              ]}
            />
          ) : (
          <Tabs defaultValue="cashback">
            <TabsList>
              <TabsTrigger value="cashback">Cashback</TabsTrigger>
              <TabsTrigger value="paid_deal">Paid Deals</TabsTrigger>
              <TabsTrigger value="barter">Barter</TabsTrigger>
            </TabsList>
            <TabsContent value="cashback" className="mt-4">
              <CampaignList type="cashback" />
            </TabsContent>
            <TabsContent value="paid_deal" className="mt-4">
              <CampaignList type="paid_deal" />
            </TabsContent>
            <TabsContent value="barter" className="mt-4">
              <CampaignList type="barter" />
            </TabsContent>
          </Tabs>
          )}
        </div>
      </BrandUserInterface>
    </AuthGuard>
  )
}
