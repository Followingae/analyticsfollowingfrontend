'use client'

import { useState, useEffect } from 'react'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { superadminApiService, DashboardOverview, RealtimeAnalytics } from '@/services/superadminApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Users,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  Plus,
  CreditCard,
  Eye,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  HardDrive,
  Monitor
} from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, Line, LineChart, Pie, PieChart as RechartsPieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'


const chartConfig = {
  revenue: {
    label: "Revenue",
    theme: {
      light: "hsl(var(--chart-1))",
      dark: "hsl(var(--chart-1))"
    }
  },
  users: {
    label: "Users",
    theme: {
      light: "hsl(var(--chart-2))",
      dark: "hsl(var(--chart-2))"
    }
  },
  conversion: {
    label: "Conversion",
    theme: {
      light: "hsl(var(--chart-3))",
      dark: "hsl(var(--chart-3))"
    }
  }
}

export function AdminDashboard() {
  const { user, isSuperAdmin } = useEnhancedAuth()
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null)
  const [realtimeData, setRealtimeData] = useState<RealtimeAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  // Load dashboard data from superadmin API
  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashboardResult, realtimeResult] = await Promise.all([
        superadminApiService.getDashboard(),
        superadminApiService.getRealtimeAnalytics()
      ])

      if (dashboardResult.success && dashboardResult.data) {
        setDashboardData(dashboardResult.data)
      } else {
        console.warn('Dashboard API failed:', dashboardResult.error)
      }

      if (realtimeResult.success && realtimeResult.data) {
        setRealtimeData(realtimeResult.data)
      } else {
        console.warn('Realtime API failed:', realtimeResult.error)
      }

    } catch (error) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    // Set up real-time updates
    const interval = setInterval(loadDashboardData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded-lg w-64 animate-pulse" />
          <div className="h-4 bg-muted rounded w-96 animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-80 bg-muted rounded-xl animate-pulse" />
          <div className="h-80 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Dashboard Unavailable</CardTitle>
            <CardDescription>
              We encountered an issue loading the dashboard. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={loadDashboardData}
              className="w-full"
              variant="outline"
            >
              <Activity className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous * 100)
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
            <Badge variant={isSuperAdmin ? 'destructive' : 'secondary'} className="px-3 py-1">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg">
            Welcome back, {user?.full_name || 'Admin'}. Here's what's happening with your platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Monitor className="h-4 w-4 mr-2" />
            Live View
          </Button>
          <Button variant="default" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Real-time Status Bar */}
      {realtimeData && (
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">System Online</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {realtimeData.online_users} active users
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  {realtimeData.system_load.cpu_percent.toFixed(1)}% CPU
                </div>
              </div>
              <Badge variant="outline" className="bg-background">
                Last updated: {new Date().toLocaleTimeString()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.user_metrics?.total_users ? formatNumber(dashboardData.user_metrics.total_users) : '0'}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-600 font-medium">
                +{dashboardData?.user_metrics?.new_this_week ?? 0}
              </span>
              this week
            </div>
            <Progress
              value={75}
              className="mt-3 h-1"
            />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboardData?.revenue_metrics?.monthly_revenue ? formatNumber(dashboardData.revenue_metrics.monthly_revenue) : '0'}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-600 font-medium">+12.5%</span>
              from last month
            </div>
            <Progress
              value={65}
              className="mt-3 h-1"
            />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Profiles</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.activity_metrics?.profiles_analyzed ? formatNumber(dashboardData.activity_metrics.profiles_analyzed) : '0'}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-600 font-medium">
                {dashboardData?.activity_metrics?.accesses_today ?? 0}
              </span>
              accessed today
            </div>
            <Progress
              value={85}
              className="mt-3 h-1"
            />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              dashboardData?.system_health.status === 'healthy' ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {dashboardData?.system_health.status === 'healthy' ? 'Excellent' : 'Warning'}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>{dashboardData?.system_health?.uptime_hours ?? 0}h</span>
              uptime
            </div>
            <Progress
              value={dashboardData?.system_health.status === 'healthy' ? 98 : 75}
              className="mt-3 h-1"
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                  Monthly revenue, user growth, and conversion trends
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedPeriod('7d')}>
                  7D
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedPeriod('30d')}>
                  30D
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedPeriod('90d')}>
                  90D
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData?.revenue_metrics ? [dashboardData.revenue_metrics] : []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>
              Daily new registrations and active user engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData?.user_metrics ? [dashboardData.user_metrics] : []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="newUsers"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="activeUsers"
                    fill="hsl(var(--muted))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Analytics */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Credit Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Distribution</CardTitle>
            <CardDescription>
              Credit usage across subscription tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.revenue_metrics ? Object.entries(dashboardData.revenue_metrics).map(([key, value], index) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(var(--chart-${(index % 4) + 1}))` }}
                    />
                    <div>
                      <div className="font-medium">{key.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">
                        Metric Value
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      credits
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-muted-foreground">No revenue data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest platform events and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recent_activities?.slice(0, 4).map((activity, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.action}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>by {activity.user}</span>
                      <span>•</span>
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Resources */}
        <Card>
          <CardHeader>
            <CardTitle>System Resources</CardTitle>
            <CardDescription>
              Real-time server performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    CPU Usage
                  </span>
                  <span className="font-medium">
                    {(realtimeData?.system_load?.cpu_percent ?? 0).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={realtimeData?.system_load.cpu_percent ?? 0}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Memory
                  </span>
                  <span className="font-medium">
                    {(realtimeData?.system_load?.memory_percent ?? 0).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={realtimeData?.system_load.memory_percent ?? 0}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Disk Usage
                  </span>
                  <span className="font-medium">
                    {(realtimeData?.system_load?.disk_percent ?? 0).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={realtimeData?.system_load.disk_percent ?? 0}
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {dashboardData?.security_alerts && dashboardData.security_alerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Security Alerts
            </CardTitle>
            <CardDescription>
              {dashboardData.security_alerts.length} alert{dashboardData.security_alerts.length !== 1 ? 's' : ''} require attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.security_alerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                  <AlertCircle className={`h-4 w-4 mt-1 ${
                    alert.severity === 'high' ? 'text-red-500' :
                    alert.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                  </div>
                  <Badge
                    variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'secondary' : 'outline'}
                  >
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}