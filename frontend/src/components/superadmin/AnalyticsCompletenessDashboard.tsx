'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Database,
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
  Users,
  Wrench,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/utils'
import {
  superadminApiService,
  AnalyticsCompletenessDashboard as DashboardType
} from '@/services/superadminApi'
import { toast } from 'sonner'

export default function AnalyticsCompletenessDashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Ensure hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load dashboard data
  useEffect(() => {
    if (mounted) {
      loadDashboard()
    }
  }, [mounted])

  // Auto-refresh every 2 minutes (as per specification)
  useEffect(() => {
    if (!mounted || !autoRefresh) return

    const interval = setInterval(() => {
      loadDashboard(false) // Don't show loading spinner for auto-refresh
    }, 120000) // 2 minutes = 120,000ms

    return () => clearInterval(interval)
  }, [mounted, autoRefresh])

  const loadDashboard = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }
    setError(null)

    try {
      console.log('🔄 Loading analytics completeness dashboard...')

      const response = await superadminApiService.getAnalyticsCompletenessDashboard()

      if (response.success && response.data) {
        setData(response.data)
        setLastUpdated(new Date())
        console.log('✅ Analytics completeness dashboard loaded successfully')
      } else {
        setError(response.error || 'Failed to load dashboard')
        console.log('❌ Dashboard load failed:', response.error)
        toast.error(response.error || 'Failed to load dashboard')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      setError(errorMessage)
      console.error('💥 Dashboard error:', err)
      toast.error('Failed to load dashboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800'
      case 'needs_attention': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-red-100 text-red-800'
    }
  }

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Completeness</h1>
            <p className="text-muted-foreground">Monitor and manage creator analytics completeness</p>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Completeness</h1>
            <p className="text-muted-foreground">Monitor and manage creator analytics completeness</p>
          </div>
          <Button onClick={loadDashboard}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Failed to load dashboard data. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { system_stats, completeness_distribution, system_health, recent_repair_operations } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Completeness</h1>
          <p className="text-muted-foreground">
            Monitor and manage creator analytics completeness system
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="w-4 h-4 mr-2" />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboard}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(system_stats.total_profiles)}
            </div>
            <p className="text-xs text-muted-foreground">
              Active creator profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complete Profiles</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(system_stats.complete_profiles)}
            </div>
            <p className="text-xs text-muted-foreground">
              100% analytics ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incomplete Profiles</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatNumber(system_stats.incomplete_profiles)}
            </div>
            <p className="text-xs text-muted-foreground">
              Needs repair
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completeness Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCompletenessColor(system_stats.completeness_percentage)}`}>
              {system_stats.completeness_percentage.toFixed(1)}%
            </div>
            <Progress
              value={system_stats.completeness_percentage}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Profile updates in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Profiles Created</span>
              </div>
              <span className="font-medium">{formatNumber(system_stats.profiles_created_24h)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Profiles Updated</span>
              </div>
              <span className="font-medium">{formatNumber(system_stats.profiles_updated_24h)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Avg Followers</span>
              </div>
              <span className="font-medium">{formatNumber(system_stats.avg_followers)}</span>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>
              Overall system status and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge
                  className={getHealthStatusColor(system_health.status)}
                  variant="secondary"
                >
                  {system_health.status === 'healthy' ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Healthy
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Needs Attention
                    </>
                  )}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {system_health.status === 'healthy'
                    ? 'All systems operational'
                    : 'Some issues detected'
                  }
                </span>
              </div>
            </div>

            {system_health.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recommendations:</h4>
                <ul className="space-y-1">
                  {system_health.recommendations.slice(0, 3).map((rec, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completeness Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Completeness Distribution
          </CardTitle>
          <CardDescription>
            Profile distribution by completeness category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completeness_distribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex flex-col">
                  <span className="font-medium capitalize">
                    {item.completeness_category}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatNumber(item.profile_count)} profiles
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    Avg {Math.round(item.avg_followers).toLocaleString()} followers
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Repair Operations */}
      {recent_repair_operations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Recent Repair Operations
            </CardTitle>
            <CardDescription>
              Latest system repair activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent_repair_operations.slice(0, 5).map((operation, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      Operation {operation.operation_id.slice(0, 8)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Started by {operation.started_by} • {operation.total_profiles} profiles
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={operation.status === 'completed' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {operation.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(operation.started_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Actions
          </CardTitle>
          <CardDescription>
            Manage analytics completeness operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              onClick={() => router.push('/superadmin/analytics/completeness/scan')}
              className="flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Scan Profiles
            </Button>

            <Button
              onClick={() => router.push('/superadmin/analytics/completeness/repair')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              Repair Profiles
            </Button>

            <Button
              onClick={() => router.push('/superadmin/analytics/completeness/health')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              System Health
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}