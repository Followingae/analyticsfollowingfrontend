"use client"

/**
 * ScoutOutreach on a roster: the goal in RELEVANT applicants (4x what the brief needs), the
 * funnel from found to relevant, and its latest steps, live. Founders start it and run
 * another round when a round is done. Below: the two outreach lanes (network on WhatsApp,
 * new creators by Instagram DM).
 */
import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Loader2, RotateCcw, Target } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { scoutApi } from "@/services/scoutApi"
import { ScoutOutreachLanes } from "./ScoutOutreachLanes"

type Data = Awaited<ReturnType<typeof scoutApi.roster>>["data"]

export function ScoutStrip({ listId, canEdit }: { listId: string; canEdit: boolean }) {
  const [d, setD] = useState<Data | null>(null)
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    try { setD((await scoutApi.roster(listId)).data) } catch { /* the card still works without it */ }
  }, [listId])
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t) }, [load])

  const start = async () => {
    setBusy(true)
    try {
      const r = await scoutApi.createGoal({ scope: "roster", list_id: listId })
      toast.success(`ScoutOutreach is on it: ${r.data.target} relevant applicants (round ${r.data.round})`)
      load()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  if (!d) return null
  const g = d.goal && d.goal.status !== "done" ? d.goal : null
  const lastDone = d.goal && d.goal.status === "done" ? d.goal : null
  const relevant = d.funnel.relevant ?? 0
  const target = g?.target || d.suggested_target || 0
  const pct = target ? Math.min(100, (relevant / target) * 100) : 0
  const steps: [string, number | undefined][] = [["Found", d.funnel.found], ["Light analysed", d.funnel.light],
    ["Contacted", d.funnel.contacted], ["Replied", d.funnel.replied], ["Applied", d.funnel.applied], ["Relevant", relevant]]

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold"><Target className="h-4 w-4" />ScoutOutreach</span>
        {g ? <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
               <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#9bd400]" />Round {g.round_no} {g.status === "paused" ? "paused" : "running"}</span>
           : lastDone ? <span className="text-xs text-emerald-600">Round {lastDone.round_no} done: {lastDone.progress} relevant applicants</span>
           : <span className="text-xs text-muted-foreground">Not started</span>}
        <div className="ml-auto flex gap-2">
          <Link href="/work/scout" className="text-xs underline-offset-2 hover:underline">Open ScoutOutreach</Link>
          {canEdit && !g && (
            <Button size="sm" className="h-7 gap-1.5 rounded-full bg-[#d3ff02] px-3 text-xs text-[#111] hover:bg-[#c4ef00]" disabled={busy} onClick={start}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : lastDone ? <RotateCcw className="h-3 w-3" /> : <Target className="h-3 w-3" />}
              {lastDone ? "Run another round" : `Find ${d.suggested_target ? d.suggested_target + " " : ""}relevant applicants`}
            </Button>
          )}
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between text-sm">
          <span><span className="text-2xl font-semibold tabular-nums">{relevant}</span>
            <span className="text-muted-foreground"> of {target || "?"} relevant applicants</span></span>
          {d.need ? <span className="text-xs text-muted-foreground">brief needs {d.need}, aiming for 4x</span> : null}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full rounded-full bg-[#c8f000]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {steps.map(([l, n]) => (
          <div key={l} className="rounded-lg bg-muted/50 px-2 py-1.5 text-center">
            <p className="text-sm font-semibold tabular-nums">{n ?? 0}</p><p className="text-[11px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      {d.events.length > 0 && (
        <div className="flex flex-col gap-1">
          {d.events.slice(0, 3).map(e => (
            <p key={e.id} className="truncate text-xs text-muted-foreground">
              {e.username ? `@${e.username}: ` : ""}{e.kind.replace(/_/g, " ")}{e.detail?.text ? ` · ${e.detail.text}` : ""}
            </p>
          ))}
        </div>
      )}
      <ScoutOutreachLanes listId={listId} canEdit={canEdit} />
    </div>
  )
}
