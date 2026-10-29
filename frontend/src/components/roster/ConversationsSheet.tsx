"use client"

/**
 * Every WhatsApp conversation on an open call, and the one you open, in full.
 *
 * A conversation the agent handed over sits at the top. Writing into it takes it over: the
 * agent stops answering that creator until you hand it back. Talent see a masked number;
 * the founders see the real one.
 */
import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { openCallsApi, type OpenCallConversation } from "@/services/openCallsApi"

const STATE: Record<string, { label: string; tone: string }> = {
  collecting: { label: "In chat", tone: "bg-[var(--tone-info-wash)]" },
  countered: { label: "Countered", tone: "bg-[var(--tone-info-wash)]" },
  done: { label: "Answered", tone: "bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]" },
  declined: { label: "Not interested", tone: "bg-[var(--tone-neutral-wash)]" },
  handover: { label: "Yours now", tone: "bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]" },
  human: { label: "You are talking", tone: "bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]" },
  closed: { label: "Closed", tone: "bg-[var(--tone-neutral-wash)]" },
}

function when(v?: string | null) {
  return v ? new Date(v).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""
}

export function ConversationsSheet({ openCallId, open, onOpenChange, founder, onChanged }: {
  openCallId: string; open: boolean; onOpenChange: (o: boolean) => void; founder: boolean; onChanged?: () => void
}) {
  const [list, setList] = useState<OpenCallConversation[]>([])
  const [loading, setLoading] = useState(false)
  const [sel, setSel] = useState<string | null>(null)
  const [thread, setThread] = useState<Awaited<ReturnType<typeof openCallsApi.conversation>>["data"] | null>(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setList((await openCallsApi.conversations(openCallId)).data.conversations) }
    catch (e) { toast.error((e as Error).message || "Could not load the conversations") }
    finally { setLoading(false) }
  }, [openCallId])
  useEffect(() => { if (open) { setSel(null); load() } }, [open, load])

  const openThread = async (id: string) => {
    setSel(id); setThread(null); setDraft("")
    try { setThread((await openCallsApi.conversation(id)).data) }
    catch (e) { toast.error((e as Error).message || "Could not open it") }
  }

  const send = async () => {
    if (!sel || !draft.trim()) return
    setBusy(true)
    try {
      await openCallsApi.reply(sel, draft.trim())
      setDraft(""); await openThread(sel); load(); onChanged?.()
    } catch (e) { toast.error((e as Error).message || "Could not send") } finally { setBusy(false) }
  }

  const handBack = async () => {
    if (!sel) return
    setBusy(true)
    try { await openCallsApi.handBack(sel); toast.success("The agent has it again"); await openThread(sel); load(); onChanged?.() }
    catch (e) { toast.error((e as Error).message || "Could not hand it back") } finally { setBusy(false) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{sel && thread ? `@${thread.handle || "creator"}` : "Conversations"}</SheetTitle>
          <SheetDescription>
            {sel ? (founder ? [thread?.phone, thread?.email].filter(Boolean).join(" · ") : thread?.phone || "")
                 : "Creators answering this open call on WhatsApp."}
          </SheetDescription>
        </SheetHeader>

        {!sel ? (
          <div className="mt-ds-3 flex-1 overflow-y-auto">
            {loading && !list.length ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : list.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Nobody has answered yet. Send your link to the creators you find.</p>
            ) : list.map(c => (
              <button key={c.id} type="button" onClick={() => openThread(c.id)}
                      className="flex w-full flex-col gap-0.5 border-b px-1 py-2.5 text-left last:border-0 hover:bg-muted/40">
                <span className="flex items-center justify-between gap-ds-2">
                  <span className="truncate text-sm font-medium">@{c.handle || c.phone}</span>
                  <span className={`shrink-0 rounded-ds-full px-2 py-0.5 text-ds-caption ${STATE[c.state]?.tone}`}>{STATE[c.state]?.label}</span>
                </span>
                <span className="truncate text-ds-caption text-muted-foreground">
                  {c.state === "handover" && c.handover_reason ? c.handover_reason + " · " : ""}
                  {c.asked != null ? `asked ${c.asked} ${c.currency || "AED"}` : ""}
                  {c.agreed != null ? ` · agreed ${c.agreed}` : ""}
                  {c.owner_email ? ` · ${c.owner_email.split("@")[0]}’s link` : " · story or invite"}
                </span>
                {c.last_message && <span className="truncate text-ds-caption text-muted-foreground">“{c.last_message}”</span>}
              </button>
            ))}
          </div>
        ) : (
          <>
            <Button variant="ghost" size="sm" className="mt-ds-2 self-start gap-1.5" onClick={() => { setSel(null); load() }}>
              <ArrowLeft className="h-4 w-4" />All conversations
            </Button>
            <div className="flex-1 overflow-y-auto">
              {!thread ? (
                <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="flex flex-col gap-ds-2 py-ds-2">
                  {thread.messages.map((m, i) => (
                    <div key={i} className={`max-w-[85%] whitespace-pre-line rounded-ds-lg px-3 py-2 text-sm ${
                      m.direction === "in" ? "self-start bg-[var(--tone-neutral-wash)]" : "self-end bg-[var(--tone-info-wash)]"}`}>
                      {m.body}
                      <span className="mt-1 block text-ds-caption text-muted-foreground">
                        {m.direction === "out" ? (m.author === "agent" ? "Agent" : m.author) : "Creator"} · {when(m.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {thread && (
              <div className="flex flex-col gap-ds-2 border-t pt-ds-3">
                {!thread.window_open ? (
                  <p className="text-ds-caption text-muted-foreground">
                    WhatsApp only allows a free reply within 24 hours of the creator’s last message. They need to message first.
                  </p>
                ) : (
                  <>
                    <Textarea rows={3} value={draft} onChange={e => setDraft(e.target.value)}
                              placeholder="Write to the creator. The agent stops answering them once you do." />
                    <div className="flex justify-end gap-ds-2">
                      {thread.state === "human" && (
                        <Button variant="outline" size="sm" onClick={handBack} disabled={busy}>Hand back to the agent</Button>
                      )}
                      <Button size="sm" className="gap-1.5" onClick={send} disabled={busy || !draft.trim()}>
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Send
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
