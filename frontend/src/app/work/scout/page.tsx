"use client"

/**
 * ScoutOutreach: one page for the whole of Scout's work.
 *
 * The live bar says what Scout is doing this second. The brand tiles pick a campaign; the
 * board under them is that campaign's funnel in four columns (Brief and fit, Reach, Review,
 * Proposal) with the people in each and the action that is theirs. The last two tiles are
 * general outreach (join Following) and the whole creator network. Any creator opens in a side
 * sheet. Campaign and creator live in the URL. The roster page keeps a tab that points here.
 */
import * as React from "react"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Globe, Loader2 } from "lucide-react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Board } from "@/components/scout/Board"
import { BrandPicker, type Pick } from "@/components/scout/BrandPicker"
import { CreatorSheet } from "@/components/scout/CreatorSheet"
import { NetworkBrowser } from "@/components/scout/NetworkBrowser"
import { PeopleTable } from "@/components/scout/PeopleTable"
import { ScoutActivity } from "@/components/scout/ScoutActivity"
import { ScoutHeader } from "@/components/scout/ScoutHeader"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { scoutApi, type ScoutCampaignsData } from "@/services/scoutApi"

export default function ScoutPageWrapper() {
  return <Suspense fallback={null}><ScoutPage /></Suspense>
}

function GeneralView({ general, onOpen }: { general: ScoutCampaignsData["general"]; onOpen: (u: string) => void }) {
  const f = general.funnel
  const steps: [number, string][] = [[f.contacted, "contacted"], [f.clicked, "clicked"], [f.joined_app, "joined the app"], [f.in_database, "in database"]]
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold tracking-tight">Join Following</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {steps.map(([v, l]) => (
            <div key={l} className="rounded-2xl border bg-background p-4">
              <p className="text-3xl font-semibold tabular-nums tracking-tight">{v.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        {general.queue > 0 && <p className="text-sm text-muted-foreground">{general.queue.toLocaleString()} waiting for the bot</p>}
      </div>
      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Everyone</h3>
        <PeopleTable listId="general" mode="general" onOpen={onOpen} />
      </section>
    </div>
  )
}

function ScoutPage() {
  const { canDestroy, isSuperAdmin, staffRole } = useAdminAccess()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const rawTab = params.get("tab")
  const listParam = params.get("list") || (rawTab === "general" ? "general" : null)
  const creator = params.get("creator")

  const setParams = useCallback((patch: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString())
    Object.entries(patch).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k) })
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [params, pathname, router])
  const openCreator = useCallback((u: string) => setParams({ creator: u }), [setParams])

  const [camps, setCamps] = useState<ScoutCampaignsData | null>(null)
  const loadCamps = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return
    try { setCamps((await scoutApi.campaigns()).data) } catch { /* next tick */ }
  }, [])
  useEffect(() => { loadCamps(); const t = setInterval(loadCamps, 10000); return () => clearInterval(t) }, [loadCamps])

  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  useEffect(() => {
    const go = () => scoutApi.overview().then(r => setCounts(r.data.counts || {})).catch(() => {})
    go(); const t = setInterval(go, 60000); return () => clearInterval(t)
  }, [])

  // The pick: the URL first; otherwise the first live campaign, so the page opens on work.
  const pick: Pick | null = useMemo(() => {
    if (rawTab === "network") return { kind: "network" }
    if (listParam === "general") return { kind: "general" }
    if (listParam) return { kind: "campaign", id: listParam }
    if (!camps) return null
    const first = [...camps.campaigns].sort((a, b) => Number(b.open_call?.status === "live") - Number(a.open_call?.status === "live"))[0]
    return first ? { kind: "campaign", id: first.list_id } : { kind: "general" }
  }, [rawTab, listParam, camps])
  const onPick = (p: Pick) => {
    setParams(p.kind === "network" ? { tab: "network", list: null } : p.kind === "general" ? { tab: null, list: "general" } : { tab: null, list: p.id })
  }

  const working = camps ? camps.campaigns.filter(c => c.goal?.status === "active" || c.open_call?.status === "live").length : null
  const week = counts?.relevant_week != null ? { n: counts.relevant_week, label: "new relevant applicants this week" }
    : counts?.applied_week != null ? { n: counts.applied_week, label: "applications this week" } : null

  return (
    <SuperadminLayout>
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 pb-24">
        <ScoutHeader canEdit={canDestroy} campaigns={working} week={week} />
        <ScoutActivity onOpenList={id => onPick({ kind: "campaign", id })} />

        {!camps ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <BrandPicker data={camps} pick={pick} onPick={onPick} />
            {pick?.kind === "network" ? (
              <NetworkBrowser defaultSegment="all" canAdd={canDestroy} onOpen={openCreator} dmCampaigns={camps.campaigns} />
            ) : pick?.kind === "general" ? (
              <GeneralView general={camps.general} onOpen={openCreator} />
            ) : pick ? (
              <Board key={pick.id} listId={pick.id} campaign={camps.campaigns.find(c => c.list_id === pick.id)}
                     canEdit={canDestroy} isSuperAdmin={isSuperAdmin} staffRole={staffRole} onOpen={openCreator} onCampaignsChanged={loadCamps} />
            ) : null}
          </>
        )}
      </div>

      <CreatorSheet username={creator} onClose={() => setParams({ creator: null })} canEdit={canDestroy}
                    campaigns={camps?.campaigns || []} onChanged={loadCamps} />
    </SuperadminLayout>
  )
}
