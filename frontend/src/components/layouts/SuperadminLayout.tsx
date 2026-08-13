"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminSidebar } from "@/components/admin/SuperAdminSidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useAdminAccess, type AdminModule, ADMIN_MODULES } from "@/hooks/useAdminAccess"
import { GlobalCommandPalette } from "@/components/GlobalCommandPalette"

interface SuperadminLayoutProps {
  children: React.ReactNode
  requireSuperAdmin?: boolean
  requireAuth?: boolean
}

// Screen → module, matched on the screen itself rather than the prefix, because the same
// page is reachable at /work/... (what staff see) and /superadmin/... (the physical route).
// Gating on the prefix alone let the /work URL through ungated.
const ROUTE_MODULES: { screen: string; module: AdminModule }[] = [
  { screen: "operations", module: "operations" },
  { screen: "clients", module: "clients" },
  { screen: "brands", module: "clients" },
  { screen: "staff", module: "users" },
  { screen: "users", module: "users" },
  { screen: "campaigns", module: "campaigns" },
  { screen: "proposals", module: "proposals" },
  { screen: "influencers", module: "influencers" },
  { screen: "coverage", module: "influencers" },
  { screen: "sourcing", module: "influencers" },
  { screen: "fa", module: "fa" },
  { screen: "notifications", module: "system" },
  { screen: "whatsapp", module: "system" },
  { screen: "system", module: "system" },
  { screen: "billing", module: "billing" },
]

/** The screen name, whichever prefix it was reached through. */
function screenOf(pathname: string): string | null {
  const m = pathname.match(/^\/(?:work|superadmin)\/([^/?#]+)/)
  if (m) return m[1]
  return pathname.startsWith("/ops") ? "operations" : null
}

// Where to send someone who lands somewhere they cannot go. Always the /work spelling —
// nobody internal should be handed a URL that says superadmin.
const MODULE_HOME: Record<string, string> = {
  operations: "/ops/campaigns", clients: "/work/clients", users: "/work/users",
  campaigns: "/work/campaigns", proposals: "/work/proposals",
  influencers: "/work/influencers", fa: "/work/fa", system: "/work/system",
  billing: "/work/billing",
}

/** Redirects a module-scoped admin away from a page they can't access. */
function ModuleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ""
  const router = useRouter()
  const { isSuperAdmin, can, loading, modules } = useAdminAccess()

  const screen = screenOf(pathname)
  const required = ROUTE_MODULES.find(r => r.screen === screen)?.module
  const allowed = isSuperAdmin || !required || can(required)

  React.useEffect(() => {
    if (loading || allowed) return
    // Send the admin to their first allowed module (or the dashboard).
    const first = ADMIN_MODULES.find(m => MODULE_HOME[m.key] && can(m.key as AdminModule))
    router.replace(first ? MODULE_HOME[first.key] : "/work/today")
  }, [loading, allowed, can, router])

  if (!loading && !allowed) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Redirecting…
      </div>
    )
  }
  return <>{children}</>
}

export function SuperadminLayout({
  children,
  requireSuperAdmin = true,
  requireAuth = true
}: SuperadminLayoutProps) {
  // Admit operators (admin + super_admin); per-module access is enforced by
  // ModuleRouteGuard below and by the backend require_module() guards.
  return (
    <AuthGuard requireAuth={requireAuth} requireAdmin={true} requireSuperAdmin={false}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 66)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <SuperAdminSidebar variant="inset" />
        <GlobalCommandPalette />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
              <ModuleRouteGuard>{children}</ModuleRouteGuard>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}

// Export a convenience wrapper for superadmin pages
export function withSuperadminLayout<P extends object>(
  Component: React.ComponentType<P>
) {
  const WrappedComponent = (props: P) => (
    <SuperadminLayout>
      <Component {...props} />
    </SuperadminLayout>
  )

  WrappedComponent.displayName = `withSuperadminLayout(${Component.displayName || Component.name})`

  return WrappedComponent
}