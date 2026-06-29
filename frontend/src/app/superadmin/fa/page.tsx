"use client"

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
      .catch(() => {/* non-fatal — Pending Tasks just shows zeros */})
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

  // ─── (a) Pending Tasks — actionable counts that need a human ──────────
  const tasks = [
    {
      label: "Proofs to verify",
      value: summary?.deliverables_awaiting_review ?? 0,
      icon: Camera,
      href: "/superadmin/fa/deliverables",
      color: "text-amber-500",
    },
    {
      label: "Pending withdrawals",
      value: summary?.pending_withdrawals ?? 0,
      icon: Banknote,
      href: "/superadmin/fa/withdrawals",
      color: "text-rose-500",
    },
    {
      label: "Pending members",
      value: stats?.pending_approvals ?? 0,
      icon: UserCheck,
      href: "/superadmin/fa/members",
      color: "text-blue-500",
    },
    {
      label: "New signups today",
      value: summary?.new_signups ?? 0,
      icon: UserPlus,
      href: "/superadmin/fa/members",
      color: "text-emerald-500",
    },
    {
      label: "Receipts to review",
      value: summary?.pending_receipts ?? 0,
      icon: Receipt,
      href: "/superadmin/fa/receipt-claims",
      color: "text-cyan-500",
    },
  ]

  // ─── (c) Platform overview — existing roll-up stat cards ──────────────
  const cards = [
    { label: "Total Members", value: stats?.total_members ?? 0, icon: Users, href: "/superadmin/fa/members", color: "text-blue-500" },
    { label: "Edge-Case Review", value: stats?.pending_approvals ?? 0, icon: Clock, href: "/superadmin/fa/members", color: "text-amber-500" },
    { label: "Active Merchants", value: stats?.active_merchants ?? 0, icon: Store, href: "/superadmin/fa/merchants", color: "text-green-500" },
    { label: "Active Campaigns", value: stats?.active_campaigns ?? 0, icon: Megaphone, href: "/superadmin/fa/campaigns", color: "text-purple-500" },
    { label: "Pending Deliverables", value: stats?.pending_deliverables ?? 0, icon: ClipboardCheck, href: "/superadmin/fa/deliverables", color: "text-orange-500" },
    { label: "Pending Withdrawals", value: stats?.pending_withdrawals ?? 0, icon: Banknote, href: "/superadmin/fa/withdrawals", color: "text-red-500" },
  ]

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold">Following App</h1>
            <p className="text-muted-foreground text-sm">Influencer cashback platform management</p>
          </div>

          {/* ─── (a) Pending Tasks ─── */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Pending Tasks</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {tasks.map((t) => {
                const active = (t.value ?? 0) > 0
                return (
                  <Link key={t.label} href={t.href}>
                    <Card className={`cursor-pointer transition-shadow hover:shadow-md ${active ? "border-primary/30 bg-primary/[0.03]" : ""}`}>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{t.label}</CardTitle>
                        <t.icon className={`h-4 w-4 shrink-0 ${t.color}`} />
                      </CardHeader>
                      <CardContent>
                        <p className={`text-3xl font-bold ${active ? "" : "text-muted-foreground/70"}`}>{t.value}</p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* ─── (b) Latest Activity ─── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />Latest Activity
              </h2>
              <Link href="/superadmin/fa/activity">
                <Button variant="ghost" size="sm">View all<ArrowRight className="h-4 w-4 ml-1" /></Button>
              </Link>
            </div>
            <Card>
              <CardContent className="p-4">
                {activity === null ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No recent activity</p>
                ) : (
                  <div className="divide-y">
                    {activity.map((it: any) => <ActivityRow key={it.id} item={it} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* ─── (c) Platform overview ─── */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Platform Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((c) => (
                <Link key={c.label} href={c.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                      <c.icon className={`h-5 w-5 ${c.color}`} />
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{c.value}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
