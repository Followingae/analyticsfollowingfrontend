"use client"

/**
 * ScoutOutreach on a roster, in one line: relevant applicants against the goal, and the way
 * into ScoutOutreach, where all the outreach for this campaign lives. Founders start a round.
 */
import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Loader2, RotateCcw, Target } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { scoutApi } from "@/services/scoutApi"

type Data = Awaited<ReturnType<typeof scoutApi.roster>>["data"]

export function ScoutStrip({ listId, canEdit }: { listId: string; canEdit: boolean }) {
  const [d, setD] = useState<Data | null>(null)
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return
    try { setD((await scoutApi.roster(listId)).data) } catch { /* the card still works without it */ }
  }, [listId])
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [load])

  const start = async () => {
    setBusy(true)
    try {
      const r = await scoutApi.createGoal({ scope: "roster", list_id: listId })
      toast.success(`ScoutOutreach is on it: ${r.data.target} relevant applicants`)
      load()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  if (!d) return null
  const g = d.goal && d.goal.status !== "done" ? d.goal : null
  const lastDone = d.goal && d.goal.status === "done" ? d.goal : null
  const relevant = d.funnel.relevant ?? 0
  const target = g?.target || d.suggested_target || 0
  const pct = target ? Math.min(100, (relevant / target) * 100) : 0

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-background px-4 py-3">
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
        {canEdit && !g && (
          <Button size="sm" className="h-8 gap-1.5 rounded-full bg-[#d3ff02] px-3.5 text-xs text-[#111] hover:bg-[#c4ef00]" disabled={busy} onClick={start}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : lastDone ? <RotateCcw className="h-3 w-3" /> : <Target className="h-3 w-3" />}
            {lastDone ? "Run another round" : `Find ${d.suggested_target ? d.suggested_target.toLocaleString() + " " : ""}relevant applicants`}
          </Button>
        )}
        <Link href={`/work/scout?tab=campaigns&list=${listId}`}
              className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium underline-offset-2 hover:underline">
          Open in ScoutOutreach<ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
