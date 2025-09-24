'use client'

import { useState, useEffect } from 'react'
import { superadminApiService, ContentModeration } from '@/services/superadminApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, Area, AreaChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import {
  Shield,
  AlertTriangle,
  Eye,
  Ban,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Flag,
  Image,
  Video,
  FileText,
  Globe,
  Clock,
  TrendingUp,
  BarChart3,
  Zap,
  Database,
  HardDrive,
  Download,
  Upload,
  CloudUpload
} from 'lucide-react'

export function ContentManagementDashboard() {
  const [moderationData, setModerationData] = useState<ContentModeration | null>(null)
  const [categoriesData, setCategoriesData] = useState<any>(null)
  const [cdnData, setCdnData] = useState<any>(null)
  const [assetsData, setAssetsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [selectedContent, setSelectedContent] = useState<any>(null)

  const loadContentData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [moderationResult, categoriesResult, cdnResult, assetsResult] = await Promise.all([
        superadminApiService.getContentModerationQueue(),
        superadminApiService.getContentCategoriesDistribution(),
        superadminApiService.getCDNPerformance(),
        superadminApiService.getCDNAssets()
      ])

      if (moderationResult.success) {
        setModerationData(moderationResult.data!)
      } else {
        console.warn('Moderation API failed:', moderationResult.error)
      }

      if (categoriesResult.success) {
        setCategoriesData(categoriesResult.data)
      } else {
        console.warn('Categories API failed:', categoriesResult.error)
      }

      if (cdnResult.success) {
        setCdnData(cdnResult.data)
      } else {
        console.warn('CDN API failed:', cdnResult.error)
      }

      if (assetsResult.success) {
        setAssetsData(assetsResult.data)
      } else {
        console.warn('Assets API failed:', assetsResult.error)
      }
    } catch (error) {
      setError('Failed to load content management data')
      console.error('Content management error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContentData()
    const interval = setInterval(loadContentData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'default'
      case 'flagged': return 'destructive'
      case 'pending': return 'secondary'
      case 'rejected': return 'destructive'
      default: return 'outline'
    }
  }

  const filteredContent = moderationData?.flagged_content?.filter(content => {
    const matchesSearch = searchQuery === '' ||
      content.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.reason.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSeverity = severityFilter === 'all' || content.severity === severityFilter
    return matchesSearch && matchesSeverity
  }) || []

  const chartConfig = {
    count: {
      label: 'Count',
      color: 'hsl(var(--primary))'
    },
    size: {
      label: 'Size (MB)',
      color: 'hsl(var(--primary))'
    },
    response_time: {
      label: 'Response Time (ms)',
      color: 'hsl(var(--primary))'
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
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={loadContentData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content & Media Management</h1>
          <p className="text-muted-foreground">
            Monitor content moderation, manage media assets, and track CDN performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadContentData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flagged Content</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {moderationData?.moderation_queue_count !== undefined ? moderationData.moderation_queue_count : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Items requiring review
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Moderation Accuracy</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {moderationData?.auto_moderation_stats?.accuracy_rate ?
                (moderationData.auto_moderation_stats.accuracy_rate * 100).toFixed(1) : 0}%
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Progress
                value={moderationData?.auto_moderation_stats?.accuracy_rate ?
                  moderationData.auto_moderation_stats.accuracy_rate * 100 : 0}
                className="flex-1 h-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CDN Response</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cdnData?.response_times?.average !== undefined ? `${cdnData.response_times.average}ms` : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assetsData?.storage_usage ?
                `${(assetsData.storage_usage / 1024 / 1024 / 1024).toFixed(1)}GB` : '0GB'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Media asset storage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="moderation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="moderation">Content Moderation</TabsTrigger>
          <TabsTrigger value="categories">Content Analytics</TabsTrigger>
          <TabsTrigger value="cdn">CDN Performance</TabsTrigger>
          <TabsTrigger value="assets">Asset Management</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="space-y-4">
          {moderationData && moderationData.moderation_queue_count > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {moderationData.moderation_queue_count} items in moderation queue require immediate attention.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Content Moderation Queue
                  </CardTitle>
                  <CardDescription>
                    Review and manage {filteredContent.length} flagged content items
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search flagged content by type or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Flagged Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContent.length > 0 ? filteredContent.map((content) => (
                      <TableRow key={content.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {content.type === 'image' && <Image className="h-4 w-4 text-blue-500" />}
                            {content.type === 'video' && <Video className="h-4 w-4 text-purple-500" />}
                            {content.type === 'text' && <FileText className="h-4 w-4 text-green-500" />}
                            <span className="capitalize">{content.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {content.reason}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityBadgeVariant(content.severity)} className="capitalize">
                            {content.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(content.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            Pending Review
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setSelectedContent(content)}>
                                <Eye className="mr-2 h-3 w-3" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <CheckCircle2 className="mr-2 h-3 w-3" />
                                Approve Content
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <XCircle className="mr-2 h-3 w-3" />
                                Remove Content
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Ban className="mr-2 h-3 w-3" />
                                Ban User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-muted-foreground space-y-2">
                            <Shield className="h-8 w-8 mx-auto opacity-50" />
                            <p>No flagged content found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Content Categories
                </CardTitle>
                <CardDescription>Content distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                {categoriesData && (
                  <ChartContainer config={chartConfig} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(categoriesData.category_distribution || {}).map(([key, value]) => ({
                            name: key,
                            value: value as number,
                            fill: `hsl(${Math.random() * 360}, 70%, 50%)`
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Content Quality Metrics
                </CardTitle>
                <CardDescription>Content quality and engagement statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {categoriesData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-lg font-bold">
                          {categoriesData.quality_metrics?.average_score !== undefined ? categoriesData.quality_metrics.average_score : 'Loading...'}
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Quality Score</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-lg font-bold">
                          {categoriesData.engagement_metrics?.average_rate !== undefined ? `${categoriesData.engagement_metrics.average_rate}%` : 'Loading...'}
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Engagement</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Content Approval Rate</span>
                        <span>{categoriesData.approval_rate !== undefined ? `${categoriesData.approval_rate}%` : 'Loading...'}</span>
                      </div>
                      <Progress value={categoriesData.approval_rate ?? 0} className="h-2" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cdn" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  CDN Performance
                </CardTitle>
                <CardDescription>Content delivery network metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {cdnData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {cdnData.cache_hit_rate || 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">Cache Hit Rate</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-lg font-bold">
                          {cdnData.response_times?.p95 || 0}ms
                        </div>
                        <div className="text-xs text-muted-foreground">P95 Response Time</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Image Processing</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium">{cdnData.image_processing?.success_rate || 0}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Thumbnail Generation</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium">{cdnData.thumbnail_generation?.success_rate || 0}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bandwidth Usage</span>
                        <span className="text-sm font-medium">
                          {cdnData.bandwidth_usage ? `${(cdnData.bandwidth_usage / 1024 / 1024 / 1024).toFixed(2)} GB` : '0 GB'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>CDN response time trends</CardDescription>
              </CardHeader>
              <CardContent>
                {cdnData?.performance_trends && (
                  <ChartContainer config={chartConfig} className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cdnData.performance_trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="timestamp"
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
                          dataKey="response_time"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Media Asset Management
              </CardTitle>
              <CardDescription>Storage and asset optimization overview</CardDescription>
            </CardHeader>
            <CardContent>
              {assetsData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        {assetsData.total_assets?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Assets</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {assetsData.optimization_ratio || 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Optimized</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        ${(assetsData.monthly_cost || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Monthly Cost</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Storage by Type</h4>
                    {assetsData.storage_by_type && Object.entries(assetsData.storage_by_type).map(([type, data]: [string, any]) => (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize flex items-center gap-2">
                            {type === 'images' && <Image className="w-4 h-4" />}
                            {type === 'videos' && <Video className="w-4 h-4" />}
                            {type === 'documents' && <FileText className="w-4 h-4" />}
                            {type}
                          </span>
                          <span className="font-medium">
                            {(data.size / 1024 / 1024 / 1024).toFixed(2)} GB
                          </span>
                        </div>
                        <Progress value={data.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Content Details Modal */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-2xl">
          {selectedContent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Flagged Content Details
                </DialogTitle>
                <DialogDescription>
                  Review content and take appropriate moderation action
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Content Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Type:</span> {selectedContent.type}</div>
                      <div><span className="font-medium">Severity:</span>
                        <Badge variant={getSeverityBadgeVariant(selectedContent.severity)} className="ml-2 capitalize">
                          {selectedContent.severity}
                        </Badge>
                      </div>
                      <div><span className="font-medium">Flagged:</span> {new Date(selectedContent.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Moderation Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Reason:</span> {selectedContent.reason}</div>
                      <div><span className="font-medium">Auto-detected:</span> Yes</div>
                      <div><span className="font-medium">Confidence:</span> 89%</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Content Preview</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <Image className="h-12 w-12 mx-auto mb-2" />
                      Content preview would be displayed here
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline">
                    <XCircle className="mr-2 h-4 w-4" />
                    Remove Content
                  </Button>
                  <Button variant="outline">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve Content
                  </Button>
                  <Button>
                    <Ban className="mr-2 h-4 w-4" />
                    Take Action
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}