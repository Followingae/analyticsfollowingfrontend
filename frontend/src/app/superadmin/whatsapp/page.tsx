"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  MessageCircle, Loader2, Send, Upload, Users, UserX, FileText,
  Plus, Search, Megaphone, CheckCircle2, XCircle, Archive, RefreshCw, Clock,
} from "lucide-react"
import { toast } from "sonner"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  whatsappApi, type WhatsAppOverview, type WhatsAppContact,
  type WhatsAppTemplate, type WhatsAppBroadcast, type AudienceSpec,
} from "@/services/whatsappApi"

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SuperadminWhatsAppPage() {
  const [overview, setOverview] = useState<WhatsAppOverview | null>(null)
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [broadcasts, setBroadcasts] = useState<WhatsAppBroadcast[]>([])

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
    } catch (e: any) {
      toast.error(e?.message || "Failed to load WhatsApp data")
    }
  }, [])

  useEffect(() => { loadTop() }, [loadTop])

  return (
    <SuperadminLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366]/15">
            <MessageCircle className="h-6 w-6 text-[#25D366]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Marketing</h1>
            <p className="text-sm text-muted-foreground">
              Broadcast to your network influencers — the app launch, campaigns & updates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard icon={Users} label="Contacts" value={overview?.total_contacts ?? "—"} />
          <StatCard icon={CheckCircle2} label="Sendable" value={overview?.sendable ?? "—"} />
          <StatCard icon={UserX} label="Opted out" value={overview?.opted_out ?? "—"} />
          <StatCard icon={Megaphone} label="Broadcasts" value={overview?.broadcasts ?? "—"} />
          <StatCard icon={FileText} label="Templates" value={overview?.templates ?? "—"} />
        </div>

        <Tabs defaultValue="broadcasts">
          <TabsList>
            <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="broadcasts" className="mt-4">
            <BroadcastsTab
              templates={templates}
              broadcasts={broadcasts}
              onChange={loadTop}
            />
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            <ContactsTab onChange={loadTop} />
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <TemplatesTab templates={templates} onChange={loadTop} />
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
  templates, broadcasts, onChange,
}: {
  templates: WhatsAppTemplate[]
  broadcasts: WhatsAppBroadcast[]
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
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      {/* composer */}
      <Card>
        <CardHeader><CardTitle className="text-base">New broadcast</CardTitle></CardHeader>
        <CardContent className="space-y-4">
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
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground">
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
        </CardContent>
      </Card>

      {/* history */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent broadcasts</CardTitle></CardHeader>
        <CardContent className="p-0">
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
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No broadcasts yet</TableCell></TableRow>
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
            <p className="px-4 py-2 text-[11px] text-muted-foreground">Tap a broadcast for full delivery analytics.</p>
          )}
        </CardContent>
      </Card>

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
function Funnel({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-2xl font-bold leading-none" style={color ? { color } : undefined}>{value}</p>
      <p className="mt-1 text-xs font-medium">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
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
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              <Funnel label="Recipients" value={a.total} />
              <Funnel label="Sent" value={a.sent} />
              <Funnel label="Delivered" value={a.delivered} sub={`${a.delivery_rate}%`} color="#16a34a" />
              <Funnel label="Read" value={a.read} sub={`${a.read_rate}%`} color="#2563eb" />
              <Funnel label="Failed" value={a.failed} sub={`${a.fail_rate}%`} color="#dc2626" />
            </div>

            {/* delivery bar */}
            <div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                {seg(a.read, "#2563eb")}
                {seg(a.delivered - a.read, "#16a34a")}
                {seg(a.sent - a.delivered, "#84cc16")}
                {seg(a.failed, "#dc2626")}
                {seg(a.queued, "#d1d5db")}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#2563eb]" />Read</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#16a34a]" />Delivered</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#84cc16]" />Sent</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#dc2626]" />Failed</span>
                {a.queued > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#d1d5db]" />Queued</span>}
              </div>
            </div>

            {/* failure reasons */}
            {a.failures.length > 0 && (
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-semibold text-red-600">Failure reasons</p>
                <div className="space-y-1">
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
              <div className="max-h-64 overflow-auto rounded-lg border">
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
                        <TableCell className="text-[11px] text-red-600">{r.error_message || ""}</TableCell>
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
  const map: Record<string, string> = {
    sending: "bg-blue-100 text-blue-700",
    sent: "bg-lime-100 text-lime-700",
    delivered: "bg-green-100 text-green-700",
    read: "bg-blue-100 text-blue-700",
    draft: "bg-gray-100 text-gray-700",
    failed: "bg-red-100 text-red-700",
    undelivered: "bg-red-100 text-red-700",
    queued: "bg-amber-100 text-amber-700",
    cancelled: "bg-gray-100 text-gray-500",
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
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await whatsappApi.listContacts({ search, only_sendable: sendableOnly, limit: 200 })
      setContacts(res.contacts); setTotal(res.total)
    } catch (e: any) { toast.error(e?.message || "Failed to load contacts") }
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Contacts ({total.toLocaleString()})</CardTitle>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
            onChange={e => onFile(e.target.files?.[0])} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Import CSV/Excel
          </Button>
          <AddContactDialog onDone={() => { load(); onChange() }} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
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
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                No contacts. Import a CSV/Excel of your network influencers to begin.
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
                    ? <span className="inline-flex items-center gap-1 text-xs text-red-600"><XCircle className="h-3 w-3" /> Opted out</span>
                    : <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3 w-3" /> Consented</span>}
                </TableCell>
                <TableCell className="text-right">
                  <Switch checked={!!c.opted_out_at} onCheckedChange={() => toggleOptOut(c)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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
function TemplatesTab({ templates, onChange }: { templates: WhatsAppTemplate[]; onChange: () => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Templates</CardTitle>
        <div className="flex items-center gap-2">
          <SyncButton onDone={onChange} />
          <TemplateDialog onDone={onChange} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
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
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                No templates yet. Create one in Twilio, then click Sync from Twilio.
              </TableCell></TableRow>
            )}
            {templates.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell><Badge variant="secondary">{t.category}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{t.twilio_content_sid}</TableCell>
                <TableCell>{t.variables?.length || 0}</TableCell>
                <TableCell><ApprovalBadge status={t.approval_status} /></TableCell>
                <TableCell>{t.status}</TableCell>
                <TableCell className="text-right">
                  {t.status === "active" && (
                    <Button variant="ghost" size="sm" onClick={async () => {
                      try { await whatsappApi.archiveTemplate(t.id); toast.success("Archived"); onChange() }
                      catch (e: any) { toast.error(e?.message || "Failed") }
                    }}>
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function ApprovalBadge({ status }: { status?: string }) {
  const s = (status || "unknown").toLowerCase()
  if (s === "approved") return <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3 w-3" />Approved</span>
  if (s === "rejected") return <span className="inline-flex items-center gap-1 text-xs text-red-600"><XCircle className="h-3 w-3" />Rejected</span>
  if (s === "pending" || s === "received" || s === "unsubmitted")
    return <span className="inline-flex items-center gap-1 text-xs text-amber-600"><Clock className="h-3 w-3" />{s}</span>
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
