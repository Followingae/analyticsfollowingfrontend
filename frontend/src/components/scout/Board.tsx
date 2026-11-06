"use client"

/**
 * One campaign, the whole of Scout's work on it, left to right: Brief and fit, Reach, Review,
 * Proposal. Each column is a stage of the funnel with the people in it and the one action that
 * is theirs; the counts across the top are the funnel at a glance. Below, everyone reached.
 *
 * Founders see all four. Talent see Brief, Reach and Review. Account roles see Review and
 * Proposal. Every number on this screen comes from the server and refreshes on its own.
 */
import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { openCallsApi, type OpenCall } from "@/services/openCallsApi"
import { scoutApi, type HeldAnswer, type ScoutCampaign, type ScoutOutreachItem, type ScoutRosterPlan } from "@/services/scoutApi"
import { BoardBrief, type RosterGoal } from "./BoardBrief"
import { BoardReach } from "./BoardReach"
import { BoardReview, type ApplicantsData } from "./BoardReview"
import { BoardProposal } from "./BoardProposal"
import { PeopleTable } from "./PeopleTable"
import { LiveDot } from "./outreachParts"

const visible = () => typeof document === "undefined" || !document.hidden

/** Poll while the tab is visible; `tick` forces a reload after an action. */
function usePoll<T>(fn: () => Promise<T | null>, ms: number, deps: unknown[]): T | null {
  const [v, setV] = useState<T | null>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async () => {
    if (!visible()) return
    try { const r = await fn(); if (r !== null) setV(r) } catch { /* next tick */ }
  }, deps)
  useEffect(() => { setV(null) }, [deps[0]]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run(); const t = setInterval(run, ms); return () => clearInterval(t) }, [run, ms])
  return v
}

type Col = "brief" | "reach" | "review" | "proposal"
const STEP: Record<Col, { n: number; title: string }> = {
  brief: { n: 1, title: "Brief and fit" }, reach: { n: 2, title: "Reach" }, review: { n: 3, title: "Review" }, proposal: { n: 4, title: "Proposal" },
}

function Column({ col, count, sub, children }: { col: Col; count: number | null; sub?: string; children: React.ReactNode }) {
  const s = STEP[col]
  return (
    <section className="flex min-w-0 flex-col rounded-3xl border bg-muted/20">
      <header className="flex items-end justify-between gap-3 px-5 pb-3 pt-5">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Step {s.n}</p>
          <h3 className="truncate text-base font-semibold">{s.title}</h3>
          {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
        {count != null && <span className="text-3xl font-semibold tabular-nums tracking-tight">{count.toLocaleString()}</span>}
      </header>
      <div className="flex flex-col gap-3 overflow-y-auto px-3 pb-3 [scrollbar-width:thin] xl:max-h-[76vh]">{children}</div>
    </section>
  )
}

export function Board({ listId, campaign, canEdit, isSuperAdmin, staffRole, onOpen, onCampaignsChanged }: {
  listId: string; campaign: ScoutCampaign | undefined; canEdit: boolean; isSuperAdmin: boolean; staffRole: string | null
  onOpen: (u: string) => void; onCampaignsChanged: () => void
}) {
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => { setTick(t => t + 1); onCampaignsChanged() }, [onCampaignsChanged])

  const plan = usePoll<ScoutRosterPlan>(() => scoutApi.plan(listId).then(r => r.data), 8000, [listId, tick])
  const items = usePoll<ScoutOutreachItem[]>(() => scoutApi.outreach(listId, "all").then(r => r.data.items || []), 8000, [listId, tick])
  const held = usePoll<HeldAnswer[]>(() => scoutApi.held(listId).then(r => r.data.items || []), 8000, [listId, tick])
  const roster = usePoll<RosterGoal>(() => scoutApi.roster(listId).then(r => r.data), 30000, [listId, tick])
  const [ocLoaded, setOcLoaded] = useState(false)
  const oc = usePoll<OpenCall | null>(async () => {
    try { return (await openCallsApi.forList(listId)).data } finally { setOcLoaded(true) }
  }, 15000, [listId, tick])
  useEffect(() => { setOcLoaded(false) }, [listId])
  const ocId = oc?.id || plan?.open_call?.id || null
  const applicants = usePoll<ApplicantsData>(() => ocId ? openCallsApi.applicants(ocId).then(r => r.data) : Promise.resolve(null), 10000, [ocId, tick])

  const role: "lead" | "talent" | "account" = canEdit ? "lead"
    : staffRole === "account_manager" || staffRole === "business_development" ? "account" : "talent"
  const cols: Col[] = role === "lead" ? ["brief", "reach", "review", "proposal"] : role === "talent" ? ["brief", "reach", "review"] : ["review", "proposal"]

  const counts = useMemo(() => {
    const f = campaign?.funnel
    const all = applicants?.applicants || []
    const reached = (items || []).filter(i => ["sent", "replied", "approved", "sending"].includes(i.status)).length + (plan?.contacts.already_alerted || 0)
    return {
      brief: plan ? plan.contacts.matching : null,
      reach: items || plan ? reached : (f ? f.contacted : null),
      review: applicants ? all.filter(a => !a.review && a.fit !== "screened_out" && ["done", "handover", "human"].includes(a.state)).length : (f ? f.applied : null),
      proposal: applicants ? all.filter(a => a.review === "shortlisted").length : (f ? f.shortlisted : null),
    }
  }, [campaign, applicants, items, plan])
  const subs = {
    brief: "fit in our network",
    reach: `${(plan?.dm.replied ?? campaign?.funnel.chatting ?? 0).toLocaleString()} replied`,
    review: `${(applicants?.applicants.filter(a => ["collecting", "countered"].includes(a.state)).length ?? 0).toLocaleString()} still chatting`,
    proposal: `${(applicants?.applicants.filter(a => a.review === "approved").length ?? campaign?.funnel.in_proposal ?? 0).toLocaleString()} on the proposal`,
  }
  const grid = cols.length === 4 ? "xl:grid-cols-4" : cols.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-2"
  const title = campaign ? campaign.brand || campaign.name : oc?.title || "Campaign"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-2xl font-semibold tracking-tight">{title}</h2>
            {(oc?.status || campaign?.open_call?.status) === "live" && <LiveDot />}
          </div>
          <Link href={`/work/areas/${listId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            {campaign && campaign.brand && campaign.name !== campaign.brand ? campaign.name : "Roster"}<ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {campaign && (
          <p className="text-xs text-muted-foreground">
            {[[campaign.funnel.contacted, "reached"], [campaign.funnel.applied, "applied"], [campaign.funnel.relevant, "relevant"], [campaign.funnel.in_proposal, "on proposal"]]
              .map(([v, l]) => `${Number(v).toLocaleString()} ${l}`).join(" · ")}
          </p>
        )}
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${grid}`}>
        {cols.includes("brief") && (
          <Column col="brief" count={counts.brief} sub={subs.brief}>
            <BoardBrief listId={listId} campaign={campaign} plan={plan} roster={roster} oc={oc} ocLoaded={ocLoaded}
                        canEdit={canEdit} isSuperadmin={isSuperAdmin} onChanged={refresh} />
          </Column>
        )}
        {cols.includes("reach") && (
          <Column col="reach" count={counts.reach} sub={subs.reach}>
            <BoardReach listId={listId} plan={plan} items={items || []} held={held || []} canEdit={canEdit} onOpen={onOpen} onChanged={refresh} />
          </Column>
        )}
        {cols.includes("review") && (
          <Column col="review" count={counts.review} sub={subs.review}>
            <BoardReview ocId={ocId} data={applicants} brand={campaign?.brand} onOpen={onOpen} onChanged={refresh} />
          </Column>
        )}
        {cols.includes("proposal") && (
          <Column col="proposal" count={counts.proposal} sub={subs.proposal}>
            <BoardProposal ocId={ocId} data={applicants} brand={campaign?.brand} onOpen={onOpen} onChanged={refresh} />
          </Column>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Everyone</h3>
        <PeopleTable listId={listId} mode="campaign" onOpen={onOpen} />
      </section>
    </div>
  )
}
