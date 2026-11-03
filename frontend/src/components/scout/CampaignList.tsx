"use client"

/**
 * Every campaign ScoutOutreach is working, one row each: one big number (relevant applicants
 * against the goal) and one quiet line. General outreach is the last row.
 */
import * as React from "react"
import { motion } from "motion/react"
import { ChevronRight, Globe } from "lucide-react"
import type { ScoutCampaign, ScoutCampaignsData } from "@/services/scoutApi"

const n = (x: number) => x.toLocaleString()
const line = (parts: [number, string][]) => parts.filter(([v]) => v > 0).map(([v, l]) => `${n(v)} ${l}`).join(" · ")

export function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />Live
    </span>
  )
}

export function Bar({ value, target, className = "" }: { value: number; target: number; className?: string }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0
  return (
    <div className={`h-1 overflow-hidden rounded-full bg-muted ${className}`}>
      <motion.div className="h-full rounded-full bg-[#c8f000]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
    </div>
  )
}

function Row({ title, sub, icon, live, big, of, unit, onClick }: {
  title: string; sub: string; icon?: React.ReactNode; live?: boolean; big: number; of?: number | null; unit: string; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick}
            className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 border-b px-5 py-4 text-left transition-colors last:border-0 hover:bg-muted/30 md:grid-cols-[minmax(0,1fr)_240px_16px]">
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          {icon}
          <span className="truncate font-semibold">{title}</span>
          {live && <LiveDot />}
        </span>
        {sub && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{sub}</span>}
      </span>
      <span className="flex flex-col items-end gap-1.5">
        <span className="whitespace-nowrap">
          <span className="text-2xl font-semibold tabular-nums">{n(big)}</span>
          {of ? <span className="text-lg tabular-nums text-muted-foreground"> / {n(of)}</span> : null}
          <span className="ml-1.5 text-xs text-muted-foreground">{unit}</span>
        </span>
        {of ? <Bar value={big} target={of} className="w-full md:w-[240px]" /> : null}
      </span>
      <ChevronRight className="hidden h-4 w-4 text-muted-foreground md:block" />
    </button>
  )
}

function campaignSub(c: ScoutCampaign) {
  const f = c.funnel
  return [c.brand && c.name !== c.brand ? c.name : "", line([[f.contacted, "contacted"], [f.chatting, "chatting"], [f.applied, "applied"]])]
    .filter(Boolean).join(" · ")
}

export function CampaignList({ data, onPick }: { data: ScoutCampaignsData; onPick: (listId: string) => void }) {
  const g = data.general.funnel
  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      {data.campaigns.map(c => (
        <Row key={c.list_id} title={c.brand || c.name} sub={campaignSub(c)} live={c.open_call?.status === "live"}
             big={c.funnel.relevant} of={c.goal?.target} unit="relevant" onClick={() => onPick(c.list_id)} />
      ))}
      <Row title="General outreach" icon={<Globe className="h-4 w-4 text-muted-foreground" />}
           sub={["Invite creators to join Following", line([[g.contacted, "contacted"], [g.clicked, "clicked"], [g.in_database, "in database"]])].filter(Boolean).join(" · ")}
           big={g.joined_app} unit="joined" onClick={() => onPick("general")} />
    </div>
  )
}
