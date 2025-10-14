"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import DiscoveryTab from "@/components/tabs/DiscoveryTab"

export default function DiscoverPage() {

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 66)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Discover Creators</h1>
                <p className="text-muted-foreground mt-2">
                  Discover the perfect creators for your brand using our AI-powered matching system.
                </p>
              </div>
            </div>

            {/* Discovery Content */}
            <DiscoveryTab />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
