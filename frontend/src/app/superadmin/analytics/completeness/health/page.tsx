"use client"

import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { useState, useEffect } from 'react'
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Database,
  RefreshCw,
  Server,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/utils'
import {
  superadminApiService,
  SystemHealthCheck
} from '@/services/superadminApi'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

export default function SuperadminAnalyticsHealthPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SystemHealthCheck | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Ensure hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load health data
  useEffect(() => {
    if (mounted) {
      loadHealthData()
    }
  }, [mounted])

  const loadHealthData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔄 Loading system health data...')

      const response = await superadminApiService.getSystemHealth()

      if (response.success && response.data) {
        setData(response.data)
        setLastUpdated(new Date())
        console.log('✅ System health data loaded successfully')
      } else {
        setError(response.error || 'Failed to load system health')
        console.log('❌ System health load failed:', response.error)
        toast.error(response.error || 'Failed to load system health')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      setError(errorMessage)
      console.error('💥 System health error:', err)
      toast.error('Failed to load system health. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <Server className="w-5 h-5 text-gray-600" />
    }
  }

  // Don't render until mounted
  if (!mounted) {
    return (
      <SuperadminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </SuperadminLayout>
    )
  }

  if (loading) {
    return (
      <SuperadminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
              <p className="text-muted-foreground">Analytics completeness system health monitoring</p>
            </div>
            <Skeleton className="h-10 w-24" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SuperadminLayout>
    )
  }

  if (error || !data) {
    return (
      <SuperadminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
              <p className="text-muted-foreground">Analytics completeness system health monitoring</p>
            </div>
            <Button onClick={loadHealthData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Failed to load system health data. Please try again.'}
            </AlertDescription>
          </Alert>
        </div>
      </SuperadminLayout>
    )
  }

  const { overall_status, system_components, performance_metrics, recent_issues } = data

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
            <p className="text-muted-foreground">
              Analytics completeness system health and performance monitoring
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadHealthData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getHealthIcon(overall_status.status)}
              Overall System Status
            </CardTitle>
            <CardDescription>
              Current health status of the analytics completeness system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge
                className={getHealthBadgeColor(overall_status.status)}
                variant="secondary"
              >
                {overall_status.status.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Score: {overall_status.score}/100
              </span>
            </div>
            <Progress value={overall_status.score} className="mt-4 h-2" />
            {overall_status.message && (
              <p className="text-sm text-muted-foreground mt-2">
                {overall_status.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* System Components */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {system_components.map((component, idx) => (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {component.name}
                </CardTitle>
                {getHealthIcon(component.status)}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge
                    className={getHealthBadgeColor(component.status)}
                    variant="secondary"
                  >
                    {component.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {component.response_time}ms
                  </span>
                </div>
                {component.message && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {component.message}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              System performance indicators and resource utilization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm text-muted-foreground">
                    {performance_metrics.cpu_usage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={performance_metrics.cpu_usage} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-muted-foreground">
                    {performance_metrics.memory_usage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={performance_metrics.memory_usage} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Response</span>
                  <span className="text-sm text-muted-foreground">
                    {performance_metrics.api_response_time}ms
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Queue Backlog</span>
                  <span className="text-sm text-muted-foreground">
                    {formatNumber(performance_metrics.queue_backlog)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Issues */}
        {recent_issues.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Recent Issues
              </CardTitle>
              <CardDescription>
                Recent system issues and their resolution status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recent_issues.slice(0, 5).map((issue, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-medium">{issue.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {issue.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={issue.resolved ? 'default' : 'destructive'}
                        className="capitalize"
                      >
                        {issue.resolved ? 'Resolved' : issue.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(issue.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SuperadminLayout>
  )
}