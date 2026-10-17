"use client"

import * as React from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminSidebar } from "@/components/admin/SuperAdminSidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { GlobalCommandPalette } from "@/components/GlobalCommandPalette"
import { KeyboardShortcuts } from "@/components/console/KeyboardShortcuts"
import { ConfirmProvider } from "@/components/console/confirm"
import { ModuleRouteGuard } from "@/components/console/ModuleRouteGuard"

interface SuperadminLayoutProps {
  children: React.ReactNode
  requireSuperAdmin?: boolean
  requireAuth?: boolean
}

/* `ModuleRouteGuard` moved to `@/components/console/ModuleRouteGuard` so the console's other
   shell can use the same one. It used to live here, which is why 29 screens had no guard. */

export function SuperadminLayout({
  children,
  requireSuperAdmin = true,
  requireAuth = true
}: SuperadminLayoutProps) {
  // Admit operators (admin + super_admin); per-module access is enforced by
  // ModuleRouteGuard below and by the backend require_module() guards.
  return (
    <AuthGuard requireAuth={requireAuth} requireAdmin={true} requireSuperAdmin={false}>
      {/* One confirmation host for the whole console, so `useConfirm()` works on every screen
          without each one mounting its own dialog. Outside this provider the hook fails CLOSED
          on anything consequential, which is the right way round: a money action that silently
          proceeds because a provider was missing is the bug you find after the transfer. */}
      <ConfirmProvider>
      <SidebarProvider
      className="console-shell"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 66)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <SuperAdminSidebar variant="inset" />
        <GlobalCommandPalette />
        {/* One handler for the whole console. Press ? to see what it does. */}
        <KeyboardShortcuts />
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
      </ConfirmProvider>
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