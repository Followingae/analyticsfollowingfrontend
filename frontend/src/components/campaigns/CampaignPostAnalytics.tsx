'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  campaignPostAnalyticsApi,
  CampaignPost,
  CampaignPostsResponse,
  CampaignAnalyticsSummary,
  AddPostsRequest
} from '@/services/campaignPostAnalyticsApi'
import {
  Plus,
  Upload,
  BarChart3,
  TrendingUp,
  MessageCircle,
  Heart,
  Eye,
  Download,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Link,
  Copy,
  Filter,
  Search,
  Calendar,
  Target,
  Users,
  Globe
} from 'lucide-react'

import { AppSidebar } from '@/components/app-sidebar'
import { toast } from 'sonner'
import { SiteHeader } from '@/components/site-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const dynamic = 'force-dynamic'

interface CampaignPostAnalyticsProps {
  campaignId: string
  campaignName?: string
}

export function CampaignPostAnalytics({ campaignId, campaignName }: CampaignPostAnalyticsProps) {
  const router = useRouter()

  // State management
  const [postsData, setPostsData] = useState<CampaignPostsResponse | null>(null)
  const [analyticsData, setAnalyticsData] = useState<CampaignAnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'failed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog states
  const [isAddPostsOpen, setIsAddPostsOpen] = useState(false)
  const [bulkUrlInput, setBulkUrlInput] = useState('')
  const [addingPosts, setAddingPosts] = useState(false)

  // Real-time polling for pending analysis
  const [isPolling, setIsPolling] = useState(false)

  // Load campaign posts and analytics
  const loadCampaignData = async (page = 1, showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)

    try {
      const [postsResult, analyticsResult] = await Promise.all([
        campaignPostAnalyticsApi.getCampaignPosts(campaignId, {
          limit: 20,
          offset: (page - 1) * 20,
          analysis_status: filterStatus
        }),
        campaignPostAnalyticsApi.getCampaignAnalyticsSummary(campaignId)
      ])

      if (postsResult.success && postsResult.data) {
        setPostsData(postsResult.data)
      } else {
        console.warn('Failed to load posts:', postsResult.error)
      }

      if (analyticsResult.success && analyticsResult.data) {
        setAnalyticsData(analyticsResult.data)
      } else {
        console.warn('Failed to load analytics:', analyticsResult.error)
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load campaign data')
      console.error('Campaign data load error:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Handle adding posts to campaign
  const handleAddPosts = async () => {
    if (!bulkUrlInput.trim()) {
      toast.error('Please enter at least one Instagram URL')
      return
    }

    setAddingPosts(true)

    try {
      // Parse and validate URLs
      const urls = campaignPostAnalyticsApi.parseBulkUrls(bulkUrlInput)

      if (urls.length === 0) {
        toast.error('No valid Instagram URLs found')
        return
      }

      const { valid, invalid } = campaignPostAnalyticsApi.validateInstagramUrls(urls)

      if (invalid.length > 0) {
        toast.error(`${invalid.length} invalid URLs found. Please check your input.`)
        return
      }

      // Add posts to campaign
      const result = await campaignPostAnalyticsApi.addPostsToCampaign(campaignId, {
        post_urls: valid,
        analysis_priority: 'normal'
      })

      if (result.success && result.data) {
        toast.success(
          `Successfully added ${result.data.posts_added} posts. Analysis will complete in ${new Date(result.data.estimated_completion).toLocaleTimeString()}`
        )

        // Clear input and close dialog
        setBulkUrlInput('')
        setIsAddPostsOpen(false)

        // Reload data
        await loadCampaignData(currentPage, false)

        // Start polling for analysis updates
        setIsPolling(true)
      } else {
        toast.error(result.error || 'Failed to add posts')
      }

    } catch (error) {
      toast.error('Network error while adding posts')
      console.error('Add posts error:', error)
    } finally {
      setAddingPosts(false)
    }
  }

  // Handle removing a post
  const handleRemovePost = async (postId: string) => {
    try {
      const result = await campaignPostAnalyticsApi.removePostFromCampaign(campaignId, postId)

      if (result.success) {
        toast.success('Post removed from campaign')
        await loadCampaignData(currentPage, false)
      } else {
        toast.error(result.error || 'Failed to remove post')
      }
    } catch (error) {
      toast.error('Network error while removing post')
    }
  }

  // Handle retrying failed analysis
  const handleRetryAnalysis = async (postId: string) => {
    try {
      const result = await campaignPostAnalyticsApi.retryPostAnalysis(campaignId, postId)

      if (result.success) {
        toast.success('Analysis restarted')
        await loadCampaignData(currentPage, false)
      } else {
        toast.error(result.error || 'Failed to retry analysis')
      }
    } catch (error) {
      toast.error('Network error while retrying analysis')
    }
  }

  // Handle export
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const result = await campaignPostAnalyticsApi.exportCampaignAnalytics(campaignId, format)

      if (result.success && result.data) {
        // Download the file
        window.open(result.data.download_url, '_blank')
        toast.success(`Analytics exported to ${format.toUpperCase()}`)
      } else {
        toast.error(result.error || 'Failed to export analytics')
      }
    } catch (error) {
      toast.error('Network error while exporting')
    }
  }

  // Polling effect for pending analysis
  useEffect(() => {
    if (!isPolling) return

    const pollInterval = setInterval(async () => {
      if (postsData?.summary.pending_analysis && postsData.summary.pending_analysis > 0) {
        await loadCampaignData(currentPage, false)
      } else {
        setIsPolling(false)
      }
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(pollInterval)
  }, [isPolling, postsData?.summary.pending_analysis, currentPage])

  // Load data on component mount and filter changes
  useEffect(() => {
    loadCampaignData(currentPage)
  }, [campaignId, currentPage, filterStatus])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 66)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading campaign analytics...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 66)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button variant="outline" onClick={() => loadCampaignData(currentPage)}>
                Try Again
              </Button>
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
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Campaign Post Analytics</h1>
                <p className="text-muted-foreground">
                  {campaignName ? `Campaign: ${campaignName}` : 'Analyze Instagram posts performance with AI insights'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleExport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Dialog open={isAddPostsOpen} onOpenChange={setIsAddPostsOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Posts
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Add Instagram Posts</DialogTitle>
                      <DialogDescription>
                        Paste Instagram post URLs to analyze. Each post costs 10 credits.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Paste Instagram URLs here (one per line or separated by spaces)&#10;&#10;Example:&#10;https://www.instagram.com/p/ABC123/&#10;https://www.instagram.com/p/DEF456/"
                        value={bulkUrlInput}
                        onChange={(e) => setBulkUrlInput(e.target.value)}
                        rows={8}
                        className="resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {campaignPostAnalyticsApi.parseBulkUrls(bulkUrlInput).length} valid URLs detected
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setBulkUrlInput('')
                              setIsAddPostsOpen(false)
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddPosts}
                            disabled={addingPosts || !bulkUrlInput.trim()}
                          >
                            {addingPosts ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Adding Posts...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Add Posts
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Analytics Summary */}
            {analyticsData && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.overview.total_posts}</div>
                    <p className="text-xs text-muted-foreground">
                      Analyzed posts in campaign
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {campaignPostAnalyticsApi.formatEngagement(analyticsData.overview.total_engagement)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Likes + Comments
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Engagement Rate</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analyticsData.overview.engagement_rate.toFixed(2)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Campaign average
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sentiment Score</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(analyticsData.ai_insights.sentiment_distribution.positive * 100).toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Positive sentiment
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Analysis Progress */}
            {postsData?.summary && postsData.summary.pending_analysis > 0 && (
              <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <RefreshCw className={`h-4 w-4 text-yellow-600 ${isPolling ? 'animate-spin' : ''}`} />
                      <span className="font-medium">Analysis in Progress</span>
                    </div>
                    <Badge variant="outline" className="text-yellow-700">
                      {postsData.summary.pending_analysis} pending
                    </Badge>
                  </div>
                  <Progress
                    value={(postsData.summary.completed_analysis / postsData.summary.total_posts) * 100}
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    {postsData.summary.completed_analysis} of {postsData.summary.total_posts} posts analyzed.
                    Analysis typically takes 10-60 seconds per post.
                  </p>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="posts" className="space-y-6">
              <TabsList>
                <TabsTrigger value="posts">Posts Analytics</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              {/* Posts Analytics Tab */}
              <TabsContent value="posts" className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-[250px] pl-10"
                      />
                    </div>

                    <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadCampaignData(currentPage, false)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Posts List */}
                <div className="space-y-4">
                  {postsData?.posts.map((post) => (
                    <Card key={post.id} className="group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <a
                                  href={post.instagram_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                                >
                                  <Link className="h-4 w-4" />
                                  {post.instagram_post_id}
                                </a>
                                <Badge className={getStatusColor(post.analysis_status)}>
                                  {getStatusIcon(post.analysis_status)}
                                  <span className="ml-1">{post.analysis_status}</span>
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {post.analysis_status === 'failed' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRetryAnalysis(post.id)}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Retry
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemovePost(post.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {post.analysis_status === 'completed' && (
                              <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Likes</span>
                                    <div className="flex items-center gap-1 font-medium">
                                      <Heart className="h-4 w-4 text-red-500" />
                                      {campaignPostAnalyticsApi.formatEngagement(post.scraped_data.likes_count)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Comments</span>
                                    <div className="flex items-center gap-1 font-medium">
                                      <MessageCircle className="h-4 w-4 text-blue-500" />
                                      {campaignPostAnalyticsApi.formatEngagement(post.scraped_data.comments_count)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Sentiment</span>
                                    <div className="flex items-center gap-1">
                                      <Badge
                                        variant="outline"
                                        className={campaignPostAnalyticsApi.getSentimentColor(post.ai_analysis.sentiment)}
                                      >
                                        {post.ai_analysis.sentiment}
                                      </Badge>
                                      <span className="text-xs">
                                        ({(post.ai_analysis.sentiment_score * 100).toFixed(0)}%)
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Category</span>
                                    <div className="font-medium">
                                      {post.ai_analysis.content_category}
                                    </div>
                                  </div>
                                </div>

                                {post.scraped_data.caption && (
                                  <div>
                                    <span className="text-sm text-muted-foreground">Caption</span>
                                    <p className="text-sm mt-1 line-clamp-2">
                                      {post.scraped_data.caption}
                                    </p>
                                  </div>
                                )}
                              </>
                            )}

                            {post.analysis_status === 'pending' && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Analysis in progress... This may take 10-60 seconds.
                              </div>
                            )}

                            {post.analysis_status === 'failed' && (
                              <div className="flex items-center gap-2 text-sm text-red-600">
                                <XCircle className="h-4 w-4" />
                                Analysis failed. Click retry to analyze again.
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {postsData?.posts.length === 0 && (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                          Add Instagram posts to start analyzing their performance with AI insights.
                        </p>
                        <Button onClick={() => setIsAddPostsOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Posts
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Pagination */}
                {postsData?.pagination && postsData.pagination.total_count > 20 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {Math.ceil(postsData.pagination.total_count / 20)}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!postsData.pagination.has_more}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* AI Insights Tab */}
              <TabsContent value="insights" className="space-y-6">
                {analyticsData?.ai_insights && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Sentiment Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Sentiment Analysis</CardTitle>
                        <CardDescription>
                          AI-powered sentiment analysis of post captions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Positive</span>
                            <span>{(analyticsData.ai_insights.sentiment_distribution.positive * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={analyticsData.ai_insights.sentiment_distribution.positive * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Neutral</span>
                            <span>{(analyticsData.ai_insights.sentiment_distribution.neutral * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={analyticsData.ai_insights.sentiment_distribution.neutral * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Negative</span>
                            <span>{(analyticsData.ai_insights.sentiment_distribution.negative * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={analyticsData.ai_insights.sentiment_distribution.negative * 100} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Content Categories */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Content Categories</CardTitle>
                        <CardDescription>
                          AI-identified content themes and topics
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {Object.entries(analyticsData.ai_insights.content_categories)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 5)
                          .map(([category, percentage]) => (
                            <div key={category}>
                              <div className="flex justify-between text-sm mb-2">
                                <span>{category}</span>
                                <span>{(percentage * 100).toFixed(1)}%</span>
                              </div>
                              <Progress value={percentage * 100} className="h-2" />
                            </div>
                          ))}
                      </CardContent>
                    </Card>

                    {/* Language Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Language Distribution</CardTitle>
                        <CardDescription>
                          Languages detected in post captions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {Object.entries(analyticsData.ai_insights.language_distribution)
                          .sort(([,a], [,b]) => b - a)
                          .map(([language, percentage]) => (
                            <div key={language}>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  {language.toUpperCase()}
                                </span>
                                <span>{(percentage * 100).toFixed(1)}%</span>
                              </div>
                              <Progress value={percentage * 100} className="h-2" />
                            </div>
                          ))}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                {analyticsData?.performance_metrics && (
                  <div className="space-y-6">
                    {/* Top Performing Posts */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Performing Posts</CardTitle>
                        <CardDescription>
                          Posts with highest engagement rates
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analyticsData.performance_metrics.top_performing_posts.slice(0, 5).map((post, index) => (
                            <div key={post.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">#{index + 1}</Badge>
                                <a
                                  href={post.instagram_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80 font-medium"
                                >
                                  {post.instagram_post_id}
                                </a>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Heart className="h-4 w-4 text-red-500" />
                                  {campaignPostAnalyticsApi.formatEngagement(post.scraped_data.likes_count)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="h-4 w-4 text-blue-500" />
                                  {campaignPostAnalyticsApi.formatEngagement(post.scraped_data.comments_count)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Best Posting Times */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Best Posting Times</CardTitle>
                        <CardDescription>
                          Optimal posting schedule based on engagement patterns
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          {analyticsData.performance_metrics.best_posting_times.slice(0, 6).map((time, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="font-medium">
                                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][time.day_of_week]} at {time.hour}:00
                                </span>
                              </div>
                              <Badge variant="outline">
                                {campaignPostAnalyticsApi.formatEngagement(time.avg_engagement)} avg
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}