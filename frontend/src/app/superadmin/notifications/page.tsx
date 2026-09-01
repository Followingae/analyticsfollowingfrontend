"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Send, MailCheck, Search, Users, ShieldAlert, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { CARD, PageHead } from "@/components/console/primitives"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  notificationSettingsApi,
  type NotificationEvent,
  type RecipientCandidate,
  type RuleUpdatePayload,
  type DigestPreview,
} from "@/services/notificationSettingsApi"

// -----------------------------------------------------------------------------
// Per-event editable row
// -----------------------------------------------------------------------------
function EventRow({
  event,
  recipients,
  recipientsFailed,
  onSaved,
}: {
  event: NotificationEvent
  recipients: RecipientCandidate[]
  recipientsFailed: boolean
  onSaved: (e: NotificationEvent) => void
}) {
  const [emailEnabled, setEmailEnabled] = useState(event.email_enabled)
  const [mode, setMode] = useState<'immediate' | 'digest' | 'off'>(event.delivery_mode || 'immediate')
  const [sendToPrimary, setSendToPrimary] = useState(event.send_to_primary)
  const [notifyAllSuperadmins, setNotifyAllSuperadmins] = useState(event.notify_all_superadmins)
  const [userIds, setUserIds] = useState<string[]>(event.recipient_user_ids || [])
  const [emailsText, setEmailsText] = useState((event.recipient_emails || []).join(", "))
  const [subjectOverride, setSubjectOverride] = useState(event.subject_override || "")
  const [saving, setSaving] = useState(false)
  const [testTo, setTestTo] = useState("")
  const [testing, setTesting] = useState(false)

  const parseEmails = (t: string) =>
    Array.from(
      new Set(
        t
          .split(/[\s,;]+/)
          .map((s) => s.trim())
          .filter((s) => s.includes("@")),
      ),
    )

  const dirty = useMemo(() => {
    const base = event
    const emails = parseEmails(emailsText)
    return (
      emailEnabled !== base.email_enabled ||
      mode !== (base.delivery_mode || 'immediate') ||
      sendToPrimary !== base.send_to_primary ||
      notifyAllSuperadmins !== base.notify_all_superadmins ||
      JSON.stringify([...userIds].sort()) !== JSON.stringify([...(base.recipient_user_ids || [])].sort()) ||
      JSON.stringify(emails) !== JSON.stringify(base.recipient_emails || []) ||
      (subjectOverride || "") !== (base.subject_override || "")
    )
  }, [event, emailEnabled, mode, sendToPrimary, notifyAllSuperadmins, userIds, emailsText, subjectOverride])

  const toggleUser = (id: string) =>
    setUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const save = async () => {
    setSaving(true)
    try {
      const payload: RuleUpdatePayload = {
        email_enabled: emailEnabled,
        delivery_mode: emailEnabled ? mode : 'off',
        send_to_primary: sendToPrimary,
        notify_all_superadmins: notifyAllSuperadmins,
        recipient_user_ids: userIds,
        recipient_emails: parseEmails(emailsText),
        subject_override: subjectOverride.trim() || null,
      }
      const updated = await notificationSettingsApi.updateRule(event.event_key, payload)
      onSaved(updated)
      toast.success(`Saved "${event.label}"`)
    } catch (e: any) {
      toast.error(e?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async () => {
    if (!testTo.includes("@")) {
      toast.error("Enter a valid test email address")
      return
    }
    setTesting(true)
    try {
      await notificationSettingsApi.sendTest(event.event_key, { to: testTo })
      toast.success(`Test sent to ${testTo}`)
    } catch (e: any) {
      toast.error(e?.message || "Test send failed")
    } finally {
      setTesting(false)
    }
  }

  return (
    /* One box per event, and now the ONLY box: these rows used to sit inside a card per
       domain, so reading one event's settings meant crossing the domain card's edge, the
       row's edge, and then the edge of whichever setting you were looking at. The domain
       card is gone; its title is a heading over the group. */
    <div className={`${CARD} bg-[var(--tone-neutral-wash)] p-ds-3`}>
      <div className="flex items-start justify-between gap-ds-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{event.label}</span>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              {event.audience === "brand" ? "Brand" : event.audience === "team" ? "Team" : "All"}
            </Badge>
            {emailEnabled ? (
              <Badge className={mode === 'immediate'
                ? "bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)] hover:bg-[var(--tone-good-wash)] text-[10px]"
                : "bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)] hover:bg-[var(--tone-info-wash)] text-[10px]"}>
                {mode === 'immediate' ? 'Sends straight away' : 'In the digest'}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">In-app only</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
          <p className="text-[11px] text-muted-foreground/70 mt-1 font-mono">{event.event_key}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Label htmlFor={`en-${event.event_key}`} className="text-xs text-muted-foreground">Email</Label>
          <Switch id={`en-${event.event_key}`} checked={emailEnabled} onCheckedChange={setEmailEnabled} />
        </div>
      </div>

      {emailEnabled && (
        <div className="mt-4 space-y-4">
          <Separator />
          {/* Whether to email is half the question. The other half is whether it is worth
              interrupting someone for, and getting that wrong is what makes people mute a
              channel entirely. */}
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setMode('immediate')}
                    className={`rounded-md border p-3 text-left transition-colors ${
                      mode === 'immediate' ? 'border-foreground/40 bg-muted/50' : 'hover:bg-muted/30'}`}>
              <span className="text-sm font-medium">Send straight away</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Someone is blocked, or money or a client is waiting
              </span>
            </button>
            <button type="button" onClick={() => setMode('digest')}
                    className={`rounded-md border p-3 text-left transition-colors ${
                      mode === 'digest' ? 'border-foreground/40 bg-muted/50' : 'hover:bg-muted/30'}`}>
              <span className="text-sm font-medium">Put it in the digest</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                One line at 08:30 and 17:30, with everything else
              </span>
            </button>
          </div>
          {/* Two switches, each in its own bordered box, inside a bordered row, inside what
              used to be a bordered card. The boxes said nothing the label did not. The two
              mode buttons above KEEP their borders: those are a choice between two options,
              and the border is what shows which one is picked. */}
          <div className="grid gap-x-ds-5 gap-y-ds-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-between gap-ds-3">
              <span className="text-ds-body">
                Notify natural recipient
                <span className="block text-ds-caption text-muted-foreground">The brand/user the notification is about</span>
              </span>
              <Switch checked={sendToPrimary} onCheckedChange={setSendToPrimary} />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-ds-3">
              <span className="text-ds-body">
                All superadmins
                <span className="block text-ds-caption text-muted-foreground">Every operator account</span>
              </span>
              <Switch checked={notifyAllSuperadmins} onCheckedChange={setNotifyAllSuperadmins} />
            </label>
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1.5 mb-2">
              <Users className="h-3.5 w-3.5" /> Specific team recipients
            </Label>
            <div className="max-h-44 divide-y divide-black/[0.06] overflow-auto rounded-ds-md border border-black/[0.06] dark:divide-white/[0.07] dark:border-white/[0.07]">
              {recipients.length === 0 && (
                /* "No admin/staff users found" over a failed read invites someone to type
                   addresses into the box below to work around a list that is actually fine. */
                <div className="p-3 text-ds-caption text-muted-foreground">
                  {recipientsFailed
                    ? "The team list did not load, so nobody can be ticked here. Whoever is already selected on this event is unaffected."
                    : "No admin or staff users to choose from."}
                </div>
              )}
              {recipients.map((r) => (
                <label key={r.id} className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-muted/40">
                  <Checkbox checked={userIds.includes(r.id)} onCheckedChange={() => toggleUser(r.id)} />
                  <div className="min-w-0">
                    <div className="text-sm truncate">{r.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                  </div>
                  {(r.staff_role || r.role) && (
                    <Badge variant="outline" className="ml-auto text-[10px]">{r.staff_role || r.role}</Badge>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor={`emails-${event.event_key}`} className="text-xs mb-2 block">Extra email addresses</Label>
              <Input
                id={`emails-${event.event_key}`}
                placeholder="ops@brand.com, finance@brand.com"
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">Comma or space separated. External addresses allowed.</p>
            </div>
            <div>
              <Label htmlFor={`subj-${event.event_key}`} className="text-xs mb-2 block">Subject override (optional)</Label>
              <Input
                id={`subj-${event.event_key}`}
                placeholder="Leave blank to use the notification title"
                value={subjectOverride}
                onChange={(e) => setSubjectOverride(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Input
                className="h-9 w-56"
                placeholder="you@following.ae"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
              />
              <Button variant="outline" size="sm" onClick={sendTest} disabled={testing}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="ml-1.5">Test</span>
              </Button>
            </div>
            <Button size="sm" onClick={save} disabled={!dirty || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Save
            </Button>
          </div>
        </div>
      )}

      {!emailEnabled && dirty && (
        <div className="mt-3 flex justify-end">
          <Button size="sm" variant="outline" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            Save
          </Button>
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

/** The digest, in one place: what is queued, and a way to look at a real one. */
function DigestPanel() {
  const [preview, setPreview] = useState<DigestPreview | null>(null)
  // The preview request used to fail into `.catch(() => undefined)`, leaving `preview` null
  // for good — and null is the state this panel renders as "Checking what is queued…". So a
  // failed read sat there claiming to still be working, forever, on a screen whose whole job
  // is to tell you whether anything is about to go out. A failure now says so.
  const [previewFailed, setPreviewFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    notificationSettingsApi.previewDigest(12)
      .then(setPreview)
      .catch(() => setPreviewFailed(true))
  }, [])

  const sendToMe = async () => {
    setBusy(true)
    try {
      const r = await notificationSettingsApi.sendDigestNow({ hours: 12, only_email: "zain@following.ae" })
      toast.success(r.recipients ? "Digest sent to zain@following.ae" : "Nothing to send right now")
    } catch (e: any) {
      toast.error(e?.message || "Could not send")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`${CARD} flex flex-wrap items-center gap-ds-3 bg-[var(--tone-neutral-wash)] p-ds-3`}>
        <div className="min-w-0">
          <div className="text-ds-label">Digest — 08:30 and 17:30, Dubai</div>
          <p className="mt-ds-1 text-ds-body text-muted-foreground">
            {previewFailed
              ? "We could not read what is queued. This is not a count of zero — try again."
              : preview === null
              ? "Checking what is queued…"
              : preview.recipients === 0
                ? "Nothing queued. An empty digest is not sent."
                : `${preview.people.reduce((n: number, p: DigestPreview['people'][number]) => n + p.count, 0)} updates queued for ` +
                  `${preview.recipients} ${preview.recipients === 1 ? "person" : "people"} ` +
                  `(${preview.people.slice(0, 3).map((p: DigestPreview['people'][number]) => p.email.split("@")[0]).join(", ")}` +
                  `${preview.recipients > 3 ? "…" : ""})`}
          </p>
        </div>
        <Button size="sm" variant="outline" className="ml-auto" onClick={sendToMe} disabled={busy}>
          {busy ? "Sending…" : "Send me one now"}
        </Button>
    </div>
  )
}

export default function SuperadminNotificationsPage() {
  const [events, setEvents] = useState<NotificationEvent[]>([])
  const [domains, setDomains] = useState<string[]>([])
  const [recipients, setRecipients] = useState<RecipientCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  /**
   * The two counts in the header were derived from `events`, and the catch set `events` to
   * an empty array. So a failed load rendered "0 of the 0 live events are in the digest" and
   * a badge reading "0 events enabled" — a confident statement that every alert on the
   * platform is switched off, made by a screen that never got an answer. Both are dashes now,
   * and the page says which of the two reads failed.
   */
  const [failure, setFailure] = useState<string | null>(null)
  // The recipient list failed into `.catch(() => [])`, which the picker renders as "No
  // admin/staff users found" — an empty roster where the real one could not be read.
  const [recipientsFailed, setRecipientsFailed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ev, rc] = await Promise.all([
        notificationSettingsApi.listEvents(),
        notificationSettingsApi.listRecipients()
          .catch(() => { setRecipientsFailed(true); return [] as RecipientCandidate[] }),
      ])
      setEvents(ev.events)
      setDomains(ev.domains)
      setRecipients(rc)
      setFailure(null)
    } catch (e: any) {
      toast.error(e?.message || "Could not load the alert settings")
      setEvents([])
      setDomains([])
      setFailure(e?.message || "The request did not complete")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onSaved = (updated: NotificationEvent) =>
    setEvents((prev) => prev.map((e) => (e.event_key === updated.event_key ? { ...e, ...updated } : e)))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return events
    return events.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.event_key.toLowerCase().includes(q) ||
        e.domain.toLowerCase().includes(q),
    )
  }, [events, search])

  const enabledCount = events.filter((e) => e.email_enabled).length
  const digestCount = events.filter((e) => e.email_enabled && e.delivery_mode === "digest").length

  const grouped = useMemo(() => {
    const orderedDomains = domains.length ? domains : Array.from(new Set(events.map((e) => e.domain)))
    return orderedDomains
      .map((d) => ({ domain: d, items: filtered.filter((e) => e.domain === d) }))
      .filter((g) => g.items.length > 0)
  }, [domains, events, filtered])

  return (
    <SuperadminLayout>
      <div className="mx-auto w-full max-w-5xl space-y-ds-5 p-ds-3 md:p-ds-4">
        <PageHead
          title="Email alerts"
          sub={
            failure
              ? "Control which platform events send email, how it arrives, and who receives it. An event either interrupts someone straight away, or waits and arrives as one line in the twice-daily digest."
              : `Control which platform events send email, how it arrives, and who receives it. An event either interrupts someone straight away, or waits and arrives as one line in the twice-daily digest. ${digestCount} of the ${enabledCount} live events are in the digest, which is what stops a busy day turning into thirty emails.`
          }
          action={
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
              <MailCheck className="h-4 w-4" />
              {failure
                ? "count unknown"
                : `${enabledCount} event${enabledCount === 1 ? "" : "s"} enabled`}
            </Badge>
          }
        />

        {failure && (
          <div className="flex flex-wrap items-center gap-ds-3">
            <div className="min-w-0">
              <p className="text-ds-label">Could not load the alert settings</p>
              <p className="mt-ds-1 text-ds-body-sm text-muted-foreground">
                Every rule is still in force exactly as it was: this screen failed to read them,
                it did not switch anything off. {failure}
              </p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={load}>
              <RefreshCw className="mr-1.5 h-4 w-4" />Try again
            </Button>
          </div>
        )}

        <DigestPanel />

        {/* Intro / how it works */}
        <div className="flex gap-ds-3 text-ds-body text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              Emails are sent via Resend and always CC <span className="font-mono">zain@following.ae</span>. For team
              events that already fan out to every operator, prefer <span className="font-medium">Notify natural
              recipient</span> rather than <span className="font-medium">All superadmins</span> to avoid duplicate
              emails. Creators (mobile app) are never emailed here — they receive push notifications.
            </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : failure ? null : grouped.length === 0 ? (
          <p className="py-ds-6 text-center text-ds-body text-muted-foreground">
            {search ? `No event matches "${search}".` : "No events are configured."}
          </p>
        ) : (
          grouped.map((g) => (
            /* The domain was a card wrapped around cards. It is a heading now: the domain
               name over its events, with the section gap doing the separating. */
            <section key={g.domain} className="space-y-ds-2">
              <h2 className="text-ds-overline uppercase text-muted-foreground">{g.domain}</h2>
              <div className="space-y-ds-2">
                {g.items.map((e) => (
                  <EventRow key={e.event_key} event={e} recipients={recipients}
                            recipientsFailed={recipientsFailed} onSaved={onSaved} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </SuperadminLayout>
  )
}
