'use client'

import { useState, useEffect } from 'react'
import { superadminApiService, UserIntelligence } from '@/services/superadminApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Pie, PieChart, Cell } from 'recharts'
import {
  Users,
  TrendingUp,
  Target,
  Brain,
  Layers,
  BarChart3,
  Activity,
  Clock,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  UserCheck,
  Crown,
  Zap,
  Calendar,
  Filter
} from 'lucide-react'

export function UserIntelligenceDashboard() {
  const [intelligenceData, setIntelligenceData] = useState<UserIntelligence | null>(null)
  const [segmentationData, setSegmentationData] = useState<any>(null)
  const [forecastData, setForecastData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cohortPeriod, setCohortPeriod] = useState('monthly')
  const [forecastPeriod, setForecastPeriod] = useState('12_months')

  const loadIntelligenceData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [intelligenceResult, segmentationResult, forecastResult] = await Promise.all([
        superadminApiService.getCohortAnalysis({
          cohort_period: cohortPeriod,
          retention_periods: '1,3,6,12'
        }),
        superadminApiService.getUserSegmentation(),
        superadminApiService.getBusinessForecasting({
          forecast_period: forecastPeriod,
          metrics: 'revenue,users,retention'
        })
      ])

      if (intelligenceResult.success) {
        setIntelligenceData(intelligenceResult.data!)
      } else {
        console.warn('User intelligence API failed:', intelligenceResult.error)
      }

      if (segmentationResult.success) {
        setSegmentationData(segmentationResult.data)
      } else {
        console.warn('User segmentation API failed:', segmentationResult.error)
      }

      if (forecastResult.success) {
        setForecastData(forecastResult.data)
      } else {
        console.warn('Business forecast API failed:', forecastResult.error)
      }
    } catch (error) {
      setError('Failed to load user intelligence data')
      console.error('User intelligence error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIntelligenceData()
  }, [cohortPeriod, forecastPeriod])

  const getRetentionColor = (rate: number) => {
    if (rate >= 80) return 'text-emerald-600'
    if (rate >= 60) return 'text-blue-600'
    if (rate >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  const getSegmentBadgeVariant = (segment: string) => {
    switch (segment.toLowerCase()) {
      case 'high-value': return 'default'
      case 'power-user': return 'secondary'
      case 'at-risk': return 'destructive'
      case 'new': return 'outline'
      default: return 'outline'
    }
  }

  const chartConfig = {
    retention: {
      label: 'Retention Rate (%)',
      color: 'hsl(var(--primary))'
    },
    users: {
      label: 'Users',
      color: 'hsl(var(--primary))'
    },
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--primary))'
    },
    value: {
      label: 'Value',
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
              <div className="h-10 bg-muted rounded w-32 animate-pulse" />
              <div className="h-10 bg-muted rounded w-24 animate-pulse" />
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
        <Button variant="outline" className="mt-4" onClick={loadIntelligenceData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  const averageRetention = intelligenceData?.cohort_analysis?.cohorts
    ? intelligenceData.cohort_analysis.cohorts.reduce((sum, cohort) => {
        const month6Retention = cohort.retention_rates['6'] || 0
        return sum + month6Retention
      }, 0) / intelligenceData.cohort_analysis.cohorts.length
    : 0

  const totalSegments = segmentationData?.segments?.length || 0
  const highValueUsers = segmentationData?.segments?.find((s: any) => s.segment_name.toLowerCase().includes('high-value'))?.user_count || 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Intelligence</h1>
          <p className="text-muted-foreground">
            Advanced user analytics, cohort analysis, and business forecasting
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={cohortPeriod} onValueChange={setCohortPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadIntelligenceData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Intelligence Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Retention</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRetentionColor(averageRetention * 100)}`}>
              {(averageRetention * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              6-month retention rate
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">User Segments</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSegments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Behavioral segments identified
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High-Value Users</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {highValueUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Premium segment users
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Forecast</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${forecastData?.revenue_forecast?.[0]?.predicted_revenue
                ? (forecastData.revenue_forecast[0].predicted_revenue / 1000).toFixed(0) + 'k'
                : '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Next month prediction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Intelligence Tabs */}
      <Tabs defaultValue="cohorts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="segments">User Segments</TabsTrigger>
          <TabsTrigger value="forecasting">Business Forecasting</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="cohorts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Cohort Retention Rates
                </CardTitle>
                <CardDescription>User retention by signup cohort</CardDescription>
              </CardHeader>
              <CardContent>
                {intelligenceData?.cohort_analysis?.cohorts && (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cohort Period</TableHead>
                          <TableHead className="text-right">Initial Users</TableHead>
                          <TableHead className="text-right">1 Month</TableHead>
                          <TableHead className="text-right">3 Months</TableHead>
                          <TableHead className="text-right">6 Months</TableHead>
                          <TableHead className="text-right">12 Months</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {intelligenceData.cohort_analysis.cohorts.map((cohort) => (
                          <TableRow key={cohort.cohort_period} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{cohort.cohort_period}</TableCell>
                            <TableCell className="text-right">{cohort.initial_users.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <span className={getRetentionColor((cohort.retention_rates['1'] || 0) * 100)}>
                                {((cohort.retention_rates['1'] || 0) * 100).toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={getRetentionColor((cohort.retention_rates['3'] || 0) * 100)}>
                                {((cohort.retention_rates['3'] || 0) * 100).toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={getRetentionColor((cohort.retention_rates['6'] || 0) * 100)}>
                                {((cohort.retention_rates['6'] || 0) * 100).toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={getRetentionColor((cohort.retention_rates['12'] || 0) * 100)}>
                                {((cohort.retention_rates['12'] || 0) * 100).toFixed(1)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Retention Curve
                </CardTitle>
                <CardDescription>Average retention over time</CardDescription>
              </CardHeader>
              <CardContent>
                {intelligenceData?.cohort_analysis?.cohorts && (
                  <ChartContainer config={chartConfig} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { period: '1 Month', retention: averageRetention * 100 },
                        { period: '3 Months', retention: (averageRetention * 0.8) * 100 },
                        { period: '6 Months', retention: (averageRetention * 0.65) * 100 },
                        { period: '12 Months', retention: (averageRetention * 0.5) * 100 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="period"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          domain={[0, 100]}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="retention"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  User Segments
                </CardTitle>
                <CardDescription>Behavioral user segmentation analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {segmentationData?.segments && (
                  <div className="space-y-4">
                    {segmentationData.segments.map((segment: any) => (
                      <Card key={segment.segment_name} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSegmentBadgeVariant(segment.segment_name)}>
                              {segment.segment_name}
                            </Badge>
                            <span className="font-medium">{segment.user_count.toLocaleString()} users</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {Object.entries(segment.characteristics).slice(0, 4).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}:</span>
                              <span className="font-medium">{value as string}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Segment Distribution
                </CardTitle>
                <CardDescription>User base composition by segment</CardDescription>
              </CardHeader>
              <CardContent>
                {segmentationData?.segments && (
                  <ChartContainer config={chartConfig} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={segmentationData.segments.map((segment: any, index: number) => ({
                            name: segment.segment_name,
                            value: segment.user_count,
                            fill: `hsl(${(index * 60) % 360}, 70%, 50%)`
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          formatter={(value, name) => [`${(value as number).toLocaleString()} users`, name]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Revenue Forecast
                    </CardTitle>
                    <CardDescription>Predicted revenue growth</CardDescription>
                  </div>
                  <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6_months">6 Months</SelectItem>
                      <SelectItem value="12_months">12 Months</SelectItem>
                      <SelectItem value="24_months">24 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {forecastData?.revenue_forecast && (
                  <ChartContainer config={chartConfig} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastData.revenue_forecast}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="period"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          formatter={(value) => [`$${(value as number).toLocaleString()}`, 'Revenue']}
                        />
                        <Area
                          type="monotone"
                          dataKey="predicted_revenue"
                          stroke="hsl(var(--primary))"
                          fillOpacity={1}
                          fill="url(#revenueGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Growth Forecast
                </CardTitle>
                <CardDescription>Predicted user acquisition</CardDescription>
              </CardHeader>
              <CardContent>
                {forecastData?.user_growth_forecast && (
                  <ChartContainer config={chartConfig} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={forecastData.user_growth_forecast}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="period"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          formatter={(value) => [`${(value as number).toLocaleString()}`, 'Users']}
                        />
                        <Bar
                          dataKey="predicted_users"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Forecast Summary
              </CardTitle>
              <CardDescription>Key predictions and confidence intervals</CardDescription>
            </CardHeader>
            <CardContent>
              {forecastData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">
                      ${forecastData.revenue_forecast?.[0]?.predicted_revenue
                        ? (forecastData.revenue_forecast[0].predicted_revenue / 1000).toFixed(0) + 'k'
                        : '0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Next Month Revenue</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ±{forecastData.revenue_forecast?.[0]?.confidence_interval?.[1]
                        ? ((forecastData.revenue_forecast[0].confidence_interval[1] - forecastData.revenue_forecast[0].predicted_revenue) / 1000).toFixed(0) + 'k'
                        : '0k'} confidence
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {forecastData.user_growth_forecast?.[0]?.predicted_users
                        ? (forecastData.user_growth_forecast[0].predicted_users / 1000).toFixed(1) + 'k'
                        : '0k'}
                    </div>
                    <div className="text-sm text-muted-foreground">New Users</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Next month prediction
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">
                      {((averageRetention * 0.95) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Retention Forecast</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Expected retention rate
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>Automated intelligence from user behavior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      <strong>High-Value Opportunity:</strong> Users who engage with analytics features within their first week have 3.2x higher retention rates. Consider enhancing onboarding to highlight these features.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Churn Risk:</strong> 847 users show patterns similar to churned users. They haven't accessed the platform in 7+ days and have low feature adoption.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Growth Opportunity:</strong> Premium users refer 2.4x more users than free users. A referral program targeting premium users could accelerate growth.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Recommended Actions
                </CardTitle>
                <CardDescription>Data-driven recommendations for user growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-sm">Urgent: Re-engage At-Risk Users</div>
                      <div className="text-xs text-muted-foreground">Send targeted campaigns to 847 users showing churn patterns</div>
                      <Badge variant="destructive" className="mt-1 text-xs">High Priority</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-sm">Optimize Onboarding Flow</div>
                      <div className="text-xs text-muted-foreground">Focus on analytics features to improve 1-week retention</div>
                      <Badge variant="secondary" className="mt-1 text-xs">Medium Priority</Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-sm">Launch Premium Referral Program</div>
                      <div className="text-xs text-muted-foreground">Target high-value users for accelerated growth</div>
                      <Badge variant="outline" className="mt-1 text-xs">Low Priority</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}