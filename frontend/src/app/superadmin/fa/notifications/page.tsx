"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { CARD, PageHead, Stat, StatGrid } from "@/components/console/primitives"
import { FaPage, Failed, Loading, Nothing, TONE_BADGE, type Tone } from "../_ui"
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

/* Five notification kinds in five palette families: emerald, blue, amber, violet, slate.
   A kind is not a state, nothing here is going wrong, so the colour was saying something
   untrue. They are neutral now and the word does the telling. */

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
    <Badge variant="outline" className={`px-2 text-[11px] capitalize ${TONE_BADGE.neutral}`}>
      {type}
    </Badge>
  )
}

// ─── Analytics Cards ───────────────────────────────────────────────────────────

/* Four figures that were four cards, each with the icon in a second tinted tile inside it -
   eight edges to compare "total sent" with "last 7 days". They are the console's Stat now,
   the same band every other converted screen uses. */

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
          {/* One switch in a box, in a dialog that already has one. */}
          <div className="flex items-center justify-between gap-ds-3">
            <div>
              <Label className="cursor-pointer">Actionable</Label>
              <p className="mt-ds-1 text-ds-caption text-muted-foreground">Add a tappable action with a target URL.</p>
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
  // Not a number until the list answers. It was `useState(0)`, and the failure path below
  // left it at 0 — so a list request that never came back put "0 sent" in the page header,
  // which reads as "we have never notified anyone" rather than "we could not check".
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  /* Whether the sent log answered. Without it a failed request emptied the table and the
     page said "No notifications sent yet", which is a claim about what creators have and
     have not been told. */
  const [error, setError] = useState(false)

  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [offset, setOffset] = useState(0)

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await faNotificationApi.analytics()
      setAnalytics(res?.data ?? null)
    } catch {
      toast.error("Could not load the notification figures")
    }
  }, [])

  const loadList = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await faNotificationApi.list({
        type: typeFilter === "all" ? undefined : typeFilter,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset,
      })
      setItems(res?.data?.items ?? [])
      setTotal(res?.data?.total ?? null)
    } catch {
      setError(true)
      setTotal(null)
      toast.error("Could not load the sent log")
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
  const totalPages = Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE))

  return (
    <AuthGuard requireAdmin={true}>
      <SuperAdminInterface>
        <FaPage>
          {/* ─── Header ─── */}
          <PageHead
            title="Notifications"
            sub={
              total == null
                ? "Push notifications to creators in the Following App. Send to everybody, to one tier, or to a single person."
                : `${formatNumber(total)} notifications sent so far. Send to everybody, to one tier, or to a single person.`
            }
            action={<ComposeDialog onSent={refresh} />}
          />

          {/* ─── Analytics Row ─── */}
          <StatGrid>
            <Stat label="Total sent" value={formatNumber(analytics?.total_sent)} icon={Megaphone} />
            <Stat
              label="Read rate"
              /* `analytics.read_rate || 0` printed a confident 0% whenever the rate came
                 back null — a delivery problem and a genuine nobody-opened-it read the
                 same. A missing rate is a dash. */
              value={analytics?.read_rate == null ? "—" : `${Math.round(analytics.read_rate * 100)}%`}
              icon={CheckCheck}
            />
            <Stat label="Unique recipients" value={formatNumber(analytics?.unique_recipients)} icon={UserCheck} />
            <Stat label="Last 7 days" value={formatNumber(analytics?.last_7_days)} icon={CalendarDays} />
          </StatGrid>

          {/* ─── By-type breakdown ─── */}
          {analytics?.by_type && analytics.by_type.length > 0 && (
            /* A card holding one bordered tile per type: two layers of box around a badge
               and two numbers. The heading fences the group, and the gap between entries is
               wider than the gap inside one, which is what the tiles were drawing. */
            <div>
                <p className="mb-ds-3 text-ds-overline uppercase text-muted-foreground">
                  By type
                </p>
                <div className="flex flex-wrap gap-x-ds-5 gap-y-ds-3">
                  {analytics.by_type.map((b) => {
                    /* `b.total > 0 ? ... : 0` printed "0% read" for a type nothing has been
                       sent under. Nothing sent has no read rate; it is not a rate of zero. */
                    const rate = b.total > 0 ? Math.round((b.read / b.total) * 100) : null
                    return (
                      <div key={b.type} className="flex items-center gap-ds-2">
                        <TypeBadge type={b.type} />
                        <span className="text-ds-body font-semibold tabular-nums">{formatNumber(b.total)}</span>
                        <span className="text-ds-caption text-muted-foreground">
                          {rate == null ? "no reads to rate" : `${rate}% read`}
                        </span>
                      </div>
                    )
                  })}
                </div>
            </div>
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
          <div className={`${CARD} overflow-hidden bg-[var(--tone-neutral-wash)]`}>
            <div>
              {loading ? (
                <Loading label="Loading what has been sent" />
              ) : error ? (
                <Failed what="the sent log" onRetry={loadList} />
              ) : items.length === 0 ? (
                <div className="px-ds-3">
                  <Nothing>
                    {search || typeFilter !== "all"
                      ? "Nothing matches those filters."
                      : "Nothing has been sent yet."}
                  </Nothing>
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
                            <Badge className="bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)] border-0 text-[11px]">Read</Badge>
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
            </div>
          </div>

          {/* ─── Pagination ─── */}
          {!loading && (total ?? 0) > PAGE_SIZE && (
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
        </FaPage>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
