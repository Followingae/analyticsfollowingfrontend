"use client"

/**
 * The desktop DM bot in one pill: who it sends from and how far into today's cap it is,
 * or that it is offline, paused, or needs attention.
 */
import * as React from "react"
import { AlertTriangle, Pause } from "lucide-react"
import type { ScoutWorker } from "@/services/scoutApi"

export function compact(n?: number | null) {
  if (n == null) return "–"
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 100) / 10}K` : String(n)
}

export function ago(t?: string | null) {
  if (!t) return ""
  const s = Math.max(1, Math.round((Date.now() - new Date(t).getTime()) / 1000))
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : s < 86400 ? `${Math.round(s / 3600)}h` : `${Math.round(s / 86400)}d`
}

export type WorkerTone = "warning" | "offline" | "paused" | "online"

export function workerTone(w: ScoutWorker): WorkerTone {
  if (w.warning) return "warning"
  if (!w.online) return "offline"
  if (w.paused) return "paused"
  return "online"
}

export function workerLabel(w: ScoutWorker): string {
  const tone = workerTone(w)
  if (tone === "warning") return w.warning!.text
  if (tone === "offline") return "Bot offline"
  if (tone === "paused") return "Paused"
  return `${w.ig_username ? `@${w.ig_username}` : "Bot"} · ${w.sent_today} of ${w.daily_cap} today`
}

export function WorkerPill({ w, className = "" }: { w: ScoutWorker; className?: string }) {
  const tone = workerTone(w)
  const cls = tone === "warning" ? "border-red-200 bg-red-50 text-red-700"
    : tone === "paused" ? "border-amber-200 bg-amber-50 text-amber-800"
    : tone === "offline" ? "bg-muted/60 text-muted-foreground"
    : "bg-background text-foreground"
  return (
    <span title={workerLabel(w)}
          className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${cls} ${className}`}>
      {tone === "warning" ? <AlertTriangle className="h-3 w-3 shrink-0" />
        : tone === "paused" ? <Pause className="h-3 w-3 shrink-0" />
        : tone === "offline" ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
        : <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>}
      <span className="truncate">{workerLabel(w)}</span>
    </span>
  )
}
