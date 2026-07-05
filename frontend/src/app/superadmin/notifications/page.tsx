"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Bell, Loader2, Send, MailCheck, Search, Users, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "@/services/notificationSettingsApi"

// -----------------------------------------------------------------------------
// Per-event editable row
// -----------------------------------------------------------------------------
function EventRow({
  event,
  recipients,
  onSaved,
}: {
  event: NotificationEvent
  recipients: RecipientCandidate[]
  onSaved: (e: NotificationEvent) => void
}) {
  const [emailEnabled, setEmailEnabled] = useState(event.email_enabled)
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
      sendToPrimary !== base.send_to_primary ||
      notifyAllSuperadmins !== base.notify_all_superadmins ||
      JSON.stringify([...userIds].sort()) !== JSON.stringify([...(base.recipient_user_ids || [])].sort()) ||
      JSON.stringify(emails) !== JSON.stringify(base.recipient_emails || []) ||
      (subjectOverride || "") !== (base.subject_override || "")
    )
  }, [event, emailEnabled, sendToPrimary, notifyAllSuperadmins, userIds, emailsText, subjectOverride])

  const toggleUser = (id: string) =>
    setUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const save = async () => {
    setSaving(true)
    try {
      const payload: RuleUpdatePayload = {
        email_enabled: emailEnabled,
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
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{event.label}</span>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              {event.audience === "brand" ? "Brand" : event.audience === "team" ? "Team" : "All"}
            </Badge>
            {emailEnabled ? (
              <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 text-[10px]">Email on</Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Off</Badge>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3 rounded-md border p-3 cursor-pointer">
              <span className="text-sm">
                Notify natural recipient
                <span className="block text-xs text-muted-foreground">The brand/user the notification is about</span>
              </span>
              <Switch checked={sendToPrimary} onCheckedChange={setSendToPrimary} />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-md border p-3 cursor-pointer">
              <span className="text-sm">
                All superadmins
                <span className="block text-xs text-muted-foreground">Every operator account</span>
              </span>
              <Switch checked={notifyAllSuperadmins} onCheckedChange={setNotifyAllSuperadmins} />
            </label>
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1.5 mb-2">
              <Users className="h-3.5 w-3.5" /> Specific team recipients
            </Label>
            <div className="rounded-md border max-h-44 overflow-auto divide-y">
              {recipients.length === 0 && (
                <div className="p-3 text-xs text-muted-foreground">No admin/staff users found.</div>
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
export default function SuperadminNotificationsPage() {
  const [events, setEvents] = useState<NotificationEvent[]>([])
  const [domains, setDomains] = useState<string[]>([])
  const [recipients, setRecipients] = useState<RecipientCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ev, rc] = await Promise.all([
        notificationSettingsApi.listEvents(),
        notificationSettingsApi.listRecipients().catch(() => []),
      ])
      setEvents(ev.events)
      setDomains(ev.domains)
      setRecipients(rc)
    } catch (e: any) {
      toast.error(e?.message || "Failed to load notification settings")
      setEvents([])
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

  const grouped = useMemo(() => {
    const orderedDomains = domains.length ? domains : Array.from(new Set(events.map((e) => e.domain)))
    return orderedDomains
      .map((d) => ({ domain: d, items: filtered.filter((e) => e.domain === d) }))
      .filter((g) => g.items.length > 0)
  }, [domains, events, filtered])

  return (
    <SuperadminLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Bell className="h-6 w-6" /> Email Alerts
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Control which platform events send email, and who receives them. Every event is{" "}
              <span className="font-medium text-foreground">off by default</span> — enable an event and choose its
              recipients below.
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
            <MailCheck className="h-4 w-4" /> {enabledCount} event{enabledCount === 1 ? "" : "s"} enabled
          </Badge>
        </div>

        {/* Intro / how it works */}
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-sm text-muted-foreground flex gap-3">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              Emails are sent via Resend and always CC <span className="font-mono">zain@following.ae</span>. For team
              events that already fan out to every operator, prefer <span className="font-medium">Notify natural
              recipient</span> rather than <span className="font-medium">All superadmins</span> to avoid duplicate
              emails. Creators (mobile app) are never emailed here — they receive push notifications.
            </div>
          </CardContent>
        </Card>

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
        ) : grouped.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No events match your search.</div>
        ) : (
          grouped.map((g) => (
            <Card key={g.domain}>
              <CardHeader>
                <CardTitle className="text-base">{g.domain}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {g.items.map((e) => (
                  <EventRow key={e.event_key} event={e} recipients={recipients} onSaved={onSaved} />
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </SuperadminLayout>
  )
}
