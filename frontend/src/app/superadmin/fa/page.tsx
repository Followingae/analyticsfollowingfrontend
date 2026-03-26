"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Store, Megaphone, ClipboardCheck, Banknote, Clock } from "lucide-react"
import Link from "next/link"
import { faStatsApi } from "@/services/faAdminApi"

export default function FADashboardPage() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    faStatsApi.dashboard().then((res) => {
      if (res.success) setStats(res.data)
    }).catch(() => {})
  }, [])

  const cards = [
    { label: "Total Members", value: stats?.total_members ?? "—", icon: Users, href: "/superadmin/fa/members", color: "text-blue-500" },
    { label: "Pending Approvals", value: stats?.pending_approvals ?? "—", icon: Clock, href: "/superadmin/fa/members", color: "text-amber-500" },
    { label: "Active Merchants", value: stats?.active_merchants ?? "—", icon: Store, href: "/superadmin/fa/merchants", color: "text-green-500" },
    { label: "Active Campaigns", value: stats?.active_campaigns ?? "—", icon: Megaphone, href: "/superadmin/fa/campaigns", color: "text-purple-500" },
    { label: "Pending Deliverables", value: stats?.pending_deliverables ?? "—", icon: ClipboardCheck, href: "/superadmin/fa/deliverables", color: "text-orange-500" },
    { label: "Pending Withdrawals", value: stats?.pending_withdrawals ?? "—", icon: Banknote, href: "/superadmin/fa/withdrawals", color: "text-red-500" },
  ]

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Following App</h1>
            <p className="text-muted-foreground text-sm">Influencer cashback platform management</p>
          </div>
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
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
