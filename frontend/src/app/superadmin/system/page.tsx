"use client"

import Link from "next/link"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart3,
  Coins,
  Globe,
  Shield,
  KeyRound,
  ScrollText,
  Bell,
  Settings,
  Workflow,
} from "lucide-react"

export const dynamic = 'force-dynamic'

const systemSections = [
  {
    title: "Analytics",
    description: "Real-time platform analytics, system performance metrics, and credit flows",
    href: "/superadmin/analytics",
    icon: BarChart3,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
  },
  {
    title: "Credits & Billing",
    description: "Credit system overview, transaction history, pricing rules, and manual adjustments",
    href: "/superadmin/credits",
    icon: Coins,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/40",
  },
  {
    title: "Currency",
    description: "Team currency settings and multi-currency configuration management",
    href: "/superadmin/currency",
    icon: Globe,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  {
    title: "Security",
    description: "Security alerts, suspicious activity monitoring, and threat detection",
    href: "/superadmin/security",
    icon: Shield,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/40",
  },
  {
    title: "Access Control",
    description: "User roles, permission matrix, and access level management",
    href: "/superadmin/access",
    icon: KeyRound,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/40",
  },
  {
    title: "Activity Logs",
    description: "Audit trail, user activity monitoring, and system event history",
    href: "/superadmin/logs",
    icon: ScrollText,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-900/40",
  },
  {
    title: "Notifications",
    description: "System notifications, security alerts, and broadcast messaging",
    href: "/superadmin/notifications",
    icon: Bell,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/40",
  },
  {
    title: "Job Queue",
    description: "View stuck post analytics jobs, clean up failed jobs, and monitor worker health",
    href: "/superadmin/system/jobs",
    icon: Workflow,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-100 dark:bg-cyan-900/40",
  },
  {
    title: "Settings",
    description: "System configurations, feature flags, and platform runtime settings",
    href: "/superadmin/settings",
    icon: Settings,
    color: "text-zinc-600 dark:text-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-900/40",
  },
]

export default function SuperadminSystemPage() {
  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System</h1>
          <p className="text-muted-foreground">
            Platform configuration, monitoring, and administration tools
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {systemSections.map((section) => {
            const Icon = section.icon
            return (
              <Link key={section.href} href={section.href}>
                <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${section.bg}`}>
                        <Icon className={`h-5 w-5 ${section.color}`} />
                      </div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {section.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </SuperadminLayout>
  )
}
