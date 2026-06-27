"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Bell,
  Send,
  Search,
  Loader2,
  Users,
  CheckCheck,
  UserCheck,
  CalendarDays,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react"
import { faNotificationApi } from "@/services/faAdminApi"
import { toast } from "sonner"

// ─── Types ──────────────────────────────────────────────────────────────────

interface FANotification {
  id: string
  member_id: string | null
  type: string
  title: string
  message: string
  read: boolean
  actionable: boolean
  action_url: string | null
  created_at: string
  instagram_username: string | null
  full_name: string | null
}

interface FANotificationAnalytics {
  total_sent: number
  total_read: number
  read_rate: number
  unique_recipients: number
  last_7_days: number
  by_type: Array<{ type: string; total: number; read: number }>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = ["cashback", "deliverable", "withdrawal", "merchant", "system"] as const
const TIER_OPTIONS = ["NANO", "MICRO", "MACRO", "MEGA"] as const
const STATUS_OPTIONS = ["active", "suspended", "pending", "inactive"] as const

const TYPE_STYLES: Record<string, string> = {
  cashback:    "bg-emerald-500/10 text-emerald-600 border-emerald-300",
  deliverable: "bg-blue-500/10 text-blue-600 border-blue-300",
  withdrawal:  "bg-amber-500/10 text-amber-600 border-amber-300",
  merchant:    "bg-violet-500/10 text-violet-600 border-violet-300",
  system:      "bg-slate-500/10 text-slate-600 border-slate-300",
}

const PAGE_SIZE = 25

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number | null | undefined): string {
  if (n == null) return "-"
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString()
}

function formatDate(iso: string): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("en-AE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function TypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="outline" className={`text-[11px] px-2 capitalize ${TYPE_STYLES[type] || ""}`}>
      {type}
    </Badge>
  )
}

// ─── Analytics Cards ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  Icon,
}: {
  label: string
  value: string
  Icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Compose Dialog ────────────────────────────────────────────────────────────

function ComposeDialog({ onSent }: { onSent: () => void }) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const [audience, setAudience] = useState<"all" | "tier" | "status" | "member">("all")
  const [tier, setTier] = useState<string>("NANO")
  const [status, setStatus] = useState<string>("active")
  const [memberId, setMemberId] = useState("")
  const [type, setType] = useState<string>("system")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [actionable, setActionable] = useState(false)
  const [actionUrl, setActionUrl] = useState("")

  const reset = () => {
    setAudience("all")
    setTier("NANO")
    setStatus("active")
    setMemberId("")
    setType("system")
    setTitle("")
    setMessage("")
    setActionable(false)
    setActionUrl("")
  }

  const handleSend = async () => {
    if (!title.trim()) { toast.error("Title is required"); return }
    if (!message.trim()) { toast.error("Message is required"); return }
    if (audience === "member" && !memberId.trim()) { toast.error("Member ID is required"); return }

    setSending(true)
    try {
      const body = {
        audience,
        type,
        title: title.trim(),
        message: message.trim(),
        actionable,
        ...(actionable && actionUrl.trim() ? { action_url: actionUrl.trim() } : {}),
        ...(audience === "tier" ? { tier } : {}),
        ...(audience === "status" ? { status } : {}),
        ...(audience === "member" ? { member_id: memberId.trim() } : {}),
      }
      const res = await faNotificationApi.send(body)
      const sent = res?.data?.sent ?? 0
      toast.success(res?.message || `Sent to ${sent} recipient${sent === 1 ? "" : "s"}`)
      reset()
      setOpen(false)
      onSent()
    } catch {
      toast.error("Failed to send notification")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) reset() }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Compose
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send notification</DialogTitle>
          <DialogDescription>Broadcast to creators by audience, tier, status, or to a single member.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Audience */}
          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Select value={audience} onValueChange={(v: string) => setAudience(v as typeof audience)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All approved creators</SelectItem>
                <SelectItem value="tier">By tier</SelectItem>
                <SelectItem value="status">By status</SelectItem>
                <SelectItem value="member">Single member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional audience inputs */}
          {audience === "tier" && (
            <div className="space-y-1.5">
              <Label>Tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {audience === "status" && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {audience === "member" && (
            <div className="space-y-1.5">
              <Label>Member ID</Label>
              <Input
                placeholder="fa_member UUID..."
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              />
            </div>
          )}

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea
              placeholder="Message body..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          {/* Actionable */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="cursor-pointer">Actionable</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Add a tappable action with a target URL.</p>
            </div>
            <Switch checked={actionable} onCheckedChange={setActionable} />
          </div>
          {actionable && (
            <div className="space-y-1.5">
              <Label>Action URL</Label>
              <Input
                placeholder="/campaigns/123 or https://..."
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
            {sending ? "Sending..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function FANotificationsPage() {
  const [analytics, setAnalytics] = useState<FANotificationAnalytics | null>(null)
  const [items, setItems] = useState<FANotification[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [offset, setOffset] = useState(0)

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await faNotificationApi.analytics()
      setAnalytics(res?.data ?? null)
    } catch {
      toast.error("Failed to load notification analytics")
    }
  }, [])

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await faNotificationApi.list({
        type: typeFilter === "all" ? undefined : typeFilter,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset,
      })
      setItems(res?.data?.items ?? [])
      setTotal(res?.data?.total ?? 0)
    } catch {
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }, [typeFilter, search, offset])

  useEffect(() => { loadAnalytics() }, [loadAnalytics])
  useEffect(() => { loadList() }, [loadList])

  const refresh = () => {
    setOffset(0)
    loadAnalytics()
    loadList()
  }

  const applySearch = () => {
    setOffset(0)
    setSearch(searchInput.trim())
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          {/* ─── Header ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">Notifications Manager</h1>
                <Badge variant="secondary" className="text-xs font-medium">{formatNumber(total)} sent</Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                Compose and broadcast push notifications to Following App creators
              </p>
            </div>
            <ComposeDialog onSent={refresh} />
          </div>

          {/* ─── Analytics Row ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total sent" value={formatNumber(analytics?.total_sent)} Icon={Megaphone} />
            <StatCard
              label="Read rate"
              value={analytics ? `${Math.round((analytics.read_rate || 0) * 100)}%` : "-"}
              Icon={CheckCheck}
            />
            <StatCard label="Unique recipients" value={formatNumber(analytics?.unique_recipients)} Icon={UserCheck} />
            <StatCard label="Last 7 days" value={formatNumber(analytics?.last_7_days)} Icon={CalendarDays} />
          </div>

          {/* ─── By-type breakdown ─── */}
          {analytics?.by_type && analytics.by_type.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                  By type
                </p>
                <div className="flex flex-wrap gap-3">
                  {analytics.by_type.map((b) => {
                    const rate = b.total > 0 ? Math.round((b.read / b.total) * 100) : 0
                    return (
                      <div key={b.type} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                        <TypeBadge type={b.type} />
                        <span className="text-sm font-semibold tabular-nums">{formatNumber(b.total)}</span>
                        <span className="text-xs text-muted-foreground">{rate}% read</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Filters ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search title, message, recipient..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applySearch() }}
                className="pl-9 h-9"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v: string) => { setTypeFilter(v); setOffset(0) }}
            >
              <SelectTrigger className="w-44 h-9">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ─── Sent Log Table ─── */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  <p className="text-sm">Loading notifications...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16">
                  <Bell className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">
                    {search || typeFilter !== "all" ? "No notifications match your filters" : "No notifications sent yet"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Read</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell>
                          {n.member_id ? (
                            <div className="flex flex-col">
                              {n.instagram_username ? (
                                <span className="font-medium">@{n.instagram_username}</span>
                              ) : (
                                <span className="font-medium">{n.full_name || "Member"}</span>
                              )}
                              {n.full_name && n.instagram_username && (
                                <span className="text-xs text-muted-foreground">{n.full_name}</span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[11px]">
                              <Megaphone className="h-3 w-3 mr-1" />Broadcast
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell><TypeBadge type={n.type} /></TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{n.title}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[280px] truncate">{n.message}</TableCell>
                        <TableCell>
                          {n.read ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300 text-[11px]">Read</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] text-muted-foreground">Unread</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(n.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* ─── Pagination ─── */}
          {!loading && total > PAGE_SIZE && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {formatNumber(total)} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + PAGE_SIZE >= total}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  Next<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
