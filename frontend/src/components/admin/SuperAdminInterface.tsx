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
        <main className="flex-1 min-h-0">
          {children || <SuperadminDashboard />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

// Keep the imports for components
import SuperadminDashboard from "./SuperadminDashboard"