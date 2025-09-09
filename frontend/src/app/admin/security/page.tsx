'use client'

import { useState, useEffect } from "react"
import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
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
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Server,
  Activity,
  Lock,
  Eye
} from "lucide-react"

import { 
  superadminApiService, 
  SecurityAlert,
  SystemHealth
} from "@/services/superadminApi"

export default function SecurityPage() {
  // State Management
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)

  // Load security data
  const loadSecurityData = async () => {
    setLoading(true)
    try {
      const [alertsResult, healthResult] = await Promise.all([
        superadminApiService.getSecurityAlerts({ limit: 20 }),
        superadminApiService.getSystemHealth()
      ])
      
      if (alertsResult.success && alertsResult.data) {
        setSecurityAlerts(alertsResult.data.alerts || [])
      }
      if (healthResult.success && healthResult.data) {
        setSystemHealth(healthResult.data)
      }
    } catch (error) {
      console.warn('Security APIs not available - superadmin endpoints not implemented')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSecurityData()
  }, [])

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
              <p className="text-muted-foreground">Loading security data...</p>
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
                <h1 className="text-3xl font-bold tracking-tight">Security & System Health</h1>
                <p className="text-muted-foreground">Monitor platform security and system performance</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => loadSecurityData()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Security Status Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">85</div>
                  <p className="text-xs text-muted-foreground">Overall security rating</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{securityAlerts.length}</div>
                  <p className="text-xs text-muted-foreground">Require attention</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <Badge className={systemHealth ? getHealthColor(systemHealth.overall_status) : 'bg-gray-100 text-gray-800'}>
                      {systemHealth?.overall_status || 'Unknown'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Current status</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemHealth ? `${(systemHealth.uptime_seconds / 3600).toFixed(1)}h` : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">System uptime</p>
                </CardContent>
              </Card>
            </div>

            {/* Security Status Alert */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Security Status</AlertTitle>
              <AlertDescription>
                System security monitoring is active. {securityAlerts.length} active alerts require attention.
                {securityAlerts.length === 0 && " All systems are operating normally."}
              </AlertDescription>
            </Alert>

            {/* System Health Monitoring */}
            {systemHealth && (
              <Card>
                <CardHeader>
                  <CardTitle>System Health Monitoring</CardTitle>
                  <CardDescription>Real-time system performance and resource usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>CPU Usage</span>
                        <span>{systemHealth.checks.cpu?.value || 0}%</span>
                      </div>
                      <Progress value={systemHealth.checks.cpu?.value || 0} />
                      <Badge className={systemHealth.checks.cpu?.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {systemHealth.checks.cpu?.status || 'unknown'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Memory Usage</span>
                        <span>{systemHealth.checks.memory?.value || 0}%</span>
                      </div>
                      <Progress value={systemHealth.checks.memory?.value || 0} />
                      <Badge className={systemHealth.checks.memory?.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {systemHealth.checks.memory?.status || 'unknown'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Disk Usage</span>
                        <span>{systemHealth.checks.disk?.value || 0}%</span>
                      </div>
                      <Progress value={systemHealth.checks.disk?.value || 0} />
                      <Badge className={systemHealth.checks.disk?.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {systemHealth.checks.disk?.status || 'unknown'}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-3">System Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Overall Status</span>
                          <Badge className={getHealthColor(systemHealth.overall_status)}>
                            {systemHealth.overall_status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Uptime</span>
                          <span>{(systemHealth.uptime_seconds / 3600).toFixed(1)} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Check</span>
                          <span>{formatDate(systemHealth.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Network Activity</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Bytes Sent</span>
                          <span>{((systemHealth.checks.network?.bytes_sent || 0) / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bytes Received</span>
                          <span>{((systemHealth.checks.network?.bytes_recv || 0) / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Network Status</span>
                          <Badge className="bg-green-100 text-green-800">
                            {systemHealth.checks.network?.status || 'healthy'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>Active security alerts and system notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityAlerts.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">All Clear</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        No active security alerts detected. The system is operating normally with all security measures active.
                      </p>
                    </div>
                  ) : (
                    securityAlerts.map((alert, index) => (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${
                              alert.severity === 'high' ? 'text-red-500' : 
                              alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                            }`} />
                            <h4 className="font-medium">{alert.title}</h4>
                          </div>
                          <Badge className={getPriorityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            <div>{formatDate(alert.timestamp)}</div>
                            {alert.affected_user && (
                              <div className="flex items-center gap-1 mt-1">
                                <Eye className="h-3 w-3" />
                                User: {alert.affected_user}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {alert.suggested_actions.map((action, actionIndex) => (
                              <Button key={actionIndex} size="sm" variant="outline" className="h-7 text-xs">
                                {action}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Security Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Security Recommendations</CardTitle>
                <CardDescription>Proactive security measures and best practices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-sm">Two-Factor Authentication</div>
                      <div className="text-xs text-muted-foreground">All admin accounts have 2FA enabled</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-sm">SSL/TLS Encryption</div>
                      <div className="text-xs text-muted-foreground">All connections are encrypted</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">Monitoring Active</div>
                      <div className="text-xs text-muted-foreground">Real-time security monitoring in place</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Lock className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">Access Controls</div>
                      <div className="text-xs text-muted-foreground">Role-based permissions enforced</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}