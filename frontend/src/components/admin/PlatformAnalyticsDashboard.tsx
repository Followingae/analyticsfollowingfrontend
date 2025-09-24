'use client'

import { useState, useEffect } from 'react'
import { superadminApiService, PlatformAnalytics } from '@/services/superadminApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Pie, PieChart, Cell } from 'recharts'
import {
  BarChart3,
  TrendingUp,
  Activity,
  Globe,
  Zap,
  Clock,
  Users,
  MousePointer,
  Smartphone,
  Monitor,
  RefreshCw,
  Download,
  AlertCircle,
  Target,
  Gauge,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Eye
} from 'lucide-react'

export function PlatformAnalyticsDashboard() {
  const [usageData, setUsageData] = useState<PlatformAnalytics | null>(null)
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [apiData, setApiData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('7d')
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('all')

  const loadAnalyticsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [usageResult, performanceResult, apiResult] = await Promise.all([
        superadminApiService.getDetailedPlatformUsage({
          timeframe,
          breakdown_by: 'day',
          include_segments: true
        }),
        superadminApiService.getPlatformPerformanceMetrics(),
        superadminApiService.getAPIUsageAnalytics({
          time_range: timeframe,
          endpoint_pattern: selectedEndpoint !== 'all' ? selectedEndpoint : undefined
        })
      ])

      if (usageResult.success) {
        setUsageData(usageResult.data!)
      } else {
        console.warn('Usage analytics API failed:', usageResult.error)
      }

      if (performanceResult.success) {
        setPerformanceData(performanceResult.data)
      } else {
        console.warn('Performance metrics API failed:', performanceResult.error)
      }

      if (apiResult.success) {
        setApiData(apiResult.data)
      } else {
        console.warn('API analytics API failed:', apiResult.error)
      }
    } catch (error) {
      setError('Failed to load platform analytics data')
      console.error('Platform analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalyticsData()
    const interval = setInterval(loadAnalyticsData, 300000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [timeframe, selectedEndpoint])

  const getPerformanceColor = (value: number, thresholds: { good: number; fair: number }) => {
    if (value <= thresholds.good) return 'text-emerald-600'
    if (value <= thresholds.fair) return 'text-amber-600'
    return 'text-red-600'
  }

  const chartConfig = {
    requests: {
      label: 'Requests',
      color: 'hsl(var(--primary))'
    },
    response_time: {
      label: 'Response Time (ms)',
      color: 'hsl(var(--primary))'
    },
    error_rate: {
      label: 'Error Rate (%)',
      color: 'hsl(var(--destructive))'
    },
    users: {
      label: 'Users',
      color: 'hsl(var(--primary))'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-muted rounded w-48 animate-pulse" />
              <div className="h-4 bg-muted rounded w-64 mt-2 animate-pulse" />
            </div>
            <div className="flex space-x-2">
              <div className="h-10 bg-muted rounded w-20 animate-pulse" />
              <div className="h-10 bg-muted rounded w-20 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={loadAnalyticsData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  const topEndpoints = apiData?.api_calls_by_endpoint
    ? Object.entries(apiData.api_calls_by_endpoint)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
    : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
          <p className="text-muted-foreground">
            Advanced usage metrics, performance analytics, and API monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last Day</SelectItem>
              <SelectItem value="7d">Last Week</SelectItem>
              <SelectItem value="30d">Last Month</SelectItem>
              <SelectItem value="90d">Last Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(performanceData?.response_times?.p95 || 0, { good: 200, fair: 500 })}`}>
              {performanceData?.response_times?.p95 || 0}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              P95 response time
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(performanceData?.error_rates?.overall || 0, { good: 1, fair: 5 })}`}>
              {performanceData?.error_rates?.overall ? (performanceData.error_rates.overall * 100).toFixed(2) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall error rate
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cache Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {performanceData?.cache_performance?.hit_rate ? (performanceData.cache_performance.hit_rate * 100).toFixed(1) : 0}%
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Progress
                value={performanceData?.cache_performance?.hit_rate ? performanceData.cache_performance.hit_rate * 100 : 0}
                className="flex-1 h-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">API Requests</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiData?.total_requests ? (apiData.total_requests / 1000).toFixed(1) + 'k' : '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total API requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="api">API Analytics</TabsTrigger>
          <TabsTrigger value="user-journey">User Journey</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Feature Adoption
                </CardTitle>
                <CardDescription>Feature usage and adoption rates</CardDescription>
              </CardHeader>
              <CardContent>
                {usageData?.usage_metrics?.feature_adoption && (
                  <div className="space-y-3">
                    {Object.entries(usageData.usage_metrics.feature_adoption).map(([feature, data]: [string, any]) => (
                      <div key={feature} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize">{feature.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{data.active_users}</span>
                            <Badge variant="outline">{data.adoption_rate}%</Badge>
                          </div>
                        </div>
                        <Progress value={data.adoption_rate} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Segments
                </CardTitle>
                <CardDescription>User activity by device and platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Monitor className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                      <div className="text-lg font-bold">
                        {usageData?.device_analytics?.desktop || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Desktop</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Smartphone className="h-6 w-6 mx-auto mb-1 text-green-500" />
                      <div className="text-lg font-bold">
                        {usageData?.device_analytics?.mobile || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Mobile</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Monitor className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                      <div className="text-lg font-bold">
                        {usageData?.device_analytics?.tablet || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Tablet</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Response Time Distribution
                </CardTitle>
                <CardDescription>API response time percentiles</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceData?.response_times && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className={`text-lg font-bold ${getPerformanceColor(performanceData.response_times.p50, { good: 100, fair: 200 })}`}>
                          {performanceData.response_times.p50}ms
                        </div>
                        <div className="text-xs text-muted-foreground">P50</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className={`text-lg font-bold ${getPerformanceColor(performanceData.response_times.p95, { good: 200, fair: 500 })}`}>
                          {performanceData.response_times.p95}ms
                        </div>
                        <div className="text-xs text-muted-foreground">P95</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className={`text-lg font-bold ${getPerformanceColor(performanceData.response_times.p99, { good: 500, fair: 1000 })}`}>
                          {performanceData.response_times.p99}ms
                        </div>
                        <div className="text-xs text-muted-foreground">P99</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Performance Score</span>
                        <span className="font-medium">
                          {performanceData.performance_score ? Math.round(performanceData.performance_score) : 0}/100
                        </span>
                      </div>
                      <Progress value={performanceData.performance_score || 0} className="h-2" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Resources
                </CardTitle>
                <CardDescription>Database and cache performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Database Query Time
                    </span>
                    <span className="font-medium">
                      {performanceData?.database_performance?.avg_query_time || 0}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Cache Hit Rate
                    </span>
                    <span className="font-medium text-green-600">
                      {performanceData?.cache_performance?.hit_rate ? (performanceData.cache_performance.hit_rate * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      Active Connections
                    </span>
                    <span className="font-medium">
                      {performanceData?.database_performance?.active_connections || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      CPU Usage
                    </span>
                    <span className="font-medium">
                      {performanceData?.system_resources?.cpu_usage || 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Top API Endpoints
                </CardTitle>
                <CardDescription>Most frequently used API endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Endpoint</TableHead>
                        <TableHead className="text-right">Requests</TableHead>
                        <TableHead className="text-right">Error Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topEndpoints.map(([endpoint, count]) => (
                        <TableRow key={endpoint} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-sm">{endpoint}</TableCell>
                          <TableCell className="text-right font-medium">
                            {(count as number).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={getPerformanceColor(
                              (performanceData?.error_rates?.[endpoint] || 0) * 100,
                              { good: 1, fair: 5 }
                            )}>
                              {performanceData?.error_rates?.[endpoint]
                                ? (performanceData.error_rates[endpoint] * 100).toFixed(2)
                                : '0.00'}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  API Usage Trends
                </CardTitle>
                <CardDescription>Request volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                {apiData?.usage_trends && (
                  <ChartContainer config={chartConfig} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={apiData.usage_trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="timestamp"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="requests"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="user-journey" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Conversion Funnel
              </CardTitle>
              <CardDescription>User journey and conversion analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {usageData?.usage_metrics?.user_journey_funnel && (
                <div className="space-y-4">
                  {usageData.usage_metrics.user_journey_funnel.map((step, index) => {
                    const isLast = index === usageData.usage_metrics.user_journey_funnel.length - 1
                    return (
                      <div key={step.step} className="relative">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{step.step}</div>
                              <div className="text-sm text-muted-foreground">
                                {step.users.toLocaleString()} users
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {step.conversion_rate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Conversion</div>
                          </div>
                        </div>
                        {!isLast && (
                          <div className="flex justify-center my-2">
                            <div className="w-px h-6 bg-border"></div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}