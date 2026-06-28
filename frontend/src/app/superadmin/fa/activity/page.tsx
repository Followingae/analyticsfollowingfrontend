"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity as ActivityIcon, UserPlus, Send, CheckCircle2, XCircle, FileImage,
  PenLine, ThumbsUp, Camera, ShieldCheck, Banknote, Receipt, Loader2, RefreshCw,
} from "lucide-react"
import { faActivityApi } from "@/services/faAdminApi"
import { toast } from "sonner"

type ActivityItem = {
  id: string
  kind: string
  title: string
  subtitle?: string | null
  actor?: string | null
  campaign_name?: string | null
  at: string
}

type Summary = {
  new_applications: number
  deliverables_awaiting_review: number
  pending_withdrawals: number
  new_signups: number
  pending_receipts?: number
}

// kind → presentation. Keep in sync with backend `add(kind, ...)` calls.
const KIND_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  signup:                { label: "Signup",        icon: UserPlus,    color: "text-blue-600",    bg: "bg-blue-500/10" },
  application:           { label: "Application",   icon: Send,        color: "text-indigo-600",  bg: "bg-indigo-500/10" },
  brand_approved:        { label: "Approved",      icon: CheckCircle2,color: "text-emerald-600", bg: "bg-emerald-500/10" },
  brand_rejected:        { label: "Rejected",      icon: XCircle,     color: "text-red-600",     bg: "bg-red-500/10" },
  content_submitted:     { label: "Content",       icon: FileImage,   color: "text-amber-600",   bg: "bg-amber-500/10" },
  content_edit_requested:{ label: "Edit asked",    icon: PenLine,     color: "text-orange-600",  bg: "bg-orange-500/10" },
  content_approved:      { label: "Content OK",    icon: ThumbsUp,    color: "text-emerald-600", bg: "bg-emerald-500/10" },
  proof_submitted:       { label: "Proof",         icon: Camera,      color: "text-purple-600",  bg: "bg-purple-500/10" },
  deliverable_verified:  { label: "Verified",      icon: ShieldCheck, color: "text-green-600",   bg: "bg-green-500/10" },
  withdrawal_requested:  { label: "Withdrawal",    icon: Banknote,    color: "text-rose-600",    bg: "bg-rose-500/10" },
  withdrawal_processed:  { label: "Paid out",      icon: Banknote,    color: "text-teal-600",    bg: "bg-teal-500/10" },
  receipt_claim:         { label: "Receipt",       icon: Receipt,     color: "text-cyan-600",    bg: "bg-cyan-500/10" },
}

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "signup", label: "Signups" },
  { key: "application", label: "Applications" },
  { key: "brand_approved", label: "Approvals" },
  { key: "content_submitted", label: "Content" },
  { key: "proof_submitted", label: "Proofs" },
  { key: "deliverable_verified", label: "Verified" },
  { key: "withdrawal_requested", label: "Withdrawals" },
  { key: "receipt_claim", label: "Receipts" },
]

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return "—"
  const diff = Date.now() - then
  const s = Math.floor(diff / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString("en-AE", { month: "short", day: "numeric" })
}

export function ActivityRow({ item }: { item: ActivityItem }) {
  const meta = KIND_META[item.kind] || { label: item.kind, icon: ActivityIcon, color: "text-muted-foreground", bg: "bg-muted" }
  const Icon = meta.icon
  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
        <Icon className={`h-4 w-4 ${meta.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm leading-tight">{item.title}</p>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${meta.color}`}>{meta.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {[item.subtitle, item.campaign_name].filter(Boolean).join(" · ")}
        </p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap pt-0.5">{timeAgo(item.at)}</span>
    </div>
  )
}

export default function FAActivityPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [items, setItems] = useState<ActivityItem[]>([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const PAGE = 30

  const loadSummary = useCallback(() => {
    faActivityApi.summary()
      .then((res) => { const p = res?.data ?? res; if (p && typeof p === "object") setSummary(p) })
      .catch(() => {/* non-fatal */})
  }, [])

  const load = useCallback(async (reset = true) => {
    if (reset) setLoading(true); else setLoadingMore(true)
    try {
      const offset = reset ? 0 : items.length
      const res = await faActivityApi.feed({
        type: filter === "all" ? undefined : filter,
        limit: PAGE,
        offset,
      })
      const list: ActivityItem[] = res?.data?.activity ?? res?.data ?? []
      setItems(reset ? list : [...items, ...list])
      setHasMore(!!res?.data?.has_more)
    } catch {
      toast.error("Failed to load activity")
    } finally {
      setLoading(false); setLoadingMore(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, items])

  useEffect(() => { loadSummary() }, [loadSummary])
  // Reload feed whenever the filter changes (and on mount).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(true) }, [filter])

  const refresh = () => { loadSummary(); load(true) }

  const cards = [
    { label: "New Applications (today)", value: summary?.new_applications ?? 0, icon: Send, color: "text-indigo-500" },
    { label: "Deliverables Awaiting Review", value: summary?.deliverables_awaiting_review ?? 0, icon: FileImage, color: "text-amber-500" },
    { label: "Pending Withdrawals", value: summary?.pending_withdrawals ?? 0, icon: Banknote, color: "text-rose-500" },
    { label: "New Signups (today)", value: summary?.new_signups ?? 0, icon: UserPlus, color: "text-blue-500" },
  ]

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Platform Activity</h1>
              <p className="text-muted-foreground text-sm">Live feed of everything happening across the Following App</p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-1.5" />Refresh
            </Button>
          </div>

          {/* Headline stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => (
              <Card key={c.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </CardHeader>
                <CardContent><p className="text-3xl font-bold">{c.value}</p></CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="flex-wrap h-auto">
              {FILTERS.map((f) => (
                <TabsTrigger key={f.key} value={f.key}>{f.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Feed */}
          <Card>
            <CardContent className="p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  <p className="text-sm">Loading activity...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12">
                  <ActivityIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <>
                  <div className="divide-y">
                    {items.map((it) => <ActivityRow key={it.id} item={it} />)}
                  </div>
                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <Button variant="outline" size="sm" disabled={loadingMore} onClick={() => load(false)}>
                        {loadingMore ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                        Load more
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
