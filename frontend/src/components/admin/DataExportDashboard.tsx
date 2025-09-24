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
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import {
  Download,
  Upload,
  FileText,
  Database,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCcw,
  Play,
  Pause,
  StopCircle,
  Settings,
  Filter,
  FileSpreadsheet,
  FileJson,
  Archive,
  Cloud,
  Server,
  Zap,
  TrendingUp,
  Users,
  BarChart3,
  Activity
} from 'lucide-react';
import { superadminApi } from '@/services/superadminApi';

interface ExportJob {
  id: string;
  name: string;
  type: string;
  format: string;
  status: string;
  progress: number;
  total_records: number;
  processed_records: number;
  file_size_mb?: number;
  download_url?: string;
  error_message?: string;
  filters: Record<string, any>;
  scheduled: boolean;
  schedule_cron?: string;
  created_by: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  estimated_completion?: string;
}

interface IntegrationStatus {
  id: string;
  name: string;
  type: string;
  status: string;
  last_sync: string;
  next_sync?: string;
  records_synced: number;
  errors_count: number;
  configuration: Record<string, any>;
  enabled: boolean;
  health_score: number;
}

interface DataSource {
  id: string;
  name: string;
  table_name: string;
  description: string;
  record_count: number;
  last_updated: string;
  exportable_fields: string[];
  size_mb: number;
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  data_source: string;
  format: string;
  default_filters: Record<string, any>;
  field_mappings: Record<string, string>;
  schedule_enabled: boolean;
  usage_count: number;
  created_by: string;
  created_at: string;
}

interface DataExportDashboardProps {}

const DataExportDashboard: React.FC<DataExportDashboardProps> = () => {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [newExportJob, setNewExportJob] = useState({
    name: '',
    type: 'users',
    format: 'csv',
    filters: {} as Record<string, any>,
    schedule_enabled: false,
    schedule_cron: ''
  });
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    data_source: '',
    format: 'csv',
    default_filters: {} as Record<string, any>,
    field_mappings: {} as Record<string, string>
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadExportJobsData, 10000); // Refresh jobs every 10 seconds
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        jobsResult,
        integrationsResult
      ] = await Promise.all([
        superadminApi.getDataExportJobs(),
        superadminApi.getThirdPartyIntegrations()
      ]);

      if (jobsResult.success) {
        setExportJobs(jobsResult.data.jobs || []);
      }

      if (integrationsResult.success) {
        setIntegrations(integrationsResult.data || []);
      }

      setError(null);
    } catch (err) {
      setError('Failed to load data export dashboard');
      console.error('Data export dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExportJobsData = async () => {
    try {
      const jobsData = await superadminApi.getExportJobs({ time_range: selectedTimeRange });
      setExportJobs(jobsData);
    } catch (err) {
      console.error('Failed to refresh export jobs:', err);
    }
  };

  const handleCreateExportJob = async () => {
    try {
      await superadminApi.createExportJob(newExportJob);
      setShowExportDialog(false);
      setNewExportJob({
        name: '',
        type: 'users',
        format: 'csv',
        filters: {},
        schedule_enabled: false,
        schedule_cron: ''
      });
      loadDashboardData();
    } catch (err) {
      console.error('Failed to create export job:', err);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await superadminApi.createExportTemplate(newTemplate);
      setShowTemplateDialog(false);
      setNewTemplate({
        name: '',
        description: '',
        data_source: '',
        format: 'csv',
        default_filters: {},
        field_mappings: {}
      });
      loadDashboardData();
    } catch (err) {
      console.error('Failed to create template:', err);
    }
  };

  const handleJobAction = async (jobId: string, action: string) => {
    try {
      if (action === 'cancel') {
        await superadminApi.cancelExportJob(jobId);
      } else if (action === 'retry') {
        await superadminApi.retryExportJob(jobId);
      } else if (action === 'download') {
        await superadminApi.downloadExportJob(jobId);
      }
      loadExportJobsData();
    } catch (err) {
      console.error(`Failed to ${action} export job:`, err);
    }
  };

  const handleIntegrationAction = async (integrationId: string, action: string) => {
    try {
      if (action === 'sync') {
        await superadminApi.triggerIntegrationSync(integrationId);
      } else if (action === 'toggle') {
        await superadminApi.toggleIntegration(integrationId);
      }
      loadDashboardData();
    } catch (err) {
      console.error(`Failed to ${action} integration:`, err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'healthy':
      case 'connected':
        return 'bg-green-500';
      case 'in_progress':
      case 'running':
      case 'syncing':
        return 'bg-blue-500';
      case 'scheduled':
      case 'pending':
      case 'warning':
        return 'bg-yellow-500';
      case 'failed':
      case 'error':
      case 'disconnected':
        return 'bg-red-500';
      case 'cancelled':
      case 'paused':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'json':
        return <FileJson className="h-4 w-4" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'zip':
        return <Archive className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const jobsOverview = useMemo(() => {
    const total = exportJobs.length;
    const completed = exportJobs.filter(job => job.status === 'completed').length;
    const failed = exportJobs.filter(job => job.status === 'failed').length;
    const running = exportJobs.filter(job => job.status === 'in_progress').length;
    const scheduled = exportJobs.filter(job => job.scheduled).length;

    return { total, completed, failed, running, scheduled };
  }, [exportJobs]);

  const exportVolumeData = useMemo(() => {
    const volumeByDay = exportJobs.reduce((acc, job) => {
      const date = new Date(job.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, records: 0, jobs: 0, size_mb: 0 };
      }
      acc[date].records += job.processed_records || 0;
      acc[date].jobs += 1;
      acc[date].size_mb += job.file_size_mb || 0;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(volumeByDay).slice(-30);
  }, [exportJobs]);

  const integrationHealth = useMemo(() => {
    const healthy = integrations.filter(i => i.health_score >= 80).length;
    const warning = integrations.filter(i => i.health_score >= 60 && i.health_score < 80).length;
    const critical = integrations.filter(i => i.health_score < 60).length;

    return [
      { name: 'Healthy', value: healthy, color: '#22c55e' },
      { name: 'Warning', value: warning, color: '#eab308' },
      { name: 'Critical', value: critical, color: '#ef4444' }
    ];
  }, [integrations]);

  if (loading && exportJobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading data export dashboard...</span>
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
            <h3 className="text-lg font-semibold mb-2">Failed to Load Data Export Dashboard</h3>
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
          <h2 className="text-3xl font-bold tracking-tight">Data Export & Integration</h2>
          <p className="text-muted-foreground">Manage data exports, scheduled jobs, and third-party integrations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadDashboardData} size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold mt-2">{jobsOverview.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold mt-2 text-green-600">{jobsOverview.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Running</p>
                <p className="text-2xl font-bold mt-2 text-blue-600">{jobsOverview.running}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold mt-2 text-yellow-600">{jobsOverview.scheduled}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Integrations</p>
                <p className="text-2xl font-bold mt-2">{integrations.length}</p>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs">Export Jobs</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Export Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Export Jobs</h3>
              <p className="text-muted-foreground">Create and manage data export jobs</p>
            </div>
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  New Export
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create Export Job</DialogTitle>
                  <DialogDescription>Configure a new data export job</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="job-name">Job Name</Label>
                    <Input
                      id="job-name"
                      value={newExportJob.name}
                      onChange={(e) => setNewExportJob(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="User export - Q4 2024"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="job-type">Data Source</Label>
                      <Select
                        value={newExportJob.type}
                        onValueChange={(value) => setNewExportJob(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="users">Users</SelectItem>
                          <SelectItem value="subscriptions">Subscriptions</SelectItem>
                          <SelectItem value="transactions">Transactions</SelectItem>
                          <SelectItem value="analytics">Analytics</SelectItem>
                          <SelectItem value="profiles">Profiles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="job-format">Format</Label>
                      <Select
                        value={newExportJob.format}
                        onValueChange={(value) => setNewExportJob(prev => ({ ...prev, format: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="xlsx">Excel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="schedule"
                      checked={newExportJob.schedule_enabled}
                      onCheckedChange={(checked) => setNewExportJob(prev => ({ ...prev, schedule_enabled: checked as boolean }))}
                    />
                    <Label htmlFor="schedule">Enable scheduling</Label>
                  </div>
                  {newExportJob.schedule_enabled && (
                    <div className="grid gap-2">
                      <Label htmlFor="cron">Schedule (Cron)</Label>
                      <Input
                        id="cron"
                        value={newExportJob.schedule_cron}
                        onChange={(e) => setNewExportJob(prev => ({ ...prev, schedule_cron: e.target.value }))}
                        placeholder="0 9 * * 1 (Every Monday at 9 AM)"
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateExportJob}>Create Job</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exportJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getFormatIcon(job.format)}
                          <div>
                            <p className="font-medium">{job.name}</p>
                            {job.scheduled && (
                              <Badge variant="outline" className="text-xs">Scheduled</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{job.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(job.status)}`} />
                          <span className="capitalize">{job.status.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-full max-w-[100px]">
                          <Progress value={job.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">{job.progress}%</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{job.processed_records?.toLocaleString() || 0}</p>
                          <p className="text-muted-foreground">of {job.total_records?.toLocaleString() || 0}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.file_size_mb ? `${job.file_size_mb.toFixed(2)} MB` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(job.created_at).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">{new Date(job.created_at).toLocaleTimeString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {job.status === 'completed' && job.download_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleJobAction(job.id, 'download')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {job.status === 'in_progress' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleJobAction(job.id, 'cancel')}
                            >
                              <StopCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {job.status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleJobAction(job.id, 'retry')}
                            >
                              <RefreshCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Zap className="h-5 w-5 mr-2" />
                  Integration Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Integrations",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={integrationHealth}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {integrationHealth.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sync Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Records Synced</span>
                    <span className="font-medium">
                      {integrations.reduce((sum, i) => sum + i.records_synced, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Integrations</span>
                    <span className="font-medium">
                      {integrations.filter(i => i.enabled).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sync Errors</span>
                    <span className="font-medium text-red-600">
                      {integrations.reduce((sum, i) => sum + i.errors_count, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {integrations.slice(0, 3).map((integration) => (
                    <div key={integration.id} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(integration.status)}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Last sync: {new Date(integration.last_sync).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
              <CardDescription>Manage external service integrations and data synchronization</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Integration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Errors</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Cloud className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{integration.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{integration.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(integration.status)}`} />
                          <span className="capitalize">{integration.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={integration.health_score} className="w-16 h-2" />
                          <span className="text-sm">{integration.health_score}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(integration.last_sync).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">{new Date(integration.last_sync).toLocaleTimeString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>{integration.records_synced.toLocaleString()}</TableCell>
                      <TableCell>
                        {integration.errors_count > 0 ? (
                          <span className="text-red-600">{integration.errors_count}</span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleIntegrationAction(integration.id, 'sync')}
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleIntegrationAction(integration.id, 'toggle')}
                          >
                            {integration.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Export Templates</h3>
              <p className="text-muted-foreground">Reusable export configurations and field mappings</p>
            </div>
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create Export Template</DialogTitle>
                  <DialogDescription>Define a reusable export configuration</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="User Analytics Export"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                      id="template-description"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Template description and use case"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="template-source">Data Source</Label>
                      <Select
                        value={newTemplate.data_source}
                        onValueChange={(value) => setNewTemplate(prev => ({ ...prev, data_source: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dataSources.map((source) => (
                            <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="template-format">Format</Label>
                      <Select
                        value={newTemplate.format}
                        onValueChange={(value) => setNewTemplate(prev => ({ ...prev, format: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="xlsx">Excel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateTemplate}>Create Template</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-2">{template.description}</CardDescription>
                    </div>
                    {getFormatIcon(template.format)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Data Source</span>
                      <span className="font-medium capitalize">{template.data_source}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usage Count</span>
                      <span className="font-medium">{template.usage_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">{new Date(template.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button size="sm" className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Export Volume Trends
                </CardTitle>
                <CardDescription>Daily export activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    records: {
                      label: "Records Exported",
                      color: "hsl(var(--chart-1))",
                    },
                    jobs: {
                      label: "Jobs Created",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={exportVolumeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="records"
                        stroke="var(--color-records)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="jobs"
                        stroke="var(--color-jobs)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Data Sources Overview
                </CardTitle>
                <CardDescription>Available data sources and record counts</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {dataSources.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{source.name}</p>
                          <p className="text-sm text-muted-foreground">{source.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{source.record_count.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{source.size_mb.toFixed(2)} MB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataExportDashboard;