'use client'

import { ReactNode } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SuperAdminSidebar } from './SuperAdminSidebar'
import { SiteHeader } from '@/components/site-header'
import { ConfirmProvider } from '@/components/console/confirm'
import { ModuleRouteGuard } from '@/components/console/ModuleRouteGuard'
import { GlobalCommandPalette } from '@/components/GlobalCommandPalette'
import { KeyboardShortcuts } from '@/components/console/KeyboardShortcuts'

interface SuperAdminInterfaceProps {
  children?: ReactNode
}

export function SuperAdminInterface({ children }: SuperAdminInterfaceProps) {
  // The console runs on two shells. SuperadminLayout mounts its own ConfirmProvider; the
  // screens on this one had no host at all, so `useConfirm()` would have failed CLOSED on
  // them and a revoke or a delete would have quietly done nothing. One provider per shell,
  // and the two shells are never nested.
  return (
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
      {/* These three used to exist only on the other shell, so Command-K, the slash search and
          the g-plus-letter jumps silently did nothing on the 29 screens that render here,
          including the delivery ladder and enrolment payments. Same console, same keys. */}
      <GlobalCommandPalette />
      <KeyboardShortcuts />
      {/* min-w-0: without it the inset is a flex item that refuses to shrink below its
          content, so a wide board (the delivery ladder is ~2,300px) stretches the whole
          shell — header included — past the viewport and the page reads as zoomed in. */}
      <SidebarInset className="min-w-0">
        <SiteHeader />
        {/* The same ground as the rest of the console: white cards need a shade behind them
            or they have no edge. Screens on this shell were the only ones still on plain
            white, which made their soft trays read as washed out. */}
        <main className="console-ground flex-1 min-h-0">
          <ModuleRouteGuard>{children || <SuperadminDashboard />}</ModuleRouteGuard>
        </main>
      </SidebarInset>
    </SidebarProvider>
    </ConfirmProvider>
  )
}

// Keep the imports for components
import SuperadminDashboard from "./SuperadminDashboard"