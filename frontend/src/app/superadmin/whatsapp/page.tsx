"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Loader2, Send, Upload, Users, UserX, FileText,
  Plus, Search, Megaphone, CheckCircle2, XCircle, Archive, RefreshCw, Clock,
} from "lucide-react"
import { toast } from "sonner"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  whatsappApi, type WhatsAppOverview, type WhatsAppContact,
  type WhatsAppTemplate, type WhatsAppBroadcast, type AudienceSpec,
} from "@/services/whatsappApi"
import { PageHead, Panel, Stat } from "@/components/console/primitives"

/* The five headline figures used to be five cards, and inside each card the icon sat in a
   rounded, tinted box of its own — so eleven edges stood between "how many contacts" and
   "how many templates". They are the console's Stat now: caption, figure, and the icon as a
   mark rather than as a tile. */

export default function SuperadminWhatsAppPage() {
  const [overview, setOverview] = useState<WhatsAppOverview | null>(null)
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [broadcasts, setBroadcasts] = useState<WhatsAppBroadcast[]>([])
  /**
   * A failed load left `templates` and `broadcasts` as empty arrays, and both lists render an
   * empty array as a sentence of advice: "No broadcasts yet", "No templates yet. Create one in
   * Twilio, then click Sync." So an outage read as a fresh, unconfigured account, and the
   * suggested fix was to go and build things that already exist. The five headline figures
   * were already honest, because `overview` stays null and each Stat falls back to a dash;
   * the two lists under them were not.
   */
  const [failure, setFailure] = useState<string | null>(null)

  const loadTop = useCallback(async () => {
    try {
      const [ov, tp, bc] = await Promise.all([
        whatsappApi.overview(),
        whatsappApi.listTemplates(),
        whatsappApi.listBroadcasts(),
      ])
      setOverview(ov)
      setTemplates(tp.templates)
      setBroadcasts(bc.broadcasts)
      setFailure(null)
    } catch (e: any) {
      setOverview(null)
      setTemplates([])
      setBroadcasts([])
      setFailure(e?.message || "The request did not complete")
      toast.error(e?.message || "Could not load the WhatsApp data")
    }
  }, [])

  useEffect(() => { loadTop() }, [loadTop])

  return (
    <SuperadminLayout>
      <div className="mx-auto w-full max-w-6xl space-y-ds-5 p-ds-3 md:p-ds-4">
        {/* The title sat beside a rounded tile tinted with #25D366, WhatsApp's own green:
            a raw hex the theme does not know, carrying no state, on a page whose name
            already says which channel this is. */}
        <PageHead
          title="WhatsApp marketing"
          sub="Broadcast to the influencers in our network: the app launch, campaigns and updates. Opt-outs are honoured automatically."
        />

        {failure && (
          <div className="flex flex-wrap items-center gap-ds-3">
            <div className="min-w-0">
              <p className="text-ds-label">Could not load the WhatsApp data</p>
              <p className="mt-ds-1 text-ds-body-sm text-muted-foreground">
                Nothing below is a count. Contacts, broadcasts and templates may all be there,
                this page just could not read them. {failure}
              </p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={loadTop}>
              <RefreshCw className="mr-1.5 h-4 w-4" />Try again
            </Button>
          </div>
        )}

        <div className="-mx-ds-2 grid gap-x-ds-5 gap-y-ds-4 sm:grid-cols-3 xl:grid-cols-5">
          <Stat icon={Users} label="Contacts" value={overview?.total_contacts ?? "—"} />
          <Stat icon={CheckCircle2} label="Sendable" value={overview?.sendable ?? "—"} />
          <Stat icon={UserX} label="Opted out" value={overview?.opted_out ?? "—"} />
          <Stat icon={Megaphone} label="Broadcasts" value={overview?.broadcasts ?? "—"} />
          <Stat icon={FileText} label="Templates" value={overview?.templates ?? "—"} />
        </div>

        <Tabs defaultValue="broadcasts">
          <TabsList>
            <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="broadcasts" className="mt-ds-3">
            <BroadcastsTab
              templates={templates}
              broadcasts={broadcasts}
              failed={!!failure}
              onChange={loadTop}
            />
          </TabsContent>

          <TabsContent value="contacts" className="mt-ds-3">
            <ContactsTab onChange={loadTop} />
          </TabsContent>

          <TabsContent value="templates" className="mt-ds-3">
            <TemplatesTab templates={templates} failed={!!failure} onChange={loadTop} />
          </TabsContent>
        </Tabs>
      </div>
    </SuperadminLayout>
  )
}

/* ======================================================================= */
/*  Broadcasts                                                             */
/* ======================================================================= */
function BroadcastsTab({
  templates, broadcasts, failed, onChange,
}: {
  templates: WhatsAppTemplate[]
  broadcasts: WhatsAppBroadcast[]
  failed: boolean
  onChange: () => void
}) {
  const active = templates.filter(t => t.status === "active")
  const [name, setName] = useState("")
  const [templateId, setTemplateId] = useState<string>("")
  const [audienceType, setAudienceType] = useState<AudienceSpec["type"]>("all_consented")
  const [tags, setTags] = useState("")
  const [testPhones, setTestPhones] = useState("")
  const [vars, setVars] = useState<Record<string, string>>({})
  const [estimate, setEstimate] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const template = useMemo(() => active.find(t => t.id === templateId), [active, templateId])

  const audience = useMemo<AudienceSpec>(() => {
    if (audienceType === "tags") return { type: "tags", tags: tags.split(",").map(s => s.trim()).filter(Boolean) }
    if (audienceType === "test") return { type: "test", test_phones: testPhones.split(/[\n,]/).map(s => s.trim()).filter(Boolean) }
    return { type: "all_consented" }
  }, [audienceType, tags, testPhones])

  const doEstimate = async () => {
    try {
      const { recipients } = await whatsappApi.estimate(audience)
      setEstimate(recipients)
    } catch (e: any) { toast.error(e?.message || "Estimate failed") }
  }

  const createAndSend = async () => {
    if (!name.trim() || !templateId) { toast.error("Name and template are required"); return }
    setBusy(true)
    try {
      const { id } = await whatsappApi.createBroadcast({
        name: name.trim(), template_id: templateId, audience, variable_values: vars,
      })
      const res = await whatsappApi.sendBroadcast(id)
      toast.success(res.status === "sending"
        ? `Sending to ${res.total} recipients…`
        : `Broadcast ${res.status}`)
      setName(""); setTemplateId(""); setVars({}); setEstimate(null); setConfirmOpen(false)
      onChange()
    } catch (e: any) {
      toast.error(e?.message || "Send failed")
    } finally { setBusy(false) }
  }

  return (
    <div className="grid gap-ds-4 lg:grid-cols-[1fr_1fr]">
      {/* composer */}
      <Panel title="New broadcast">
        <div className="space-y-ds-3">
          <div className="space-y-1.5">
            <Label>Name (internal)</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="App launch announcement" />
          </div>

          <div className="space-y-1.5">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue placeholder="Choose an approved template" /></SelectTrigger>
              <SelectContent>
                {active.length === 0 && <div className="p-2 text-sm text-muted-foreground">No active templates — add one first.</div>}
                {active.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} <span className="text-muted-foreground">· {t.category}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* template variables */}
          {template && template.variables?.length > 0 && (
            /* The variable fields were fenced in their own bordered box inside a card that
               already has one. The caption above them does the fencing. */
            <div className="space-y-ds-2">
              <p className="text-ds-caption font-medium text-muted-foreground">
                Variables — use {"{{first_name}}"} to personalise
              </p>
              {template.variables.map(v => (
                <div key={v.index} className="space-y-1">
                  <Label className="text-xs">{`{{${v.index}}}`} {v.name ? `· ${v.name}` : ""}</Label>
                  <Input
                    value={vars[v.index] ?? ""}
                    placeholder={v.sample || "value or {{first_name}}"}
                    onChange={e => setVars(p => ({ ...p, [v.index]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Select value={audienceType} onValueChange={(v: string) => { setAudienceType(v as AudienceSpec["type"]); setEstimate(null) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_consented">All consented contacts</SelectItem>
                <SelectItem value="tags">By tag</SelectItem>
                <SelectItem value="test">Test — specific numbers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {audienceType === "tags" && (
            <Input value={tags} onChange={e => { setTags(e.target.value); setEstimate(null) }} placeholder="beauty, vip (comma separated)" />
          )}
          {audienceType === "test" && (
            <Textarea value={testPhones} onChange={e => { setTestPhones(e.target.value); setEstimate(null) }} placeholder="+971501234567, +971502223333" rows={2} />
          )}

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={doEstimate} type="button">
              Estimate recipients
            </Button>
            {estimate !== null && (
              <span className="text-sm font-medium">{estimate.toLocaleString()} recipients</span>
            )}
          </div>

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full"
                disabled={!name.trim() || !templateId}
                onClick={async () => { await doEstimate() }}
              >
                <Send className="mr-2 h-4 w-4" /> Send broadcast
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Send this broadcast?</DialogTitle></DialogHeader>
              <div className="space-y-2 text-sm">
                <p>Template: <b>{template?.name}</b> ({template?.category})</p>
                <p>Audience: <b>{estimate ?? "…"}</b> recipients</p>
                {template?.category === "marketing" && (
                  <p className="text-muted-foreground">
                    Marketing messages are billed per conversation and respect each
                    contact&apos;s consent. Opt-outs (STOP) are honoured automatically.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy}>Cancel</Button>
                <Button onClick={createAndSend} disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send now
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Panel>

      {/* history */}
      <Panel title="Recent broadcasts" flush>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="text-right">Failed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {broadcasts.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-ds-body-sm text-muted-foreground">
                  {failed
                    ? "The broadcast history did not load. This is not a record of nothing being sent."
                    : "No broadcast has been sent yet."}
                </TableCell></TableRow>
              )}
              {broadcasts.map(b => (
                <TableRow key={b.id} className="cursor-pointer" onClick={() => setDetailId(b.id)}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                  <TableCell className="text-right">{b.sent_count}/{b.total_recipients}</TableCell>
                  <TableCell className="text-right">{b.delivered_count}</TableCell>
                  <TableCell className="text-right">{b.failed_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {broadcasts.length > 0 && (
            <p className="px-6 py-ds-2 text-ds-overline text-muted-foreground">Tap a broadcast for full delivery analytics.</p>
          )}
        </div>
      </Panel>

      {detailId && (
        <BroadcastDetail
          broadcast={broadcasts.find(b => b.id === detailId)!}
          onClose={() => setDetailId(null)}
          onRefresh={onChange}
        />
      )}
    </div>
  )
}

/* ======================================================================= */
/*  Broadcast detail — delivery funnel + recipients                       */
/* ======================================================================= */
/**
 * One step of the delivery funnel.
 *
 * These were five bordered, padded boxes in a row inside a dialog that already has an edge —
 * ten edges between "recipients" and "failed", when the whole point is to read them as one
 * sequence. The boxes are gone and the gap between them went up instead, so the figures can
 * take the room the padding was holding. Colour moves from raw hex to the console tone
 * tokens, and it arrives with the label beside it rather than as the only signal.
 */
function Funnel({ label, value, sub, tone }: { label: string; value: number | string; sub?: string; tone?: "good" | "info" | "bad" }) {
  const ink = tone === "good" ? "text-[var(--tone-good-ink)]"
    : tone === "info" ? "text-[var(--tone-info-ink)]"
      : tone === "bad" ? "text-[var(--tone-bad-ink)]" : ""
  return (
    <div>
      <p className={`text-[28px] font-semibold leading-none tracking-[-0.025em] tabular-nums ${ink}`}>{value}</p>
      <p className="mt-ds-2 text-ds-caption font-medium">{label}</p>
      {sub && <p className="text-ds-overline text-muted-foreground">{sub}</p>}
    </div>
  )
}

function BroadcastDetail({
  broadcast, onClose, onRefresh,
}: {
  broadcast: WhatsAppBroadcast
  onClose: () => void
  onRefresh: () => void
}) {
  const [a, setA] = useState<import("@/services/whatsappApi").BroadcastAnalytics | null>(null)
  const [recipients, setRecipients] = useState<import("@/services/whatsappApi").BroadcastRecipient[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [an, rc] = await Promise.all([
        whatsappApi.broadcastAnalytics(broadcast.id),
        whatsappApi.broadcastRecipients(broadcast.id, statusFilter || undefined),
      ])
      setA(an); setRecipients(rc.recipients)
    } catch (e: any) { toast.error(e?.message || "Failed to load analytics") }
    finally { setLoading(false) }
  }, [broadcast.id, statusFilter])

  useEffect(() => { load() }, [load])

  // live-refresh while the broadcast is still sending
  useEffect(() => {
    if (broadcast.status !== "sending") return
    const t = setInterval(() => { load(); onRefresh() }, 5000)
    return () => clearInterval(t)
  }, [broadcast.status, load, onRefresh])

  const seg = (n: number, color: string) => a && a.total > 0
    ? <div style={{ width: `${(n / a.total) * 100}%`, backgroundColor: color }} className="h-full" /> : null

  return (
    <Dialog open onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {broadcast.name} <StatusBadge status={broadcast.status} />
          </DialogTitle>
        </DialogHeader>

        {loading && !a ? (
          <div className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
        ) : a ? (
          <div className="space-y-4">
            {/* funnel tiles */}
            <div className="grid grid-cols-3 gap-x-ds-4 gap-y-ds-3 sm:grid-cols-5">
              <Funnel label="Recipients" value={a.total} />
              <Funnel label="Sent" value={a.sent} />
              <Funnel label="Delivered" value={a.delivered} sub={`${a.delivery_rate}%`} tone="good" />
              <Funnel label="Read" value={a.read} sub={`${a.read_rate}%`} tone="info" />
              <Funnel label="Failed" value={a.failed} sub={`${a.fail_rate}%`} tone="bad" />
            </div>

            {/* delivery bar */}
            <div>
              {/* The bar and its legend were six hex literals with no dark-mode answer; they
                  are the console tone dots now, so blue means the same here as everywhere. */}
              <div className="flex h-3 w-full overflow-hidden rounded-ds-full bg-black/[0.07] dark:bg-white/10">
                {seg(a.read, "var(--tone-info-dot)")}
                {seg(a.delivered - a.read, "var(--tone-good-dot)")}
                {seg(a.sent - a.delivered, "var(--console-lime)")}
                {seg(a.failed, "var(--tone-bad-dot)")}
                {seg(a.queued, "var(--tone-neutral-dot)")}
              </div>
              <div className="mt-ds-2 flex flex-wrap gap-ds-3 text-ds-overline text-muted-foreground">
                <span className="flex items-center gap-ds-1"><span className="h-2 w-2 rounded-full bg-[var(--tone-info-dot)]" />Read</span>
                <span className="flex items-center gap-ds-1"><span className="h-2 w-2 rounded-full bg-[var(--tone-good-dot)]" />Delivered</span>
                <span className="flex items-center gap-ds-1"><span className="h-2 w-2 rounded-full bg-[var(--console-lime)]" />Sent</span>
                <span className="flex items-center gap-ds-1"><span className="h-2 w-2 rounded-full bg-[var(--tone-bad-dot)]" />Failed</span>
                {a.queued > 0 && <span className="flex items-center gap-ds-1"><span className="h-2 w-2 rounded-full bg-[var(--tone-neutral-dot)]" />Queued</span>}
              </div>
            </div>

            {/* failure reasons */}
            {a.failures.length > 0 && (
              <div>
                <p className="mb-ds-2 text-ds-caption font-semibold text-[var(--tone-bad-ink)]">Failure reasons</p>
                <div className="space-y-ds-1">
                  {a.failures.map((f, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 text-[12px]">
                      <span className="text-muted-foreground">{f.reason}{f.error_code ? ` (${f.error_code})` : ""}</span>
                      <span className="font-semibold">{f.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* recipients */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-xs font-semibold">Recipients</p>
                <Select value={statusFilter || "all"} onValueChange={(v: string) => setStatusFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {["queued", "sent", "delivered", "read", "failed", "undelivered"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-64 overflow-auto rounded-ds-lg border border-black/[0.06] dark:border-white/[0.07]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipients.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground">No recipients</TableCell></TableRow>
                    )}
                    {recipients.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{r.full_name || (r.instagram_handle ? `@${r.instagram_handle}` : "—")}</TableCell>
                        <TableCell className="font-mono text-[11px]">{r.phone}</TableCell>
                        <TableCell><StatusBadge status={r.status} /></TableCell>
                        <TableCell className="text-[11px] text-[var(--tone-bad-ink)]">{r.error_message || ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function StatusBadge({ status }: { status: string }) {
  /* These were nine light-mode-only literals — bg-blue-100 with no dark answer, so in dark
     mode the chips stayed paper-white. They are the console tone washes now, which carry a
     value for both modes and mean the same thing on every other screen. */
  const good = "bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]"
  const info = "bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]"
  const bad = "bg-[var(--tone-bad-wash)] text-[var(--tone-bad-ink)]"
  const map: Record<string, string> = {
    sending: info,
    sent: "bg-[var(--tone-neutral-wash)] text-foreground",
    delivered: good,
    read: info,
    draft: "bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]",
    failed: bad,
    undelivered: bad,
    queued: "bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]",
    cancelled: "bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]",
  }
  return <Badge className={`${map[status] || ""} border-0`} variant="secondary">{status}</Badge>
}

/* ======================================================================= */
/*  Contacts                                                               */
/* ======================================================================= */
function ContactsTab({ onChange }: { onChange: () => void }) {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [sendableOnly, setSendableOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  // "No contacts. Import a CSV/Excel of your network influencers to begin." over a failed
  // read told an operator with two thousand contacts to go and import them again.
  const [failure, setFailure] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await whatsappApi.listContacts({ search, only_sendable: sendableOnly, limit: 200 })
      setContacts(res.contacts); setTotal(res.total); setFailure(null)
    } catch (e: any) {
      setContacts([]); setTotal(0)
      setFailure(e?.message || "The request did not complete")
      toast.error(e?.message || "Could not load the contacts")
    }
    finally { setLoading(false) }
  }, [search, sendableOnly])

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])

  const onFile = async (f: File | undefined) => {
    if (!f) return
    try {
      const res = await whatsappApi.importContacts(f)
      toast.success(`Imported ${res.imported} new, updated ${res.updated}, skipped ${res.skipped}`)
      load(); onChange()
    } catch (e: any) { toast.error(e?.message || "Import failed") }
    if (fileRef.current) fileRef.current.value = ""
  }

  const toggleOptOut = async (c: WhatsAppContact) => {
    try {
      await whatsappApi.optOut({ contact_id: c.id, opted_out: !c.opted_out_at ? true : false })
      load(); onChange()
    } catch (e: any) { toast.error(e?.message || "Failed") }
  }

  return (
    <Panel
      title={failure ? "Contacts" : `Contacts (${total.toLocaleString()})`}
      action={
        <div className="flex items-center gap-ds-2">
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
            onChange={e => onFile(e.target.files?.[0])} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Import CSV/Excel
          </Button>
          <AddContactDialog onDone={() => { load(); onChange() }} />
        </div>
      }
    >
      <div className="space-y-ds-3">
        <div className="flex items-center gap-ds-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search name, phone, handle" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={sendableOnly} onCheckedChange={setSendableOnly} id="sendable" />
            <Label htmlFor="sendable" className="text-sm">Sendable only</Label>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Handle</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Opt-out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></TableCell></TableRow>}
            {!loading && contacts.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-ds-body-sm text-muted-foreground">
                {failure ? (
                  <>
                    The contact list did not load, so this is not an empty address book.
                    <span className="block text-ds-caption">{failure}</span>
                    <Button variant="outline" size="sm" className="mt-ds-2" onClick={load}>
                      <RefreshCw className="mr-1.5 h-4 w-4" />Try again
                    </Button>
                  </>
                ) : search || sendableOnly ? (
                  "No contact matches these filters."
                ) : (
                  "No contacts yet. Import a CSV or Excel of the influencers in our network to begin."
                )}
              </TableCell></TableRow>
            )}
            {contacts.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.full_name || "—"}</TableCell>
                <TableCell className="font-mono text-xs">{c.phone}</TableCell>
                <TableCell>{c.instagram_handle ? `@${c.instagram_handle}` : "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(c.tags || []).slice(0, 3).map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                  </div>
                </TableCell>
                <TableCell>
                  {c.opted_out_at
                    ? <span className="inline-flex items-center gap-1 text-ds-caption text-[var(--tone-bad-ink)]"><XCircle className="h-3 w-3" /> Opted out</span>
                    : <span className="inline-flex items-center gap-1 text-ds-caption text-[var(--tone-good-ink)]"><CheckCircle2 className="h-3 w-3" /> Consented</span>}
                </TableCell>
                <TableCell className="text-right">
                  <Switch checked={!!c.opted_out_at} onCheckedChange={() => toggleOptOut(c)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Panel>
  )
}

function AddContactDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!phone.trim()) { toast.error("Phone required"); return }
    setBusy(true)
    try {
      await whatsappApi.addContact({ phone: phone.trim(), full_name: name.trim() || undefined, instagram_handle: handle.trim() || undefined })
      toast.success("Contact added")
      setPhone(""); setName(""); setHandle(""); setOpen(false); onDone()
    } catch (e: any) { toast.error(e?.message || "Failed") }
    finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add contact</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Phone *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 50 123 4567" /></div>
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Instagram handle</Label><Input value={handle} onChange={e => setHandle(e.target.value)} placeholder="username" /></div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ======================================================================= */
/*  Templates                                                              */
/* ======================================================================= */
function TemplatesTab({ templates, failed, onChange }: {
  templates: WhatsAppTemplate[]; failed: boolean; onChange: () => void
}) {
  // Archiving takes a template out of the composer's picker, so a broadcast that was going
  // out on it cannot be built until someone un-archives it in Twilio. It was a bare icon
  // button with no label and no confirmation, sitting at the end of the row.
  const [confirmArchive, setConfirmArchive] = useState<WhatsAppTemplate | null>(null)

  const archive = async (t: WhatsAppTemplate) => {
    setConfirmArchive(null)
    try { await whatsappApi.archiveTemplate(t.id); toast.success(`"${t.name}" archived`); onChange() }
    catch (e: any) { toast.error(e?.message || "Could not archive the template") }
  }

  return (
    <Panel
      title="Templates"
      action={
        <div className="flex items-center gap-ds-2">
          <SyncButton onDone={onChange} />
          <TemplateDialog onDone={onChange} />
        </div>
      }
    >
      <div className="space-y-ds-3">
        <p className="text-ds-body text-muted-foreground">
          Create templates in Twilio&apos;s Content Template Builder (they submit to Meta
          for approval). Click <b>Sync from Twilio</b> to pull them in automatically with
          their approval status — or add one manually by pasting its <code className="font-mono">HX</code> Content SID.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Content SID</TableHead>
              <TableHead>Variables</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-ds-body-sm text-muted-foreground">
                {failed
                  ? "The template list did not load. Templates you already have in Twilio are unaffected, this page just could not read them."
                  : "No templates yet. Create one in Twilio, then click Sync from Twilio."}
              </TableCell></TableRow>
            )}
            {templates.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell><Badge variant="secondary">{t.category}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{t.twilio_content_sid}</TableCell>
                {/* `t.variables?.length || 0` printed a confident 0 for a template whose
                    variables the payload did not carry — indistinguishable from a template
                    that genuinely takes none, which is the difference between "safe to send
                    as is" and "we do not know what this needs". Absent is a dash. */}
                <TableCell>{t.variables ? t.variables.length : "—"}</TableCell>
                <TableCell><ApprovalBadge status={t.approval_status} /></TableCell>
                <TableCell>{t.status}</TableCell>
                <TableCell className="text-right">
                  {t.status === "active" && (
                    <Button variant="ghost" size="sm" className="gap-1.5"
                            onClick={() => setConfirmArchive(t)}>
                      <Archive className="h-4 w-4" />Archive
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <AlertDialog open={!!confirmArchive} onOpenChange={(o: boolean) => !o && setConfirmArchive(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive &ldquo;{confirmArchive?.name}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                It disappears from the template picker, so no new broadcast can be built on it.
                Broadcasts already sent on this template keep their delivery figures. Meta&apos;s
                approval is not withdrawn, and syncing from Twilio will bring it back.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it active</AlertDialogCancel>
              <AlertDialogAction onClick={() => confirmArchive && archive(confirmArchive)}>
                Archive it
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Panel>
  )
}

function ApprovalBadge({ status }: { status?: string }) {
  const s = (status || "unknown").toLowerCase()
  if (s === "approved") return <span className="inline-flex items-center gap-1 text-ds-caption text-[var(--tone-good-ink)]"><CheckCircle2 className="h-3 w-3" />Approved</span>
  if (s === "rejected") return <span className="inline-flex items-center gap-1 text-ds-caption text-[var(--tone-bad-ink)]"><XCircle className="h-3 w-3" />Rejected</span>
  if (s === "pending" || s === "received" || s === "unsubmitted")
    return <span className="inline-flex items-center gap-1 text-ds-caption text-[var(--tone-warn-ink)]"><Clock className="h-3 w-3" />{s}</span>
  return <span className="text-xs text-muted-foreground">—</span>
}

function SyncButton({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const sync = async () => {
    setBusy(true)
    try {
      const res = await whatsappApi.syncTemplates()
      toast.success(`Synced ${res.synced} template(s) from Twilio`)
      onDone()
    } catch (e: any) { toast.error(e?.message || "Sync failed") }
    finally { setBusy(false) }
  }
  return (
    <Button variant="outline" size="sm" onClick={sync} disabled={busy}>
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
      Sync from Twilio
    </Button>
  )
}

function TemplateDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [sid, setSid] = useState("")
  const [category, setCategory] = useState("marketing")
  const [body, setBody] = useState("")
  const [varCount, setVarCount] = useState(0)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!name.trim() || !sid.trim()) { toast.error("Name and Content SID required"); return }
    setBusy(true)
    try {
      const variables = Array.from({ length: varCount }, (_, i) => ({ index: String(i + 1), name: "", sample: "" }))
      await whatsappApi.saveTemplate({ name: name.trim(), twilio_content_sid: sid.trim(), category, body_preview: body || undefined, variables })
      toast.success("Template registered")
      setName(""); setSid(""); setBody(""); setVarCount(0); setOpen(false); onDone()
    } catch (e: any) { toast.error(e?.message || "Failed") }
    finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Register template</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Register a WhatsApp template</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="App launch" /></div>
          <div className="space-y-1.5"><Label>Twilio Content SID</Label><Input value={sid} onChange={e => setSid(e.target.value)} placeholder="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className="font-mono" /></div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="utility">Utility</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Body preview (with {"{{1}}"} placeholders)</Label><Textarea value={body} onChange={e => setBody(e.target.value)} rows={3} placeholder="Hi {{1}}, the Following creator app is live! Download..." /></div>
          <div className="space-y-1.5"><Label>Number of variables</Label><Input type="number" min={0} max={10} value={varCount} onChange={e => setVarCount(Math.max(0, Number(e.target.value) || 0))} /></div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
