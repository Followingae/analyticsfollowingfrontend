"use client"

/**
 * Column 2, Reach: who is being contacted and what needs a person. The WhatsApp alert to our
 * network and the Instagram search run themselves; found creators wait here for approve or
 * skip, ScoutAI's unsure answers wait here for send or drop, and every reply shows as it lands.
 */
import * as React from "react"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, ChevronDown, Clock, Instagram, Loader2, MessageCircle, RefreshCw, Send, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { scoutApi, type HeldAnswer, type ScoutOutreachItem, type ScoutRosterPlan } from "@/services/scoutApi"
import { Face, Scanning } from "./outreachParts"
import { WorkerPill, ago, compact } from "./WorkerPill"

function Block({ title, count, aside, children, tone = "plain" }: {
  title: string; count?: number; aside?: React.ReactNode; children: React.ReactNode; tone?: "plain" | "needs"
}) {
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-4 ${tone === "needs" ? "border-[#c8f000] bg-[#d3ff02]/10" : "bg-background"}`}>
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        {count != null && <span className="text-xs font-semibold tabular-nums">{count.toLocaleString()}</span>}
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </div>
  )
}

function Row({ c, onOpen, children, sub }: { c: ScoutOutreachItem | HeldAnswer; onOpen: (u: string) => void; children?: React.ReactNode; sub?: string | null }) {
  return (
    <div className="flex items-start gap-2.5">
      <button type="button" onClick={() => onOpen(c.username)} className="shrink-0 rounded-full"><Face c={c} size={32} /></button>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => onOpen(c.username)} className="flex max-w-full items-baseline gap-2 text-left text-sm hover:underline">
          <span className="truncate font-medium">@{c.username}</span>
          {c.followers != null && <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{compact(c.followers)}</span>}
        </button>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

type SearchPlan = { hashtags: string[]; lookalikes: boolean; max_new: number }

function searchSentence(s: SearchPlan) {
  const tags = s.hashtags.map(t => `#${t}`)
  if (!tags.length) return s.lookalikes ? "Look-alikes of creators who fit" : ""
  const head = tags.length <= 2 ? tags.join(" and ") : `${tags.slice(0, 2).join(", ")} and ${tags.length - 2} more`
  return `${head}${s.lookalikes ? ", plus look-alikes" : ""}`
}

function Lanes({ listId, plan, canEdit, onChanged }: { listId: string; plan: ScoutRosterPlan; canEdit: boolean; onChanged: () => void }) {
  const [s, setS] = useState<SearchPlan | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { scoutApi.suggest(listId).then(r => setS(r.data)).catch(() => setS(null)) }, [listId])
  const { matching, already_alerted, to_send } = plan.contacts
  const live = plan.open_call?.status === "live"
  const again = async () => {
    setBusy(true)
    try {
      await scoutApi.source(listId, { lookalikes: s?.lookalikes ?? true, hashtags: s?.hashtags ?? [], max_new: s?.max_new || 200 })
      toast.success("Scout is searching"); onChanged()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <Block title="Two lanes" aside={<WorkerPill w={plan.worker} />}>
      <div className="flex items-start gap-2.5 text-sm">
        <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="min-w-0">
          <span className="font-semibold tabular-nums">{already_alerted.toLocaleString()}</span> alerted on WhatsApp
          {!live ? <span className="block text-xs text-muted-foreground">Starts when the open call is live</span>
            : !plan.template_approved ? <span className="block text-xs text-amber-800">Waiting for Meta to approve the message</span>
            : to_send > 0 ? <span className="block text-xs text-muted-foreground">{to_send.toLocaleString()} more going out by themselves</span>
            : matching > 0 ? <span className="block text-xs text-muted-foreground">Everyone who fits has it</span> : null}
        </p>
      </div>
      <div className="flex items-start gap-2.5 text-sm">
        <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p><span className="font-semibold tabular-nums">{plan.dm.sent.toLocaleString()}</span> DMs sent, <span className="tabular-nums">{plan.dm.replied.toLocaleString()}</span> replied</p>
          {plan.sourcing.running ? <div className="mt-2"><Scanning note={plan.sourcing.last_note} /></div> : (
            <p className="text-xs text-muted-foreground">
              {s ? `Searching ${searchSentence(s)}` : ""}
              {canEdit && (
                <button type="button" disabled={busy} onClick={again}
                        className={`${s ? "ml-2 " : ""}inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline disabled:opacity-50`}>
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}Search again now
                </button>
              )}
            </p>
          )}
        </div>
      </div>
    </Block>
  )
}

function ToApprove({ items, canEdit, onOpen, onChanged }: { items: ScoutOutreachItem[]; canEdit: boolean; onOpen: (u: string) => void; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [all, setAll] = useState(false)
  if (items.length === 0) return null
  const decide = async (ids: string[], d: "approve" | "skip") => {
    setBusy(ids.join(","))
    try {
      await scoutApi.decide(ids, d)
      toast.success(d === "approve" ? `${ids.length} approved, the bot sends them at human pace` : `${ids.length} skipped`)
      onChanged()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(null) }
  }
  const shown = all ? items : items.slice(0, 6)
  return (
    <Block title="Found, waiting for your yes" count={items.length} tone="needs"
           aside={canEdit && items.length > 1 ? (
             <Button size="sm" variant="outline" className="h-7 gap-1 rounded-full bg-background px-2.5 text-xs" disabled={!!busy}
                     onClick={() => decide(items.map(i => i.id), "approve")}>
               <Check className="h-3 w-3" />Approve all
             </Button>
           ) : null}>
      <div className="flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {shown.map(c => (
            <motion.div key={c.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
              <Row c={c} onOpen={onOpen} sub={c.fit_reason || c.summary}>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7 rounded-full bg-background" aria-label="Approve the DM" disabled={!!busy} onClick={() => decide([c.id], "approve")}>
                      {busy === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" aria-label="Skip" disabled={!!busy} onClick={() => decide([c.id], "skip")}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </Row>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {!all && items.length > 6 && (
        <button type="button" onClick={() => setAll(true)} className="self-start text-xs text-muted-foreground underline-offset-2 hover:underline">
          {items.length - 6} more
        </button>
      )}
    </Block>
  )
}

function HeldRow({ h, onOpen, onChanged }: { h: HeldAnswer; onOpen: (u: string) => void; onChanged: () => void }) {
  const [text, setText] = useState(h.body)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  useEffect(() => { if (!editing) setText(h.body) }, [h.body, editing])
  const act = async (a: "send" | "discard") => {
    setBusy(true)
    try {
      await scoutApi.reply(h.id, a, a === "send" ? text : undefined)
      toast.success(a === "send" ? `Answer to @${h.username} goes at the bot's next slot` : "Dropped, write to them yourself")
      onChanged()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-background p-3">
      <Row c={h} onOpen={onOpen} sub={h.replied_at ? `replied ${ago(h.replied_at)} ago` : null} />
      {h.reply_text && <p className="line-clamp-3 rounded-xl border bg-muted/30 px-3 py-2 text-xs">{h.reply_text}</p>}
      {editing ? (
        <Textarea rows={4} value={text} onChange={e => setText(e.target.value)} className="text-xs" />
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="rounded-xl bg-foreground px-3 py-2 text-left text-xs text-background hover:opacity-90" title="Click to edit">
          {text}
        </button>
      )}
      <div className="flex items-center gap-2">
        <Button size="sm" className="h-7 flex-1 gap-1.5 rounded-full text-xs" disabled={busy || !text.trim()} onClick={() => act("send")}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}Send
        </Button>
        <Button size="sm" variant="ghost" className="h-7 gap-1.5 rounded-full text-xs" disabled={busy} onClick={() => act("discard")}>
          <Trash2 className="h-3 w-3" />Drop
        </Button>
      </div>
    </div>
  )
}

function Held({ items, onOpen, onChanged }: { items: HeldAnswer[]; onOpen: (u: string) => void; onChanged: () => void }) {
  if (items.length === 0) return null
  return (
    <Block title="ScoutAI was not sure, you decide" count={items.length} tone="needs">
      <div className="flex flex-col gap-2">
        {items.map(h => <HeldRow key={h.id} h={h} onOpen={onOpen} onChanged={onChanged} />)}
      </div>
    </Block>
  )
}

function Fold({ title, count, items, onOpen, sub, defaultOpen = false }: {
  title: string; count: number; items: ScoutOutreachItem[]; onOpen: (u: string) => void
  sub: (c: ScoutOutreachItem) => string | null; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (count === 0) return null
  return (
    <Block title={title} count={count} aside={
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="text-muted-foreground">
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
    }>
      {!open ? (
        <div className="flex -space-x-2">{items.slice(0, 8).map(c => <Face key={c.id} c={c} size={26} ring />)}</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.slice(0, 40).map(c => <Row key={c.id} c={c} onOpen={onOpen} sub={sub(c)} />)}
          {items.length > 40 && <p className="text-xs text-muted-foreground">and {items.length - 40} more in Everyone below</p>}
        </div>
      )}
    </Block>
  )
}

export function BoardReach({ listId, plan, items, held, canEdit, onOpen, onChanged }: {
  listId: string; plan: ScoutRosterPlan | null; items: ScoutOutreachItem[]; held: HeldAnswer[]
  canEdit: boolean; onOpen: (u: string) => void; onChanged: () => void
}) {
  const proposed = items.filter(i => i.status === "proposed")
  const queued = items.filter(i => i.status === "approved" || i.status === "sending")
  const replied = items.filter(i => i.status === "replied")
  const waiting = items.filter(i => i.status === "sent")
  if (!plan) return <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
  return (
    <>
      <Lanes listId={listId} plan={plan} canEdit={canEdit} onChanged={onChanged} />
      <ToApprove items={proposed} canEdit={canEdit} onOpen={onOpen} onChanged={onChanged} />
      <Held items={held} onOpen={onOpen} onChanged={onChanged} />
      <Fold title="Replied" count={replied.length} items={replied} onOpen={onOpen} defaultOpen
            sub={c => c.reply_text ? `"${c.reply_text}"` : c.replied_at ? `replied ${ago(c.replied_at)} ago` : null} />
      <Fold title="Up next for the bot" count={queued.length} items={queued} onOpen={onOpen}
            sub={c => c.status === "sending" ? "sending now" : (c.fit_reason ?? null)} />
      <Fold title="Sent, waiting" count={waiting.length} items={waiting} onOpen={onOpen}
            sub={c => c.sent_at ? `sent ${ago(c.sent_at)} ago · follow-ups go by themselves` : null} />
      {proposed.length + held.length + replied.length + queued.length + waiting.length === 0 && (
        <p className="flex items-center gap-2 px-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />Nobody reached by DM yet. The search fills this.</p>
      )}
    </>
  )
}
