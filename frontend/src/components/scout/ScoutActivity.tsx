"use client"

/**
 * Scout is working, shown, not told: the ScoutAI avatar, a radial meter of today's DMs with a
 * countdown ring to the next one, a step track per running job (the current step glows and fills
 * with real done/total), and WhatsApp sends as fill bars. Hover for detail; Details opens the full
 * picture. Every number comes from GET /scout/activity; nothing here is estimated.
 */
import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { AlertTriangle, ArrowRight, Check, ChevronDown, Instagram, MessageCircle, Radar, RotateCcw, ScanSearch, X } from "lucide-react"
import { ScoutAvatar } from "@/components/roster/ScoutAvatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { scoutApi, type ScoutActivity as Activity } from "@/services/scoutApi"
import { ago } from "./WorkerPill"

type Job = Activity["running"][number]
type Wa = Activity["whatsapp_sending"][number]
type Recent = Activity["recent"][number]

const LIME = "#c8f000"
const wrap = "min-w-0 break-words [overflow-wrap:anywhere]"
const fmt = (n: number) => n.toLocaleString()

/* ------------------------------------------------------------------ shared bits */

export function Progress({ done, total }: { done: number; total: number | null }) {
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

export function clock(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`
}

/** The campaign name, unless the label already says it. */
export function subUnlessIn(label: string, sub: string | null | undefined) {
  if (!sub) return null
  return label.toLowerCase().includes(sub.toLowerCase()) ? null : sub
}

/** Time left until `at`, and how much of the wait is left (measured from when this `at` was first seen). */
function useCountdown(at: string | null) {
  const [now, setNow] = useState(() => Date.now())
  const base = useRef<{ at: string; ms: number } | null>(null)
  useEffect(() => {
    if (!at) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [at])
  if (!at) return null
  const ms = new Date(at).getTime() - now
  if (!base.current || base.current.at !== at) base.current = { at, ms: Math.max(ms, 1000) }
  return { ms, frac: Math.max(0, Math.min(1, ms / base.current.ms)) }
}

export function CountdownRing({ at, size = 22, label = true }: { at: string; size?: number; label?: boolean }) {
  const cd = useCountdown(at)
  if (!cd) return null
  const r = (size - 4) / 2, c = 2 * Math.PI * r
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90 shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={3} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={LIME} strokeWidth={3} strokeLinecap="round"
                       strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - cd.frac) }} transition={{ duration: 0.9, ease: "linear" }} />
      </svg>
      {label && <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{cd.ms > 0 ? clock(cd.ms) : "now"}</span>}
    </span>
  )
}

/* ------------------------------------------------------------------ job step track */

const SEARCH_STEPS = ["Plan", "Search", "Check", "Match", "Queue"]
const CHECK_STEPS = ["Profiles", "AI read", "Photos"]

/** Which step a job is on, read from the phase text the backend reports. -1 = unknown. */
export function jobSteps(j: Job): { steps: string[]; at: number } {
  const p = (j.phase || "").toLowerCase()
  const checking = p.includes("instagram profiles") ? 0 : p.includes("ai reading") ? 1 : p.includes("photo") ? 2 : -1
  if (j.kind === "check") return { steps: CHECK_STEPS, at: checking }
  const at = p.startsWith("choosing") ? 0
    : p.startsWith("searching") || p.startsWith("reading who posts") || p.startsWith("reading recent posts") ? 1
    : checking >= 0 ? 2
    : p.startsWith("matching") ? 3 : -1
  return { steps: SEARCH_STEPS, at }
}

function Glow({ children, on }: { children: React.ReactNode; on: boolean }) {
  if (!on) return <>{children}</>
  return (
    <motion.div className="rounded-full" animate={{ boxShadow: ["0 0 0 0 rgba(200,240,0,0)", "0 0 10px 1px rgba(200,240,0,0.6)", "0 0 0 0 rgba(200,240,0,0)"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
      {children}
    </motion.div>
  )
}

export function JobTrack({ j, compact = false }: { j: Job; compact?: boolean }) {
  const { steps, at } = jobSteps(j)
  const frac = j.total ? Math.min(1, j.done / j.total) : null
  const s = subUnlessIn(j.label, j.list_name)
  const Icon = j.kind === "check" ? ScanSearch : Radar
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="-mx-2 flex min-w-0 cursor-default flex-col gap-1.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted/50">
          <div className="flex min-w-0 items-center gap-2">
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className={`min-w-0 flex-1 truncate font-medium ${compact ? "text-xs" : "text-sm"}`}>{j.label}</span>
            {j.total ? <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{fmt(j.done)}/{fmt(j.total)}</span> : null}
          </div>
          {at < 0 ? <Progress done={j.done} total={j.total} /> : (
            <div className="flex gap-1">
              {steps.map((st, i) => (
                <div key={st} className="flex min-w-0 flex-1 flex-col gap-1">
                  <Glow on={i === at}>
                    <div className={`relative overflow-hidden rounded-full ${compact ? "h-1" : "h-1.5"} ${i < at ? "bg-[#c8f000]" : "bg-muted"}`}>
                      {i === at && (frac != null
                        ? <motion.div className="absolute inset-y-0 left-0 rounded-full bg-[#c8f000]" initial={false}
                                      animate={{ width: `${Math.max(8, frac * 100)}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
                        : <motion.div className="absolute inset-y-0 w-1/2 rounded-full bg-[#c8f000]"
                                      animate={{ left: ["-50%", "100%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} />)}
                    </div>
                  </Glow>
                  {!compact && (
                    <span className={`truncate text-[10px] ${i === at ? "font-medium text-foreground" : i < at ? "text-muted-foreground" : "text-muted-foreground/60"}`}>{st}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="font-medium">{j.label}{s ? ` · ${s}` : ""}</p>
        {j.phase && <p className="opacity-80">{j.phase}</p>}
        <p className="opacity-80">
          {j.total ? `${fmt(j.done)} of ${fmt(j.total)} · ` : j.done ? `${fmt(j.done)} so far · ` : ""}started {ago(j.started_at)} ago
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

/* ------------------------------------------------------------------ WhatsApp fill bar */

export function WaTrack({ w, compact = false }: { w: Wa; compact?: boolean }) {
  const total = Math.max(1, w.total)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="-mx-2 flex min-w-0 cursor-default flex-col gap-1.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted/50">
          <div className="flex min-w-0 items-center gap-2">
            <MessageCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className={`min-w-0 flex-1 truncate font-medium ${compact ? "text-xs" : "text-sm"}`}>
              WhatsApp{!compact && w.list_name ? <span className="font-normal text-muted-foreground"> · {w.list_name}</span> : null}
            </span>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{fmt(w.sent)}/{fmt(w.total)}</span>
          </div>
          <div className={`flex overflow-hidden rounded-full bg-muted ${compact ? "h-1" : "h-1.5"}`}>
            <motion.div className="h-full bg-[#c8f000]" initial={false} animate={{ width: `${(w.sent / total) * 100}%` }} transition={{ duration: 0.6 }} />
            {w.failed > 0 && <motion.div className="h-full bg-red-400" initial={false} animate={{ width: `${(w.failed / total) * 100}%` }} transition={{ duration: 0.6 }} />}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="font-medium">WhatsApp alert{w.list_name ? ` · ${w.list_name}` : ""}</p>
        <p className="opacity-80">{fmt(w.sent)} of {fmt(w.total)} sent · {fmt(w.waiting)} waiting{w.failed ? ` · ${fmt(w.failed)} failed` : ""}</p>
      </TooltipContent>
    </Tooltip>
  )
}

/* ------------------------------------------------------------------ DM meter */

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  const [x0, y0] = p(a0), [x1, y1] = p(a1)
  return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}`
}

function dmWarningText(dm: Activity["dm"]) {
  return typeof dm.warning === "string" ? dm.warning
    : dm.warning ? (dm.warning.text || `Instagram warning: ${(dm.warning.kind || "").replace(/_/g, " ")}`) : null
}

function DmMeter({ dm, size = 132 }: { dm: Activity["dm"]; size?: number }) {
  const cap = Math.max(0, dm.cap_today)
  const n = cap ? Math.min(cap, 48) : 24
  const per = cap ? cap / n : 1
  const filled = cap ? Math.min(n, Math.floor(dm.sent_today / per)) : 0
  const gap = n > 30 ? 0.035 : 0.06
  const r = size / 2 - 8, cx = size / 2, cy = size / 2
  const start = -Math.PI / 2
  const warning = dmWarningText(dm)
  const state = !dm.online ? "Bot offline" : dm.paused ? "Paused" : null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div whileHover={{ scale: 1.03 }} className="relative shrink-0 cursor-default self-center" style={{ width: size, height: size }}>
          <svg width={size} height={size}>
            {Array.from({ length: n }).map((_, i) => {
              const a0 = start + (i / n) * 2 * Math.PI + gap / 2
              const a1 = start + ((i + 1) / n) * 2 * Math.PI - gap / 2
              const on = i < filled
              return (
                <motion.path key={i} d={arc(cx, cy, r, a0, a1)} fill="none" strokeWidth={9} strokeLinecap="butt"
                             stroke={on ? LIME : "currentColor"} initial={{ strokeOpacity: on ? 0 : 0.08 }}
                             animate={{ strokeOpacity: on ? 1 : 0.08 }} transition={{ delay: on ? i * 0.015 : 0, duration: 0.35 }} />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold leading-none tabular-nums">{fmt(dm.sent_today)}</span>
            <span className="mt-1 text-[11px] tabular-nums text-muted-foreground">{cap ? `of ${fmt(cap)}` : "DMs"}</span>
            <span className="mt-1.5 flex h-4 items-center">
              {state ? <span className={`text-[10px] ${dm.paused ? "text-amber-700" : "text-muted-foreground"}`}>{state}</span>
                : dm.next_send_at ? <CountdownRing at={dm.next_send_at} size={14} /> : null}
            </span>
          </div>
          {warning && <span className="absolute right-2 top-2 h-3 w-3 rounded-full border-2 border-background bg-red-500" />}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="font-medium">{fmt(dm.sent_today)} of {fmt(cap)} DMs today</p>
        <p className="opacity-80">{fmt(dm.queue)} queued{state ? ` · ${state}` : dm.state ? ` · ${dm.state.replace(/_/g, " ")}` : ""}</p>
        {dm.next_send_at && !state && <p className="opacity-80">Next DM {new Date(dm.next_send_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</p>}
        {warning && <p className="text-red-300">{warning}</p>}
      </TooltipContent>
    </Tooltip>
  )
}

/* ------------------------------------------------------------------ details */

const RESTARTED = "Stopped (the server restarted)"

function groupRecent(rs: Recent[]): { r: Recent; n: number }[] {
  const out: { r: Recent; n: number }[] = []
  for (const r of rs) {
    const last = out[out.length - 1]
    if (last && last.r.label === r.label && last.r.status === r.status && (last.r.note || "") === (r.note || "")) last.n++
    else out.push({ r, n: 1 })
  }
  return out
}

function Heading({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{children}</p>
}

function Details({ a, onOpenList }: { a: Activity; onOpenList: (id: string) => void }) {
  const dmTodos = a.todo.filter(t => t.kind === "dm")
  const todo = a.todo.filter(t => t.kind !== "dm").sort((x, y) => (x.kind === "attention" ? 0 : 1) - (y.kind === "attention" ? 0 : 1))
  const recent = groupRecent(a.recent).slice(0, 5)
  const warning = dmWarningText(a.dm)
  const item = (key: React.Key, body: React.ReactNode, listId?: string | null, tone = "") => listId
    ? <button key={key} type="button" onClick={() => onOpenList(listId)}
              className={`flex w-full min-w-0 items-start gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted/60 ${tone}`}>{body}
        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-40" /></button>
    : <div key={key} className={`flex min-w-0 items-start gap-2 rounded-lg px-2.5 py-1.5 text-sm ${tone}`}>{body}</div>

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 border-t pt-5 md:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-5">
        {(a.running.length > 0 || a.whatsapp_sending.length > 0) && (
          <div className="flex min-w-0 flex-col gap-2.5">
            <Heading>Running</Heading>
            {a.running.map(j => {
              const s = subUnlessIn(j.label, j.list_name)
              return (
                <div key={j.id} className="min-w-0 rounded-xl bg-muted/40 px-3 py-2.5">
                  <p className={`${wrap} text-sm font-medium`}>{j.label}{s && <span className="font-normal text-muted-foreground"> · {s}</span>}</p>
                  {j.phase && <p className={`${wrap} mt-0.5 text-xs text-muted-foreground`}>{j.phase}</p>}
                  <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                    {j.total ? `${fmt(j.done)} of ${fmt(j.total)} · ` : j.done ? `${fmt(j.done)} so far · ` : ""}started {ago(j.started_at)} ago
                  </p>
                </div>
              )
            })}
            {a.whatsapp_sending.map(w => (
              <div key={`wa-${w.list_id}`} className="min-w-0 rounded-xl bg-muted/40 px-3 py-2.5">
                <p className={`${wrap} text-sm font-medium`}>WhatsApp alert{w.list_name && <span className="font-normal text-muted-foreground"> · {w.list_name}</span>}</p>
                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                  {fmt(w.sent)} of {fmt(w.total)} sent · {fmt(w.waiting)} waiting{w.failed ? ` · ${fmt(w.failed)} failed` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
        {(dmTodos.length > 0 || warning) && (
          <div className="flex min-w-0 flex-col gap-1">
            <Heading>Instagram DMs</Heading>
            {warning && item("w", <><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className={`${wrap} flex-1`}>{warning}</span></>, null, "bg-red-50 text-red-800")}
            {dmTodos.map((t, i) => item(i, <><Instagram className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" /><span className={`${wrap} flex-1`}>{t.label}</span></>, t.list_id))}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-5">
        {todo.length > 0 && (
          <div className="flex min-w-0 flex-col gap-1">
            <Heading>Next up</Heading>
            {todo.map((t, i) => {
              const attention = t.kind === "attention"
              return item(i, <>{attention ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Radar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                <span className={`${wrap} flex-1`}>{t.label}</span></>, t.list_id, attention ? "bg-amber-50 text-amber-900" : "")
            })}
          </div>
        )}
        {recent.length > 0 && (
          <div className="flex min-w-0 flex-col gap-2.5">
            <Heading>Just finished</Heading>
            {recent.map(({ r, n }) => {
              const restarted = r.status === "failed" && (r.note || "").startsWith(RESTARTED)
              const s = subUnlessIn(r.label, r.list_name)
              return (
                <div key={r.id} className="grid min-w-0 grid-cols-[14px_minmax(0,1fr)_auto_2.75rem] items-start gap-x-2.5 text-sm">
                  {r.status !== "failed" ? <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                    : restarted ? <RotateCcw className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    : <X className="mt-0.5 h-3.5 w-3.5 text-red-600" />}
                  <div className="min-w-0">
                    <p className={`${wrap} line-clamp-2 ${restarted ? "text-muted-foreground" : ""}`}>
                      {r.label}{s && <span className="text-muted-foreground"> · {s}</span>}
                      {n > 1 && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">×{n}</span>}
                    </p>
                    {r.note && <p className={`${wrap} line-clamp-2 text-xs text-muted-foreground`}>{r.note}</p>}
                  </div>
                  <span className="whitespace-nowrap text-right text-xs tabular-nums text-muted-foreground">
                    {r.cost_usd != null && Number(r.cost_usd) > 0 ? `$${Number(r.cost_usd).toFixed(2)}` : ""}
                  </span>
                  <span className="text-right text-xs tabular-nums text-muted-foreground">{ago(r.finished_at)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ the bar */

const OPEN_KEY = "scout.activity.details"

function AvatarHalo({ working, size }: { working: boolean; size: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {working && (
        <>
          <motion.span className="absolute inset-0 rounded-full bg-[#d3ff02]" animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0, 0.35] }}
                       transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
          <motion.span className="absolute -inset-1.5" animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
            <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-[#9bd400]" />
          </motion.span>
        </>
      )}
      <div className="relative">
        <ScoutAvatar size={size} state={working ? "working" : "default"} />
      </div>
    </div>
  )
}

export function ScoutActivity({ onOpenList }: { onOpenList: (listId: string) => void }) {
  const [a, setA] = useState<Activity | null>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => { try { setOpen(localStorage.getItem(OPEN_KEY) === "1") } catch { /* storage blocked */ } }, [])
  const toggle = () => setOpen(o => {
    try { localStorage.setItem(OPEN_KEY, o ? "0" : "1") } catch { /* storage blocked */ }
    return !o
  })
  const load = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return
    try { setA((await scoutApi.activity()).data) } catch { /* next tick */ }
  }, [])
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t) }, [load])
  if (!a) return null

  const dmBusy = a.dm.online && !a.dm.paused && a.dm.queue > 0
  const working = a.running.length > 0 || a.whatsapp_sending.length > 0 || dmBusy
  const search = a.running.find(j => j.kind === "search")
  const status = search ? `Searching${search.list_name ? ` for ${search.list_name}` : ""}`
    : a.running.length ? "Checking creators"
    : a.whatsapp_sending.length ? "Sending WhatsApp alerts"
    : dmBusy ? "Sending DMs"
    : a.dm.warning ? "Needs attention"
    : "Idle"
  const attention = a.todo.find(t => t.kind === "attention")

  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-3xl border bg-background p-4 sm:p-6">
      <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-center md:gap-8">
        <div className="flex min-w-0 items-center gap-4 md:w-64 md:shrink-0">
          <AvatarHalo working={working} size={84} />
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={status} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className={`${wrap} line-clamp-2 text-lg font-semibold leading-snug`}>{status}</motion.p>
            </AnimatePresence>
            {attention && (
              <button type="button" onClick={() => { if (!open) toggle() }} className={`${wrap} mt-1 line-clamp-2 text-left text-xs text-amber-800 hover:underline`}>
                {attention.label}
              </button>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-center">
          <DmMeter dm={a.dm} />
          {(a.running.length > 0 || a.whatsapp_sending.length > 0) && (
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <AnimatePresence initial={false}>
                {a.running.map(j => (
                  <motion.div key={j.id} layout="position" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <JobTrack j={j} />
                  </motion.div>
                ))}
                {a.whatsapp_sending.map(w => (
                  <motion.div key={`wa-${w.list_id}`} layout="position" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <WaTrack w={w} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <button type="button" onClick={toggle} aria-expanded={open}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 self-stretch rounded-full border px-4 py-2 text-sm transition-colors hover:bg-muted/60 md:self-center">
          Details<ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="min-w-0 overflow-hidden">
            <Details a={a} onOpenList={onOpenList} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
