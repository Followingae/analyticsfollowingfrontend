"use client"

/**
 * Everyone who answered the open call, as cards, against THIS campaign's rules: where they
 * are, the slot they picked, their answers to the team's questions, their followers. The
 * founders approve straight onto the proposal, or say not this time. Contact details stay
 * with the founders; talent see the card and nothing else.
 */
import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarClock, Check, CircleSlash, Loader2, MapPin, MessageCircle, Search, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { adminProposalApi } from "@/services/adminProposalMasterApi"
import { openCallsApi, type Applicant, type Screening, type Slot } from "@/services/openCallsApi"

type Filter = "review" | "fits" | "unsure" | "out" | "approved" | "passed" | "chatting"

const FILTERS: { id: Filter; label: string; test: (a: Applicant) => boolean }[] = [
  { id: "review", label: "To review", test: a => !a.review && a.fit !== "screened_out" && ["done", "handover", "human"].includes(a.state) },
  { id: "fits", label: "Fits", test: a => a.fit === "fits" && !a.review },
  { id: "unsure", label: "Check", test: a => a.fit === "unsure" && !a.review },
  { id: "chatting", label: "Still chatting", test: a => ["collecting", "countered"].includes(a.state) },
  { id: "approved", label: "On the proposal", test: a => a.review === "approved" },
  { id: "passed", label: "Not this time", test: a => a.review === "passed" },
  { id: "out", label: "Screened out", test: a => a.fit === "screened_out" || (a.state === "declined" && !a.review) },
]

const FIT: Record<string, { label: string; dot: string }> = {
  fits: { label: "Fits", dot: "bg-emerald-500" },
  unsure: { label: "Check", dot: "bg-amber-400" },
  screened_out: { label: "Screened out", dot: "bg-rose-400" },
}

const OPEN = ["draft", "building", "internal_review", "pending_internal_review", "internal_changes_requested",
              "internally_approved", "more_requested"]

function compact(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 100) / 10}K` : String(n)
}

function Avatar({ a }: { a: Applicant }) {
  const [broken, setBroken] = useState(false)
  if (a.avatar && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={a.avatar} alt="" onError={() => setBroken(true)} className="h-12 w-12 rounded-full object-cover" />
  }
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--tone-neutral-wash)] text-sm font-semibold uppercase">
      {(a.handle || "?").slice(0, 2)}
    </span>
  )
}

function ApplicantCard({ a, s, picked, onPick, canApprove, onApprove, onPass }: {
  a: Applicant; s: Screening; picked: boolean; onPick: () => void; canApprove: boolean
  onApprove: () => void; onPass: () => void
}) {
  const fit = a.fit ? FIT[a.fit] : null
  const where = a.answers.in_city === true ? (s.city || a.answers.based_in)
    : a.answers.based_in ? `${a.answers.based_in}${a.answers.can_visit ? " · will visit" : a.answers.can_visit === false ? " · can’t visit" : ""}` : null
  return (
    <div className={`group relative flex flex-col gap-ds-3 rounded-ds-xl border bg-background p-ds-4 transition ${picked ? "border-foreground" : "hover:border-foreground/25"}`}>
      {canApprove && !a.review && a.influencer_id && (
        <Checkbox checked={picked} onCheckedChange={onPick} className="absolute right-ds-3 top-ds-3" aria-label="Select" />
      )}
      <div className="flex items-center gap-ds-3">
        <Avatar a={a} />
        <div className="min-w-0">
          {a.handle ? (
            <a href={`https://instagram.com/${a.handle}`} target="_blank" rel="noreferrer"
               className="block truncate text-sm font-semibold hover:underline">@{a.handle}</a>
          ) : <span className="text-sm font-semibold text-muted-foreground">No handle yet</span>}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {fit && <><i className={`h-1.5 w-1.5 rounded-full ${fit.dot}`} />{fit.label}</>}
            {a.review === "approved" && <><Check className="h-3 w-3" />On the proposal</>}
            {a.review === "passed" && <><CircleSlash className="h-3 w-3" />Not this time</>}
            {!fit && !a.review && (a.state === "collecting" ? "Still chatting" : a.state === "declined" ? "Not interested" : "")}
          </span>
        </div>
        <span className="ml-auto pr-6 text-right">
          <span className="block text-lg font-semibold leading-none tabular-nums">{a.followers ? compact(a.followers) : "–"}</span>
          <span className="text-[11px] text-muted-foreground">followers</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {where && (
          <span className="inline-flex items-center gap-1 rounded-ds-full bg-[var(--tone-neutral-wash)] px-2.5 py-1 text-xs">
            <MapPin className="h-3 w-3" />{where}
          </span>
        )}
        {a.slot && (
          <span className="inline-flex items-center gap-1 rounded-ds-full bg-[var(--tone-neutral-wash)] px-2.5 py-1 text-xs">
            <CalendarClock className="h-3 w-3" />{a.slot}
          </span>
        )}
        {s.questions.map(q => {
          const v = a.answers.q?.[q.id]
          if (!v) return null
          const yes = /^(yes|y|yeah|sure|ok)/i.test(v), no = /^(no|n|nope)\b/i.test(v)
          return (
            <span key={q.id} title={q.q}
                  className="inline-flex max-w-full items-center gap-1 truncate rounded-ds-full bg-[var(--tone-neutral-wash)] px-2.5 py-1 text-xs">
              {yes ? <Check className="h-3 w-3 text-emerald-600" /> : no ? <X className="h-3 w-3 text-rose-500" /> : null}
              <span className="truncate">{yes || no ? q.q.replace(/\?$/, "") : `${q.q.replace(/\?$/, "")}: ${v}`}</span>
            </span>
          )
        })}
      </div>

      {a.fit === "screened_out" && a.fit_reasons?.length > 0 && (
        <p className="text-xs text-muted-foreground">{a.fit_reasons.filter(r => /not|under|cannot|No to/.test(r)).join(" · ")}</p>
      )}

      {canApprove && !a.review && a.influencer_id && a.fit !== "screened_out" && ["done", "handover", "human"].includes(a.state) && (
        <div className="mt-auto flex gap-ds-2 pt-1">
          <Button size="sm" className="flex-1 gap-1.5 rounded-ds-full bg-[#d3ff02] text-[#111] hover:bg-[#c4ef00]" onClick={onApprove}>
            <Check className="h-3.5 w-3.5" />Approve
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5 rounded-ds-full" onClick={onPass}>Not this time</Button>
        </div>
      )}
    </div>
  )
}

function SlotStrip({ slots }: { slots: Slot[] }) {
  if (!slots.length) return null
  return (
    <div className="grid grid-cols-2 gap-ds-2 md:grid-cols-4">
      {slots.map((s, i) => {
        const pct = s.capacity ? Math.min(1, (s.taken || 0) / s.capacity) : 0
        return (
          <div key={s.id} className="rounded-ds-lg border p-ds-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground">{"ABCDEFGHJKLMNPQRSTUV"[i]}</span>
              <span className="text-sm font-semibold tabular-nums">{s.taken || 0}{s.capacity ? `/${s.capacity}` : ""}</span>
            </div>
            <p className="mt-1 truncate text-xs" title={s.label}>{s.label}</p>
            {s.capacity ? (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--tone-neutral-wash)]">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.max(4, pct * 100)}%` }} />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function ProposalPicker({ open, onOpenChange, brand, onPick }: {
  open: boolean; onOpenChange: (o: boolean) => void; brand?: string | null; onPick: (p: { id: string; title: string }) => void
}) {
  const [all, setAll] = useState<any[]>([])
  const [q, setQ] = useState("")
  useEffect(() => {
    if (!open) return
    adminProposalApi.listProposals({ limit: 200 })
      .then(r => setAll((r.proposals || []).filter((p: any) => OPEN.includes(p.status))))
      .catch(() => toast.error("Could not load proposals"))
  }, [open])
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase(), b = (brand || "").toLowerCase()
    const hay = (p: any) => `${p.title || ""} ${p.brand_name || ""} ${p.user_email || ""}`.toLowerCase()
    return all.filter(p => !t || hay(p).includes(t))
      .sort((x, y) => Number(!!b && hay(y).includes(b)) - Number(!!b && hay(x).includes(b)))
  }, [all, q, brand])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Which proposal?</DialogTitle>
          <DialogDescription>They go straight on, cleared on the roster.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Find a proposal" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="max-h-[46vh] overflow-y-auto">
          {shown.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No open proposals match.</p>
            : shown.map(p => (
              <button key={p.id} type="button" onClick={() => onPick({ id: p.id, title: p.title })}
                      className="flex w-full flex-col border-b px-1 py-2.5 text-left last:border-0 hover:bg-muted/40">
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

export function ApplicantsBoard({ openCallId, open, onOpenChange, brand, onChats, onChanged }: {
  openCallId: string; open: boolean; onOpenChange: (o: boolean) => void; brand?: string | null
  onChats: () => void; onChanged?: () => void
}) {
  const [data, setData] = useState<{ applicants: Applicant[]; can_approve: boolean; screening: Screening; slots: Slot[] } | null>(null)
  const [filter, setFilter] = useState<Filter>("review")
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [approving, setApproving] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try { setData((await openCallsApi.applicants(openCallId)).data) }
    catch (e) { toast.error((e as Error).message || "Could not load applicants") }
  }, [openCallId])
  useEffect(() => { if (open) { setPicked({}); load() } }, [open, load])

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(f => [f.id, (data?.applicants || []).filter(f.test).length])), [data])
  const shown = useMemo(() => (data?.applicants || []).filter(FILTERS.find(f => f.id === filter)!.test), [data, filter])
  const ids = Object.keys(picked).filter(k => picked[k])

  const pass = async (cids: string[]) => {
    setBusy(true)
    try {
      await openCallsApi.review(openCallId, { action: "pass", conversation_ids: cids })
      toast.success(cids.length === 1 ? "Not this time" : `${cids.length} marked not this time`)
      setPicked({}); load(); onChanged?.()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  const approve = async (p: { id: string; title: string }) => {
    if (!approving) return
    setBusy(true)
    try {
      const r = await openCallsApi.review(openCallId, { action: "approve", conversation_ids: approving, proposal_id: p.id })
      const blocked = r.data.blocked || []
      toast.success(`${r.data.added || 0} added to ${p.title}`, {
        description: blocked.length ? blocked.map(b => `@${b.username}: ${b.reason}`).join(" · ") : undefined,
      })
      setApproving(null); setPicked({}); load(); onChanged?.()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-5xl">
        <SheetHeader>
          <SheetTitle className="text-2xl">Applicants</SheetTitle>
          <SheetDescription>Everyone who answered on WhatsApp, against this campaign’s rules.</SheetDescription>
        </SheetHeader>

        {!data ? (
          <div className="flex justify-center py-24"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="mt-ds-4 flex flex-col gap-ds-4 pb-24">
            <SlotStrip slots={data.slots} />

            <div className="flex flex-wrap items-center gap-1.5">
              {FILTERS.map(f => (
                <button key={f.id} type="button" onClick={() => setFilter(f.id)}
                        className={`rounded-ds-full border px-3 py-1.5 text-xs transition ${filter === f.id
                          ? "border-foreground bg-foreground text-background" : "hover:border-foreground/40"}`}>
                  {f.label} <span className="ml-0.5 tabular-nums opacity-60">{counts[f.id]}</span>
                </button>
              ))}
              <Button size="sm" variant="ghost" className="ml-auto gap-1.5" onClick={onChats}>
                <MessageCircle className="h-3.5 w-3.5" />Conversations
              </Button>
            </div>

            {shown.length === 0 ? (
              <p className="py-20 text-center text-sm text-muted-foreground">Nobody here yet.</p>
            ) : (
              <div className="grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map(a => (
                  <ApplicantCard key={a.id} a={a} s={data.screening} canApprove={data.can_approve}
                                 picked={!!picked[a.id]} onPick={() => setPicked(p => ({ ...p, [a.id]: !p[a.id] }))}
                                 onApprove={() => setApproving([a.id])} onPass={() => pass([a.id])} />
                ))}
              </div>
            )}
          </div>
        )}

        {ids.length > 0 && (
          <div className="fixed bottom-ds-4 right-ds-4 z-50 flex items-center gap-ds-2 rounded-ds-full border bg-background/95 py-1.5 pl-4 pr-1.5 shadow-lg backdrop-blur">
            <span className="text-sm font-medium tabular-nums">{ids.length} selected</span>
            <Button size="sm" variant="ghost" className="rounded-ds-full" disabled={busy} onClick={() => pass(ids)}>Not this time</Button>
            <Button size="sm" className="gap-1.5 rounded-ds-full bg-[#d3ff02] text-[#111] hover:bg-[#c4ef00]" disabled={busy}
                    onClick={() => setApproving(ids)}>
              <Check className="h-3.5 w-3.5" />Approve {ids.length}
            </Button>
          </div>
        )}

        <ProposalPicker open={!!approving} onOpenChange={o => !o && setApproving(null)} brand={brand} onPick={approve} />
      </SheetContent>
    </Sheet>
  )
}
