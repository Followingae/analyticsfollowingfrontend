'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  FileText,
  Gauge,
  HardDrive,
  Loader2,
  PlayCircle,
  RefreshCcw,
  Server,
  Settings,
  Shield,
  Zap,
  AlertCircle,
  Eye,
  Download,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { superadminApi } from '@/services/superadminApi';

interface SystemHealthStatus {
  overall_status: string;
  uptime: number;
  last_check: string;
  services: {
    api: { status: string; response_time: number; last_check: string };
    database: { status: string; response_time: number; connections: number; last_check: string };
    redis: { status: string; memory_usage: number; last_check: string };
    storage: { status: string; disk_usage: number; available_space: number; last_check: string };
    background_jobs: { status: string; active_jobs: number; failed_jobs: number; last_check: string };
  };
  performance_metrics: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  severity: string;
}

interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  estimated_duration: number;
  actual_duration?: number;
  assigned_to: string;
  affects_services: string[];
  rollback_plan: string;
  success_criteria: string;
  created_at: string;
}

interface BackupStatus {
  id: string;
  type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  duration?: number;
  size_mb: number;
  location: string;
  checksum: string;
  retention_days: number;
  automated: boolean;
  error_message?: string;
}

interface OperationsDashboardProps {}

const OperationsDashboard: React.FC<OperationsDashboardProps> = () => {
  const [healthStatus, setHealthStatus] = useState<SystemHealthStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [backupStatus, setBackupStatus] = useState<BackupStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [newMaintenanceTask, setNewMaintenanceTask] = useState({
    title: '',
    description: '',
    type: 'routine',
    priority: 'medium',
    scheduled_at: '',
    estimated_duration: 30,
    affects_services: [] as string[],
    rollback_plan: '',
    success_criteria: ''
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        healthResult,
        logsResult,
        backupsResult
      ] = await Promise.all([
        superadminApi.getSystemHealth(),
        superadminApi.getAuditLog({
          limit: 100,
          date_range: selectedTimeRange
        }),
        superadminApi.getBackupStatus()
      ]);

      if (healthResult.success) {
        setHealthStatus(healthResult.data);
      }

      if (logsResult.success) {
        setAuditLogs(logsResult.data || []);
      }

      if (backupsResult.success) {
        setBackupStatus(backupsResult.data);
      }

      // Set empty maintenance tasks since API doesn't exist yet
      setMaintenanceTasks([]);
      setError(null);
    } catch (err) {
      setError('Failed to load operations data');
      console.error('Operations dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaintenanceTask = async () => {
    try {
      await superadminApi.createMaintenanceTask(newMaintenanceTask);
      setShowMaintenanceDialog(false);
      setNewMaintenanceTask({
        title: '',
        description: '',
        type: 'routine',
        priority: 'medium',
        scheduled_at: '',
        estimated_duration: 30,
        affects_services: [],
        rollback_plan: '',
        success_criteria: ''
      });
      loadDashboardData();
    } catch (err) {
      console.error('Failed to create maintenance task:', err);
    }
  };

  const handleStartBackup = async (type: string) => {
    try {
      await superadminApi.initiateBackup({ backup_type: type });
      loadDashboardData();
    } catch (err) {
      console.error('Failed to start backup:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'online':
      case 'completed':
      case 'success':
        return 'bg-green-500';
      case 'warning':
      case 'degraded':
      case 'scheduled':
        return 'bg-yellow-500';
      case 'critical':
      case 'offline':
      case 'failed':
      case 'error':
        return 'bg-red-500';
      case 'in_progress':
      case 'running':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const performanceData = useMemo(() => {
    if (!healthStatus) return [];
    return [
      { name: 'CPU', value: healthStatus.performance_metrics.cpu_usage, color: '#8884d8' },
      { name: 'Memory', value: healthStatus.performance_metrics.memory_usage, color: '#82ca9d' },
      { name: 'Disk', value: healthStatus.performance_metrics.disk_usage, color: '#ffc658' },
      { name: 'Network', value: healthStatus.performance_metrics.network_io, color: '#ff7300' }
    ];
  }, [healthStatus]);

  const serviceStatusData = useMemo(() => {
    if (!healthStatus) return [];
    const services = healthStatus.services;
    return [
      { name: 'API', status: services.api.status, response_time: services.api.response_time },
      { name: 'Database', status: services.database.status, response_time: services.database.response_time },
      { name: 'Redis', status: services.redis.status, memory_usage: services.redis.memory_usage },
      { name: 'Storage', status: services.storage.status, disk_usage: services.storage.disk_usage },
      { name: 'Background Jobs', status: services.background_jobs.status, active_jobs: services.background_jobs.active_jobs }
    ];
  }, [healthStatus]);

  const activeAlerts = useMemo(() => {
    if (!healthStatus) return [];
    return healthStatus.alerts.filter(alert => !alert.resolved);
  }, [healthStatus]);

  if (loading && !healthStatus) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading operations dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Operations Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadDashboardData}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Platform Operations</h2>
          <p className="text-muted-foreground">System health monitoring, audit logs, and maintenance management</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="6h">6 Hours</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadDashboardData} size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <div className="flex items-center mt-2">
                  <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(healthStatus?.overall_status || 'unknown')}`} />
                  <p className="text-2xl font-bold capitalize">{healthStatus?.overall_status || 'Unknown'}</p>
                </div>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold mt-2">
                  {healthStatus ? Math.floor(healthStatus.uptime / 3600) : 0}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold mt-2">{activeAlerts.length}</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${activeAlerts.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Maintenance Tasks</p>
                <p className="text-2xl font-bold mt-2">
                  {maintenanceTasks.filter(task => task.status === 'scheduled').length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="health" className="space-y-6">
        <TabsList>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
        </TabsList>

        {/* System Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gauge className="h-5 w-5 mr-2" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Real-time system performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Usage %",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="var(--color-value)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Service Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="h-5 w-5 mr-2" />
                  Service Status
                </CardTitle>
                <CardDescription>Status of critical system services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceStatusData.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(service.status)}`} />
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant={service.status === 'healthy' || service.status === 'online' ? 'default' : 'destructive'}>
                          {service.status}
                        </Badge>
                        {service.response_time && (
                          <p className="text-xs text-muted-foreground mt-1">{service.response_time}ms</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                  Active Alerts
                </CardTitle>
                <CardDescription>System alerts requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{alert.message}</p>
                          <Badge variant="destructive">{alert.severity}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Audit Logs
              </CardTitle>
              <CardDescription>System activity and administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.resource_type}</p>
                            <p className="text-xs text-muted-foreground">{log.resource_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getSeverityIcon(log.severity)}
                            <span className="ml-2 capitalize">{log.severity}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Maintenance Tasks</h3>
              <p className="text-muted-foreground">Scheduled and ongoing maintenance activities</p>
            </div>
            <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
              <DialogTrigger asChild>
                <Button>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Schedule Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Schedule Maintenance Task</DialogTitle>
                  <DialogDescription>Create a new maintenance task with scheduling details</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newMaintenanceTask.title}
                      onChange={(e) => setNewMaintenanceTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Database optimization"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newMaintenanceTask.description}
                      onChange={(e) => setNewMaintenanceTask(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of maintenance task"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={newMaintenanceTask.type}
                        onValueChange={(value) => setNewMaintenanceTask(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="routine">Routine</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="upgrade">Upgrade</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={newMaintenanceTask.priority}
                        onValueChange={(value) => setNewMaintenanceTask(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="scheduled_at">Scheduled Time</Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={newMaintenanceTask.scheduled_at}
                      onChange={(e) => setNewMaintenanceTask(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowMaintenanceDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateMaintenanceTask}>Schedule Task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">{task.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{task.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(task.status)}`} />
                          <span className="capitalize">{task.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={task.priority === 'critical' || task.priority === 'high' ? 'destructive' : 'default'}
                          className="capitalize"
                        >
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(task.scheduled_at).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">{new Date(task.scheduled_at).toLocaleTimeString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {task.actual_duration ? (
                            <span>{task.actual_duration}min</span>
                          ) : (
                            <span className="text-muted-foreground">~{task.estimated_duration}min</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{task.assigned_to}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Backup Management</h3>
              <p className="text-muted-foreground">System backups and recovery operations</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => handleStartBackup('database')} size="sm">
                <Database className="h-4 w-4 mr-2" />
                Database Backup
              </Button>
              <Button onClick={() => handleStartBackup('full')} size="sm">
                <HardDrive className="h-4 w-4 mr-2" />
                Full Backup
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Backup Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Backup Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Backups</span>
                    <span className="font-medium">{backupStatus.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Successful</span>
                    <span className="font-medium text-green-600">
                      {backupStatus.filter(b => b.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Failed</span>
                    <span className="font-medium text-red-600">
                      {backupStatus.filter(b => b.status === 'failed').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Size</span>
                    <span className="font-medium">
                      {(backupStatus.reduce((sum, b) => sum + b.size_mb, 0) / 1024).toFixed(2)} GB
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Latest Backup</CardTitle>
              </CardHeader>
              <CardContent>
                {backupStatus.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {backupStatus[0].type}
                      </Badge>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(backupStatus[0].status)}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Started</p>
                      <p className="font-medium">{new Date(backupStatus[0].started_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-medium">{(backupStatus[0].size_mb / 1024).toFixed(2)} GB</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Automated Backups */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Automation Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Daily Database Backup</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Weekly Full Backup</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Retention (Days)</span>
                    <span className="font-medium">30</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Backup History */}
          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>Recent backup operations and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Automated</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backupStatus.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{backup.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(backup.status)}`} />
                          <span className="capitalize">{backup.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(backup.started_at).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">{new Date(backup.started_at).toLocaleTimeString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {backup.duration ? `${Math.floor(backup.duration / 60)}m ${backup.duration % 60}s` : '-'}
                      </TableCell>
                      <TableCell>{(backup.size_mb / 1024).toFixed(2)} GB</TableCell>
                      <TableCell className="font-mono text-sm">{backup.location}</TableCell>
                      <TableCell>
                        {backup.automated ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">Manual</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OperationsDashboard;