"use client"

/**
 * Column 4, Proposal: the shortlisted creators waiting to be placed, picked and added to a
 * proposal in one go (founders), and below them everyone already on one, locked: a creator
 * the client has seen keeps the row the client has seen.
 */
import * as React from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, BarChart3, Check, Loader2, Lock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { openCallsApi, type Applicant } from "@/services/openCallsApi"
import { ApplicantCard } from "./ApplicantCard"
import type { ApplicantsData } from "./BoardReview"
import { compact } from "./WorkerPill"

function Locked({ a, onOpen }: { a: Applicant; onOpen?: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border bg-muted/30 px-3 py-2">
      <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium">@{a.handle}</span>
        <span className="block truncate text-xs text-muted-foreground">{a.followers ? `${compact(a.followers)} followers · ` : ""}on the proposal</span>
      </button>
      {a.proposal_id && (
        <Link href={`/work/proposals/${a.proposal_id}`} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Open the proposal">
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

/** Approved, promised to a proposal, waiting for analytics to finish before going on it. */
function Held({ a, onOpen, onAddAnyway }: { a: Applicant; onOpen?: () => void; onAddAnyway?: () => void }) {
  const failed = !!a.analytics_unavailable_reason || ["failed", "unavailable", "error"].includes(a.analytics_status || "")
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-dashed px-3 py-2">
      {failed ? <BarChart3 className="h-3.5 w-3.5 shrink-0 text-rose-500" /> : <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium">@{a.handle}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {failed ? `analytics could not run${a.analytics_unavailable_reason ? `: ${a.analytics_unavailable_reason}` : ""}` : "analysing, goes on the proposal when done"}
        </span>
      </button>
      {failed && onAddAnyway && (
        <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" onClick={onAddAnyway}>Add anyway</Button>
      )}
    </div>
  )
}

export function BoardProposal({ ocId, data, brand, onOpen, onChanged, listId }: {
  ocId: string | null; data: ApplicantsData | null; brand?: string | null; listId?: string; onOpen: (u: string) => void; onChanged: () => void
}) {
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const all = data?.applicants || []
  const waiting = useMemo(() => all.filter(a => a.review === "shortlisted"), [all])
  const placed = useMemo(() => all.filter(a => a.review === "approved" && a.on_proposal !== false), [all])
  const held = useMemo(() => all.filter(a => a.review === "approved" && a.on_proposal === false && a.proposal_id), [all])
  const ids = Object.keys(picked).filter(k => picked[k] && waiting.some(a => a.id === k && a.influencer_id))

  /* One flow (founder, 19 Nov 2026): a founder's approve goes straight onto the round's own
     proposal, the same as Approve on the round. No picker, never another client's proposal. */
  const approveNow = async (ids: string[]) => {
    if (!ocId || !ids.length) return
    setBusy(true)
    try {
      const r = await openCallsApi.review(ocId, { action: "approve", conversation_ids: ids })
      const title = r.data.proposal?.title || "the proposal"
      const blocked = r.data.blocked || []
      const waiting = r.data.waiting || []
      const needs = r.data.needs_price || []
      toast.success(r.data.added ? `${r.data.added} added to ${title}` : waiting.length ? `Approved for ${title}, analytics running` : needs.length ? "Needs a sell price first" : `Nothing added to ${title}`, {
        description: [waiting.length ? `${waiting.map(w => `@${w.username}`).join(", ")} ${waiting.length === 1 ? "goes" : "go"} on once analytics finish.` : null,
                      needs.length ? `${needs.map(n => `@${n.username}`).join(", ")}: paid campaign, approve them on the roster with a sell price.` : null,
                      ...blocked.map(b => `@${b.username}: ${b.reason}`)].filter(Boolean).join(" · ") || undefined,
      })
      setPicked({}); onChanged()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  const addAnyway = async (a: Applicant) => {
    if (!ocId || !a.proposal_id) return
    setBusy(true)
    try {
      const r = await openCallsApi.review(ocId, { action: "approve", conversation_ids: [a.id], proposal_id: a.proposal_id, skip_analytics: true })
      toast.success(r.data.added ? `@${a.handle} added without analytics` : `@${a.handle} not added`, {
        description: (r.data.blocked || []).map(b => b.reason).join(" · ") || undefined,
      })
      onChanged()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  const pass = async (id: string) => {
    if (!ocId) return
    setBusy(true)
    try { await openCallsApi.review(ocId, { action: "pass", conversation_ids: [id] }); toast.success("Not this time"); onChanged() }
    catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  if (!ocId) return <p className="px-1 text-sm text-muted-foreground">Shortlisted creators land here.</p>
  if (!data) return <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>

  return (
    <>
      {waiting.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-muted-foreground">Nobody waiting. Shortlist in Review and they appear here.</p>
      ) : (
        <>
          {data.can_approve && (
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-8 flex-1 gap-1.5 rounded-full bg-[#111] text-white hover:bg-black" disabled={busy || ids.length === 0}
                      onClick={() => approveNow(ids)}>
                <Check className="h-3.5 w-3.5" />Add {ids.length || ""} to a proposal
              </Button>
              {ids.length > 0 ? (
                <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs" onClick={() => setPicked({})}>Clear</Button>
              ) : (
                <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs"
                        onClick={() => setPicked(Object.fromEntries(waiting.filter(a => a.influencer_id).map(a => [a.id, true])))}>All</Button>
              )}
            </div>
          )}
          <div className={`flex flex-col gap-3 ${busy ? "pointer-events-none opacity-60" : ""}`}>
            {waiting.map(a => (
              <ApplicantCard key={a.id} a={a} s={data.screening} canApprove={data.can_approve} canShortlist={false}
                             picked={!!picked[a.id]} onPick={data.can_approve ? () => setPicked(p => ({ ...p, [a.id]: !p[a.id] })) : undefined}
                             onOpen={a.handle ? () => onOpen(a.handle!) : undefined}
                             onApprove={data.can_approve ? () => approveNow([a.id]) : undefined}
                             onPass={data.can_approve ? () => pass(a.id) : undefined} />
            ))}
          </div>
        </>
      )}
      {held.length > 0 && (
        <div className="flex flex-col gap-2 pt-2">
          <p className="px-1 text-xs font-medium text-muted-foreground">Approved, analytics running <span className="tabular-nums">{held.length}</span></p>
          {held.map(a => <Held key={a.id} a={a} onOpen={a.handle ? () => onOpen(a.handle!) : undefined}
                               onAddAnyway={data.can_approve ? () => addAnyway(a) : undefined} />)}
        </div>
      )}
      {placed.length > 0 && (
        <div className="flex flex-col gap-2 pt-2">
          <p className="px-1 text-xs font-medium text-muted-foreground">On the proposal <span className="tabular-nums">{placed.length}</span></p>
          {placed.map(a => <Locked key={a.id} a={a} onOpen={a.handle ? () => onOpen(a.handle!) : undefined} />)}
        </div>
      )}
    </>
  )
}
