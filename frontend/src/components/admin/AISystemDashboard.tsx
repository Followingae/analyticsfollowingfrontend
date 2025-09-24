'use client'

import { useState, useEffect } from 'react'
import { superadminApiService, AISystemStatus } from '@/services/superadminApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from 'recharts'
import {
  Brain,
  Cpu,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  RefreshCw,
  Activity,
  BarChart3,
  TrendingUp,
  Database,
  Server,
  Settings,
  FileText,
  Target,
  AlertCircle,
  Layers,
  Gauge
} from 'lucide-react'

export function AISystemDashboard() {
  const [aiStatus, setAiStatus] = useState<AISystemStatus | null>(null)
  const [queueData, setQueueData] = useState<any>(null)
  const [analysisStats, setAnalysisStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('24h')

  const loadAISystemData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statusResult, queueResult, statsResult] = await Promise.all([
        superadminApiService.getAIModelsStatus(),
        superadminApiService.getAIAnalysisQueue(),
        superadminApiService.getAIAnalysisStats({ date_from: getDateFromRange(timeRange) })
      ])

      if (statusResult.success) {
        setAiStatus(statusResult.data!)
      } else {
        console.warn('AI Status API failed:', statusResult.error)
      }

      if (queueResult.success) {
        setQueueData(queueResult.data)
      } else {
        console.warn('AI Queue API failed:', queueResult.error)
      }

      if (statsResult.success) {
        setAnalysisStats(statsResult.data)
      } else {
        console.warn('AI Stats API failed:', statsResult.error)
      }
    } catch (error) {
      setError('Failed to load AI system data')
      console.error('AI system data error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAISystemData()
    const interval = setInterval(loadAISystemData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [timeRange])

  const getDateFromRange = (range: string) => {
    const now = new Date()
    switch (range) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000).toISOString()
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    }
  }

  const getModelStatusBadge = (successRate: number) => {
    if (successRate >= 95) return { variant: 'default', text: 'Excellent' }
    if (successRate >= 90) return { variant: 'secondary', text: 'Good' }
    if (successRate >= 80) return { variant: 'outline', text: 'Fair' }
    return { variant: 'destructive', text: 'Poor' }
  }

  const chartConfig = {
    processing_time: {
      label: 'Processing Time (ms)',
      color: 'hsl(var(--primary))'
    },
    success_rate: {
      label: 'Success Rate (%)',
      color: 'hsl(var(--primary))'
    },
    queue_depth: {
      label: 'Queue Depth',
      color: 'hsl(var(--destructive))'
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
              <div className="h-10 bg-muted rounded w-20 animate-pulse" />
              <div className="h-10 bg-muted rounded w-20 animate-pulse" />
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
        <Button variant="outline" className="mt-4" onClick={loadAISystemData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  const modelNames = aiStatus ? Object.keys(aiStatus.model_performance) : []
  const filteredModels = selectedModel === 'all' ? modelNames : [selectedModel]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI System Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage AI models, processing queue, and analysis performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAISystemData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modelNames.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              AI models deployed
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Queue Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {queueData?.processing_queue?.pending_jobs || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Jobs pending processing
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {analysisStats?.success_rate ? (analysisStats.success_rate * 100).toFixed(1) : 0}%
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Progress
                value={analysisStats?.success_rate ? analysisStats.success_rate * 100 : 0}
                className="flex-1 h-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Processing</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysisStats?.avg_processing_time ? (analysisStats.avg_processing_time / 1000).toFixed(1) : 0}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average processing time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI System Tabs */}
      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">Model Performance</TabsTrigger>
          <TabsTrigger value="queue">Processing Queue</TabsTrigger>
          <TabsTrigger value="analytics">Analysis Stats</TabsTrigger>
          <TabsTrigger value="monitoring">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    AI Model Performance
                  </CardTitle>
                  <CardDescription>Real-time performance metrics for all deployed models</CardDescription>
                </div>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {modelNames.map((model) => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Success Rate</TableHead>
                      <TableHead className="text-right">Avg Time</TableHead>
                      <TableHead className="text-right">Queue Depth</TableHead>
                      <TableHead className="text-right">Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aiStatus && filteredModels.map((modelName) => {
                      const model = aiStatus.model_performance[modelName]
                      const statusBadge = getModelStatusBadge(model.success_rate * 100)
                      return (
                        <TableRow key={modelName} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{modelName}</TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant as any}>
                              {statusBadge.text}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(model.success_rate * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {(model.avg_processing_time / 1000).toFixed(1)}s
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={model.queue_depth > 100 ? 'text-red-600 font-medium' : ''}>
                              {model.queue_depth}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {new Date(model.last_updated).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Queue Overview
                </CardTitle>
                <CardDescription>Current processing queue status</CardDescription>
              </CardHeader>
              <CardContent>
                {queueData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {queueData.processing_queue?.total_jobs || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Jobs</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {(queueData.processing_queue?.total_jobs || 0) - (queueData.processing_queue?.pending_jobs || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Processing Progress</span>
                        <span>{Math.round(((queueData.processing_queue?.total_jobs - queueData.processing_queue?.pending_jobs) / queueData.processing_queue?.total_jobs || 0) * 100)}%</span>
                      </div>
                      <Progress
                        value={((queueData.processing_queue?.total_jobs - queueData.processing_queue?.pending_jobs) / queueData.processing_queue?.total_jobs || 0) * 100}
                        className="h-3"
                      />
                    </div>

                    {queueData.processing_queue?.failed_jobs > 0 && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          {queueData.processing_queue.failed_jobs} jobs have failed processing.
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={() => superadminApiService.retryAIAnalysis()}
                          >
                            Retry Failed Jobs
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Processing Timeline
                </CardTitle>
                <CardDescription>Estimated completion times</CardDescription>
              </CardHeader>
              <CardContent>
                {queueData && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {queueData.processing_queue?.estimated_completion ?
                          new Date(queueData.processing_queue.estimated_completion).toLocaleString() :
                          'N/A'
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">Estimated Completion</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Pending Jobs:</span>
                        <span className="font-medium">{queueData.processing_queue?.pending_jobs || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Failed Jobs:</span>
                        <span className="font-medium text-red-600">{queueData.processing_queue?.failed_jobs || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analysis Statistics
              </CardTitle>
              <CardDescription>Content analysis performance and insights</CardDescription>
            </CardHeader>
            <CardContent>
              {analysisStats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        {analysisStats.total_analyses?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Analyses</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {analysisStats.success_rate ? (analysisStats.success_rate * 100).toFixed(1) : 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        {analysisStats.avg_processing_time ? (analysisStats.avg_processing_time / 1000).toFixed(1) : 0}s
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Processing</div>
                    </div>
                  </div>

                  {analysisStats.content_categories && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Content Category Distribution</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(analysisStats.content_categories).map(([category, count]) => (
                          <div key={category} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                            <span className="capitalize">{category}</span>
                            <span className="font-medium">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Health
                </CardTitle>
                <CardDescription>AI infrastructure monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Model Servers</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">All Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Processing Workers</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">8/8 Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Queue Manager</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Healthy</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Model Cache</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">95% Hit Rate</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Controls
                </CardTitle>
                <CardDescription>AI system management controls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Pause className="mr-2 h-4 w-4" />
                    Pause All Processing
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Play className="mr-2 h-4 w-4" />
                    Resume Processing
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clear Failed Jobs
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="mr-2 h-4 w-4" />
                    Restart Model Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}