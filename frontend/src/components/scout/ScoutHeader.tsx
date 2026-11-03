"use client"

/**
 * The top of ScoutOutreach: the title, one sentence on what it is doing, and the bot pill.
 * The pill opens a small panel with each Instagram account the bot sends from. Founders pause
 * the bot, set each account's daily cap and add accounts.
 */
import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { AlertTriangle, Check, ChevronDown, Copy, Loader2, Minus, Pause, Play, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { scoutApi, type ScoutBot, type ScoutWorker } from "@/services/scoutApi"
import { WorkerPill, ago } from "./WorkerPill"

const CAP_MIN = 5, CAP_MAX = 200, CAP_STEP = 5

function BotRow({ b, canEdit, onChanged }: { b: ScoutBot; canEdit: boolean; onChanged: () => void }) {
  const [cap, setCap] = useState(b.daily_cap)
  const [busy, setBusy] = useState(false)
  const dirty = useRef(false)
  useEffect(() => { if (!dirty.current) setCap(b.daily_cap) }, [b.daily_cap])
  useEffect(() => {
    if (!dirty.current) return
    const t = setTimeout(async () => {
      try { await scoutApi.setWorker({ bot_id: b.id, daily_cap: cap }); dirty.current = false; onChanged() }
      catch (e) { toast.error((e as Error).message) }
    }, 700)
    return () => clearTimeout(t)
  }, [cap, b.id, onChanged])
  const step = (d: number) => { dirty.current = true; setCap(c => Math.max(CAP_MIN, Math.min(CAP_MAX, c + d))) }
  const pause = async () => {
    setBusy(true)
    try { await scoutApi.setWorker({ bot_id: b.id, paused: !b.paused }); onChanged() }
    catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  const pct = b.cap_today ? Math.min(100, (b.sent_today / b.cap_today) * 100) : 0
  const dot = b.warning ? "bg-red-500" : !b.online ? "bg-muted-foreground/40" : b.paused ? "bg-amber-500" : "bg-emerald-500"
  return (
    <div className="flex flex-col gap-2 rounded-xl border p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        <span className="min-w-0 truncate text-sm font-medium">{b.ig_username ? `@${b.ig_username}` : b.label || "New account"}</span>
        <span className="text-xs text-muted-foreground">
          {!b.online ? `Offline${b.last_seen ? ` · seen ${ago(b.last_seen)} ago` : ""}` : b.paused ? "Paused" : (b.state || "Online").replace(/_/g, " ")}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {canEdit && (
            <div className="flex items-center rounded-full border">
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" aria-label="Lower the daily cap"
                      disabled={cap <= CAP_MIN} onClick={() => step(-CAP_STEP)}><Minus className="h-3 w-3" /></Button>
              <span className="min-w-[4.5rem] text-center text-xs tabular-nums">{cap} a day</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" aria-label="Raise the daily cap"
                      disabled={cap >= CAP_MAX} onClick={() => step(CAP_STEP)}><Plus className="h-3 w-3" /></Button>
            </div>
          )}
          {canEdit && (
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" disabled={busy} onClick={pause}
                    aria-label={b.paused ? "Resume this account" : "Pause this account"}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : b.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full rounded-full bg-[#c8f000]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{b.sent_today} of {b.cap_today} today</span>
      </div>
      {b.warning && (
        <p className="flex items-start gap-1.5 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{b.warning.text} · {ago(b.warning.at)} ago
        </p>
      )}
    </div>
  )
}

function NewAccount() {
  const [busy, setBusy] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const add = async () => {
    setBusy(true)
    try { setToken((await scoutApi.addWorker()).data.token) } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  const copy = async () => {
    if (!token) return
    try { await navigator.clipboard.writeText(token); setCopied(true); setTimeout(() => setCopied(false), 1500) }
    catch { toast.error("Could not copy, select it instead") }
  }
  if (token) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-dashed p-3">
        <p className="text-sm font-medium">Paste this into the bot&apos;s .env on the PC that runs this account</p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 select-all truncate rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs">{token}</code>
          <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Shown once.</p>
      </div>
    )
  }
  return (
    <Button size="sm" variant="outline" className="gap-1.5 self-start rounded-full" disabled={busy} onClick={add}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Add account
    </Button>
  )
}

export function ScoutHeader({ canEdit, campaigns, week }: {
  canEdit: boolean; campaigns: number | null; week: { n: number; label: string } | null
}) {
  const [w, setW] = useState<ScoutWorker | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return
    try { setW((await scoutApi.worker()).data) } catch { /* the page still works without it */ }
  }, [])
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t) }, [load])

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

  const sentence = [
    campaigns != null ? `Working on ${campaigns} campaign${campaigns === 1 ? "" : "s"}` : "",
    w ? `${w.sent_today.toLocaleString()} DMs sent today` : "",
    week ? `${week.n.toLocaleString()} ${week.label}` : "",
  ].filter(Boolean).join(" · ")

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">ScoutOutreach</h1>
          {sentence && <p className="mt-1 text-sm text-muted-foreground">{sentence}</p>}
        </div>
        {w && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
                    className="inline-flex max-w-[22rem] items-center gap-1 rounded-full transition hover:opacity-80">
              <WorkerPill w={w} className="py-1.5" />
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {canEdit && (
              <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full" disabled={busy} onClick={togglePause}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : w.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                {w.paused ? "Resume" : "Pause"}
              </Button>
            )}
          </div>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && w && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="flex flex-col gap-2 rounded-2xl border bg-background p-4">
              {(w.bots || []).map(b => <BotRow key={b.id} b={b} canEdit={canEdit} onChanged={load} />)}
              {canEdit && <NewAccount />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
