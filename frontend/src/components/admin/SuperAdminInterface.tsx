'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { RefreshCw, Shield, Users, Settings, Database, BarChart3, Brain, FileImage, Server, Download, Lock, User, Crown, Zap, Activity } from "lucide-react"

import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { SiteHeader } from "@/components/site-header"

// Import all the new comprehensive dashboard components
import { AdminDashboard } from "./AdminDashboard"
import EnhancedUserManagementDashboard from "./EnhancedUserManagementDashboard"
import RolePermissionDashboard from "./RolePermissionDashboard"
import { FinancialDashboard } from "./FinancialDashboard"
import { InfluencerDashboard } from "./InfluencerDashboard"
import { ProposalDashboard } from "./ProposalDashboard"
import { AISystemDashboard } from "./AISystemDashboard"
import { ContentManagementDashboard } from "./ContentManagementDashboard"
import { SystemConfigDashboard } from "./SystemConfigDashboard"
import { PlatformAnalyticsDashboard } from "./PlatformAnalyticsDashboard"
import { UserIntelligenceDashboard } from "./UserIntelligenceDashboard"
import OperationsDashboard from "./OperationsDashboard"
import DataExportDashboard from "./DataExportDashboard"
import SecurityComplianceDashboard from "./SecurityComplianceDashboard"
import { SystemMonitorDashboard } from "./SystemMonitorDashboard"

export function SuperAdminInterface() {
  const [currentTab, setCurrentTab] = useState("dashboard")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRefreshAll = async () => {
    setLoading(true)
    // Trigger refresh across all components
    window.location.reload()
  }

  const tabConfigs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      component: AdminDashboard,
      description: "Main overview and key metrics"
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      component: EnhancedUserManagementDashboard,
      description: "Advanced user management with security controls"
    },
    {
      id: "roles",
      label: "Roles & Permissions",
      icon: Crown,
      component: RolePermissionDashboard,
      description: "Role-based access control and permissions"
    },
    {
      id: "credits",
      label: "Financial",
      icon: Database,
      component: FinancialDashboard,
      description: "Credits, billing, and financial management"
    },
    {
      id: "influencers",
      label: "Influencers",
      icon: User,
      component: InfluencerDashboard,
      description: "Influencer database and analytics"
    },
    {
      id: "proposals",
      label: "Proposals",
      icon: FileImage,
      component: ProposalDashboard,
      description: "Campaign proposals and brand management"
    },
    {
      id: "ai",
      label: "AI Systems",
      icon: Brain,
      component: AISystemDashboard,
      description: "AI model monitoring and analysis queue"
    },
    {
      id: "content",
      label: "Content",
      icon: FileImage,
      component: ContentManagementDashboard,
      description: "Content moderation and media management"
    },
    {
      id: "config",
      label: "Configuration",
      icon: Settings,
      component: SystemConfigDashboard,
      description: "System settings and feature flags"
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      component: PlatformAnalyticsDashboard,
      description: "Advanced platform analytics and insights"
    },
    {
      id: "intelligence",
      label: "Intelligence",
      icon: Zap,
      component: UserIntelligenceDashboard,
      description: "User intelligence and business forecasting"
    },
    {
      id: "operations",
      label: "Operations",
      icon: Server,
      component: OperationsDashboard,
      description: "System health and maintenance operations"
    },
    {
      id: "exports",
      label: "Data Export",
      icon: Download,
      component: DataExportDashboard,
      description: "Data exports and integration management"
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      component: SecurityComplianceDashboard,
      description: "Security monitoring and compliance"
    },
    {
      id: "monitoring",
      label: "Monitoring",
      icon: Activity,
      component: SystemMonitorDashboard,
      description: "System monitoring and health checks"
    }
  ]

  const getCurrentComponent = () => {
    const currentConfig = tabConfigs.find(tab => tab.id === currentTab)
    if (!currentConfig) return null

    const Component = currentConfig.component
    return <Component />
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 66)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SuperadminSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">

            {/* Header with Actions */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
                <p className="text-muted-foreground">
                  Comprehensive platform management and oversight • {tabConfigs.find(t => t.id === currentTab)?.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleRefreshAll} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh All
                </Button>
              </div>
            </div>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
              {/* Navigation Tabs */}
              <div className="border-b">
                <TabsList className="grid w-full grid-cols-8 lg:grid-cols-15 h-auto p-1">
                  {tabConfigs.map((tab) => {
                    const IconComponent = tab.icon
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="hidden lg:inline">{tab.label}</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>

              {/* Tab Content */}
              <div className="flex-1">
                {tabConfigs.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="m-0">
                    {getCurrentComponent()}
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}