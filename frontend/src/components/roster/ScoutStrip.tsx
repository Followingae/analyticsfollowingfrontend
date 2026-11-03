"use client"

/**
 * ScoutOutreach on a roster, in one calm card of three rows:
 *  1. relevant applicants against the goal, and the way into ScoutOutreach;
 *  2. the outreach funnel for this campaign, contacted to in proposal;
 *  3. what Scout is doing for this campaign right now (searches, checks, WhatsApp, DMs).
 * Every number comes from /scout/roster, /scout/campaigns and /scout/activity. Founders start a round.
 */
import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, ChevronRight, Instagram, Loader2, MessageCircle, Radar, RotateCcw, ScanSearch, Target } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Progress, clock } from "@/components/scout/ScoutActivity"
import { scoutApi, type ScoutActivity, type ScoutCampaign } from "@/services/scoutApi"

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

function Funnel({ c }: { c: ScoutCampaign }) {
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

function Countdown({ at }: { at: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  const ms = new Date(at).getTime() - now
  return <span className="tabular-nums">{ms > 0 ? `next DM in ${clock(ms)}` : "next DM any moment"}</span>
}

function LiveLine({ icon, title, phase, right, done, total }: {
  icon: React.ReactNode; title: string; phase?: string | null; right?: string | null; done?: number; total?: number | null
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <span className="shrink-0 text-muted-foreground">{icon}</span>
        <span className="min-w-0 flex-1 truncate font-medium" title={title}>{title}</span>
        {right && <span className="shrink-0 whitespace-nowrap text-right tabular-nums text-muted-foreground">{right}</span>}
      </div>
      {phase && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={phase} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }} title={phase}
                    className="min-w-0 truncate pl-[22px] text-xs text-muted-foreground">{phase}</motion.p>
        </AnimatePresence>
      )}
      {done !== undefined && <Progress done={done} total={total ?? null} />}
    </div>
  )
}

function dmCount(label: string): number | null {
  const m = label.match(/^([\d,]+)/)
  return m ? Number(m[1].replace(/,/g, "")) : null
}

export function ScoutStrip({ listId, canEdit }: { listId: string; canEdit: boolean }) {
  const [busy, setBusy] = useState(false)
  const [tick, setTick] = useState(0)
  const roster = usePoll(useCallback(async () => { void tick; return (await scoutApi.roster(listId)).data }, [listId, tick]), 30000)
  const camps = usePoll(useCallback(async () => (await scoutApi.campaigns()).data, []), 15000)
  const act = usePoll(useCallback(async () => (await scoutApi.activity()).data, []), 5000)

  const start = async () => {
    setBusy(true)
    try {
      const r = await scoutApi.createGoal({ scope: "roster", list_id: listId })
      toast.success(`ScoutOutreach is on it: ${r.data.target} relevant applicants`)
      setTick(t => t + 1)
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  if (!roster) return null

  const g = roster.goal && roster.goal.status !== "done" ? roster.goal : null
  const lastDone = roster.goal && roster.goal.status === "done" ? roster.goal : null
  const camp = camps?.campaigns.find(c => c.list_id === listId) || null
  const relevant = camp?.funnel.relevant ?? roster.funnel.relevant ?? 0
  const target = g?.target || roster.suggested_target || 0
  const pct = target ? Math.min(100, (relevant / target) * 100) : 0

  // Row 3: only what is happening for THIS campaign.
  const a: ScoutActivity | null = act
  const jobs = a ? a.running.filter(j => j.list_id === listId) : []
  const wa = a ? a.whatsapp_sending.filter(w => w.list_id === listId) : []
  const todos = a ? a.todo.filter(t => t.list_id === listId) : []
  const dmTodo = todos.find(t => t.kind === "dm")
  const dmWaiting = dmTodo ? (dmCount(dmTodo.label) ?? camp?.dm_queue ?? 0) : 0
  const otherTodo = todos.find(t => t.kind !== "dm")
  const dmState = a && dmWaiting > 0
    ? !a.dm.online ? "bot offline" : a.dm.paused ? "bot paused" : null
    : null
  const idle = jobs.length === 0 && wa.length === 0
  const hasLive = jobs.length > 0 || wa.length > 0 || dmWaiting > 0 || (idle && !!otherTodo)

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
          {canEdit && !g && (
            <Button size="sm" className="h-8 gap-1.5 rounded-full bg-[#d3ff02] px-3.5 text-xs text-[#111] hover:bg-[#c4ef00]" disabled={busy} onClick={start}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : lastDone ? <RotateCcw className="h-3 w-3" /> : <Target className="h-3 w-3" />}
              {lastDone ? "Run another round" : `Find ${roster.suggested_target ? roster.suggested_target.toLocaleString() + " " : ""}relevant applicants`}
            </Button>
          )}
          <Link href={`/work/scout?tab=campaigns&list=${listId}`}
                className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium underline-offset-2 hover:underline">
            Open in ScoutOutreach<ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {camp && (
        <div className="border-t px-4 py-2.5">
          <Funnel c={camp} />
        </div>
      )}

      {hasLive && (
        <div className="flex min-w-0 flex-col gap-2.5 border-t px-4 py-3">
          <AnimatePresence initial={false}>
            {jobs.map(j => (
              <motion.div key={j.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <LiveLine icon={j.kind === "check" ? <ScanSearch className="h-3.5 w-3.5" /> : <Radar className="h-3.5 w-3.5" />}
                          title={j.label} phase={j.phase} done={j.done} total={j.total}
                          right={j.total ? `${j.done.toLocaleString()} / ${j.total.toLocaleString()}` : null} />
              </motion.div>
            ))}
            {wa.map(w => (
              <motion.div key={`wa-${w.list_id}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <LiveLine icon={<MessageCircle className="h-3.5 w-3.5" />} title="WhatsApp alert" done={w.sent} total={w.total}
                          phase={w.failed ? `${w.failed.toLocaleString()} failed` : null}
                          right={`${w.sent.toLocaleString()} of ${w.total.toLocaleString()} sent`} />
              </motion.div>
            ))}
          </AnimatePresence>
          {dmWaiting > 0 && a && (
            <p className="flex items-center gap-2 text-xs">
              <Instagram className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span><span className="font-medium tabular-nums">{dmWaiting.toLocaleString()}</span> DMs waiting</span>
              {(dmState || a.dm.next_send_at) && <>
                <span className="text-muted-foreground">·</span>
                <span className={dmState ? "text-amber-700" : "text-muted-foreground"}>
                  {dmState || <Countdown at={a.dm.next_send_at!} />}
                </span>
              </>}
            </p>
          )}
          {idle && otherTodo && <p className="min-w-0 break-words text-xs text-muted-foreground [overflow-wrap:anywhere] line-clamp-2">{otherTodo.label}</p>}
        </div>
      )}
    </div>
  )
}
