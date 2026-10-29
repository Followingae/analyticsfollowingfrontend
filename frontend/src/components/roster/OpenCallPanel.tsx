"use client"

/**
 * The roster's open call: the campaign card creators answer in WhatsApp.
 *
 * Talent copy their own link (or the DM with it) and send it to the creators they find. The
 * chat collects the price and lands the answer on this roster. Only a superadmin creates or
 * changes the card; the negotiation bounds are never shown to talent.
 */
import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Copy, Loader2, MessageCircle, Pencil, Plus, Send, Smartphone, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { openCallsApi, type OpenCall } from "@/services/openCallsApi"
import { ConversationsSheet } from "./ConversationsSheet"

type Draft = Partial<OpenCall> & { faq: { q: string; a: string }[] }

const EMPTY: Draft = { title: "", brand_descriptor: "", pitch: "", comp_mode: "paid", deliverables: "", location: "",
                       dates: "", image_url: "", barter_offer: "", target_aed: null, ceiling_aed: null,
                       max_counters: 1, handover_followers: 500000, faq: [], status: "live" }

export function OpenCallPanel({ listId, brand, isSuperadmin, isFounder }: {
  listId: string; brand?: string | null; isSuperadmin: boolean; isFounder: boolean
}) {
  const params = useSearchParams()
  const [oc, setOc] = useState<OpenCall | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [edit, setEdit] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [chats, setChats] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await openCallsApi.forList(listId)
      setOc(r.data)
    } catch { /* the roster still works without it */ } finally { setLoaded(true) }
  }, [listId])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (params?.get("chats") === "1") setChats(true) }, [params])

  const set = (p: Partial<Draft>) => setDraft(d => ({ ...d, ...p }))

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
      setEdit(false); load()
    } catch (e) { toast.error((e as Error).message || "Could not save") } finally { setBusy(false) }
  }

  const copy = async (s: string, what: string) => {
    await navigator.clipboard.writeText(s)
    toast.success(`${what} copied`)
  }

  const myLink = async (dm: boolean) => {
    if (!oc) return
    try {
      const link = oc.my_link || (await openCallsApi.myLink(oc.id)).data.link
      if (!oc.my_link) load()
      if (dm) {
        await copy(`Hi! We have a ${oc.comp_mode === "barter" ? "barter" : "paid"} campaign with ${oc.brand_descriptor}` +
                   `${oc.location ? ` in ${oc.location}` : ""} that fits you really well. All the details, and a quick way to send your rate, are here: ${link}`,
                   "DM")
      } else {
        await copy(link, "Your link")
      }
    } catch (e) { toast.error((e as Error).message || "Could not get your link") }
  }

  const invite = async (channel: "app" | "whatsapp") => {
    if (!oc) return
    setBusy(true)
    try {
      const r = await openCallsApi.invite(oc.id, channel)
      toast.success(`${r.data.invited} ${channel === "app" ? "app creators" : "creators on WhatsApp"} invited`)
    } catch (e) { toast.error((e as Error).message || "Could not invite") } finally { setBusy(false) }
  }

  const outcomes = async () => {
    if (!oc) return
    setBusy(true)
    try {
      const r = await openCallsApi.outcomes(oc.id)
      toast.success(`${r.data.sent.length} creator${r.data.sent.length === 1 ? "" : "s"} told how it went`, {
        description: r.data.not_sent.length ? `Not sent (outside WhatsApp's 24-hour window): ${r.data.not_sent.join(", ")}` : undefined,
      })
      load()
    } catch (e) { toast.error((e as Error).message || "Could not send") } finally { setBusy(false) }
  }

  const setStatus = async (status: "live" | "closed") => {
    setBusy(true)
    try { await openCallsApi.save(listId, { status }); load() }
    catch (e) { toast.error((e as Error).message || "Could not change it") } finally { setBusy(false) }
  }

  if (!loaded) return null
  if (!oc && !isSuperadmin) return null

  return (
    <section className="flex flex-col gap-ds-3 border-t pt-ds-3">
      <div className="flex flex-wrap items-center justify-between gap-ds-2">
        <p className="flex items-center gap-1.5 text-ds-overline uppercase text-muted-foreground">
          <MessageCircle className="h-3.5 w-3.5" />Open call on WhatsApp
          {oc && <span className={`ml-1 rounded-ds-full px-2 py-0.5 normal-case ${oc.status === "live" ? "bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]" : "bg-[var(--tone-neutral-wash)]"}`}>{oc.status === "live" ? "Live" : oc.status === "closed" ? "Closed" : "Draft"}</span>}
        </p>
        {!oc && isSuperadmin && (
          <Button size="sm" className="gap-1.5" onClick={() => { setDraft(EMPTY); setEdit(true) }}>
            <Plus className="h-3.5 w-3.5" />Create an open call
          </Button>
        )}
      </div>

      {!oc ? (
        <p className="text-ds-caption text-muted-foreground">
          A campaign card the talent team sends creators to. The chat collects their price, dates and email and puts them on this roster.
        </p>
      ) : (
        <div className="grid gap-ds-3 md:grid-cols-[1fr_auto]">
          <div className="whitespace-pre-line rounded-ds-lg bg-[var(--tone-neutral-wash)] p-ds-3 text-sm">{oc.card}</div>
          <div className="flex flex-col gap-ds-2 md:w-56">
            <div className="grid grid-cols-3 gap-1 text-center">
              {[["Answered", oc.counts.done], ["In chat", oc.counts.talking], ["Yours now", oc.counts.handover]].map(([l, n]) => (
                <div key={l as string} className="rounded-ds-lg border py-1.5">
                  <div className="text-base font-semibold tabular-nums">{n as number}</div>
                  <div className="text-ds-caption text-muted-foreground">{l as string}</div>
                </div>
              ))}
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => myLink(true)} disabled={oc.status !== "live"}>
              <Copy className="h-3.5 w-3.5" />Copy a DM with my link
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => myLink(false)} disabled={oc.status !== "live"}>
              <Copy className="h-3.5 w-3.5" />Copy my link
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setChats(true)}>
              <MessageCircle className="h-3.5 w-3.5" />Conversations ({oc.counts.total})
            </Button>
            {isSuperadmin && (
              <>
                <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => copy(oc.story_link, "Story link")}>
                  <Copy className="h-3.5 w-3.5" />Copy the story link
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5" disabled={busy || oc.status !== "live"} onClick={() => invite("app")}>
                  <Smartphone className="h-3.5 w-3.5" />Invite app creators
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5" disabled={busy || oc.status !== "live"} onClick={() => invite("whatsapp")}>
                  <Send className="h-3.5 w-3.5" />Invite on WhatsApp
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => {
                  setDraft({ ...EMPTY, ...oc, faq: oc.faq || [] }); setEdit(true)
                }}>
                  <Pencil className="h-3.5 w-3.5" />Edit
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5" disabled={busy} onClick={() => setStatus(oc.status === "live" ? "closed" : "live")}>
                  <X className="h-3.5 w-3.5" />{oc.status === "live" ? "Close it" : "Open it again"}
                </Button>
              </>
            )}
            {isFounder && (
              <Button size="sm" variant="ghost" className="gap-1.5" disabled={busy} onClick={outcomes}>
                <Send className="h-3.5 w-3.5" />Tell creators how it went
              </Button>
            )}
          </div>
        </div>
      )}

      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent className="w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{oc ? "Edit the open call" : "Create an open call"}</DialogTitle>
            <DialogDescription>
              What the creator sees in WhatsApp. Never write the brand’s name: describe it instead.
              The budget and ceiling are only for the agent and are never shown.
            </DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[62vh] flex-col gap-ds-3 overflow-y-auto pr-1">
            <div className="grid gap-ds-3 sm:grid-cols-2">
              <F label="Title"><Input value={draft.title || ""} onChange={e => set({ title: e.target.value })} placeholder="Winter menu launch" /></F>
              <F label="The brand, described">
                <Input value={draft.brand_descriptor || ""} onChange={e => set({ brand_descriptor: e.target.value })}
                       placeholder={brand ? `e.g. a global quick-service restaurant brand (not “${brand}”)` : "a global quick-service restaurant brand"} />
              </F>
            </div>
            <F label="What it is"><Textarea rows={3} value={draft.pitch || ""} onChange={e => set({ pitch: e.target.value })}
                                            placeholder="We are looking for Dubai food creators to try the new winter menu and post one reel." /></F>
            <div className="grid gap-ds-3 sm:grid-cols-3">
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
            <div className="grid gap-ds-3 sm:grid-cols-2">
              <F label="When"><Input value={draft.dates || ""} onChange={e => set({ dates: e.target.value })} placeholder="between 10 and 20 November" /></F>
              {draft.comp_mode !== "paid" && (
                <F label="What they get"><Input value={draft.barter_offer || ""} onChange={e => set({ barter_offer: e.target.value })} placeholder="a meal for two" /></F>
              )}
            </div>
            <F label="Picture (optional, a link to an image)"><Input value={draft.image_url || ""} onChange={e => set({ image_url: e.target.value })} placeholder="https://cdn.following.ae/..." /></F>
            {draft.comp_mode !== "barter" && (
              <div className="rounded-ds-lg bg-[var(--tone-neutral-wash)] p-ds-3">
                <p className="mb-ds-2 text-ds-caption text-muted-foreground">
                  How the agent negotiates. At or under the target it accepts. Above it, it counters once, gently.
                  Above the ceiling, or over the follower size, it hands the creator to the talent manager.
                </p>
                <div className="grid gap-ds-3 sm:grid-cols-3">
                  <F label="Target per creator (AED)"><Input inputMode="decimal" value={draft.target_aed ?? ""} onChange={e => set({ target_aed: e.target.value as unknown as number })} placeholder="3500" /></F>
                  <F label="Ceiling (AED)"><Input inputMode="decimal" value={draft.ceiling_aed ?? ""} onChange={e => set({ ceiling_aed: e.target.value as unknown as number })} placeholder="5000" /></F>
                  <F label="A person handles creators over"><Input inputMode="numeric" value={draft.handover_followers ?? ""} onChange={e => set({ handover_followers: Number(e.target.value) || 0 })} placeholder="500000" /></F>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-ds-2">
              <Label className="text-ds-caption">Questions the agent may answer</Label>
              {draft.faq.map((f, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-ds-2">
                  <Input value={f.q} placeholder="Is it dine-in?" onChange={e => set({ faq: draft.faq.map((x, j) => j === i ? { ...x, q: e.target.value } : x) })} />
                  <Input value={f.a} placeholder="Yes, you visit any Dubai branch." onChange={e => set({ faq: draft.faq.map((x, j) => j === i ? { ...x, a: e.target.value } : x) })} />
                  <Button size="icon" variant="ghost" onClick={() => set({ faq: draft.faq.filter((_, j) => j !== i) })}><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" className="self-start" onClick={() => set({ faq: [...draft.faq, { q: "", a: "" }] })}>
                <Plus className="mr-1 h-3.5 w-3.5" />Add a question
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(false)} disabled={busy}>Cancel</Button>
            <Button onClick={save} disabled={busy || !draft.title?.trim() || !draft.brand_descriptor?.trim() || !draft.pitch?.trim()}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{oc ? "Save" : "Make it live"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {oc && <ConversationsSheet openCallId={oc.id} open={chats} onOpenChange={setChats} founder={isFounder} onChanged={load} />}
    </section>
  )
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1"><Label className="text-ds-caption">{label}</Label>{children}</div>
}
