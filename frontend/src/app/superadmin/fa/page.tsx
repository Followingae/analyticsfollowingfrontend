"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Button } from "@/components/ui/button"
import { CARD, PageHead, Stat, StatGrid, type Tone } from "@/components/console/primitives"
import {
  Users, Store, Megaphone, ClipboardCheck, Banknote, Clock, Activity, ArrowRight,
  Loader2, Camera, UserPlus, UserCheck, Receipt,
} from "lucide-react"
import Link from "next/link"
import { faStatsApi, faActivityApi } from "@/services/faAdminApi"
import { ActivityRow } from "@/app/superadmin/fa/activity/page"

type Summary = {
  new_applications: number
  deliverables_awaiting_review: number
  pending_withdrawals: number
  new_signups: number
  pending_receipts?: number
}

export default function FADashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [activity, setActivity] = useState<any[] | null>(null)

  const loadActivity = useCallback(() => {
    faActivityApi.feed({ limit: 8 })
      .then((res) => {
        const list = res?.data?.activity ?? res?.data ?? []
        setActivity(Array.isArray(list) ? list : [])
      })
      .catch(() => setActivity([]))
  }, [])

  const loadSummary = useCallback(() => {
    faActivityApi.summary()
      .then((res) => { const p = res?.data ?? res; if (p && typeof p === "object") setSummary(p) })
      // Non-fatal. It used to say "Pending Tasks just shows zeros", which was true and was
      // the bug: `summary` stayed null, every tile read `?? 0`, and a failed request became
      // five confident statements that there is nothing to do. The tiles show an em dash
      // for an absent figure now, so a failure looks like a failure.
      .catch(() => {/* non-fatal — the tiles it feeds show an em dash */})
  }, [])

  const loadStats = useCallback(() => {
    // Tolerate either { success, data } or a raw stats payload - different backend
    // routes return different shapes, and silently showing zeros forever was masking
    // real failures.
    faStatsApi.dashboard()
      .then((res) => {
        const payload = res?.data ?? res
        if (payload && typeof payload === "object") setStats(payload)
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error("FA dashboard stats fetch failed:", e)
      })
  }, [])

  // Load on mount
  useEffect(() => { loadStats(); loadSummary(); loadActivity() }, [loadStats, loadSummary, loadActivity])

  // Re-fetch when tab/page becomes visible again (user navigated back)
  useEffect(() => {
    const refreshAll = () => { loadStats(); loadSummary(); loadActivity() }
    const handleVisibility = () => { if (document.visibilityState === 'visible') refreshAll() }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', refreshAll)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', refreshAll)
    }
  }, [loadStats, loadSummary, loadActivity])

  /**
   * A figure that never arrived is a dash.
   *
   * Every one of the eleven tiles on this screen read `?? 0` over an object that stays null
   * when its request fails, and both requests swallow their own failure. So a dashboard
   * whose two feeds were down rendered eleven confident zeroes — nothing to verify, nobody
   * to pay, no members waiting — which is the exact reading that sends somebody away from
   * the screen. A real zero still prints 0, in the lighter weight it always used.
   */
  const fig = (v: number | null | undefined) =>
    v == null ? '—' : v > 0 ? v : <span className="text-muted-foreground/70">0</span>

  /** Tone marks a queue that has somebody in it; it is not decoration. */
  const busy = (v: number | null | undefined): Tone => (v ? 'warn' : 'neutral')

  // ─── (a) Pending Tasks — actionable counts that need a human ──────────
  const tasks = [
    {
      label: "Proofs to verify",
      value: summary?.deliverables_awaiting_review,
      icon: Camera,
      href: "/superadmin/fa/deliverables",
    },
    {
      label: "Pending withdrawals",
      value: summary?.pending_withdrawals,
      icon: Banknote,
      href: "/superadmin/fa/withdrawals",
    },
    {
      label: "Pending members",
      value: stats?.pending_approvals,
      icon: UserCheck,
      href: "/superadmin/fa/members",
    },
    {
      label: "New signups today",
      value: summary?.new_signups,
      icon: UserPlus,
      href: "/superadmin/fa/members",
    },
    {
      label: "Receipts to review",
      value: summary?.pending_receipts,
      icon: Receipt,
      href: "/superadmin/fa/receipt-claims",
    },
  ]

  // ─── (c) Platform overview — existing roll-up stat cards ──────────────
  const cards = [
    { label: "Total Members", value: stats?.total_members, icon: Users, href: "/superadmin/fa/members" },
    { label: "Edge-Case Review", value: stats?.pending_approvals, icon: Clock, href: "/superadmin/fa/members" },
    { label: "Active Merchants", value: stats?.active_merchants, icon: Store, href: "/superadmin/fa/merchants" },
    { label: "Active Campaigns", value: stats?.active_campaigns, icon: Megaphone, href: "/superadmin/fa/campaigns" },
    { label: "Pending Deliverables", value: stats?.pending_deliverables, icon: ClipboardCheck, href: "/superadmin/fa/deliverables" },
    { label: "Pending Withdrawals", value: stats?.pending_withdrawals, icon: Banknote, href: "/superadmin/fa/withdrawals" },
  ]

  /* The shared hover/focus affordance the Stat gets when it is a link. Stat itself supplies
     the padding, so this only carries the target shape. */
  const TILE_LINK =
    'block rounded-ds-lg transition-colors hover:bg-black/[0.035] dark:hover:bg-white/[0.05] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  return (
    <AuthGuard requireAdmin={true}>
      <SuperAdminInterface>
        {/* Eleven numbers, and every one of them used to arrive in its own box: a border,
            a background, a shadow and its own padding, in two grids one above the other.
            Twenty-two edges on one screen, none of which said anything the grid had not
            already said. The borders come off both bands and the gap goes up a step; the
            section headings and the space beneath them are what separate "what needs a
            human" from "how big the platform is", which is the one place on this screen
            the subject genuinely changes. */}
        <div className="space-y-ds-5">
          <PageHead title="Following App" sub="Influencer cashback platform management" />

          {/* ─── (a) Pending Tasks ─── */}
          <section className="space-y-ds-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Pending Tasks</h2>
            {/* Five across, so this band writes StatGrid's language out rather than adding a
                fifth column to a primitive sixteen other screens depend on. */}
            <div className="-mx-ds-2 grid grid-cols-2 gap-x-ds-5 gap-y-ds-4 sm:grid-cols-3 lg:grid-cols-5">
              {tasks.map((t) => (
                <Link key={t.label} href={t.href} className={TILE_LINK}>
                  <Stat label={t.label} value={fig(t.value)} icon={t.icon} tone={busy(t.value)} />
                </Link>
              ))}
            </div>
          </section>

          {/* ─── (b) Latest Activity ─── */}
          <section className="space-y-ds-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-ds-2">
                <Activity className="h-4 w-4 text-primary" />Latest Activity
              </h2>
              <Link href="/superadmin/fa/activity">
                <Button variant="ghost" size="sm">View all<ArrowRight className="h-4 w-4 ml-1" /></Button>
              </Link>
            </div>
            {/* The feed keeps its box: it is a list, not a figure, and it is the one thing
                on the page that reads top to bottom. */}
            <div className={`${CARD} bg-[var(--tone-neutral-wash)] p-ds-3`}>
              {activity === null ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : activity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No recent activity</p>
              ) : (
                <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                  {activity.map((it: any) => <ActivityRow key={it.id} item={it} />)}
                </div>
              )}
            </div>
          </section>

          {/* ─── (c) Platform overview ─── */}
          <section className="space-y-ds-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Platform Overview</h2>
            <StatGrid cols={3}>
              {cards.map((c) => (
                <Link key={c.label} href={c.href} className={TILE_LINK}>
                  <Stat label={c.label} value={fig(c.value)} icon={c.icon} />
                </Link>
              ))}
            </StatGrid>
          </section>
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
