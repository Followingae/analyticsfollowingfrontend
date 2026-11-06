"use client"

/**
 * Which campaign Scout is working: one rounded tile per brand, its logo first, the funnel in
 * one quiet line and a lime count when something there needs a person. The last two tiles are
 * everyone we invite to join Following, and the whole creator network.
 */
import * as React from "react"
import { useState } from "react"
import { motion } from "motion/react"
import { Globe, Users } from "lucide-react"
import type { ScoutCampaign, ScoutCampaignsData } from "@/services/scoutApi"

export type Pick = { kind: "campaign"; id: string } | { kind: "general" } | { kind: "network" }

const n = (x: number) => x.toLocaleString()

function Logo({ src, name, size = 64 }: { src: string | null; name: string; size?: number }) {
  const [bad, setBad] = useState(false)
  const style = { width: size, height: size }
  if (src && !bad) {
    return (
      <span style={style} className="flex shrink-0 items-center justify-center overflow-hidden rounded-[22px] border bg-white p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" onError={() => setBad(true)} className="h-full w-full object-contain" />
      </span>
    )
  }
  const initials = name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?"
  return (
    <span style={style} className="flex shrink-0 items-center justify-center rounded-[22px] border bg-muted text-lg font-semibold tracking-tight">
      {initials}
    </span>
  )
}

function Tile({ on, onClick, children, needs }: { on: boolean; onClick: () => void; children: React.ReactNode; needs?: number }) {
  return (
    <button type="button" onClick={onClick} data-on={on}
            className="group relative flex w-[172px] shrink-0 snap-start flex-col items-center gap-3 rounded-[28px] border bg-background px-4 pb-4 pt-5 text-center transition
                       hover:-translate-y-0.5 hover:shadow-md data-[on=true]:border-foreground data-[on=true]:shadow-lg">
      {needs ? (
        <span className="absolute right-3 top-3 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#d3ff02] px-1.5 text-[11px] font-semibold tabular-nums text-[#111]"
              title="Waiting for a person">{n(needs)}</span>
      ) : null}
      {children}
      {on && <motion.span layoutId="brand-pick" className="absolute inset-x-8 -bottom-px h-1 rounded-full bg-[#d3ff02]" />}
    </button>
  )
}

function funnelLine(c: ScoutCampaign) {
  const f = c.funnel
  const parts: [number, string][] = [[f.contacted, "reached"], [f.relevant, "interested"], [f.in_proposal, "on proposal"]]
  const shown = parts.filter(([v]) => v > 0)
  return shown.length ? shown.map(([v, l]) => `${n(v)} ${l}`).join(" · ") : "Nobody reached yet"
}

export function BrandPicker({ data, pick, onPick }: { data: ScoutCampaignsData; pick: Pick | null; onPick: (p: Pick) => void }) {
  const camps = [...data.campaigns].sort((a, b) => Number(b.open_call?.status === "live") - Number(a.open_call?.status === "live"))
  const g = data.general.funnel
  return (
    <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 pt-1 [scrollbar-width:thin]">
      {camps.map(c => {
        const on = pick?.kind === "campaign" && pick.id === c.list_id
        const live = c.open_call?.status === "live"
        const mode = c.open_call?.comp_mode
        return (
          <Tile key={c.list_id} on={on} onClick={() => onPick({ kind: "campaign", id: c.list_id })} needs={c.to_approve + c.held}>
            <Logo src={c.logo} name={c.brand || c.name} />
            <span className="flex min-w-0 w-full flex-col gap-1">
              <span className="truncate text-sm font-semibold">{c.brand || c.name}</span>
              <span className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                {live ? <><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />Live</> : c.open_call ? "Closed" : "No open call"}
                {mode && <span className="rounded-full bg-muted px-1.5 py-px capitalize">{mode === "both" ? "Paid + product" : mode}</span>}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">{funnelLine(c)}</span>
            </span>
          </Tile>
        )
      })}
      <Tile on={pick?.kind === "general"} onClick={() => onPick({ kind: "general" })}>
        <span className="flex h-16 w-16 items-center justify-center rounded-[22px] border bg-foreground text-background"><Globe className="h-6 w-6" /></span>
        <span className="flex min-w-0 w-full flex-col gap-1">
          <span className="truncate text-sm font-semibold">Join Following</span>
          <span className="text-[11px] text-muted-foreground">General outreach</span>
          <span className="truncate text-[11px] text-muted-foreground">{g.joined_app ? `${n(g.joined_app)} joined` : `${n(g.contacted)} invited`}</span>
        </span>
      </Tile>
      <Tile on={pick?.kind === "network"} onClick={() => onPick({ kind: "network" })}>
        <span className="flex h-16 w-16 items-center justify-center rounded-[22px] border bg-muted"><Users className="h-6 w-6" /></span>
        <span className="flex min-w-0 w-full flex-col gap-1">
          <span className="truncate text-sm font-semibold">Network</span>
          <span className="text-[11px] text-muted-foreground">Every creator we know</span>
          <span className="truncate text-[11px] text-muted-foreground">Search, DM, add</span>
        </span>
      </Tile>
    </div>
  )
}
