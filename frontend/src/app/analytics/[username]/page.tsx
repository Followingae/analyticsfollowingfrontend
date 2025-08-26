"use client"

import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { CreatorProfilePage } from "@/components/creator/CreatorProfilePage"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import ErrorBoundary from "@/components/ErrorBoundary"

export default function CreatorAnalyticsPage() {
  const params = useParams()
  const username = params.username as string

  if (!username) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invalid Username</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Please provide a valid Instagram username to analyze.
          </p>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <ErrorBoundary>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 66)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <div className="flex-1 overflow-auto p-6">
              <CreatorProfilePage username={username} />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ErrorBoundary>
    </AuthGuard>
  )
}