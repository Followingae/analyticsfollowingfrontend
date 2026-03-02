"use client"

import * as React from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminSidebar } from "@/components/admin/SuperAdminSidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

interface SuperadminLayoutProps {
  children: React.ReactNode
  requireSuperAdmin?: boolean
  requireAuth?: boolean
}

export function SuperadminLayout({
  children,
  requireSuperAdmin = true,
  requireAuth = true
}: SuperadminLayoutProps) {
  return (
    <AuthGuard requireAuth={requireAuth} requireSuperAdmin={requireSuperAdmin}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 66)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <SuperAdminSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
              {children}
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