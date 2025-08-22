'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Shield
} from 'lucide-react'

export function SystemMonitorDashboard() {
  const systemMetrics = {
    uptime: '99.98%',
    responseTime: 245,
    cpuUsage: 35,
    memoryUsage: 67,
    diskUsage: 42,
    activeConnections: 1247,
    errorRate: 0.02,
    apiCallsToday: 45230
  }

  const getHealthColor = (value: number, type: 'cpu' | 'memory' | 'disk') => {
    if (type === 'cpu') return value > 80 ? 'text-red-500' : value > 60 ? 'text-orange-500' : 'text-green-500'
    if (type === 'memory') return value > 85 ? 'text-red-500' : value > 70 ? 'text-orange-500' : 'text-green-500'
    if (type === 'disk') return value > 90 ? 'text-red-500' : value > 75 ? 'text-orange-500' : 'text-green-500'
    return 'text-green-500'
  }

  const getHealthStatus = () => {
    const avgUsage = (systemMetrics.cpuUsage + systemMetrics.memoryUsage + systemMetrics.diskUsage) / 3
    if (avgUsage > 80) return { status: 'Warning', color: 'text-orange-500', variant: 'secondary' as const }
    if (avgUsage > 90) return { status: 'Critical', color: 'text-red-500', variant: 'destructive' as const }
    return { status: 'Healthy', color: 'text-green-500', variant: 'default' as const }
  }

  const healthStatus = getHealthStatus()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system health and performance monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Maintenance Mode
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Enable Maintenance Mode</AlertDialogTitle>
                <AlertDialogDescription>
                  This will temporarily disable the platform for all users except admins. Are you sure?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground">
                  Enable Maintenance
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* System Health Overview */}
      <Card className={`border-l-4 ${healthStatus.status === 'Healthy' ? 'border-l-green-500' : 
        healthStatus.status === 'Warning' ? 'border-l-orange-500' : 'border-l-red-500'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 h-5" />
              System Health
            </CardTitle>
            <Badge variant={healthStatus.variant} className={healthStatus.color}>
              {healthStatus.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Uptime</div>
              <div className="text-2xl font-bold text-green-600">{systemMetrics.uptime}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Response Time</div>
              <div className="text-2xl font-bold">{systemMetrics.responseTime}ms</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Progress value={systemMetrics.cpuUsage} className="flex-1" />
              <span className={`text-sm font-medium ${getHealthColor(systemMetrics.cpuUsage, 'cpu')}`}>
                {systemMetrics.cpuUsage}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Progress value={systemMetrics.memoryUsage} className="flex-1" />
              <span className={`text-sm font-medium ${getHealthColor(systemMetrics.memoryUsage, 'memory')}`}>
                {systemMetrics.memoryUsage}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Progress value={systemMetrics.diskUsage} className="flex-1" />
              <span className={`text-sm font-medium ${getHealthColor(systemMetrics.diskUsage, 'disk')}`}>
                {systemMetrics.diskUsage}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.activeConnections.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Current active sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Database Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Primary Database</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Read Replicas</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">3/3 Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Connection Pool</span>
              <span className="text-sm font-medium">25/50 active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">SSL Certificate</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Valid</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Firewall Status</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Failed Login Attempts</span>
              <span className="text-sm font-medium text-green-600">12 (Normal)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Performance */}
      <Card>
        <CardHeader>
          <CardTitle>API Performance</CardTitle>
          <CardDescription>Today's API usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {systemMetrics.apiCallsToday.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total API Calls</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {systemMetrics.responseTime}ms
              </div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {systemMetrics.errorRate}%
              </div>
              <p className="text-sm text-muted-foreground">Error Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}