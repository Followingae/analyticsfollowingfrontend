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
    title: "Currency",
    description: "Team currency settings and multi-currency configuration management",
    href: "/superadmin/currency",
    icon: Globe,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  {
    title: "Job Queue",
    description: "View stuck post analytics jobs, clean up failed jobs, and monitor worker health",
    href: "/superadmin/system/jobs",
    icon: Workflow,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-100 dark:bg-cyan-900/40",
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
