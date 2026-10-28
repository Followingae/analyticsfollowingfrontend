"use client"

/**
 * A creator across every campaign: every price they gave us, what we paid, where they were
 * let go and why, and what working with them is like. Opened from a roster row.
 *
 * Contact details are written by anyone sourcing and read only by the founders. Talent sees
 * that a number is on file, never the number.
 */
import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { Loader2, Lock, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { rosterSheetApi, type CreatorHistory } from "@/services/imdListsApi"
import { BUNDLE_LABEL, aed, amount } from "./rosterFormat"

const SUGGESTED_TAGS = ["Reliable", "Delivers on time", "Strong relationship", "Repeat collaborator",
                        "Great work ethic", "Slow to reply", "Open to barter"]

function day(v?: string | null) {
  return v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""
}

export function CreatorPanel({ influencerId, username, open, onOpenChange, founder, onChanged }: {
  influencerId: string | null
  username?: string
  open: boolean
  onOpenChange: (o: boolean) => void
  founder: boolean
  onChanged?: () => void
}) {
  const [h, setH] = useState<CreatorHistory | null>(null)
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState("")
  const [contact, setContact] = useState<{ contact_phone: string | null; contact_email: string | null } | null>(null)
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!influencerId) return
    setLoading(true)
    try {
      const res = await rosterSheetApi.history(influencerId)
      setH(res.data)
      setTags(res.data.creator.relationship_tags || [])
      if (founder) {
        const c = await rosterSheetApi.getContact(influencerId).catch(() => null)
        setContact(c?.data ?? null)
      }
    } catch (e) {
      toast.error((e as Error).message || "Could not load this creator")
    } finally {
      setLoading(false)
    }
  }, [influencerId, founder])

  useEffect(() => { if (open) { setPhone(""); setEmail(""); setContact(null); load() } }, [open, load])

  const saveTags = async (next: string[]) => {
    if (!influencerId) return
    setTags(next)
    try {
      await rosterSheetApi.setRelationship(influencerId, { tags: next, gender: h?.creator.gender ?? null, languages: h?.creator.languages || [] })
      onChanged?.()
    } catch (e) {
      toast.error((e as Error).message || "Could not save")
    }
  }

  const saveContact = async () => {
    if (!influencerId) return
    setBusy(true)
    try {
      await rosterSheetApi.setContact(influencerId, { phone: phone.trim() || undefined, email: email.trim() || undefined })
      toast.success(founder ? "Saved" : "Saved. Only the founders can see it.")
      setPhone(""); setEmail("")
      load(); onChanged?.()
    } catch (e) {
      toast.error((e as Error).message || "Could not save")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>@{h?.creator.username || username}</SheetTitle>
          <SheetDescription>Everything we know about working with them.</SheetDescription>
        </SheetHeader>

        {loading && !h ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : h && (
          <div className="mt-ds-4 flex flex-col gap-ds-5">
            <section className="flex flex-col gap-ds-2">
              <p className="text-ds-overline uppercase text-muted-foreground">Working with them</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-ds-full bg-[var(--tone-good-wash)] px-2.5 py-0.5 text-ds-caption text-[var(--tone-good-ink)]">
                    {t}
                    <button type="button" aria-label={`Remove ${t}`} onClick={() => saveTags(tags.filter(x => x !== t))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(t => (
                  <button key={t} type="button" onClick={() => saveTags([...tags, t])}
                          className="rounded-ds-full border border-dashed px-2.5 py-0.5 text-ds-caption text-muted-foreground hover:text-foreground">
                    + {t}
                  </button>
                ))}
              </div>
              <form className="flex gap-ds-2" onSubmit={e => { e.preventDefault(); const t = tagDraft.trim(); if (t && !tags.includes(t)) saveTags([...tags, t]); setTagDraft("") }}>
                <Input className="h-8" value={tagDraft} onChange={e => setTagDraft(e.target.value)} placeholder="Another word for them" />
                <Button size="sm" variant="outline" type="submit" disabled={!tagDraft.trim()}>Add</Button>
              </form>
            </section>

            <section className="flex flex-col gap-ds-2">
              <p className="text-ds-overline uppercase text-muted-foreground">Prices they have given us</p>
              {h.quotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">None recorded yet.</p>
              ) : (
                <ul className="flex flex-col">
                  {h.quotes.map(q => (
                    <li key={q.id} className="flex items-baseline justify-between gap-ds-3 border-b py-2 last:border-0">
                      <span className="min-w-0">
                        <span className="block text-sm">
                          {q.agreed != null ? <>agreed {amount(q.agreed, q.currency)}</> : <>asked {amount(q.asked, q.currency)}</>}
                          {q.agreed != null && q.asked != null && q.asked !== q.agreed && (
                            <span className="text-muted-foreground"> (asked {amount(q.asked, q.currency)})</span>
                          )}
                        </span>
                        <span className="block truncate text-ds-caption text-muted-foreground">
                          {[q.context || q.roster, q.bundle ? BUNDLE_LABEL[q.bundle] : null,
                            q.currency !== "AED" ? aed(q.agreed_aed_cents ?? q.asked_aed_cents) : null,
                            q.source === "import" ? "from the old sheet" : null].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className="shrink-0 text-ds-caption text-muted-foreground">{day(q.captured_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {h.campaigns.length > 0 && (
              <section className="flex flex-col gap-ds-2">
                <p className="text-ds-overline uppercase text-muted-foreground">Campaigns with us</p>
                <ul className="flex flex-col">
                  {h.campaigns.map((c, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-ds-3 border-b py-2 text-sm last:border-0">
                      <span>{c.campaign}</span>
                      <span className="text-muted-foreground">{c.agreed_rate_cents ? aed(c.agreed_rate_cents) : c.stage}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {h.rosters.some(r => r.talent_reason || r.struck_reason || r.dropped_reason) && (
              <section className="flex flex-col gap-ds-2">
                <p className="text-ds-overline uppercase text-muted-foreground">Passed on before</p>
                <ul className="flex flex-col gap-1.5">
                  {h.rosters.filter(r => r.talent_reason || r.struck_reason || r.dropped_reason).map((r, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium">{r.brand || r.roster}</span>
                      <span className="text-muted-foreground">
                        {r.dropped_reason ? `: the client said “${r.dropped_reason}”`
                          : r.struck_reason ? `: taken off, ${r.struck_reason}`
                          : `: not for that one, ${r.talent_reason}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="flex flex-col gap-ds-2">
              <p className="flex items-center gap-1.5 text-ds-overline uppercase text-muted-foreground">
                <Lock className="h-3 w-3" />Contact, founders only
              </p>
              {founder && contact && (contact.contact_phone || contact.contact_email) ? (
                <p className="text-sm">{[contact.contact_phone, contact.contact_email].filter(Boolean).join(" · ")}</p>
              ) : !founder && h.creator.has_contact ? (
                <p className="text-sm text-muted-foreground">A contact is on file.</p>
              ) : null}
              <div className="grid grid-cols-2 gap-ds-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-ds-caption">WhatsApp number</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 50 123 4567" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-ds-caption">Email</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
                </div>
              </div>
              <Button size="sm" variant="outline" className="self-start" onClick={saveContact}
                      disabled={busy || (!phone.trim() && !email.trim())}>
                {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Save contact
              </Button>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
