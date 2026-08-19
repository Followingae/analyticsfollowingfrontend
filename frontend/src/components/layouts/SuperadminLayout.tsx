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
import { MODULE_HOME, modulesForPath } from "@/lib/routeModules"
import { GlobalCommandPalette } from "@/components/GlobalCommandPalette"

interface SuperadminLayoutProps {
  children: React.ReactNode
  requireSuperAdmin?: boolean
  requireAuth?: boolean
}

/** Redirects a module-scoped admin away from a page they can't access. */
function ModuleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ""
  const router = useRouter()
  const { isSuperAdmin, can, loading, modules } = useAdminAccess()

  const required = modulesForPath(pathname)
  const allowed = isSuperAdmin || required.length === 0 || required.some(m => can(m))

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
          {/* The ground the cards sit on. Soft rather than white: the panels are white, and
              a white page under white cards leaves them with no edge at all. Two faint tints
              keep it from reading as flat grey. */}
          <div className="console-ground flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-7 p-4 md:p-7">
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