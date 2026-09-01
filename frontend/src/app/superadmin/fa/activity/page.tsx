"use client"

import { useState, useEffect, useCallback, type ReactNode } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Button } from "@/components/ui/button"
import { CARD, PageHead, Stat, StatGrid, type Tone } from "@/components/console/primitives"
import { FaPage, Failed, Loading, Nothing, TONE_BADGE } from "../_ui"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity as ActivityIcon, UserPlus, Send, CheckCircle2, XCircle, FileImage,
  PenLine, ThumbsUp, Camera, ShieldCheck, Banknote, Receipt, Loader2, RefreshCw,
} from "lucide-react"
import { faActivityApi } from "@/services/faAdminApi"
import { toast } from "sonner"
import Link from "next/link"

type ActivityItem = {
  id: string
  kind: string
  title: string
  subtitle?: string | null
  actor?: string | null
  campaign_name?: string | null
  // Optional — present only if the backend feed carries a campaign id for the row.
  campaign_id?: string | null
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
/* Twelve kinds in twelve hues — blue, indigo, emerald, red, amber, orange, purple, green,
   rose, teal, cyan — is a rainbow, not a signal. None of them meant anything, and they were
   the loudest thing on a screen whose figures above carry real state in the same palette.
   The icon tells the kinds apart; the mark behind it is one neutral. */
const KIND_META: Record<string, { label: string; icon: any }> = {
  signup:                { label: "Signup",      icon: UserPlus },
  application:           { label: "Application", icon: Send },
  brand_approved:        { label: "Approved",    icon: CheckCircle2 },
  brand_rejected:        { label: "Rejected",    icon: XCircle },
  content_submitted:     { label: "Content in",  icon: FileImage },
  content_edit_requested:{ label: "Edit asked",  icon: PenLine },
  content_approved:      { label: "Content ok",  icon: ThumbsUp },
  proof_submitted:       { label: "Proof in",    icon: Camera },
  deliverable_verified:  { label: "Verified",    icon: ShieldCheck },
  withdrawal_requested:  { label: "Withdrawal",  icon: Banknote },
  withdrawal_processed:  { label: "Paid out",    icon: Banknote },
  receipt_claim:         { label: "Receipt",     icon: Receipt },
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

// Deep-link an activity row to the most relevant superadmin destination.
// Campaign-scoped kinds prefer the campaign's posts page when a campaign id is
// available on the row; otherwise they fall back to the FA campaigns list.
const DELIVERABLE_KINDS = new Set([
  "content_submitted", "content_edit_requested", "content_approved",
  "proof_submitted", "deliverable_verified",
])
const CAMPAIGN_KINDS = new Set(["application", "brand_approved", "brand_rejected"])
const WITHDRAWAL_KINDS = new Set(["withdrawal_requested", "withdrawal_processed"])

export function activityHref(item: ActivityItem): string {
  const k = item.kind
  if (DELIVERABLE_KINDS.has(k)) return "/superadmin/fa/deliverables"
  if (WITHDRAWAL_KINDS.has(k)) return "/superadmin/fa/withdrawals"
  if (k === "signup") return "/superadmin/fa/members"
  if (k === "receipt_claim") return "/superadmin/fa/receipt-claims"
  if (CAMPAIGN_KINDS.has(k)) {
    return item.campaign_id ? `/campaigns/${item.campaign_id}/posts` : "/superadmin/fa/campaigns"
  }
  return "/superadmin/fa/activity"
}

export function ActivityRow({ item }: { item: ActivityItem }) {
  const meta = KIND_META[item.kind] || { label: item.kind, icon: ActivityIcon }
  const Icon = meta.icon
  return (
    <Link
      href={activityHref(item)}
      className="-mx-2 flex items-start gap-3 rounded-ds-md px-2 py-3 transition-colors hover:bg-black/[0.035] dark:hover:bg-white/[0.05]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md bg-black/[0.04] dark:bg-white/[0.07]">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm leading-tight">{item.title}</p>
          <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${TONE_BADGE.neutral}`}>{meta.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {[item.subtitle, item.campaign_name].filter(Boolean).join(" · ")}
        </p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap pt-0.5">{timeAgo(item.at)}</span>
    </Link>
  )
}

export default function FAActivityPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [items, setItems] = useState<ActivityItem[]>([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  /* Whether the feed answered. Without it a failed request left `items` empty and the
     panel said "No recent activity" — the platform reported quiet because we could not
     ask it. */
  const [error, setError] = useState(false)
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
    if (reset) setError(false)
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
      if (reset) setError(true)
      toast.error("Could not load the activity feed")
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

  /**
   * The four headline figures.
   *
   * They read `summary?.x ?? 0`, and `loadSummary` swallows its own failure as
   * "non-fatal" — so when the summary call did not answer, the band printed four
   * confident zeroes: no applications, nothing awaiting review, no withdrawals
   * pending. On a live-operations screen that is the most expensive lie available,
   * because zero waiting is exactly the state that means "go and do something else".
   * Absent is a dash now. A real zero still prints 0.
   *
   * The colours were decoration — indigo, amber, rose, blue, one per tile, meaning
   * nothing. Tone now carries only state: the two queues turn amber while somebody is
   * actually waiting in them, and the two counters stay neutral because a signup is
   * news, not a problem.
   */
  const n = (v: number | undefined) => (v == null ? "—" : v)
  const queue = (v: number | undefined): Tone => (v ? "warn" : "neutral")
  const cards: { label: string; value: ReactNode; icon: any; tone?: Tone }[] = [
    { label: "Applications today", value: n(summary?.new_applications), icon: Send },
    { label: "Deliverables to review", value: n(summary?.deliverables_awaiting_review),
      icon: FileImage, tone: queue(summary?.deliverables_awaiting_review) },
    { label: "Withdrawals to approve", value: n(summary?.pending_withdrawals),
      icon: Banknote, tone: queue(summary?.pending_withdrawals) },
    { label: "Signed up today", value: n(summary?.new_signups), icon: UserPlus },
  ]

  return (
    <AuthGuard requireAdmin={true}>
      <SuperAdminInterface>
        <FaPage>
          <PageHead
            title="Activity"
            sub="Everything that has happened across the Following App, newest first. Click a line to go to the screen where you can act on it."
            action={
              <Button variant="outline" size="sm" onClick={refresh}>
                <RefreshCw className="h-4 w-4 mr-1.5" />Refresh
              </Button>
            }
          />

          {/* The four headline figures.

              They were four Cards: a border, a background, a shadow and its own padding
              each, laid out in a row — eight edges to cross to compare the first number
              with the last, and every one of those edges saying only "this is a tile",
              which the row already said. The borders come off and the gap goes up a step
              instead, which separates them more clearly than the hairlines did because
              nothing else in the band carries either. The figures take the room the
              padding was holding: 30px to 40px. */}
          <StatGrid>
            {cards.map((c) => (
              <Stat key={c.label} label={c.label} value={c.value} icon={c.icon} tone={c.tone} />
            ))}
          </StatGrid>

          {/* Filters */}
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="flex-wrap h-auto">
              {FILTERS.map((f) => (
                <TabsTrigger key={f.key} value={f.key}>{f.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Feed. This box stays: it is the one place on the screen where the subject
              genuinely changes, from "how much is waiting" to "what happened". It moves to
              the console card shell so its radius and shadow match every other panel. */}
          <div className={`${CARD} bg-[var(--tone-neutral-wash)] p-ds-3`}>
            {loading ? (
              <Loading label="Loading activity" />
            ) : error ? (
              <Failed what="the activity feed" onRetry={() => load(true)} />
            ) : items.length === 0 ? (
              /* The illustration came off with the apology. Nothing happened, and that is
                 the whole sentence. */
              <Nothing>Nothing has happened here yet.</Nothing>
            ) : (
              <>
                <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                  {items.map((it) => <ActivityRow key={it.id} item={it} />)}
                </div>
                {hasMore && (
                  <div className="flex justify-center pt-ds-3">
                    <Button variant="outline" size="sm" disabled={loadingMore} onClick={() => load(false)}>
                      {loadingMore ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                      Load more
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </FaPage>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
