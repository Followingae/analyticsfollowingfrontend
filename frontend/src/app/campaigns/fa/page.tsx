"use client"

/**
 * The brand's influencer campaigns, split by how the creator is paid. Tier: WORKING.
 *
 * The page had no padding of its own and the shell supplies none, so it ran flush into the
 * sidebar. It also had one loading sentence doing three jobs: a failed list toasted and then
 * rendered "No cashback campaigns yet", which tells a client they have never run one when
 * what actually happened is that we could not ask. Those are three states now.
 *
 * Each campaign is a real object you open, so it keeps a row you can click, but the four
 * borders around each one become one hairline between them.
 */

import { useCallback, useEffect, useState } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { PremiumFeatureGate } from "@/components/ui/premium-feature-gate"
import { QrCode as QrCodeGate, Coins as CoinsGate, Gift as GiftGate } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { QrCode, Gift, Coins, ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { brandCampaignApi } from "@/services/faAdminApi"
import { toast } from "sonner"
import {
  Empty,
  Failed,
  Page,
  PageHead,
  Sections,
  State,
  Waiting,
  type StateTone,
} from "@/components/campaigns/surface"

const TYPE_META: Record<string, { icon: LucideIcon; label: string }> = {
  cashback: { icon: QrCode, label: "Cashback" },
  paid_deal: { icon: Coins, label: "Paid deal" },
  barter: { icon: Gift, label: "Barter" },
}

const STATUS_TONE: Record<string, StateTone> = {
  active: "good",
  live: "good",
  paused: "warn",
  draft: "neutral",
  completed: "info",
  cancelled: "bad",
}

const NOTHING_YET: Record<string, string> = {
  cashback: "You have not run a cashback campaign yet.",
  paid_deal: "You have not run a paid deal yet.",
  barter: "You have not run a barter campaign yet.",
}

function CampaignList({ type }: { type: "cashback" | "paid_deal" | "barter" }) {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading")

  const load = useCallback(async () => {
    setState("loading")
    try {
      const res = await brandCampaignApi.listByType(type)
      // /unified returns data:[...] (array)
      if (res.success) {
        setCampaigns(Array.isArray(res.data) ? res.data : [])
        setState("ready")
      } else {
        setState("failed")
      }
    } catch {
      toast.error("Failed to load campaigns")
      setState("failed")
    }
  }, [type])

  useEffect(() => { load() }, [load])

  if (state === "loading") return <Waiting lines={3} />
  if (state === "failed") {
    return (
      <Failed
        what="We could not load these campaigns"
        detail="This is our end, not yours. Nothing has changed on any campaign you are running."
        onRetry={load}
      />
    )
  }
  if (campaigns.length === 0) return <Empty>{NOTHING_YET[type]}</Empty>

  return (
    <div className="divide-y overflow-hidden rounded-ds-lg border">
      {campaigns.map((c: any) => {
        const meta = TYPE_META[c.campaign_type] || TYPE_META[type]
        const Icon = meta.icon
        const status = String(c.status || "").toLowerCase()
        return (
          <Link
            key={c.id}
            href={`/campaigns/${c.id}/posts`}
            className="flex items-center gap-ds-3 px-ds-4 py-ds-3 transition-colors hover:bg-muted/60"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-ds-md bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-ds-label">{c.name}</span>
              <span className="mt-1 block truncate text-ds-caption text-muted-foreground">
                {c.brand_name || meta.label}
              </span>
            </span>
            {status && <State tone={STATUS_TONE[status] || "neutral"}>{status}</State>}
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
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
        <Page width="page">
          <Sections>
            <PageHead
              title="Influencer campaigns"
              sub="Cashback, paid deals and barter, run with creators in the Following App."
            />

            {isFreeTier ? (
              <PremiumFeatureGate
                featureName="Influencer Campaigns"
                headline="Run Influencer Campaigns at Scale"
                description="Launch cashback, paid deal, and barter campaigns directly with influencers through the Following App network."
                requiredTier="Standard"
                highlights={[
                  { icon: QrCodeGate, title: "Cashback campaigns", description: "Set up QR-based cashback campaigns where influencers earn commission on every purchase they drive." },
                  { icon: CoinsGate, title: "Paid deals and barter", description: "Create paid collaborations or product barter deals with pre-vetted influencers in your market." },
                  { icon: GiftGate, title: "Deliverable tracking", description: "Track influencer deliverables, review content, and manage payouts, all from one dashboard." },
                ]}
              />
            ) : (
              <Tabs defaultValue="cashback" className="flex flex-col gap-ds-4">
                <TabsList>
                  <TabsTrigger value="cashback">Cashback</TabsTrigger>
                  <TabsTrigger value="paid_deal">Paid deals</TabsTrigger>
                  <TabsTrigger value="barter">Barter</TabsTrigger>
                </TabsList>
                <TabsContent value="cashback" className="mt-0">
                  <CampaignList type="cashback" />
                </TabsContent>
                <TabsContent value="paid_deal" className="mt-0">
                  <CampaignList type="paid_deal" />
                </TabsContent>
                <TabsContent value="barter" className="mt-0">
                  <CampaignList type="barter" />
                </TabsContent>
              </Tabs>
            )}
          </Sections>
        </Page>
      </BrandUserInterface>
    </AuthGuard>
  )
}
