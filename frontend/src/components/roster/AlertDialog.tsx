"use client"

/**
 * Send the campaign alert on WhatsApp: the one Meta-approved "New barter campaign alert",
 * with this campaign in it. A test to one number first, then the contacts. Superadmin only.
 * Nobody is alerted twice for the same open call, and anyone who opted out is never sent it.
 */
import * as React from "react"
import { useEffect, useState } from "react"
import { CheckCircle2, Clock, Loader2, Send, Smartphone, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { openCallsApi, type AlertInfo } from "@/services/openCallsApi"

export function CampaignAlertDialog({ openCallId, open, onOpenChange, onSent }: {
  openCallId: string; open: boolean; onOpenChange: (o: boolean) => void; onSent?: () => void
}) {
  const [info, setInfo] = useState<AlertInfo | null>(null)
  const [mode, setMode] = useState<"test" | "contacts">("test")
  const [phone, setPhone] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) { setConfirm(false); return }
    setInfo(null)
    openCallsApi.alert(openCallId).then(r => setInfo(r.data)).catch(e => toast.error((e as Error).message))
  }, [open, openCallId])

  const reach = !info ? 0 : tags.length === 0 ? info.contacts
    : Math.min(info.contacts, info.tags.filter(t => tags.includes(t.tag)).reduce((a, t) => a + t.n, 0))

  const send = async () => {
    if (mode === "contacts" && !confirm) { setConfirm(true); return }
    setBusy(true)
    try {
      const r = await openCallsApi.sendAlert(openCallId, mode === "test" ? { to: "test", phone } : { to: "contacts", tags })
      toast.success(mode === "test" ? "Test sent to " + phone : `${r.data.queued.toLocaleString()} alerts on their way`,
                    { description: mode === "contacts" ? "Five a second. Anyone already alerted for this campaign is skipped." : undefined })
      onSent?.()
      onOpenChange(false)
    } catch (e) { toast.error((e as Error).message || "Could not send") } finally { setBusy(false); setConfirm(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Send the campaign alert</DialogTitle>
          <DialogDescription>From the Following marketing number. Tapping “I’m interested” starts the conversation.</DialogDescription>
        </DialogHeader>

        {!info ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid gap-ds-4 md:grid-cols-[1fr_1fr]">
            {/* The message, as it lands */}
            <div className="rounded-ds-lg bg-[#efeae2] p-ds-3">
              <div className="max-w-[320px] rounded-lg rounded-tl-none bg-white p-3 text-[13px] leading-relaxed shadow-sm">
                <p className="whitespace-pre-line">{info.text.split("\n\n[")[0].replace(/\*/g, "")}</p>
                <div className="mt-3 grid gap-1 border-t pt-2 text-center text-[13px] font-medium text-[#027eb5]">
                  <span>I’m interested</span><span className="border-t pt-1">Not for me</span>
                </div>
              </div>
              <p className={`mt-ds-3 inline-flex items-center gap-1.5 rounded-ds-full px-2.5 py-1 text-xs ${info.approved
                ? "bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]" : "bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]"}`}>
                {info.approved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                {info.approved ? "Approved by Meta" : "Waiting on Meta’s approval"}
              </p>
            </div>

            {/* Who it goes to */}
            <div className="flex flex-col gap-ds-3">
              <div className="grid grid-cols-2 gap-ds-2">
                {([["test", Smartphone, "A test to me"], ["contacts", Users, "My contacts"]] as const).map(([id, Icon, label]) => (
                  <button key={id} type="button" onClick={() => { setMode(id); setConfirm(false) }}
                          className={`flex flex-col items-start gap-ds-2 rounded-ds-lg border p-ds-3 text-left transition ${mode === id
                            ? "border-foreground" : "hover:border-foreground/30"}`}>
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {mode === "test" ? (
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 50 123 4567" inputMode="tel" />
              ) : (
                <div className="flex flex-col gap-ds-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-semibold tabular-nums">{tags.length > 1 ? "Up to " : ""}{reach.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{info.sent ? `${info.sent.toLocaleString()} already alerted` : "contacts"}</span>
                  </div>
                  <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                    <button type="button" onClick={() => setTags([])}
                            className={`rounded-ds-full border px-2.5 py-1 text-xs ${tags.length === 0 ? "border-foreground bg-foreground text-background" : ""}`}>
                      Everyone
                    </button>
                    {info.tags.map(t => {
                      const on = tags.includes(t.tag)
                      return (
                        <button key={t.tag} type="button"
                                onClick={() => setTags(on ? tags.filter(x => x !== t.tag) : [...tags, t.tag])}
                                className={`rounded-ds-full border px-2.5 py-1 text-xs ${on ? "border-foreground bg-foreground text-background" : ""}`}>
                          {t.tag} <span className="opacity-60">{t.n}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={send} className="gap-1.5"
                  disabled={busy || !info || !info.approved || !info.live || (mode === "test" && phone.replace(/\D/g, "").length < 9)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {mode === "test" ? "Send the test" : confirm ? `Yes, send to ${reach.toLocaleString()}` : `Send to ${reach.toLocaleString()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
