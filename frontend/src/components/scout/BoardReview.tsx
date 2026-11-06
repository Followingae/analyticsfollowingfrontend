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
import { ApplicantCard, ProposalPicker, decidable } from "./ApplicantCard"
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

export function BoardReview({ ocId, data, brand, onOpen, onChanged }: {
  ocId: string | null; data: ApplicantsData | null; brand?: string | null; onOpen: (u: string) => void; onChanged: () => void
}) {
  const [filter, setFilter] = useState<Filter>("review")
  const [approving, setApproving] = useState<string[] | null>(null)
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
        toast.success(`${r.data.shortlisted} shortlisted, now in Proposal`, {
          description: r.data.analytics_started ? `Analytics started for ${r.data.analytics_started}.` : undefined,
        })
      } else toast.success("Not this time")
      onChanged()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  const approve = async (p: { id: string; title: string }) => {
    if (!ocId || !approving) return
    setBusy(true)
    try {
      const r = await openCallsApi.review(ocId, { action: "approve", conversation_ids: approving, proposal_id: p.id })
      const blocked = r.data.blocked || []
      toast.success(`${r.data.added || 0} added to ${p.title}`, {
        description: blocked.length ? blocked.map(b => `@${b.username}: ${b.reason}`).join(" · ") : undefined,
      })
      setApproving(null); onChanged()
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
                           onApprove={data.can_approve ? () => setApproving([a.id]) : undefined}
                           onPass={data.can_approve ? () => act("pass", [a.id]) : undefined} />
          ))}
        </div>
      )}
      <ProposalPicker open={!!approving} onOpenChange={o => !o && setApproving(null)} brand={brand} count={approving?.length || 0} onPick={approve} />
    </>
  )
}
