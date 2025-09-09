'use client'

import { useState, useEffect } from "react"
import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import {
  Users,
  Shield,
  Database,
  TrendingUp,
  Activity,
  Server,
  AlertCircle,
  CheckCircle,
  DollarSign,
  FileText,
  RefreshCw,
  BarChart3
} from "lucide-react"

import { 
  superadminApiService, 
  AdminOverview
} from "@/services/superadminApi"

export default function AdminDashboardPage() {
  // State Management
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)

  // Load overview data
  const loadOverview = async () => {
    setLoading(true)
    try {
      const result = await superadminApiService.getAdminOverview()
      if (result.success && result.data) {
        setOverview(result.data)
      }
    } catch (error) {
      console.warn('Admin overview API not available - using mock data for demo')
      // Mock data for demo purposes
      setOverview({
        system_stats: {
          total_users: 12847,
          active_users_24h: 3421,
          total_transactions: 89234,
          system_uptime: 99.97,
          total_revenue: 245890,
          active_subscriptions: 8234
        },
        recent_activity: {
          new_users_today: 156,
          transactions_today: 1234,
          support_tickets_open: 23,
          system_alerts: 2
        },
        platform_health: {
          api_response_time: 145,
          database_performance: 98.5,
          error_rate: 0.02,
          cpu_usage: 34,
          memory_usage: 67,
          disk_usage: 45
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverview()
  }, [])

  // Utility functions
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getHealthStatus = (percentage: number) => {
    if (percentage >= 95) return { color: 'text-green-600', bg: 'bg-green-100', status: 'Excellent' }
    if (percentage >= 80) return { color: 'text-yellow-600', bg: 'bg-yellow-100', status: 'Good' }
    return { color: 'text-red-600', bg: 'bg-red-100', status: 'Needs Attention' }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <SuperadminSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading admin dashboard...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
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
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">Platform overview and system management</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => loadOverview()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            {overview && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(overview.system_stats.total_users)}</div>
                    <p className="text-xs text-muted-foreground">
                      +{formatNumber(overview.recent_activity.new_users_today)} today
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Activity className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(overview.system_stats.active_users_24h)}</div>
                    <p className="text-xs text-muted-foreground">
                      Last 24 hours
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(overview.system_stats.total_revenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(overview.recent_activity.transactions_today)} transactions today
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* System Health Overview */}
            {overview && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>Real-time platform performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>System Uptime</span>
                          <span>{overview.system_stats.system_uptime}%</span>
                        </div>
                        <Progress value={overview.system_stats.system_uptime} />
                        <Badge className={getHealthStatus(overview.system_stats.system_uptime).bg + ' ' + getHealthStatus(overview.system_stats.system_uptime).color}>
                          {getHealthStatus(overview.system_stats.system_uptime).status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Database Performance</span>
                          <span>{overview.platform_health.database_performance}%</span>
                        </div>
                        <Progress value={overview.platform_health.database_performance} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>API Response Time</span>
                          <span>{overview.platform_health.api_response_time}ms</span>
                        </div>
                        <Progress value={Math.max(0, 100 - (overview.platform_health.api_response_time / 10))} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resource Usage</CardTitle>
                    <CardDescription>Current server resource consumption</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>CPU Usage</span>
                          <span>{overview.platform_health.cpu_usage}%</span>
                        </div>
                        <Progress value={overview.platform_health.cpu_usage} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Memory Usage</span>
                          <span>{overview.platform_health.memory_usage}%</span>
                        </div>
                        <Progress value={overview.platform_health.memory_usage} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Disk Usage</span>
                          <span>{overview.platform_health.disk_usage}%</span>
                        </div>
                        <Progress value={overview.platform_health.disk_usage} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Actions & Stats */}
            {overview && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(overview.system_stats.active_subscriptions)}
                    </div>
                    <p className="text-xs text-muted-foreground">Paying customers</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {overview.recent_activity.support_tickets_open}
                    </div>
                    <p className="text-xs text-muted-foreground">Open tickets</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {overview.recent_activity.system_alerts}
                    </div>
                    <p className="text-xs text-muted-foreground">Require attention</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Access Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm">User Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Manage users, roles, and permissions</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-sm">Security Center</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Monitor security alerts and system health</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-sm">Influencer Database</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Browse and manage influencer profiles</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-sm">Analytics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">View detailed platform analytics</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}