"use client"

/**
 * Scout is working: every job running right now (searches, fit checks), WhatsApp alerts going
 * out, the DM bot with a countdown to its next message, what is next, and what just finished.
 * Every number comes from GET /scout/activity; nothing here is estimated.
 */
import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { AlertTriangle, ArrowRight, Check, Instagram, MessageCircle, Radar, ScanSearch, X } from "lucide-react"
import { scoutApi, type ScoutActivity as Activity } from "@/services/scoutApi"
import { ago } from "./WorkerPill"

function Progress({ done, total }: { done: number; total: number | null }) {
  if (!total) {
    return (
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div className="absolute inset-y-0 w-1/3 rounded-full bg-[#d3ff02]"
                    animate={{ left: ["-33%", "100%"] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
      </div>
    )
  }
  const pct = Math.min(100, (done / total) * 100)
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <motion.div className="h-full rounded-full bg-[#c8f000]" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
    </div>
  )
}

function Row({ icon, title, sub, right, phase, children }: {
  icon: React.ReactNode; title: string; sub?: string | null; right?: React.ReactNode; phase?: string | null; children?: React.ReactNode
}) {
  return (
    <motion.div layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <p className="min-w-0 truncate text-sm font-medium">{title}{sub && <span className="font-normal text-muted-foreground"> · {sub}</span>}</p>
          {right && <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">{right}</span>}
        </div>
        {phase && (
          <div className="h-4 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={phase} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }} className="truncate text-xs text-muted-foreground">{phase}</motion.p>
            </AnimatePresence>
          </div>
        )}
        {children}
      </div>
    </motion.div>
  )
}

function clock(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`
}

function DmRow({ dm }: { dm: Activity["dm"] }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  const warning = typeof dm.warning === "string" ? dm.warning
    : dm.warning ? (dm.warning.text || `Instagram warning: ${(dm.warning.kind || "").replace(/_/g, " ")}`) : null
  const next = dm.next_send_at ? new Date(dm.next_send_at).getTime() - now : null
  const status = !dm.online ? "Bot offline" : dm.paused ? "Paused"
    : next != null ? (next > 0 ? `Next DM in ${clock(next)}` : "Next DM any moment") : dm.state ? dm.state.replace(/_/g, " ") : null
  return (
    <Row icon={<Instagram className="h-4 w-4" />} title="Instagram DMs" sub={dm.queue ? `${dm.queue.toLocaleString()} queued` : null}
         right={`${dm.sent_today.toLocaleString()} of ${dm.cap_today.toLocaleString()} today`}>
      {dm.cap_today > 0 && <Progress done={dm.sent_today} total={dm.cap_today} />}
      {status && <p className={`text-xs tabular-nums ${!dm.online ? "text-muted-foreground" : dm.paused ? "text-amber-700" : "text-foreground"}`}>{status}</p>}
      {warning && <p className="flex items-start gap-1.5 text-xs text-red-700"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{warning}</p>}
    </Row>
  )
}

export function ScoutActivity({ onOpenList }: { onOpenList: (listId: string) => void }) {
  const [a, setA] = useState<Activity | null>(null)
  const load = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return
    try { setA((await scoutApi.activity()).data) } catch { /* next tick */ }
  }, [])
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t) }, [load])
  if (!a) return null

  const dmWarning = !!a.dm.warning
  const dmBusy = a.dm.online && !a.dm.paused && a.dm.queue > 0
  const working = a.running.length > 0 || a.whatsapp_sending.length > 0 || dmBusy
  const todo = [...a.todo].sort((x, y) => (x.kind === "attention" ? 0 : 1) - (y.kind === "attention" ? 0 : 1))
  const recent = a.recent.slice(0, 3)
  const showNow = working || dmWarning

  return (
    <section className="flex flex-col gap-5 rounded-2xl border bg-background p-5">
      <div className="flex items-center gap-2.5">
        {working ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c8f000] opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#9bd400]" />
          </span>
        ) : <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />}
        <p className="font-semibold">{working ? "Scout is working" : "Idle"}</p>
      </div>

      <div className={`grid gap-6 ${showNow && (todo.length || recent.length) ? "lg:grid-cols-[1.3fr_1fr]" : ""}`}>
        {showNow && (
          <div className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {a.running.map(j => (
                <Row key={j.id} icon={j.kind === "check" ? <ScanSearch className="h-4 w-4" /> : <Radar className="h-4 w-4" />}
                     title={j.label} sub={j.list_name} phase={j.phase}
                     right={j.total ? `${j.done.toLocaleString()} / ${j.total.toLocaleString()}` : j.done ? j.done.toLocaleString() : `${ago(j.started_at)}`}>
                  <Progress done={j.done} total={j.total} />
                </Row>
              ))}
              {a.whatsapp_sending.map(w => (
                <Row key={`wa-${w.list_id}`} icon={<MessageCircle className="h-4 w-4" />} title="WhatsApp alert" sub={w.list_name}
                     right={`${w.sent.toLocaleString()} of ${w.total.toLocaleString()} sent`}
                     phase={[w.waiting ? `${w.waiting.toLocaleString()} waiting` : "", w.failed ? `${w.failed.toLocaleString()} failed` : ""].filter(Boolean).join(" · ") || null}>
                  <Progress done={w.sent} total={w.total} />
                </Row>
              ))}
            </AnimatePresence>
            {(dmBusy || dmWarning || a.dm.sent_today > 0) && <DmRow dm={a.dm} />}
          </div>
        )}

        {(todo.length > 0 || recent.length > 0) && (
          <div className="flex flex-col gap-5">
            {todo.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next up</p>
                {todo.map((t, i) => {
                  const attention = t.kind === "attention"
                  const body = (
                    <>
                      {attention ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        : t.kind === "dm" ? <Instagram className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        : <Radar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                      <span className="min-w-0 flex-1 truncate">{t.label}</span>
                      {t.list_id && <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-50" />}
                    </>
                  )
                  const cls = `flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm ${attention ? "bg-amber-50 text-amber-900" : ""}`
                  return t.list_id
                    ? <button key={i} type="button" onClick={() => onOpenList(t.list_id!)} className={`${cls} transition-colors hover:bg-muted/50`}>{body}</button>
                    : <div key={i} className={cls}>{body}</div>
                })}
              </div>
            )}
            {recent.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Just finished</p>
                {recent.map(r => (
                  <div key={r.id} className="flex gap-2.5 text-sm">
                    {r.status === "failed" ? <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" /> : <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{r.label}{r.list_name && <span className="text-muted-foreground"> · {r.list_name}</span>}</p>
                      {r.note && <p className="truncate text-xs text-muted-foreground">{r.note}</p>}
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {r.cost_usd != null ? `$${Number(r.cost_usd).toFixed(2)} · ` : ""}{ago(r.finished_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
