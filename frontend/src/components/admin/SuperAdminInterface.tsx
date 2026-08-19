'use client'

import { ReactNode } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SuperAdminSidebar } from './SuperAdminSidebar'
import { SiteHeader } from '@/components/site-header'

interface SuperAdminInterfaceProps {
  children?: ReactNode
}

export function SuperAdminInterface({ children }: SuperAdminInterfaceProps) {
  return (
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
      <SidebarInset>
        <SiteHeader />
        {/* The same ground as the rest of the console: white cards need a shade behind them
            or they have no edge. Screens on this shell were the only ones still on plain
            white, which made their soft trays read as washed out. */}
        <main className="console-ground flex-1 min-h-0">
          {children || <SuperadminDashboard />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

// Keep the imports for components
import SuperadminDashboard from "./SuperadminDashboard"