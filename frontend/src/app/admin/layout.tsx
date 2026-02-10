"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminSidebar } from "@/components/admin/SuperAdminSidebar"
import { SiteHeader } from "@/components/site-header"
import { ClientOnly } from "@/components/ClientOnly"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requiredRole="admin">
      <ClientOnly>
        <SidebarProvider
          defaultOpen={true}
          style={{
            "--sidebar-width": "calc(var(--spacing) * 66)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties}
        >
          <div className="flex min-h-screen w-full">
            <SuperAdminSidebar variant="inset" />
            <SidebarInset>
              <SiteHeader />
              <main className="flex-1 p-6">
                {children}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </ClientOnly>
    </AuthGuard>
  )
}