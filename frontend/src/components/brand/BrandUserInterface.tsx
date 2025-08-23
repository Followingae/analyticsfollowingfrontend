'use client'

import { ReactNode } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { EnhancedAppSidebar } from '@/components/brand/EnhancedAppSidebar'
import { SiteHeader } from '@/components/site-header'
import { FloatingSetupChecklist } from '@/components/setup/FloatingSetupChecklist'

interface BrandUserInterfaceProps {
  children?: ReactNode
}

export function BrandUserInterface({ children }: BrandUserInterfaceProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 66)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <EnhancedAppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 min-h-0">
          {children}
        </main>
        <FloatingSetupChecklist />
      </SidebarInset>
    </SidebarProvider>
  )
}