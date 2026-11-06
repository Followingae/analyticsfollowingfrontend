"use client"

/**
 * ScoutOutreach's tab on a roster: the funnel for this campaign in numbers, and the way into
 * Scout, where all the work happens (criteria, reach, review, proposal). Nothing is decided
 * here; the roster stays the talent sheet.
 */
import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, ChevronRight, Target } from "lucide-react"
import { scoutApi, type ScoutCampaign } from "@/services/scoutApi"

const visible = () => typeof document === "undefined" || !document.hidden

/** Poll while the tab is visible. */
function usePoll<T>(fn: () => Promise<T | null>, ms: number): T | null {
  const [v, setV] = useState<T | null>(null)
  const run = useCallback(async () => {
    if (!visible()) return
    try { const r = await fn(); if (r !== null) setV(r) } catch { /* the card still works without it */ }
  }, [fn])
  useEffect(() => { run(); const t = setInterval(run, ms); return () => clearInterval(t) }, [run, ms])
  return v
}

const STEPS: [keyof ScoutCampaign["funnel"], string][] = [
  ["contacted", "Contacted"], ["clicked", "Clicked"], ["chatting", "Chatting"], ["applied", "Applied"],
  ["relevant", "Relevant"], ["shortlisted", "Shortlisted"], ["in_proposal", "In proposal"],
]

export function Funnel({ c }: { c: ScoutCampaign }) {
  const f = c.funnel
  return (
    <div className="-mx-1 flex items-start gap-1 overflow-x-auto px-1 pb-0.5">
      {STEPS.map(([k, l], i) => (
        <React.Fragment key={k}>
          {i > 0 && <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
          <div className="shrink-0 px-1">
            <p className={`text-sm font-semibold tabular-nums ${f[k] ? "" : "text-muted-foreground/60"}`}>{(f[k] || 0).toLocaleString()}</p>
            <p className="whitespace-nowrap text-[11px] text-muted-foreground">{l}</p>
            {k === "contacted" && (f.whatsapp > 0 || f.instagram > 0) && (
              <p className="whitespace-nowrap text-[10px] tabular-nums text-muted-foreground/80">
                WhatsApp {f.whatsapp.toLocaleString()} · Instagram {f.instagram.toLocaleString()}
              </p>
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

export function ScoutStrip({ listId }: { listId: string }) {
  const roster = usePoll(useCallback(async () => (await scoutApi.roster(listId)).data, [listId]), 30000)
  const camps = usePoll(useCallback(async () => (await scoutApi.campaigns()).data, []), 15000)
  const camp = camps?.campaigns.find(c => c.list_id === listId) || null
  if (!roster && !camp) return null

  const g = roster?.goal && roster.goal.status !== "done" ? roster.goal : null
  const relevant = camp?.funnel.relevant ?? roster?.funnel.relevant ?? 0
  const target = g?.target || 0
  const pct = target ? Math.min(100, (relevant / target) * 100) : 0
  const needs = (camp?.to_approve || 0) + (camp?.held || 0)

  return (
    <div className="flex min-w-0 flex-col rounded-xl border bg-background">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold"><Target className="h-4 w-4" />ScoutOutreach</span>
        <span className="text-sm text-muted-foreground">
          <span className="text-lg font-semibold tabular-nums text-foreground">{relevant.toLocaleString()}</span>
          {target ? ` of ${target.toLocaleString()}` : ""} relevant applicants
        </span>
        {target > 0 && (
          <div className="h-1.5 min-w-[80px] flex-1 overflow-hidden rounded-full bg-muted">
            <motion.div className="h-full rounded-full bg-[#c8f000]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">
          {needs > 0 && (
            <span className="rounded-full bg-[#d3ff02] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#111]">{needs} waiting for you</span>
          )}
          <Link href={`/work/scout?list=${listId}`}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-foreground px-3.5 py-1.5 text-sm font-medium text-background hover:opacity-90">
            Open in ScoutOutreach<ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      {camp && (
        <div className="border-t px-4 py-2.5">
          <Funnel c={camp} />
        </div>
      )}
    </div>
  )
}
