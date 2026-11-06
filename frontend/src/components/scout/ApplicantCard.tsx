"use client"

/**
 * One creator who answered ScoutAI, as the Review and Proposal columns show them: who they
 * are, how they fit this campaign's rules, their answers, and the one action that is theirs
 * now. Contact details stay with the founders.
 */
import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { BarChart3, CalendarClock, Check, CircleSlash, Flag, Lock, MapPin, Search, Star, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { adminProposalApi } from "@/services/adminProposalMasterApi"
import type { Applicant, Screening } from "@/services/openCallsApi"
import { compact } from "./WorkerPill"

export const FIT: Record<string, { label: string; dot: string }> = {
  fits: { label: "Fits", dot: "bg-emerald-500" },
  unsure: { label: "Check", dot: "bg-amber-400" },
  screened_out: { label: "Screened out", dot: "bg-rose-400" },
}

/** Finished the chat, so a person can decide. */
export const decidable = (a: Applicant) => ["done", "handover", "human"].includes(a.state)

function Avatar({ a }: { a: Applicant }) {
  const [broken, setBroken] = useState(false)
  if (a.avatar && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={a.avatar} alt="" onError={() => setBroken(true)} className="h-11 w-11 shrink-0 rounded-full object-cover" />
  }
  return <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">{(a.handle || "?").slice(0, 2)}</span>
}

function Tag({ children, tone = "muted", title }: { children: React.ReactNode; tone?: "muted" | "good" | "lime"; title?: string }) {
  const cls = tone === "good" ? "bg-emerald-50 text-emerald-700" : tone === "lime" ? "bg-[#d3ff02] text-[#111]" : "bg-muted"
  return <span title={title} className={`inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[11px] ${cls}`}>{children}</span>
}

export function ApplicantCard({ a, s, picked, onPick, canApprove, canShortlist, onApprove, onPass, onShortlist, onOpen, proposalTitle }: {
  a: Applicant; s: Screening; picked?: boolean; onPick?: () => void; canApprove: boolean; canShortlist: boolean
  onApprove?: () => void; onPass?: () => void; onShortlist?: () => void; onOpen?: () => void; proposalTitle?: string | null
}) {
  const nat = a.answers.nationality || a.saved_nationality
  const analysed = ["completed", "complete"].includes(a.analytics_status || "")
  const analysing = ["queued", "processing", "running"].includes(a.analytics_status || "")
  const fit = a.fit ? FIT[a.fit] : null
  const where = a.answers.in_city === true ? (s.city || a.answers.based_in)
    : a.answers.based_in ? `${a.answers.based_in}${a.answers.can_visit ? " · will visit" : a.answers.can_visit === false ? " · can't visit" : ""}` : null
  const open = !a.review || a.review === "shortlisted"
  const actionable = open && !!a.influencer_id && a.fit !== "screened_out" && decidable(a)

  return (
    <div className={`relative flex flex-col gap-3 rounded-2xl border bg-background p-4 transition ${picked ? "border-foreground" : "hover:border-foreground/25"}`}>
      {onPick && actionable && (
        <Checkbox checked={!!picked} onCheckedChange={onPick} className="absolute right-3 top-3" aria-label="Select" />
      )}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onOpen} className="shrink-0 rounded-full"><Avatar a={a} /></button>
        <div className="min-w-0 flex-1">
          {a.handle ? (
            <button type="button" onClick={onOpen} className="block max-w-full truncate text-left text-sm font-semibold hover:underline">@{a.handle}</button>
          ) : <span className="text-sm font-semibold text-muted-foreground">No handle yet</span>}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {fit && <><i className={`h-1.5 w-1.5 rounded-full ${fit.dot}`} />{fit.label}</>}
            {a.review === "shortlisted" && <><Star className="h-3 w-3" />Shortlisted</>}
            {a.review === "approved" && <><Lock className="h-3 w-3" />{proposalTitle ? `On ${proposalTitle}` : "On the proposal"}</>}
            {a.review === "passed" && <><CircleSlash className="h-3 w-3" />Not this time</>}
            {!fit && !a.review && (["collecting", "countered"].includes(a.state) ? "Still chatting" : a.state === "declined" ? "Not interested" : "")}
          </span>
        </div>
        <span className={`text-right ${onPick && actionable ? "pr-6" : ""}`}>
          <span className="block text-base font-semibold leading-none tabular-nums">{a.followers ? compact(a.followers) : "–"}</span>
          <span className="text-[10px] text-muted-foreground">followers</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {where && <Tag><MapPin className="h-3 w-3" />{where}</Tag>}
        {a.slot && <Tag><CalendarClock className="h-3 w-3" />{a.slot}</Tag>}
        {a.answers.ack && <Tag tone="good" title={a.answers.ack_at ? `Agreed ${new Date(a.answers.ack_at).toLocaleString("en-GB")}` : undefined}><Check className="h-3 w-3" />Agreed to terms</Tag>}
        {nat && <Tag tone={a.answers.nationality_match ? "lime" : "muted"}><Flag className="h-3 w-3" />{nat}</Tag>}
        {(analysed || analysing) && (
          <Tag><BarChart3 className="h-3 w-3" />{analysing ? "Analysing…" : a.engagement_rate != null ? `${Number(a.engagement_rate).toFixed(1)}% engagement` : "Analysed"}</Tag>
        )}
        {s.questions.map(q => {
          const v = a.answers.q?.[q.id]
          if (!v) return null
          const yes = /^(yes|y|yeah|sure|ok)/i.test(v), no = /^(no|n|nope)\b/i.test(v)
          return (
            <Tag key={q.id} title={q.q}>
              {yes ? <Check className="h-3 w-3 text-emerald-600" /> : no ? <X className="h-3 w-3 text-rose-500" /> : null}
              <span className="truncate">{yes || no ? q.q.replace(/\?$/, "") : `${q.q.replace(/\?$/, "")}: ${v}`}</span>
            </Tag>
          )
        })}
      </div>

      {a.last_message && !a.review && (
        <p className="line-clamp-2 rounded-xl bg-muted/50 px-3 py-2 text-xs">{a.last_message}</p>
      )}
      {a.fit === "screened_out" && a.fit_reasons?.length > 0 && (
        <p className="text-xs text-muted-foreground">{a.fit_reasons.filter(r => /not|under|cannot|No to/.test(r)).join(" · ")}</p>
      )}

      {actionable && (onShortlist || onApprove || onPass) && (
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {!a.review && canShortlist && onShortlist && (
            <Button size="sm" className="flex-1 gap-1.5 rounded-full bg-[#d3ff02] text-[#111] hover:bg-[#c4ef00]" onClick={onShortlist}>
              <Star className="h-3.5 w-3.5" />Shortlist
            </Button>
          )}
          {canApprove && onApprove && (
            <Button size="sm" className="flex-1 gap-1.5 rounded-full bg-[#111] text-white hover:bg-black" onClick={onApprove}>
              <Check className="h-3.5 w-3.5" />Add to proposal
            </Button>
          )}
          {!canApprove && a.review === "shortlisted" && <span className="flex-1 self-center text-xs text-muted-foreground">Waiting for a founder</span>}
          {canApprove && onPass && <Button size="sm" variant="ghost" className="rounded-full" onClick={onPass}>Not this time</Button>}
        </div>
      )}
    </div>
  )
}

const OPEN = ["draft", "building", "internal_review", "pending_internal_review", "internal_changes_requested",
              "internally_approved", "more_requested"]

export function ProposalPicker({ open, onOpenChange, brand, count, onPick }: {
  open: boolean; onOpenChange: (o: boolean) => void; brand?: string | null; count: number; onPick: (p: { id: string; title: string }) => void
}) {
  type ProposalRow = { id: string; title: string; status?: string; brand_name?: string | null; user_email?: string | null; campaign_type_target?: string | null }
  const [all, setAll] = useState<ProposalRow[]>([])
  const [q, setQ] = useState("")
  useEffect(() => {
    if (!open) return
    adminProposalApi.listProposals({ limit: 200 })
      .then(r => setAll(((r.proposals || []) as ProposalRow[]).filter(p => OPEN.includes(p.status || ""))))
      .catch(() => toast.error("Could not load proposals"))
  }, [open])
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase(), b = (brand || "").toLowerCase()
    const hay = (p: ProposalRow) => `${p.title || ""} ${p.brand_name || ""} ${p.user_email || ""}`.toLowerCase()
    return all.filter(p => !t || hay(p).includes(t))
      .sort((x, y) => Number(!!b && hay(y).includes(b)) - Number(!!b && hay(x).includes(b)))
  }, [all, q, brand])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Which proposal?</DialogTitle>
          <DialogDescription>{count} creator{count === 1 ? "" : "s"} go straight on, cleared on the roster. Analytics run first for anyone without them.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="rounded-full pl-9" placeholder="Find a proposal" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="max-h-[46vh] overflow-y-auto">
          {shown.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No open proposals match.</p>
            : shown.map(p => (
              <button key={p.id} type="button" onClick={() => onPick({ id: p.id, title: p.title })}
                      className="flex w-full flex-col rounded-xl px-2 py-2.5 text-left hover:bg-muted/40">
                <span className="truncate text-sm font-medium">{p.title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {[p.brand_name || p.user_email, p.campaign_type_target === "barter_portal" ? "barter" : null, p.status?.replace(/_/g, " ")].filter(Boolean).join(" · ")}
                </span>
              </button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
