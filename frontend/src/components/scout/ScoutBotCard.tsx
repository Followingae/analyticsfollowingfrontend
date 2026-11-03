"use client"

/**
 * The desktop DM bot: whether it is up, which Instagram account it sends from, how far into
 * today's cap it is, what is queued, and its last warning. Founders pause it and set the cap.
 */
import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { AlertTriangle, Bot, Loader2, Minus, Pause, Play, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { scoutApi, type ScoutWorker } from "@/services/scoutApi"
import { WorkerPill, ago } from "./WorkerPill"

const CAP_MIN = 5, CAP_MAX = 100, CAP_STEP = 5

function CapRing({ value, cap, size = 104 }: { value: number; cap: number; size?: number }) {
  const pct = Math.min(1, cap ? value / cap : 0)
  const r = (size - 12) / 2, c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={10} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#c8f000" strokeWidth={10} strokeLinecap="round"
                       strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }}
                       transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-[11px] text-muted-foreground">of {cap} today</span>
      </div>
    </div>
  )
}

export function ScoutBotCard({ canEdit }: { canEdit: boolean }) {
  const [w, setW] = useState<ScoutWorker | null>(null)
  const [cap, setCap] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const capDirty = useRef(false)

  const load = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return
    try {
      const r = (await scoutApi.worker()).data
      setW(r)
      if (!capDirty.current) setCap(r.daily_cap)
    } catch { /* the page still works without it */ }
  }, [])
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t) }, [load])

  // Save the cap a moment after the last click.
  useEffect(() => {
    if (cap == null || !capDirty.current) return
    const t = setTimeout(async () => {
      try {
        await scoutApi.setWorker({ daily_cap: cap })
        capDirty.current = false
        toast.success(`Daily cap set to ${cap}`)
        load()
      } catch (e) { toast.error((e as Error).message) }
    }, 700)
    return () => clearTimeout(t)
  }, [cap, load])

  const step = (d: number) => {
    capDirty.current = true
    setCap(c => Math.max(CAP_MIN, Math.min(CAP_MAX, (c ?? w?.daily_cap ?? 20) + d)))
  }
  const togglePause = async () => {
    if (!w) return
    setBusy(true)
    try {
      await scoutApi.setWorker({ paused: !w.paused })
      setW({ ...w, paused: !w.paused })
      toast.success(w.paused ? "Bot resumed" : "Bot paused")
      load()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  if (!w) return null
  const shownCap = cap ?? w.daily_cap
  const facts: [string, string][] = [
    ["Account", w.ig_username ? `@${w.ig_username}` : ""],
    ["State", w.state ? w.state[0].toUpperCase() + w.state.slice(1).replace(/_/g, " ") : ""],
    ["Queue", `${w.queue.toLocaleString()} waiting`],
    ["Last seen", w.last_seen ? `${ago(w.last_seen)} ago` : ""],
  ]

  return (
    <section className="flex flex-col gap-5 rounded-3xl border bg-background p-6 md:p-7">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted"><Bot className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">DM bot</p>
          <p className="text-sm text-muted-foreground">Sends approved Instagram DMs at human pace from the desktop</p>
        </div>
        <WorkerPill w={w} />
      </div>

      <AnimatePresence>
        {w.warning && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{w.warning.text}</p>
              <p className="text-xs text-red-700/80">{w.warning.kind.replace(/_/g, " ")} · {ago(w.warning.at)} ago</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <CapRing value={w.sent_today} cap={shownCap} />
        <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
          {facts.filter(([, v]) => v).map(([l, v]) => (
            <div key={l} className="min-w-0">
              <p className="truncate text-sm font-semibold">{v}</p>
              <p className="text-xs text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-end">
            <div className="flex items-center gap-1 rounded-full border p-1">
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" aria-label="Lower the daily cap"
                      disabled={shownCap <= CAP_MIN} onClick={() => step(-CAP_STEP)}><Minus className="h-3.5 w-3.5" /></Button>
              <span className="min-w-[5.5rem] text-center text-sm tabular-nums">{shownCap} a day</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" aria-label="Raise the daily cap"
                      disabled={shownCap >= CAP_MAX} onClick={() => step(CAP_STEP)}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            <Button variant="outline" className="gap-1.5 rounded-full" disabled={busy} onClick={togglePause}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : w.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {w.paused ? "Resume" : "Pause"}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
