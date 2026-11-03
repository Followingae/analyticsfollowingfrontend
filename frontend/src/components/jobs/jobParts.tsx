"use client"

/**
 * The pieces every Jobs surface shares: the stage rail, the live pulse, a creator's face, the
 * source marks, and the one place an action name becomes a link. Jobs, the Job and Needs you
 * all read from here, so "Price" goes to the same screen wherever it is pressed.
 */
import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Info, Loader2, MessageCircle, Radar, Send, Users } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { JobPerson, JobStage, Source, StageKey, Step, Viewer, Who } from "@/services/jobsApi"

/** Lime is a surface, never ink. */
export const LIME = "bg-[#d3ff02] text-[#111]"

/* ------------------------------------------------------------------ polling */

/** Run `fn` now, then every `ms` while the tab is visible, and again the moment it comes back. */
export function usePoll(fn: () => void | Promise<void>, ms = 15000) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    const tick = () => { if (typeof document === "undefined" || !document.hidden) void ref.current() }
    tick()
    const t = setInterval(tick, ms)
    const onVis = () => { if (!document.hidden) void ref.current() }
    document.addEventListener("visibilitychange", onVis)
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis) }
  }, [ms])
}

/* ------------------------------------------------------------------ who and what */

export const STAGE_STEPS: Record<StageKey, Step[]> = {
  find: ["found", "dm_queued", "dm_sent", "chatting", "applied", "needs_rate"],
  price: ["needs_price", "ready"],
  propose: ["on_proposal", "client_picked"],
  book: ["booked", "send_enrolment", "enrolment_approve", "enrolment_sent", "payee", "enrolled"],
  deliver: ["briefed", "content_in", "content_approved", "posted"],
  paid: ["paid"],
}

export function stageOf(step: Step): StageKey | null {
  for (const k of Object.keys(STAGE_STEPS) as StageKey[]) if (STAGE_STEPS[k].includes(step)) return k
  return null
}

/** Is this step yours to move? A founder also carries the talent team's steps. */
export function isMine(who: Who, viewer: Viewer) {
  return who === viewer || (viewer === "founder" && who === "talent")
}

export const WAITING_ON: Record<Who, string> = {
  founder: "Waiting on a founder",
  talent: "Waiting on talent",
  client: "Waiting on client",
  creator: "Waiting on creator",
  scout: "Waiting on Scout",
  nobody: "",
}

export const WHO_SHORT: Record<Who, string> = {
  founder: "Founder", talent: "Talent", client: "Client", creator: "Creators", scout: "Scout", nobody: "",
}

/** The order actions are worked in, so the same action sits in the same place everywhere. */
export const ACTION_ORDER = [
  "Price", "Agree the cost", "Approve the link", "Confirm payee", "Confirm the booking", "Open the campaign",
  "Pay", "Send enrolment link", "Add to proposal", "Review and send for pricing", "Review the content", "Get their rate",
]
export const actionRank = (a: string | null) => {
  const i = a ? ACTION_ORDER.indexOf(a) : -1
  return i < 0 ? 99 : i
}

const ROSTER_ACTIONS = new Set(["Price", "Add to proposal", "Review and send for pricing", "Get their rate"])
const PROPOSAL_ACTIONS = new Set(["Confirm the booking", "Agree the cost", "Send enrolment link", "Open the campaign"])
const ENROL_ACTIONS = new Set(["Approve the link", "Confirm payee"])
const CAMPAIGN_ACTIONS = new Set(["Review the content", "Pay"])

type Linkable = Pick<JobPerson, "username" | "proposal_id" | "enrolment_id" | "action">

/**
 * Where an action is done. Deep links for now; each falls back to the brief's roster (or to
 * the Job when the campaign is not known) rather than to nowhere.
 */
export function actionHref(p: Linkable, jobId: string, campaignId?: string | null): string {
  const a = p.action || ""
  const roster = `/work/areas/${jobId}?focus=${encodeURIComponent(p.username)}`
  if (PROPOSAL_ACTIONS.has(a) && p.proposal_id) return `/work/proposals/${p.proposal_id}`
  if (ENROL_ACTIONS.has(a) && p.enrolment_id) return `/work/enrolments/${p.enrolment_id}`
  if (CAMPAIGN_ACTIONS.has(a)) return campaignId ? `/work/campaigns/${campaignId}/ladder` : `/work/jobs/${jobId}`
  return roster
}

/** One link for a whole pile of the same action: the roster unfocused when it is several people. */
export function pileHref(action: string, people: Linkable[], jobId: string, campaignId?: string | null): string {
  if (ROSTER_ACTIONS.has(action) && people.length > 1) return `/work/areas/${jobId}`
  return people[0] ? actionHref(people[0], jobId, campaignId) : `/work/jobs/${jobId}`
}

/** The stage the job is mostly sitting in. Ties go to the later stage. */
export function activeStage(stages: JobStage[]): StageKey | null {
  let best: JobStage | null = null
  for (const s of stages) if (s.count > 0 && (!best || s.count >= best.count)) best = s
  return best?.key ?? null
}

export function compactNum(n?: number | null) {
  if (n == null) return null
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 100) / 10}K` : String(n)
}

export function dueChip(due: string | null): { text: string; late: boolean } | null {
  if (!due) return null
  const d = new Date(due)
  if (Number.isNaN(d.getTime())) return null
  const days = Math.ceil((d.getTime() - Date.now()) / 86_400_000)
  return { text: `Due ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`, late: days <= 2 }
}

/* ------------------------------------------------------------------ small marks */

export function Chip({ children, tone = "muted", className }: {
  children: React.ReactNode; tone?: "muted" | "lime" | "good" | "warn" | "outline"; className?: string
}) {
  return (
    <span className={cn(
      "inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-medium tabular-nums",
      tone === "muted" && "bg-muted text-muted-foreground",
      tone === "lime" && LIME,
      tone === "good" && "bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]",
      tone === "warn" && "bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]",
      tone === "outline" && "border text-muted-foreground",
      className,
    )}>{children}</span>
  )
}

/** The explanation lives behind this, never on the page. */
export function InfoTip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label="About this" className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground">
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">{children}</TooltipContent>
    </Tooltip>
  )
}

export function Face({ src, name, size = 36, className }: { src: string | null; name: string; size?: number; className?: string }) {
  const [bad, setBad] = useState(false)
  const style = { width: size, height: size }
  if (src && !bad) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" style={style} onError={() => setBad(true)} className={cn("shrink-0 rounded-full bg-muted object-cover", className)} />
  }
  return (
    <span style={style} className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium uppercase text-muted-foreground", className)}>
      <span style={{ fontSize: Math.max(10, size * 0.36) }}>{(name || "?").replace(/^@/, "").slice(0, 1)}</span>
    </span>
  )
}

export function FaceStack({ people, max = 4, size = 26 }: { people: { avatar: string | null; username: string }[]; max?: number; size?: number }) {
  const shown = people.slice(0, max)
  const more = people.length - shown.length
  return (
    <span className="flex shrink-0 items-center">
      {shown.map((p, i) => (
        <Face key={`${p.username}-${i}`} src={p.avatar} name={p.username} size={size}
              className={cn("ring-2 ring-background", i > 0 && "-ml-2")} />
      ))}
      {more > 0 && (
        <span style={{ height: size }} className="-ml-2 inline-flex min-w-[26px] items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground ring-2 ring-background">
          +{more}
        </span>
      )}
    </span>
  )
}

export const SOURCE_META: Record<Source, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  talent: { label: "Talent team", icon: Users },
  scout: { label: "Picked by Scout", icon: Radar },
  scoutai: { label: "ScoutAI", icon: MessageCircle },
  scoutoutreach: { label: "ScoutOutreach", icon: Send },
}

export function SourceMarks({ sources }: { sources: Source[] }) {
  return (
    <span className="flex items-center gap-1">
      {sources.map(s => {
        const m = SOURCE_META[s]
        if (!m) return null
        const Icon = m.icon
        return (
          <Tooltip key={s}>
            <TooltipTrigger asChild>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted/70 text-muted-foreground">
                <Icon className="h-3 w-3" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">{m.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </span>
  )
}

/* ------------------------------------------------------------------ live pulse */

export function PulseDot({ on = true, className }: { on?: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2 w-2 shrink-0", className)}>
      {on && (
        <motion.span className="absolute inset-0 rounded-full bg-[#9bd400]"
                     animate={{ scale: [1, 2.4], opacity: [0.55, 0] }}
                     transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }} />
      )}
      <span className={cn("relative h-2 w-2 rounded-full", on ? "bg-[#9bd400]" : "bg-muted-foreground/40")} />
    </span>
  )
}

/** A pulse and the first live line, rotating through the rest. Nothing when nothing is running. */
export function LiveLine({ lines, className, every = 4500 }: { lines: { kind: string; text: string }[]; className?: string; every?: number }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (lines.length < 2) return
    const t = setInterval(() => setI(x => x + 1), every)
    return () => clearInterval(t)
  }, [lines.length, every])
  if (!lines.length) return null
  const line = lines[i % lines.length]
  return (
    <div className={cn("flex min-w-0 items-center gap-2 text-sm text-muted-foreground", className)}>
      <PulseDot />
      <span className="relative min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={`${i % lines.length}-${line.text}`} className="block truncate"
                       initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                       transition={{ duration: 0.22 }}>
            {line.text}
          </motion.span>
        </AnimatePresence>
      </span>
      {lines.length > 1 && <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/70">{(i % lines.length) + 1}/{lines.length}</span>}
    </div>
  )
}

/* ------------------------------------------------------------------ stage rail */

/**
 * Six stages, Find to Paid. A bar per stage, its count beneath. The stage the job mostly sits
 * in is lime; stages holding anyone are ink; empty ones are a hairline. With `onSelect` each
 * stage is a filter.
 */
export function StageRail({ stages, size = "sm", selected, onSelect }: {
  stages: JobStage[]
  size?: "sm" | "lg"
  selected?: StageKey | null
  onSelect?: (k: StageKey | null) => void
}) {
  const active = activeStage(stages)
  const lg = size === "lg"
  return (
    <div className={cn("grid grid-cols-6", lg ? "gap-1.5 sm:gap-2" : "gap-1")} role={onSelect ? "tablist" : undefined}>
      {stages.map(s => {
        const on = s.key === active
        const sel = selected === s.key
        const dim = selected && !sel
        const body = (
          <>
            <span className={cn(
              "block w-full rounded-full transition-colors",
              lg ? "h-1.5" : "h-1",
              on ? "bg-[#d3ff02]" : s.count > 0 ? "bg-foreground/70" : "bg-muted",
            )} />
            {lg ? (
              /* The filter form gives the number room: figure first, word under it, so six
                 columns still read at phone width. */
              <>
                <span className={cn("mt-2 block text-lg font-semibold leading-none tabular-nums sm:text-xl",
                                    s.count > 0 ? "text-foreground" : "text-muted-foreground/50")}>{s.count}</span>
                <span className={cn("mt-1 block truncate text-xs", on || sel ? "font-medium text-foreground" : "text-muted-foreground")}>{s.label}</span>
              </>
            ) : (
              <span className="mt-1.5 flex min-w-0 flex-col-reverse text-[11px] sm:flex-row sm:items-baseline sm:justify-between sm:gap-1">
                <span className={cn("truncate", on ? "font-medium text-foreground" : "text-muted-foreground")}>{s.label}</span>
                <span className={cn("tabular-nums", s.count > 0 ? "text-foreground" : "text-muted-foreground/60", on && "font-semibold")}>{s.count}</span>
              </span>
            )}
          </>
        )
        if (!onSelect) return <div key={s.key} className="min-w-0">{body}</div>
        return (
          <button key={s.key} type="button" role="tab" aria-selected={sel}
                  onClick={() => onSelect(sel ? null : s.key)}
                  className={cn(
                    "min-w-0 rounded-xl px-1.5 py-2 text-left transition-[background-color,opacity] sm:px-2.5",
                    sel ? "bg-muted" : "hover:bg-muted/60",
                    dim && "opacity-50 hover:opacity-100",
                  )}>
            {body}
          </button>
        )
      })}
    </div>
  )
}

export function Spinner() {
  return <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
}

export function LoadFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--tone-bad-dot)]" />Could not load</span>
      <button type="button" onClick={onRetry} className="rounded-full border px-4 py-1.5 text-foreground transition-colors hover:bg-muted/60">Try again</button>
    </div>
  )
}
