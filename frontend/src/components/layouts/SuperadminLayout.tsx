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

// Longest-prefix → module mapping for the route guard.
const ROUTE_MODULES: { prefix: string; module: AdminModule }[] = [
  { prefix: "/superadmin/operations", module: "operations" },
  { prefix: "/superadmin/clients", module: "clients" },
  { prefix: "/superadmin/users", module: "users" },
  { prefix: "/superadmin/campaigns", module: "campaigns" },
  { prefix: "/superadmin/proposals", module: "proposals" },
  { prefix: "/superadmin/influencers", module: "influencers" },
  { prefix: "/superadmin/fa", module: "fa" },
  { prefix: "/superadmin/system", module: "system" },
  { prefix: "/superadmin/billing", module: "billing" },
  { prefix: "/ops", module: "operations" },
]
const MODULE_HOME: Record<string, string> = {
  operations: "/superadmin/operations", clients: "/superadmin/clients", users: "/superadmin/users",
  campaigns: "/superadmin/campaigns", proposals: "/superadmin/proposals",
  influencers: "/superadmin/influencers", fa: "/superadmin/fa", system: "/superadmin/system",
  billing: "/superadmin/billing",
}

/** Redirects a module-scoped admin away from a page they can't access. */
function ModuleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ""
  const router = useRouter()
  const { isSuperAdmin, can, loading, modules } = useAdminAccess()

  const required = ROUTE_MODULES.find(r => pathname.startsWith(r.prefix))?.module
  const allowed = isSuperAdmin || !required || can(required)

  React.useEffect(() => {
    if (loading || allowed) return
    // Send the admin to their first allowed module (or the dashboard).
    const first = ADMIN_MODULES.find(m => MODULE_HOME[m.key] && can(m.key as AdminModule))
    router.replace(first ? MODULE_HOME[first.key] : "/superadmin")
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