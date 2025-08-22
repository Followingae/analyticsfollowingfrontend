'use client'

import { ReactNode } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { EnhancedAppSidebar } from '@/components/brand/EnhancedAppSidebar'

interface BrandUserInterfaceProps {
  children?: ReactNode
}

export function BrandUserInterface({ children }: BrandUserInterfaceProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <EnhancedAppSidebar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}