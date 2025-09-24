'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts'
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
  Shield,
  Lock,
  Eye,
  UserX,
  Ban,
  Key,
  Globe,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  Filter
} from 'lucide-react'

export function SystemMonitorDashboard() {
  const [loading, setLoading] = useState(false)

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

  const securityMetrics = {
    totalThreats: 47,
    blockedAttacks: 12,
    suspiciousActivity: 8,
    failedLogins: 156,
    activeFirewallRules: 23,
    securityScore: 94
  }

  const securityAlerts = [
    {
      id: 1,
      type: 'High',
      title: 'Multiple failed login attempts',
      description: 'IP 192.168.1.100 attempted 15 failed logins in 5 minutes',
      timestamp: '2024-01-15T14:30:00Z',
      source: '192.168.1.100',
      status: 'active'
    },
    {
      id: 2,
      type: 'Medium',
      title: 'Suspicious API rate limiting',
      description: 'Unusual API call patterns detected from user ID 12345',
      timestamp: '2024-01-15T14:25:00Z',
      source: 'User: john@example.com',
      status: 'investigating'
    },
    {
      id: 3,
      type: 'Low',
      title: 'SSL certificate renewal needed',
      description: 'SSL certificate expires in 30 days',
      timestamp: '2024-01-15T14:20:00Z',
      source: 'System',
      status: 'resolved'
    }
  ]

  const securityTrends = [
    { hour: '00:00', threats: 12, blocks: 8 },
    { hour: '04:00', threats: 8, blocks: 6 },
    { hour: '08:00', threats: 25, blocks: 18 },
    { hour: '12:00', threats: 47, blocks: 32 },
    { hour: '16:00', threats: 38, blocks: 25 },
    { hour: '20:00', threats: 22, blocks: 15 }
  ]

  const chartConfig = {
    threats: {
      label: 'Threats Detected',
      color: 'hsl(var(--destructive))'
    },
    blocks: {
      label: 'Threats Blocked',
      color: 'hsl(var(--primary))'
    }
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

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'High': return 'destructive'
      case 'Medium': return 'default'
      case 'Low': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'destructive'
      case 'investigating': return 'secondary'
      case 'resolved': return 'outline'
      default: return 'outline'
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security & Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time security monitoring, threat detection, and system health
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setLoading(true)}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
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

      {/* Active Security Alerts */}
      {securityAlerts.filter(alert => alert.status === 'active').length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Alert:</strong> {securityAlerts.filter(alert => alert.status === 'active').length} active security incidents require attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Security & System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={`border-l-4 ${healthStatus.status === 'Healthy' ? 'border-l-green-500' :
          healthStatus.status === 'Warning' ? 'border-l-orange-500' : 'border-l-red-500'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
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
                <div className="text-sm font-medium text-muted-foreground">Uptime</div>
                <div className="text-2xl font-bold text-emerald-600">{systemMetrics.uptime}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Response Time</div>
                <div className="text-2xl font-bold">{systemMetrics.responseTime}ms</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Score
              </CardTitle>
              <Badge variant="default" className="bg-blue-500">
                {securityMetrics.securityScore}/100
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Security Rating</span>
                <span className="font-medium text-blue-600">Excellent</span>
              </div>
              <Progress value={securityMetrics.securityScore} className="h-2" />
              <div className="text-xs text-muted-foreground">
                Based on threat detection, access controls, and system hardening
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Threats Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{securityMetrics.totalThreats}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attacks Blocked</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{securityMetrics.blockedAttacks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Automatic prevention
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed Logins</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{securityMetrics.failedLogins}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Authentication attempts
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Firewall Rules</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{securityMetrics.activeFirewallRules}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Protection rules active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            System Performance
          </CardTitle>
          <CardDescription>Real-time system resource utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className={`text-sm font-medium ${getHealthColor(systemMetrics.cpuUsage, 'cpu')}`}>
                  {systemMetrics.cpuUsage}%
                </span>
              </div>
              <Progress value={systemMetrics.cpuUsage} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className={`text-sm font-medium ${getHealthColor(systemMetrics.memoryUsage, 'memory')}`}>
                  {systemMetrics.memoryUsage}%
                </span>
              </div>
              <Progress value={systemMetrics.memoryUsage} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Disk Usage</span>
                <span className={`text-sm font-medium ${getHealthColor(systemMetrics.diskUsage, 'disk')}`}>
                  {systemMetrics.diskUsage}%
                </span>
              </div>
              <Progress value={systemMetrics.diskUsage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Security & System Tabs */}
      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="security">Security Alerts</TabsTrigger>
          <TabsTrigger value="threats">Threat Analysis</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="logs">Access Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Active Security Alerts</h3>
              <p className="text-sm text-muted-foreground">Real-time security incident monitoring</p>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-3 w-3" />
              Filter Alerts
            </Button>
          </div>

          <div className="space-y-3">
            {securityAlerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${
                alert.type === 'High' ? 'border-l-red-500' :
                alert.type === 'Medium' ? 'border-l-amber-500' : 'border-l-blue-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getAlertVariant(alert.type)}>
                          {alert.type} Priority
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(alert.status)} className="capitalize">
                          {alert.status}
                        </Badge>
                      </div>
                      <h4 className="font-semibold">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {alert.source}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(alert.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Ban className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Threat Detection Trends
              </CardTitle>
              <CardDescription>Security incidents over the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={securityTrends}>
                    <defs>
                      <linearGradient id="threatsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="blocksGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="hour"
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
                      dataKey="threats"
                      stackId="1"
                      stroke="hsl(var(--destructive))"
                      fill="url(#threatsGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="blocks"
                      stackId="2"
                      stroke="hsl(var(--primary))"
                      fill="url(#blocksGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
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
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Read Replicas</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">3/3 Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connection Pool</span>
                  <span className="text-sm font-medium">25/50 active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Query Performance</span>
                  <span className="text-sm font-medium text-emerald-600">Optimal</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">SSL Certificate</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">Valid (89 days)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">WAF Protection</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">DDoS Protection</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">Enabled</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rate Limiting</span>
                  <span className="text-sm font-medium text-emerald-600">1000 req/min</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Recent Access Logs
              </CardTitle>
              <CardDescription>Latest authentication and access attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">14:32:15</TableCell>
                    <TableCell className="font-mono text-xs">192.168.1.100</TableCell>
                    <TableCell>admin@company.com</TableCell>
                    <TableCell>Login attempt</TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">14:30:42</TableCell>
                    <TableCell className="font-mono text-xs">10.0.0.50</TableCell>
                    <TableCell>john@company.com</TableCell>
                    <TableCell>API access</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Success
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">14:28:33</TableCell>
                    <TableCell className="font-mono text-xs">203.0.113.45</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>Blocked request</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Ban className="w-3 h-3 mr-1" />
                        Blocked
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  )
}