"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export const dynamic = 'force-dynamic'

export default function SuperadminCreditsPage() {
  return (
    <AuthGuard requireAuth={true} requireSuperAdmin={true}>
      <SidebarProvider>
        <SuperadminSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Credits & Billing</h1>
                  <p className="text-muted-foreground">Manage credit system and billing</p>
                </div>
              </div>

              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Credit Management</h3>
                <p className="text-muted-foreground">
                  Credit and billing management coming soon...
                </p>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}