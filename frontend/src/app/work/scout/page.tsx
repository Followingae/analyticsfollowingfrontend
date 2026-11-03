"use client"

/**
 * ScoutOutreach: Following's outreach teammate. Two tabs.
 *
 * Campaigns: one row per campaign (relevant applicants against the goal); open one for who
 * fits, reaching out, and everyone reached. General outreach is the last row.
 * Network: every creator we know, to DM about a campaign or add to the database.
 * Any creator opens in a side sheet. Tab, campaign and creator live in the URL.
 */
import * as React from "react"
import { Suspense, useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CampaignList } from "@/components/scout/CampaignList"
import { CampaignView, GeneralView } from "@/components/scout/CampaignView"
import { CreatorSheet } from "@/components/scout/CreatorSheet"
import { NetworkBrowser } from "@/components/scout/NetworkBrowser"
import { ScoutActivity } from "@/components/scout/ScoutActivity"
import { ScoutHeader } from "@/components/scout/ScoutHeader"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { scoutApi, type ScoutCampaignsData } from "@/services/scoutApi"

type Tab = "campaigns" | "network"

export default function ScoutPageWrapper() {
  return <Suspense fallback={null}><ScoutPage /></Suspense>
}

function ScoutPage() {
  const { canDestroy } = useAdminAccess()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const rawTab = params.get("tab")
  const tab: Tab = rawTab === "network" ? "network" : "campaigns"
  // Old links: ?tab=general opens General outreach.
  const list = params.get("list") || (rawTab === "general" ? "general" : null)
  const creator = params.get("creator")

  const setParams = useCallback((patch: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString())
    Object.entries(patch).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k) })
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [params, pathname, router])
  const openCreator = useCallback((u: string) => setParams({ creator: u }), [setParams])
  const openList = (id: string | null) => {
    setParams({ tab: null, list: id })
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const [camps, setCamps] = useState<ScoutCampaignsData | null>(null)
  const loadCamps = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return
    try { setCamps((await scoutApi.campaigns()).data) } catch { /* next tick */ }
  }, [])
  useEffect(() => {
    loadCamps()
    if (tab !== "campaigns") return
    const t = setInterval(loadCamps, 10000)
    return () => clearInterval(t)
  }, [tab, loadCamps])

  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  useEffect(() => {
    const go = () => scoutApi.overview().then(r => setCounts(r.data.counts || {})).catch(() => {})
    go(); const t = setInterval(go, 60000); return () => clearInterval(t)
  }, [])

  const working = camps ? camps.campaigns.filter(c => c.goal?.status === "active" || c.open_call?.status === "live").length : null
  const week = counts?.relevant_week != null ? { n: counts.relevant_week, label: "new relevant applicants this week" }
    : counts?.applied_week != null ? { n: counts.applied_week, label: "applications this week" } : null

  return (
    <SuperadminLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-24">
        <ScoutHeader canEdit={canDestroy} campaigns={working} week={week} />
        <ScoutActivity onOpenList={id => openList(id)} />

        <Tabs value={tab} onValueChange={(v: string) => setParams({ tab: v === "campaigns" ? null : v, list: null })} className="gap-6">
          <TabsList className="h-10 rounded-full p-1">
            <TabsTrigger value="campaigns" className="rounded-full px-5">Campaigns</TabsTrigger>
            <TabsTrigger value="network" className="rounded-full px-5">Network</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            {!camps ? (
              <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : list === "general" ? (
              <GeneralView general={camps.general} onBack={() => openList(null)} onOpen={openCreator} />
            ) : list ? (
              <CampaignView key={list} listId={list} campaign={camps.campaigns.find(c => c.list_id === list)} canEdit={canDestroy}
                            onBack={() => openList(null)} onOpen={openCreator} />
            ) : (
              <CampaignList data={camps} onPick={openList} />
            )}
          </TabsContent>

          <TabsContent value="network">
            <NetworkBrowser defaultSegment="all" canAdd={canDestroy} onOpen={openCreator} dmCampaigns={camps?.campaigns || []} />
          </TabsContent>
        </Tabs>
      </div>

      <CreatorSheet username={creator} onClose={() => setParams({ creator: null })} canEdit={canDestroy}
                    campaigns={camps?.campaigns || []} onChanged={loadCamps} />
    </SuperadminLayout>
  )
}
