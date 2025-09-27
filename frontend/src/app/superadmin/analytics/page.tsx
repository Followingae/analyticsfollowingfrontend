"use client"

import { useState, useEffect } from "react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { superadminApiService, RealtimeAnalytics } from "@/services/superadminApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, Users, Activity, Server, TrendingUp, BarChart3, Clock } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function SuperadminAnalyticsPage() {
  const [realtimeData, setRealtimeData] = useState<RealtimeAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  const loadRealtimeAnalytics = async () => {
    try {
      setLoading(true)
      const result = await superadminApiService.getRealtimeAnalytics()

      if (result.success && result.data) {
        setRealtimeData(result.data)
      }
    } catch (error) {
      console.error('Failed to load realtime analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRealtimeAnalytics()

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadRealtimeAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: any) => {
    if (num === undefined || num === null || num === '' || typeof num !== 'number' || isNaN(num)) {
      return '0'
    }
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Analytics & Reports</h1>
                  <p className="text-muted-foreground">Real-time platform analytics and performance metrics</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Live Data
                  </Badge>
                  <Button variant="outline" onClick={loadRealtimeAnalytics}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Real-time Overview Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Online Users</CardTitle>
                    <Users className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(realtimeData?.online_users)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active sessions: {formatNumber(realtimeData?.active_sessions)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Load</CardTitle>
                    <Server className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {realtimeData?.system_load?.cpu_percent || 0}%
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>CPU</span>
                        <span>{realtimeData?.system_load?.cpu_percent || 0}%</span>
                      </div>
                      <Progress value={realtimeData?.system_load?.cpu_percent || 0} className="h-1" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                    <Activity className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(realtimeData?.performance_metrics?.response_time_ms)}ms
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cache hit: {((realtimeData?.performance_metrics?.cache_hit_rate || 0) * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Credits Flow</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(realtimeData?.credit_flows?.net_flow)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Net flow last hour
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* System Performance Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>System Resources</CardTitle>
                    <CardDescription>Current system resource utilization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>CPU Usage</span>
                        <span>{realtimeData?.system_load?.cpu_percent || 0}%</span>
                      </div>
                      <Progress value={realtimeData?.system_load?.cpu_percent || 0} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Memory Usage</span>
                        <span>{realtimeData?.system_load?.memory_percent || 0}%</span>
                      </div>
                      <Progress value={realtimeData?.system_load?.memory_percent || 0} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Disk Usage</span>
                        <span>{realtimeData?.system_load?.disk_percent || 0}%</span>
                      </div>
                      <Progress value={realtimeData?.system_load?.disk_percent || 0} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Real-time system performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Time</span>
                      <Badge variant="outline">
                        {formatNumber(realtimeData?.performance_metrics?.response_time_ms)}ms
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cache Hit Rate</span>
                      <Badge variant="outline">
                        {((realtimeData?.performance_metrics?.cache_hit_rate || 0) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Error Rate</span>
                      <Badge variant={
                        (realtimeData?.performance_metrics?.error_rate || 0) > 0.05 ? 'destructive' : 'outline'
                      }>
                        {((realtimeData?.performance_metrics?.error_rate || 0) * 100).toFixed(2)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Credits Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Credit System Analytics</CardTitle>
                  <CardDescription>Real-time credit flow and transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        +{formatNumber(realtimeData?.credit_flows?.spent_last_hour)}
                      </div>
                      <p className="text-sm text-muted-foreground">Credits Spent (1h)</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        +{formatNumber(realtimeData?.credit_flows?.earned_last_hour)}
                      </div>
                      <p className="text-sm text-muted-foreground">Credits Earned (1h)</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        (realtimeData?.credit_flows?.net_flow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(realtimeData?.credit_flows?.net_flow || 0) >= 0 ? '+' : ''}{formatNumber(realtimeData?.credit_flows?.net_flow)}
                      </div>
                      <p className="text-sm text-muted-foreground">Net Flow (1h)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Platform Activities</CardTitle>
                  <CardDescription>Latest user activities and system events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {realtimeData?.recent_activities?.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-muted">
                        <div>
                          <p className="text-sm font-medium">{activity.type}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-muted-foreground">
                        No recent activities
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
      </div>
    </SuperadminLayout>
  )
}