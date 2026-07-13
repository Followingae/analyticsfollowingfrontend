"use client"

import { useState } from "react"
import Link from "next/link"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import {
  BarChart3,
  Coins,
  Shield,
  KeyRound,
  ScrollText,
  Bell,
  Settings,
  Workflow,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react"

function DemoSandboxCard() {
  const [resetting, setResetting] = useState(false)
  const resetDemo = async () => {
    setResetting(true)
    try {
      const res = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/demo/reset`, {
        method: "POST", headers: { ...getAuthHeaders() },
      })
      if (!res.ok) { let m = ""; try { m = (await res.json())?.detail } catch { m = await res.text() }; throw new Error(m || "Reset failed") }
      toast.success("Demo sandbox reset to the golden snapshot.")
    } catch (e: any) {
      toast.error(e.message || "Could not reset the demo sandbox")
    } finally {
      setResetting(false)
    }
  }
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
            <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-lg">Demo Sandbox</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="text-sm">
          The shared prospect account (<span className="font-medium">demo@following.ae</span>, brand “Auré”).
          Rebuilds to the golden snapshot nightly — use this to reset it right before a live demo.
        </CardDescription>
        <Button size="sm" variant="outline" disabled={resetting} onClick={resetDemo}>
          {resetting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Resetting…</> : <><RefreshCw className="h-4 w-4 mr-2" />Reset now</>}
        </Button>
      </CardContent>
    </Card>
  )
}

export const dynamic = 'force-dynamic'

const systemSections = [
  // Currency card removed: the page called a removed currencyService (crashed on
  // mount) and per-team currency is obsolete under the AED-everywhere model.
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
          <DemoSandboxCard />
        </div>
      </div>
    </SuperadminLayout>
  )
}
