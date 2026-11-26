'use client'

import { ReactNode } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { EnhancedAppSidebar } from '@/components/brand/EnhancedAppSidebar'
import { SiteHeader } from '@/components/site-header'
import { GlobalCommandPalette } from '@/components/GlobalCommandPalette'
import { useViewOnly } from '@/lib/viewOnly'

interface BrandUserInterfaceProps {
  children?: ReactNode
}

export function BrandUserInterface({ children }: BrandUserInterfaceProps) {
  // A viewer login has two pages; a palette that jumps anywhere has nothing to offer it.
  const { scoped: viewer } = useViewOnly()
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
      {!viewer && <GlobalCommandPalette />}
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <main className="flex-1 min-h-0 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}