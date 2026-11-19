"use client"

/**
 * Column 3, Review: everyone who answered ScoutAI and is not yet decided. Shortlist moves
 * them to the Proposal column (and starts their analytics); a founder can also add straight
 * to a proposal or say not this time. Still-chatting and screened-out creators sit behind chips.
 */
import * as React from "react"
import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { openCallsApi, type Applicant, type Screening, type Slot } from "@/services/openCallsApi"
import { ApplicantCard, decidable } from "./ApplicantCard"
import { Chip } from "./outreachParts"

export type ApplicantsData = { applicants: Applicant[]; can_approve: boolean; can_shortlist: boolean; screening: Screening; slots: Slot[] }

type Filter = "review" | "fits" | "unsure" | "chatting" | "out" | "passed"
const FILTERS: { id: Filter; label: string; test: (a: Applicant) => boolean }[] = [
  { id: "review", label: "To review", test: a => !a.review && a.fit !== "screened_out" && decidable(a) },
  { id: "fits", label: "Fits", test: a => a.fit === "fits" && !a.review },
  { id: "unsure", label: "Check", test: a => a.fit === "unsure" && !a.review },
  { id: "chatting", label: "Still chatting", test: a => ["collecting", "countered"].includes(a.state) },
  { id: "out", label: "Screened out", test: a => a.fit === "screened_out" || (a.state === "declined" && !a.review) },
  { id: "passed", label: "Not this time", test: a => a.review === "passed" },
]

export function BoardReview({ ocId, data, brand, onOpen, onChanged, listId }: {
  ocId: string | null; data: ApplicantsData | null; brand?: string | null; listId?: string; onOpen: (u: string) => void; onChanged: () => void
}) {
  const [filter, setFilter] = useState<Filter>("review")
  const [busy, setBusy] = useState(false)
  const all = data?.applicants || []
  const counts = useMemo(() => Object.fromEntries(FILTERS.map(f => [f.id, all.filter(f.test).length])), [all])
  const shown = useMemo(() => all.filter(FILTERS.find(f => f.id === filter)!.test), [all, filter])

  const act = async (action: "shortlist" | "pass", ids: string[]) => {
    if (!ocId) return
    setBusy(true)
    try {
      const r = await openCallsApi.review(ocId, { action, conversation_ids: ids })
      if (action === "shortlist") {
        toast.success(`${r.data.shortlisted} sent for approval`, {
          description: r.data.analytics_started ? `Analytics started for ${r.data.analytics_started}.` : undefined,
        })
      } else toast.success("Not this time")
      onChanged()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
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
      onChanged()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  if (!ocId) return <p className="px-1 text-sm text-muted-foreground">Answers arrive once the open call is live.</p>
  if (!data) return <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.filter(f => f.id === "review" || counts[f.id]).map(f => (
          <Chip key={f.id} on={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label} <span className="ml-0.5 tabular-nums opacity-60">{counts[f.id]}</span>
          </Chip>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-muted-foreground">
          {filter === "review" ? "Nobody waiting. New answers land here." : "Nobody here."}
        </p>
      ) : (
        <div className={`flex flex-col gap-3 ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {shown.map(a => (
            <ApplicantCard key={a.id} a={a} s={data.screening} canApprove={data.can_approve} canShortlist={data.can_shortlist}
                           onOpen={a.handle ? () => onOpen(a.handle!) : undefined}
                           onShortlist={() => act("shortlist", [a.id])}
                           onApprove={data.can_approve ? () => approveNow([a.id]) : undefined}
                           onPass={data.can_approve ? () => act("pass", [a.id]) : undefined} />
          ))}
        </div>
      )}
    </>
  )
}
