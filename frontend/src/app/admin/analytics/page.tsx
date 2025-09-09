'use client'

import { useState, useEffect } from "react"
import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  DollarSign,
  BarChart3,
  RefreshCw,
  Download,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  Eye
} from "lucide-react"

import { 
  superadminApiService, 
  PlatformAnalytics,
  UserAnalytics
} from "@/services/superadminApi"

export default function AnalyticsPage() {
  // State Management
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")

  // Load analytics data
  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [analyticsResult, userAnalyticsResult] = await Promise.all([
        superadminApiService.getPlatformAnalytics({ time_range: timeRange }),
        superadminApiService.getUserAnalytics({ limit: 20, time_range: timeRange })
      ])
      
      if (analyticsResult.success && analyticsResult.data) {
        setAnalytics(analyticsResult.data)
      } else {
        // Mock data for demo
        setAnalytics({
          overview: {
            total_page_views: 2847293,
            unique_visitors: 189234,
            session_duration_avg: 8.4,
            bounce_rate: 34.2,
            conversion_rate: 12.8,
            revenue_total: 245890
          },
          growth_metrics: {
            user_growth_rate: 15.6,
            revenue_growth_rate: 23.4,
            engagement_growth_rate: 8.9
          },
          traffic_sources: [
            { source: "Direct", visitors: 89234, percentage: 47.2 },
            { source: "Google", visitors: 56789, percentage: 30.1 },
            { source: "Social Media", visitors: 23456, percentage: 12.4 },
            { source: "Referrals", visitors: 19755, percentage: 10.3 }
          ],
          device_breakdown: [
            { device_type: "Desktop", count: 98234, percentage: 52.1 },
            { device_type: "Mobile", count: 78456, percentage: 41.6 },
            { device_type: "Tablet", count: 11889, percentage: 6.3 }
          ],
          geographic_data: [
            { country: "United Arab Emirates", users: 67890, percentage: 35.9 },
            { country: "Saudi Arabia", users: 45678, percentage: 24.2 },
            { country: "Egypt", users: 34567, percentage: 18.3 },
            { country: "Jordan", users: 23456, percentage: 12.4 },
            { country: "Kuwait", users: 17643, percentage: 9.2 }
          ]
        })
      }
      
      if (userAnalyticsResult.success && userAnalyticsResult.data) {
        setUserAnalytics(userAnalyticsResult.data.users || [])
      } else {
        // Mock user analytics data
        setUserAnalytics([
          {
            user_id: "1",
            full_name: "Ahmed Al-Rashid",
            email: "ahmed@example.com",
            total_sessions: 147,
            total_page_views: 892,
            avg_session_duration: 12.4,
            last_active: "2024-01-15T10:30:00Z"
          },
          {
            user_id: "2", 
            full_name: "Fatima Hassan",
            email: "fatima@example.com",
            total_sessions: 89,
            total_page_views: 567,
            avg_session_duration: 9.8,
            last_active: "2024-01-15T09:15:00Z"
          },
          {
            user_id: "3",
            full_name: "Omar Khalil",
            email: "omar@example.com", 
            total_sessions: 203,
            total_page_views: 1234,
            avg_session_duration: 15.2,
            last_active: "2024-01-15T08:45:00Z"
          }
        ])
      }
    } catch (error) {
      console.warn('Analytics API not available - using mock data for demo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGrowthColor = (rate: number) => {
    if (rate > 0) return 'text-green-600'
    if (rate < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getGrowthIcon = (rate: number) => {
    return rate > 0 ? TrendingUp : TrendingDown
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
              <p className="text-muted-foreground">Loading analytics data...</p>
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
            
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
                <p className="text-muted-foreground">Comprehensive insights into platform performance and user behavior</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Last 24h</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 3 months</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => loadAnalytics()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Key Metrics Overview */}
            {analytics && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                    <Eye className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(analytics.overview.total_page_views)}</div>
                    <div className="flex items-center gap-1 text-xs">
                      {(() => {
                        const GrowthIcon = getGrowthIcon(analytics.growth_metrics.engagement_growth_rate)
                        return (
                          <>
                            <GrowthIcon className={`h-3 w-3 ${getGrowthColor(analytics.growth_metrics.engagement_growth_rate)}`} />
                            <span className={getGrowthColor(analytics.growth_metrics.engagement_growth_rate)}>
                              {analytics.growth_metrics.engagement_growth_rate}%
                            </span>
                            <span className="text-muted-foreground">vs last period</span>
                          </>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                    <Users className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(analytics.overview.unique_visitors)}</div>
                    <div className="flex items-center gap-1 text-xs">
                      {(() => {
                        const GrowthIcon = getGrowthIcon(analytics.growth_metrics.user_growth_rate)
                        return (
                          <>
                            <GrowthIcon className={`h-3 w-3 ${getGrowthColor(analytics.growth_metrics.user_growth_rate)}`} />
                            <span className={getGrowthColor(analytics.growth_metrics.user_growth_rate)}>
                              {analytics.growth_metrics.user_growth_rate}%
                            </span>
                            <span className="text-muted-foreground">growth rate</span>
                          </>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(analytics.overview.revenue_total)}</div>
                    <div className="flex items-center gap-1 text-xs">
                      {(() => {
                        const GrowthIcon = getGrowthIcon(analytics.growth_metrics.revenue_growth_rate)
                        return (
                          <>
                            <GrowthIcon className={`h-3 w-3 ${getGrowthColor(analytics.growth_metrics.revenue_growth_rate)}`} />
                            <span className={getGrowthColor(analytics.growth_metrics.revenue_growth_rate)}>
                              {analytics.growth_metrics.revenue_growth_rate}%
                            </span>
                            <span className="text-muted-foreground">revenue growth</span>
                          </>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Performance Metrics */}
            {analytics && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.overview.session_duration_avg}min</div>
                    <p className="text-xs text-muted-foreground">Per user session</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.overview.bounce_rate}%</div>
                    <p className="text-xs text-muted-foreground">Single page visits</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{analytics.overview.conversion_rate}%</div>
                    <p className="text-xs text-muted-foreground">Visitor to customer</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">User Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">+{analytics.growth_metrics.user_growth_rate}%</div>
                    <p className="text-xs text-muted-foreground">This period</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Traffic Sources & Device Breakdown */}
            {analytics && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Traffic Sources</CardTitle>
                    <CardDescription>Where your visitors are coming from</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.traffic_sources.map((source, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{source.source}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatNumber(source.visitors)}</div>
                            <div className="text-xs text-muted-foreground">{source.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Device Breakdown</CardTitle>
                    <CardDescription>User device preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.device_breakdown.map((device, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {device.device_type === 'Desktop' && <Monitor className="h-4 w-4 text-muted-foreground" />}
                            {device.device_type === 'Mobile' && <Smartphone className="h-4 w-4 text-muted-foreground" />}
                            {device.device_type === 'Tablet' && <Monitor className="h-4 w-4 text-muted-foreground" />}
                            <span className="font-medium">{device.device_type}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatNumber(device.count)}</div>
                            <div className="text-xs text-muted-foreground">{device.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Geographic Data */}
            {analytics && (
              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                  <CardDescription>User locations and regional performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-5">
                    {analytics.geographic_data.map((country, index) => (
                      <div key={index} className="text-center p-4 border border-border rounded-lg">
                        <div className="font-medium text-sm mb-1">{country.country}</div>
                        <div className="text-2xl font-bold text-primary mb-1">{formatNumber(country.users)}</div>
                        <Badge variant="secondary" className="text-xs">{country.percentage}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Users Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Top Active Users</CardTitle>
                <CardDescription>Most engaged users in the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Page Views</TableHead>
                      <TableHead>Avg. Duration</TableHead>
                      <TableHead>Last Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userAnalytics.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.total_sessions}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{user.total_page_views}</span>
                        </TableCell>
                        <TableCell>
                          <span>{user.avg_session_duration}min</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.last_active)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {userAnalytics.length === 0 && (
                  <div className="py-12 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No user analytics found</h3>
                    <p className="text-muted-foreground">
                      User activity data will appear here once available from the backend.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}