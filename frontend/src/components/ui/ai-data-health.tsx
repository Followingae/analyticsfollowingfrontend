"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Wrench,
  Database,
  Loader2,
  Activity,
  TrendingUp,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { instagramApiService } from "@/services/instagramApi"
import { useNotifications } from "@/contexts/NotificationContext"

interface DataHealthStatus {
  healthy_profiles: number
  partial_data_profiles: number
  total_profiles: number
  affected_usernames: string[]
  health_percentage: number
  last_check: string
}

interface SystemHealth {
  overall_status: 'healthy' | 'warning' | 'critical'
  ai_service_status: 'active' | 'degraded' | 'down'
  job_success_rate: number
  hung_jobs_count: number
  processing_queue_size: number
  recommendations: string[]
}

export function AIDataHealthMonitor({ username }: { username?: string }) {
  const [healthStatus, setHealthStatus] = useState<DataHealthStatus | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRepairing, setIsRepairing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const { addNotification } = useNotifications()

  const checkDataHealth = async () => {
    setIsLoading(true)
    try {
      // Check for partial data issues (veraciocca bugs)
      const partialDataResult = await instagramApiService.detectPartialDataIssues()
      
      // Get system health status
      const healthResult = await instagramApiService.getAISystemHealth(username)

      if (partialDataResult.success) {
        setHealthStatus(partialDataResult.data)
      }

      if (healthResult.success) {
        setSystemHealth(healthResult.data)
      }

      setLastRefresh(new Date())
    } catch (error) {

      addNotification({
        title: 'Health Check Failed',
        message: 'Unable to check AI data health status',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const repairPartialData = async () => {
    if (!healthStatus?.affected_usernames?.length) return

    setIsRepairing(true)
    try {
      const result = await instagramApiService.repairProfileAggregation(healthStatus.affected_usernames || [])
      
      if (result.success) {
        addNotification({
          title: 'Data Repair Complete',
          message: `Successfully repaired ${(healthStatus.affected_usernames || []).length} profiles`,
          type: 'success'
        })
        
        // Refresh health status
        setTimeout(() => {
          checkDataHealth()
        }, 2000)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {

      addNotification({
        title: 'Repair Failed',
        message: 'Unable to repair partial data issues',
        type: 'error'
      })
    } finally {
      setIsRepairing(false)
    }
  }

  useEffect(() => {
    checkDataHealth()
    
    // REMOVED: Auto-refresh polling was spamming backend with 404 errors
    // Manual refresh button is available instead
    // const interval = setInterval(checkDataHealth, 300000)
    // return () => clearInterval(interval)
  }, [])

  const getHealthColor = () => {
    if (!healthStatus || healthStatus.health_percentage === undefined || healthStatus.health_percentage === null) return 'text-muted-foreground'
    if (healthStatus.health_percentage >= 95) return 'text-green-600'
    if (healthStatus.health_percentage >= 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthStatus = () => {
    if (!healthStatus || healthStatus.health_percentage === undefined || healthStatus.health_percentage === null) return 'Unknown'
    if (healthStatus.health_percentage >= 95) return 'Excellent'
    if (healthStatus.health_percentage >= 85) return 'Good'
    if (healthStatus.health_percentage >= 70) return 'Warning'
    return 'Critical'
  }

  const getSystemStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return 'text-green-600'
      case 'warning':
      case 'degraded':
        return 'text-yellow-600'
      case 'critical':
      case 'down':
        return 'text-red-600'
      default:
        return 'text-muted-foreground'
    }
  }

  if (isLoading && !healthStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse text-blue-600" />
            AI Data Health Monitor
          </CardTitle>
          <CardDescription>Checking system health and data integrity...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Analyzing data health...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle>AI Data Health Monitor</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkDataHealth}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          Real-time monitoring of AI analysis data integrity
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Health Status */}
        {healthStatus && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Shield className={cn("h-4 w-4", getHealthColor())} />
                <div>
                  <p className="text-sm font-medium">Data Health</p>
                  <p className={cn("text-lg font-bold", getHealthColor())}>
                    {getHealthStatus()}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Healthy Profiles</p>
                  <p className="text-lg font-bold text-blue-600">
                    {healthStatus.healthy_profiles || 0}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Profiles</p>
                  <p className="text-lg font-bold text-muted-foreground">
                    {healthStatus.total_profiles || 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Health Progress Bar */}
        {healthStatus && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Data Integrity</span>
              <span className={cn("font-medium", getHealthColor())}>
                {(healthStatus.health_percentage || 0).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={healthStatus.health_percentage || 0} 
              className="h-2"
            />
          </div>
        )}

        {/* Partial Data Alert */}
        {(healthStatus?.partial_data_profiles || 0) > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Partial Data Detected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {healthStatus.partial_data_profiles || 0} profiles have incomplete AI analysis data
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={repairPartialData}
                disabled={isRepairing}
                className="ml-4"
              >
                {isRepairing ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  <Wrench className="h-3 w-3 mr-2" />
                )}
                {isRepairing ? 'Repairing...' : 'Auto-Repair'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* System Health Status */}
        {systemHealth && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              System Health
            </h4>
            
            <div className="grid gap-2 md:grid-cols-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>Overall Status</span>
                <Badge 
                  variant="outline" 
                  className={getSystemStatusColor(systemHealth.overall_status)}
                >
                  {systemHealth.overall_status || 'unknown'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>AI Service</span>
                <Badge 
                  variant="outline"
                  className={getSystemStatusColor(systemHealth.ai_service_status)}
                >
                  {systemHealth.ai_service_status || 'unknown'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>Success Rate</span>
                <span className={cn(
                  "font-medium",
                  (systemHealth.job_success_rate || 0) >= 90 ? "text-green-600" : 
                  (systemHealth.job_success_rate || 0) >= 75 ? "text-yellow-600" : "text-red-600"
                )}>
                  {(systemHealth.job_success_rate || 0).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>Processing Queue</span>
                <span className="font-medium">
                  {systemHealth.processing_queue_size || 0} jobs
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {systemHealth?.recommendations?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recommendations</h4>
            <div className="space-y-1">
              {(systemHealth.recommendations || []).map((recommendation, index) => (
                <div key={index} className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  {recommendation}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Update */}
        <div className="text-xs text-muted-foreground">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}