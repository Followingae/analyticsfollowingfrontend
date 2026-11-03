"use client"

/**
 * Every campaign ScoutOutreach is working, one row each: the open call, the goal, the funnel
 * from contacted to in proposal, the channel split and the bot's queue. Click a row and it
 * opens in place into everyone reached for that campaign.
 */
import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { ArrowUpRight, ChevronDown, Instagram, MessageCircle, Send } from "lucide-react"
import type { ScoutCampaign } from "@/services/scoutApi"
import { PeopleTable } from "./PeopleTable"
import { ago } from "./WorkerPill"

const STEPS: [keyof ScoutCampaign["funnel"], string][] = [
  ["contacted", "Contacted"], ["clicked", "Clicked"], ["chatting", "Chatting"], ["applied", "Applied"],
  ["relevant", "Relevant"], ["shortlisted", "Shortlisted"], ["in_proposal", "Proposal"],
]

export function MiniRing({ value, target, size = 44 }: { value: number; target: number; size?: number }) {
  const pct = Math.min(1, target ? value / target : 0)
  const r = (size - 6) / 2, c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={5} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#c8f000" strokeWidth={5} strokeLinecap="round"
                       strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }}
                       transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums">{value}</span>
    </div>
  )
}

export function Funnel({ steps, values }: { steps: [string, string][]; values: Record<string, number> }) {
  const top = Math.max(1, ...steps.map(([k]) => values[k] || 0))
  return (
    <div className="flex items-end gap-1">
      {steps.map(([k, l]) => {
        const n = values[k] || 0
        return (
          <div key={k} className="flex min-w-0 flex-1 flex-col gap-1" title={`${l}: ${n}`}>
            <span className={`text-center text-sm font-semibold tabular-nums ${n ? "" : "text-muted-foreground/60"}`}>{n}</span>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <motion.div className="h-full rounded-full bg-foreground/80" initial={{ width: 0 }}
                          animate={{ width: `${(n / top) * 100}%` }} transition={{ duration: 0.7 }} />
            </div>
            <span className="truncate text-center text-[10px] text-muted-foreground">{l}</span>
          </div>
        )
      })}
    </div>
  )
}

function OpenCallBadge({ status }: { status: string }) {
  const live = status === "live"
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${live ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "text-muted-foreground"}`}>
      {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
      {live ? "Live" : status[0].toUpperCase() + status.slice(1)}
    </span>
  )
}

const COLS = "lg:grid-cols-[minmax(0,1.3fr)_52px_minmax(0,2.4fr)_110px_64px_56px_20px]"

export function CampaignsTable({ campaigns, expanded, onToggle, onOpen }: {
  campaigns: ScoutCampaign[]; expanded: string | null; onToggle: (listId: string | null) => void; onOpen: (username: string) => void
}) {
  if (campaigns.length === 0) return null
  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div className={`hidden gap-5 border-b bg-muted/30 px-5 py-2.5 text-[11px] uppercase tracking-wide text-muted-foreground lg:grid ${COLS}`}>
        <span>Campaign</span><span>Goal</span><span>Funnel</span><span>Channels</span><span className="text-right">Queue</span>
        <span className="text-right">Last</span><span />
      </div>
      {campaigns.map(c => {
        const open = expanded === c.list_id
        return (
          <div key={c.list_id} className={`border-b last:border-0 ${open ? "bg-muted/20" : ""}`}>
            <button type="button" onClick={() => onToggle(open ? null : c.list_id)} aria-expanded={open}
                    className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-3 px-5 py-4 text-left transition-colors hover:bg-muted/30 ${COLS}`}>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{c.brand || c.name}</span>
                <span className="mt-0.5 flex min-w-0 items-center gap-2">
                  {c.brand && c.name !== c.brand && <span className="truncate text-xs text-muted-foreground">{c.name}</span>}
                  {c.open_call && <OpenCallBadge status={c.open_call.status} />}
                </span>
              </span>
              <span className="flex items-center gap-2 lg:block" title={c.goal ? `${c.goal.progress} of ${c.goal.target} relevant applicants, round ${c.goal.round_no}` : undefined}>
                {c.goal && <MiniRing value={c.goal.progress} target={c.goal.target} />}
                {c.goal && <span className="text-xs text-muted-foreground lg:hidden">of {c.goal.target} relevant</span>}
              </span>
              <span className="col-span-2 lg:col-span-1"><Funnel steps={STEPS} values={c.funnel} /></span>
              <span className="flex flex-col gap-1 text-xs">
                <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="tabular-nums">{c.funnel.whatsapp}</span><span className="text-muted-foreground">WhatsApp</span></span>
                <span className="inline-flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="tabular-nums">{c.funnel.instagram}</span><span className="text-muted-foreground">Instagram</span></span>
              </span>
              <span className="inline-flex items-center gap-1 text-sm tabular-nums lg:justify-end" title="DMs waiting for the bot">
                {c.dm_queue > 0 && <><Send className="h-3.5 w-3.5 text-muted-foreground" />{c.dm_queue}</>}
              </span>
              <span className="text-right text-xs text-muted-foreground tabular-nums">{c.last_activity ? ago(c.last_activity) : ""}</span>
              <ChevronDown className={`hidden h-4 w-4 text-muted-foreground transition-transform lg:block ${open ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                  <div className="flex flex-col gap-3 px-5 pb-5">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {c.goal && <span>Round {c.goal.round_no}: {c.goal.progress} of {c.goal.target} relevant applicants{c.need ? `, brief needs ${c.need}` : ""}</span>}
                      <Link href={`/work/areas/${c.list_id}`} className="ml-auto inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline">
                        Open roster<ArrowUpRight className="h-3.5 w-3.5" /></Link>
                    </div>
                    <PeopleTable listId={c.list_id} mode="campaign" onOpen={onOpen} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
