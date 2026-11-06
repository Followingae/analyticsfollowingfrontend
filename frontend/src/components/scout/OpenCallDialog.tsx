"use client"

/**
 * Create or edit the ScoutAI open call: the card creators read in WhatsApp and the rules the
 * agent screens by. ScoutAI drafts it from the roster's brief; a superadmin checks every line.
 * The budget and ceiling are for the agent only and are never shown to creators or talent.
 */
import * as React from "react"
import { useEffect, useState } from "react"
import { Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { openCallsApi, type OpenCall } from "@/services/openCallsApi"
import { EMPTY_SCREENING, ScreeningEditor } from "@/components/roster/ScreeningEditor"
import { ScoutAvatar } from "@/components/roster/ScoutAvatar"

type Draft = Partial<OpenCall> & { faq: { q: string; a: string }[] }

const EMPTY: Draft = { title: "", brand_descriptor: "", pitch: "", comp_mode: "barter", deliverables: "", location: "",
                       dates: "", image_url: "", barter_offer: "", target_aed: null, ceiling_aed: null,
                       max_counters: 1, handover_followers: 500000, faq: [], status: "live",
                       looking_for: "", screening: EMPTY_SCREENING }

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1"><Label className="text-xs">{label}</Label>{children}</div>
}

export function OpenCallDialog({ listId, brand, oc, open, onOpenChange, onSaved }: {
  listId: string; brand?: string | null; oc: OpenCall | null; open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [drafted, setDrafted] = useState(false)
  const set = (p: Partial<Draft>) => setDraft(d => ({ ...d, ...p }))

  const draftFromBrief = async (keep?: Draft) => {
    setDrafting(true)
    try {
      const r = await openCallsApi.suggest(listId)
      const d = r.data.draft
      setDraft(prev => {
        const base = keep || prev
        const pick = <T,>(v: T | null | undefined, cur: T) => (v === null || v === undefined || v === "" ? cur : v)
        return {
          ...base,
          ...Object.fromEntries(Object.entries(d).filter(([, v]) => v !== null && v !== undefined && v !== "")),
          screening: { ...(base.screening || EMPTY_SCREENING), ...(d.screening || {}),
                       slots: (base.screening?.slots?.length ? base.screening.slots : d.screening?.slots) || [] },
          faq: pick(d.faq?.length ? d.faq : null, base.faq),
        } as Draft
      })
      setDrafted(r.data.drafted_by_ai)
    } catch (e) { toast.error((e as Error).message || "Could not draft from the brief") } finally { setDrafting(false) }
  }

  // Opening: an existing call loads as it is; a new one is drafted from the brief at once.
  useEffect(() => {
    if (!open) return
    setDrafted(false)
    if (oc) {
      setDraft({ ...EMPTY, ...oc, faq: oc.faq || [], screening: oc.screening || EMPTY_SCREENING, looking_for: oc.looking_for || "" })
    } else {
      setDraft(EMPTY)
      draftFromBrief(EMPTY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, oc?.id])

  const save = async () => {
    setBusy(true)
    try {
      await openCallsApi.save(listId, {
        ...draft,
        target_aed: draft.target_aed ? Number(draft.target_aed) : null,
        ceiling_aed: draft.ceiling_aed ? Number(draft.ceiling_aed) : null,
        faq: draft.faq.filter(f => f.q.trim()),
      })
      toast.success(oc ? "Open call updated" : "Open call is live")
      onOpenChange(false); onSaved()
    } catch (e) { toast.error((e as Error).message || "Could not save") } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{oc ? "Edit the open call" : "Create the open call"}</DialogTitle>
          <DialogDescription>
            What the creator sees in WhatsApp. Never write the brand&apos;s name: describe it instead.
            The budget and ceiling are only for the agent and are never shown.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-2xl bg-muted/40 px-4 py-3">
          <ScoutAvatar size={36} state={drafting ? "working" : "default"} />
          <p className="flex-1 text-sm">
            {drafting ? "ScoutAI is drafting this from the roster's brief…"
              : drafted ? "Drafted by ScoutAI from the brief. Check every line before it goes live."
              : "ScoutAI can draft this from the roster's brief."}
          </p>
          <Button size="sm" variant="outline" className="rounded-full" disabled={drafting} onClick={() => draftFromBrief()}>
            {drafting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : drafted ? "Redraft" : "Draft from the brief"}
          </Button>
        </div>
        <div className={`flex max-h-[58vh] flex-col gap-4 overflow-y-auto pr-1 transition-opacity ${drafting ? "pointer-events-none opacity-40" : ""}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Title"><Input value={draft.title || ""} onChange={e => set({ title: e.target.value })} placeholder="Winter menu launch" /></F>
            <F label="The brand, described">
              <Input value={draft.brand_descriptor || ""} onChange={e => set({ brand_descriptor: e.target.value })}
                     placeholder={brand ? `e.g. a global quick-service restaurant brand (not "${brand}")` : "a global quick-service restaurant brand"} />
            </F>
          </div>
          <F label="What it is"><Textarea rows={3} value={draft.pitch || ""} onChange={e => set({ pitch: e.target.value })}
                                          placeholder="We are looking for Dubai food creators to try the new winter menu and post one reel." /></F>
          <div className="grid gap-4 sm:grid-cols-3">
            <F label="Paid or barter">
              <Select value={draft.comp_mode || "paid"} onValueChange={(v: string) => set({ comp_mode: v as Draft["comp_mode"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="barter">Barter</SelectItem>
                  <SelectItem value="both">Paid, plus product</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label="What we need"><Input value={draft.deliverables || ""} onChange={e => set({ deliverables: e.target.value })} placeholder="1 Instagram reel" /></F>
            <F label="Where"><Input value={draft.location || ""} onChange={e => set({ location: e.target.value })} placeholder="Dubai" /></F>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="When"><Input value={draft.dates || ""} onChange={e => set({ dates: e.target.value })} placeholder="between 10 and 20 November" /></F>
            {draft.comp_mode !== "paid" && (
              <F label="What they get"><Input value={draft.barter_offer || ""} onChange={e => set({ barter_offer: e.target.value })} placeholder="a meal for two" /></F>
            )}
          </div>
          <F label="Who we are looking for">
            <Input value={draft.looking_for || ""} onChange={e => set({ looking_for: e.target.value })} placeholder="younger lifestyle creators, all genders" />
          </F>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">What the agent checks</Label>
            <ScreeningEditor value={draft.screening || EMPTY_SCREENING} onChange={sc => set({ screening: sc })} />
          </div>
          <F label="Picture (optional, a link to an image)"><Input value={draft.image_url || ""} onChange={e => set({ image_url: e.target.value })} placeholder="https://cdn.following.ae/..." /></F>
          {draft.comp_mode !== "barter" && (
            <div className="flex flex-col gap-3 rounded-2xl border p-4">
              <label className="flex items-center justify-between gap-3 text-sm font-medium">
                Ask creators for their rate
                <Switch checked={draft.ask_rate !== false} onCheckedChange={(v: boolean) => set({ ask_rate: v })} />
              </label>
              {draft.ask_rate === false && (
                <>
                  <p className="text-xs text-muted-foreground">ScoutAI states the fee and never asks a rate.</p>
                  <F label="The fee, as creators read it">
                    <Input value={draft.fee_note || ""} onChange={e => set({ fee_note: e.target.value })} placeholder="AED 150 on top" />
                  </F>
                </>
              )}
            </div>
          )}
          {draft.comp_mode !== "barter" && draft.ask_rate !== false && (
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="mb-3 text-xs text-muted-foreground"
                 title="Above the target it counters once. Above the ceiling, or over the follower size, it hands the creator to the talent manager.">
                At or under the target it accepts. Above the ceiling it hands over.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <F label="Target per creator (AED)"><Input inputMode="decimal" value={draft.target_aed ?? ""} onChange={e => set({ target_aed: e.target.value as unknown as number })} placeholder="3500" /></F>
                <F label="Ceiling (AED)"><Input inputMode="decimal" value={draft.ceiling_aed ?? ""} onChange={e => set({ ceiling_aed: e.target.value as unknown as number })} placeholder="5000" /></F>
                <F label="A person handles creators over"><Input inputMode="numeric" value={draft.handover_followers ?? ""} onChange={e => set({ handover_followers: Number(e.target.value) || 0 })} placeholder="500000" /></F>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label className="text-xs">Questions the agent may answer</Label>
            {draft.faq.map((f, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input value={f.q} placeholder="Is it dine-in?" onChange={e => set({ faq: draft.faq.map((x, j) => j === i ? { ...x, q: e.target.value } : x) })} />
                <Input value={f.a} placeholder="Yes, you visit any Dubai branch." onChange={e => set({ faq: draft.faq.map((x, j) => j === i ? { ...x, a: e.target.value } : x) })} />
                <Button size="icon" variant="ghost" onClick={() => set({ faq: draft.faq.filter((_, j) => j !== i) })}><X className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button size="sm" variant="outline" className="self-start rounded-full" onClick={() => set({ faq: [...draft.faq, { q: "", a: "" }] })}>
              <Plus className="mr-1 h-3.5 w-3.5" />Add a question
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button className="rounded-full" onClick={save} disabled={busy || !draft.title?.trim() || !draft.brand_descriptor?.trim() || !draft.pitch?.trim()}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{oc ? "Save" : "Make it live"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
