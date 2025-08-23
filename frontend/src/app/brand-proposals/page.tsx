"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { FileText, Send, Handshake } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { EmptyState } from "@/components/ui/empty-state"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function BrandProposalsPage() {

  return (
    <AuthGuard requireAuth={true}>
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
              <div className="text-center">
                <h1 className="text-4xl font-bold">Proposals</h1>
              </div>

              {/* Proposals Empty State */}
              <div className="flex items-center justify-center min-h-[70vh] px-4">
                <EmptyState
                  title="Agency Proposals"
                  description="Proposals will appear here for clients who have Following as their marketing agency.

Connect with us to explore our professional marketing services and partnership opportunities."
                  icons={[FileText, Send, Handshake]}
                  action={{
                    label: "Contact Following Agency",
                    onClick: () => window.open("https://www.following.ae/contact-us", "_blank")
                  }}
                  className="max-w-4xl p-20 text-lg"
                />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}