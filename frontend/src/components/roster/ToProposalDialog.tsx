"use client"

/**
 * Cleared creators onto a proposal, straight from the roster.
 *
 * Every reason someone cannot go on is shown BEFORE the button, by name: not cleared, no sell
 * price, the client already said no, already on it. "Added 4, skipped 3" after the fact was
 * how creators went missing from proposals with nobody able to say why.
 */
import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { adminProposalApi } from "@/services/adminProposalMasterApi"
import { rosterSheetApi, type ClientRejection, type ReadyRow } from "@/services/imdListsApi"

const OPEN = ["draft", "building", "internal_review", "pending_internal_review", "internal_changes_requested",
              "internally_approved", "more_requested"]

export function ToProposalDialog({ open, onOpenChange, listId, brand, ids, onDone }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  listId: string
  brand?: string | null
  ids: string[]
  onDone: () => void
}) {
  const router = useRouter()
  const [proposals, setProposals] = useState<any[]>([])
  const [q, setQ] = useState("")
  const [picked, setPicked] = useState<{ id: string; title: string } | null>(null)
  const [check, setCheck] = useState<{ ready: ReadyRow[]; blocked: ReadyRow[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [rejected, setRejected] = useState<ClientRejection[]>([])
  const [why, setWhy] = useState("")

  useEffect(() => {
    if (!open) { setPicked(null); setCheck(null); setQ(""); setRejected([]); setWhy(""); return }
    adminProposalApi.listProposals({ limit: 200 })
      .then(r => setProposals((r.proposals || []).filter((p: any) => OPEN.includes(p.status))))
      .catch(() => toast.error("Could not load proposals"))
  }, [open])

  // This brand's proposals first: they are almost always the one being built.
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    const b = (brand || "").toLowerCase()
    const hay = (p: any) => `${p.title || ""} ${p.campaign_name || ""} ${p.brand_name || ""} ${p.user_email || ""}`.toLowerCase()
    return proposals
      .filter(p => !t || hay(p).includes(t))
      .sort((a, z) => Number(!!b && hay(z).includes(b)) - Number(!!b && hay(a).includes(b)))
  }, [proposals, q, brand])

  const pick = async (p: any) => {
    setPicked({ id: p.id, title: p.title })
    setBusy(true)
    try {
      const res = await rosterSheetApi.proposalCheck(listId, p.id, ids)
      setCheck({ ready: res.data.ready, blocked: res.data.blocked })
    } catch (e) {
      toast.error((e as Error).message || "Could not check this proposal")
      setPicked(null)
    } finally {
      setBusy(false)
    }
  }

  const add = async (override?: boolean) => {
    if (!picked || !check) return
    setBusy(true)
    try {
      const res = await rosterSheetApi.toProposal(listId, picked.id, check.ready.map(r => r.influencer_id),
                                                  override ? { reason: why.trim() } : undefined)
      if (res.data.client_rejected?.length && !override) {
        setRejected(res.data.client_rejected)
        if (res.data.added) toast.success(`${res.data.added} added`)
        return
      }
      toast.success(`${res.data.added} added to ${picked.title}`, {
        action: { label: "Open proposal", onClick: () => router.push(`/work/proposals/${picked.id}`) },
      })
      onOpenChange(false)
      onDone()
    } catch (e) {
      toast.error((e as Error).message || "Could not add them")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{picked ? picked.title : "Add to a proposal"}</DialogTitle>
          <DialogDescription>
            {picked ? "Who can go on now, and why anyone cannot." : `${ids.length} cleared creator${ids.length === 1 ? "" : "s"} selected.`}
          </DialogDescription>
        </DialogHeader>

        {!picked ? (
          <div className="flex flex-col gap-ds-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Find a proposal" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <div className="max-h-[46vh] overflow-y-auto">
              {shown.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No open proposals match.</p>
              ) : shown.map(p => (
                <button key={p.id} type="button" onClick={() => pick(p)}
                        className="flex w-full items-center justify-between gap-ds-3 border-b px-1 py-2.5 text-left last:border-0 hover:bg-muted/40">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{p.title}</span>
                    <span className="block truncate text-ds-caption text-muted-foreground">
                      {[p.brand_name || p.user_email, p.status?.replace(/_/g, " ")].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : busy && !check ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : check && (
          <div className="flex max-h-[52vh] flex-col gap-ds-3 overflow-y-auto">
            {check.ready.length > 0 && (
              <div>
                <p className="mb-1 text-ds-overline uppercase text-muted-foreground">Going on ({check.ready.length})</p>
                <p className="text-sm">{check.ready.map(r => "@" + r.username).join(", ")}</p>
              </div>
            )}
            {check.blocked.length > 0 && (
              <div>
                <p className="mb-1 text-ds-overline uppercase text-muted-foreground">Not yet ({check.blocked.length})</p>
                <ul className="flex flex-col gap-1">
                  {check.blocked.map(b => (
                    <li key={b.influencer_id} className="text-sm">
                      <span className="font-medium">@{b.username}</span>
                      <span className="text-muted-foreground">: {b.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {rejected.length > 0 && (
              <div className="flex flex-col gap-ds-2 border-t pt-ds-3">
                <p className="text-sm font-medium">This client has already turned these down</p>
                <ul className="flex flex-col gap-1 text-sm">
                  {rejected.map(r => (
                    <li key={r.influencer_db_id}>@{r.username}<span className="text-muted-foreground">: “{r.client_reason}”</span></li>
                  ))}
                </ul>
                <Textarea rows={2} value={why} onChange={e => setWhy(e.target.value)}
                          placeholder="Why propose them again? This is shown to whoever approves the proposal." />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {picked && (
            <Button variant="ghost" className="mr-auto gap-1.5" onClick={() => { setPicked(null); setCheck(null); setRejected([]) }} disabled={busy}>
              <ArrowLeft className="h-4 w-4" />Another proposal
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Close</Button>
          {picked && check && (rejected.length ? (
            <Button onClick={() => add(true)} disabled={busy || !why.trim()}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Propose them anyway
            </Button>
          ) : (
            <Button onClick={() => add(false)} disabled={busy || check.ready.length === 0}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Add {check.ready.length}
            </Button>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
