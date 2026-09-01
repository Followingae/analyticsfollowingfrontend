"use client"

/**
 * Put the creators you have selected onto a proposal.
 *
 * The reason this exists: you filter the database to food in KSA, you can see the eight
 * people you want, and the next thing you want is a proposal — not a detour through making
 * a list you will never open again.
 *
 * Only creators with a sell price can go on, because a creator with no sell price cannot be
 * quoted. Rather than filtering them out quietly, they are named: nine times out of ten the
 * answer is to price them, and you cannot do that if you never learn who they were.
 */
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Search, FileText, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { imdListsApi } from "@/services/imdListsApi"
import { adminProposalApi } from "@/services/adminProposalMasterApi"
import type { MasterInfluencer } from "@/types/influencerDatabase"

/** Sell pricing lives in several per-deliverable fields; any one of them makes them sellable. */
function hasSell(inf: MasterInfluencer): boolean {
  const anyInf = inf as unknown as Record<string, number | null | undefined>
  return ["post", "reel", "story", "carousel", "video", "bundle", "monthly"]
    .some(d => Number(anyInf[`sell_${d}_aed_cents`] ?? 0) > 0)
}

// Proposals that are still being put together. Once one is with a client, adding creators to
// it behind their back is not an edit — it is a different proposal.
const OPEN_STATUSES = ["draft", "internal_review", "internally_approved", "more_requested"]

// What we are quoting. A creator added with no deliverable shows no price anywhere and is
// silently left out of the proposal total — so this is asked for, never assumed away.
const DELIVERABLES = [
  { key: "reel", label: "Reel" },
  { key: "post", label: "Post" },
  { key: "story", label: "Story" },
  { key: "carousel", label: "Carousel" },
  { key: "video", label: "Video" },
]

export function AddToProposalDialog({
  open, onOpenChange, selected, onDone,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  selected: MasterInfluencer[]
  onDone?: () => void
}) {
  const router = useRouter()
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState("")
  const [dType, setDType] = useState("reel")
  const [qty, setQty] = useState(1)

  const sellable = useMemo(() => selected.filter(hasSell), [selected])
  const unpriced = useMemo(() => selected.filter(i => !hasSell(i)), [selected])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    adminProposalApi.listProposals({ limit: 100 })
      .then(r => setProposals((r.proposals || []).filter(p => OPEN_STATUSES.includes(p.status))))
      .catch(() => toast.error("Could not load proposals"))
      .finally(() => setLoading(false))
  }, [open])

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return proposals
    return proposals.filter(p =>
      (p.campaign_name || p.title || "").toLowerCase().includes(t) ||
      (p.brand_name || "").toLowerCase().includes(t))
  }, [proposals, q])

  const add = async (proposalId: string, label: string) => {
    setBusy(true)
    try {
      const res = await imdListsApi.addSelectionToProposal(
        proposalId, sellable.map(i => i.id), { type: dType, quantity: qty })
      const d = res.data
      const bits = [`${d.added} added to ${label} · ${qty} ${dType}${qty > 1 ? "s" : ""} each`]
      if (d.already_on_proposal) bits.push(`${d.already_on_proposal} already there`)
      if (d.without_deliverable?.length)
        bits.push(`${d.without_deliverable.length} have no ${dType} price, set one by hand`)
      if (d.no_cost?.length) bits.push(`${d.no_cost.length} with no cost recorded`)
      toast.success(bits.join(" · "), {
        action: { label: "Open proposal", onClick: () => router.push(`/work/proposals/${proposalId}`) },
      })
      onOpenChange(false)
      onDone?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add to the proposal")
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add to a proposal</DialogTitle>
          <DialogDescription>
            {sellable.length} of {selected.length} selected creators can be quoted.
            Pick the proposal they belong on.
          </DialogDescription>
        </DialogHeader>

        {unpriced.length > 0 && (
          <div className="flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div className="min-w-0 text-xs leading-relaxed">
              <p className="font-medium text-amber-700 dark:text-amber-500">
                {unpriced.length} will be left out, they have no sell price yet
              </p>
              <p className="mt-0.5 truncate text-muted-foreground">
                {unpriced.slice(0, 6).map(i => `@${i.username}`).join(", ")}
                {unpriced.length > 6 ? ` and ${unpriced.length - 6} more` : ""}
              </p>
              <p className="mt-1 text-muted-foreground">
                Price them in the waiting room and they become selectable everywhere.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium">What are we quoting for each of them?</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {DELIVERABLES.map(d => (
              <Button key={d.key} type="button" size="sm"
                      variant={dType === d.key ? "default" : "outline"}
                      onClick={() => setDType(d.key)}>
                {d.label}
              </Button>
            ))}
            <span className="ml-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              ×
              <Input type="number" min={1} value={qty} className="h-8 w-16"
                     onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))} />
              each
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            A creator added with no deliverable shows no price on the proposal and is left out
            of the total.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="h-9 pl-8" placeholder="Search proposals…"
                 value={q} onChange={e => setQ(e.target.value)} />
        </div>

        <div className="max-h-[320px] space-y-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 px-1 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />Loading proposals…
            </div>
          )}
          {!loading && shown.length === 0 && (
            <p className="px-1 py-8 text-center text-sm text-muted-foreground">
              No proposals are open for edits. Create one first.
            </p>
          )}
          {shown.map(p => (
            <button
              key={p.id}
              type="button"
              disabled={busy || sellable.length === 0}
              onClick={() => add(p.id, p.campaign_name || p.title || "the proposal")}
              className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition hover:bg-muted disabled:opacity-50"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {p.campaign_name || p.title || "Untitled proposal"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {p.brand_name || "No brand linked"}
                </span>
              </span>
              <Badge variant="outline" className="shrink-0 capitalize">
                {String(p.status || "").replace(/_/g, " ")}
              </Badge>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="ghost" onClick={() => router.push("/work/proposals/create")}>
            New proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
