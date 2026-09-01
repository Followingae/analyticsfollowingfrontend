"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Button } from "@/components/ui/button"
import { CARD, PageHead, Stat, StatGrid, type Tone } from "@/components/console/primitives"
import {
  Users, Store, Megaphone, ClipboardCheck, Banknote, Clock, Activity, ArrowRight,
  Camera, UserPlus, UserCheck, Receipt,
} from "lucide-react"
import Link from "next/link"
import { faStatsApi, faActivityApi } from "@/services/faAdminApi"
import { FaPage, Failed, Loading, Nothing } from "./_ui"
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
  /** null = has not answered yet, false = the request failed, [] = we asked and it is quiet. */
  const [activity, setActivity] = useState<any[] | null | false>(null)

  /* The feed used to `catch(() => setActivity([]))`, and an empty array renders "No recent
     activity". So a broken feed told the operator the platform had gone quiet. Failure is
     its own state now: `false` means the request came back broken, `null` means it has not
     answered yet, and an empty array means we asked and nothing happened. */
  const loadActivity = useCallback(() => {
    faActivityApi.feed({ limit: 8 })
      .then((res) => {
        const list = res?.data?.activity ?? res?.data ?? []
        setActivity(Array.isArray(list) ? list : [])
      })
      .catch(() => setActivity(false))
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
      label: "Withdrawals to approve",
      value: summary?.pending_withdrawals,
      icon: Banknote,
      href: "/superadmin/fa/withdrawals",
    },
    {
      label: "Creators to decide on",
      value: stats?.pending_approvals,
      icon: UserCheck,
      href: "/superadmin/fa/members",
    },
    {
      label: "Signed up today",
      value: summary?.new_signups,
      icon: UserPlus,
      href: "/superadmin/fa/members",
    },
    {
      label: "Receipts to check",
      value: summary?.pending_receipts,
      icon: Receipt,
      href: "/superadmin/fa/receipt-claims",
    },
  ]

  // ─── (c) Platform overview — existing roll-up stat cards ──────────────
  const cards = [
    { label: "Creators signed up", value: stats?.total_members, icon: Users, href: "/superadmin/fa/members" },
    { label: "Waiting on a decision", value: stats?.pending_approvals, icon: Clock, href: "/superadmin/fa/members" },
    { label: "Merchants live", value: stats?.active_merchants, icon: Store, href: "/superadmin/fa/merchants" },
    { label: "Campaigns running", value: stats?.active_campaigns, icon: Megaphone, href: "/superadmin/fa/campaigns" },
    { label: "Deliverables outstanding", value: stats?.pending_deliverables, icon: ClipboardCheck, href: "/superadmin/fa/deliverables" },
    { label: "Withdrawals waiting", value: stats?.pending_withdrawals, icon: Banknote, href: "/superadmin/fa/withdrawals" },
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
        <FaPage>
          <PageHead
            title="Following App"
            sub="The staff side of the creator app: who is waiting on a decision, what has just happened, and how big the platform is right now."
          />

          {/* ─── (a) Pending Tasks ─── */}
          <section className="space-y-ds-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Waiting on somebody</h2>
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
                <Activity className="h-4 w-4 text-primary" />What just happened
              </h2>
              <Link href="/superadmin/fa/activity">
                <Button variant="ghost" size="sm">See everything<ArrowRight className="h-4 w-4 ml-1" /></Button>
              </Link>
            </div>
            {/* The feed keeps its box: it is a list, not a figure, and it is the one thing
                on the page that reads top to bottom. */}
            <div className={`${CARD} bg-[var(--tone-neutral-wash)] p-ds-3`}>
              {activity === null ? (
                <Loading label="Loading the feed" />
              ) : activity === false ? (
                <Failed what="the activity feed" onRetry={loadActivity} />
              ) : activity.length === 0 ? (
                <Nothing>Nothing has happened on the platform yet.</Nothing>
              ) : (
                <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                  {activity.map((it: any) => <ActivityRow key={it.id} item={it} />)}
                </div>
              )}
            </div>
          </section>

          {/* ─── (c) Platform overview ─── */}
          <section className="space-y-ds-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">How big the platform is</h2>
            <StatGrid cols={3}>
              {cards.map((c) => (
                <Link key={c.label} href={c.href} className={TILE_LINK}>
                  <Stat label={c.label} value={fig(c.value)} icon={c.icon} />
                </Link>
              ))}
            </StatGrid>
          </section>
        </FaPage>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
