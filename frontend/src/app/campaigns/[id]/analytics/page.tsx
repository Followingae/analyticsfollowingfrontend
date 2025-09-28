"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Share,
  Eye,
  Play,
  Calendar,
  ExternalLink,
  Loader2,
  MapPin,
  Music,
  Hash,
  AtSign,
  Clock,
  Video,
  Image,
  Zap,
  CheckCircle,
  Star,
  Copy,
  Download,
  Plus,
  X,
  Trash2,
  MoreVertical,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { postAnalyticsApi, PostAnalysisData } from "@/services/postAnalyticsApi"
import { ActualPostAnalytics } from "@/components/campaigns/ActualPostAnalytics"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

interface Campaign {
  id: string
  name: string
  description: string
  posts: Array<{
    url: string
    analytics?: PostAnalysisData
  }>
  createdAt: string
  status: 'active' | 'completed' | 'draft' | 'analyzing'
}

export default function CampaignAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzingPosts, setAnalyzingPosts] = useState(false)
  const [showAddPostsDialog, setShowAddPostsDialog] = useState(false)
  const [newPosts, setNewPosts] = useState<string[]>([''])
  const [isAddingPosts, setIsAddingPosts] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    loadCampaign()
  }, [campaignId])

  const loadCampaign = () => {
    try {
      const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]')
      const foundCampaign = campaigns.find((c: Campaign) => c.id === campaignId)

      if (foundCampaign) {
        setCampaign(foundCampaign)
      } else {
        toast.error("Campaign not found")
        router.push("/campaigns")
      }
    } catch (error) {
      toast.error("Failed to load campaign")
      router.push("/campaigns")
    } finally {
      setLoading(false)
    }
  }

  const addNewPostField = () => {
    setNewPosts([...newPosts, ''])
  }

  const removePostField = (index: number) => {
    if (newPosts.length > 1) {
      setNewPosts(newPosts.filter((_, i) => i !== index))
    }
  }

  const updatePostUrl = (index: number, url: string) => {
    const updatedPosts = [...newPosts]
    updatedPosts[index] = url
    setNewPosts(updatedPosts)
  }

  const handleAddPosts = async () => {
    if (!campaign) return

    setIsAddingPosts(true)

    try {
      // Filter out empty URLs
      const validUrls = newPosts.filter(url => url.trim() !== '')

      if (validUrls.length === 0) {
        toast.error("Please add at least one post URL")
        return
      }

      // Validate all URLs
      const urlValidationErrors: string[] = []
      validUrls.forEach((url, index) => {
        const validation = postAnalyticsApi.validateInstagramUrl(url)
        if (!validation.valid) {
          urlValidationErrors.push(`Post ${index + 1}: ${validation.error}`)
        }
      })

      if (urlValidationErrors.length > 0) {
        toast.error(`Invalid URLs:\n${urlValidationErrors.join('\n')}`)
        return
      }

      // Check for duplicate URLs in existing campaign
      const existingUrls = campaign.posts.map(p => p.url.toLowerCase())
      const duplicateUrls = validUrls.filter(url => existingUrls.includes(url.toLowerCase()))

      if (duplicateUrls.length > 0) {
        toast.error(`Duplicate URLs found:\n${duplicateUrls.join('\n')}`)
        return
      }

      setAnalyzingPosts(true)
      toast.success("Starting analysis of new posts...")

      // Use single or batch analysis based on number of posts
      let analysisResults: any

      if (validUrls.length === 1) {
        // Single post analysis for better efficiency
        console.log('Using single post analysis for 1 new URL')
        const singleResult = await postAnalyticsApi.monitorAnalysis(validUrls[0], campaignId)
        analysisResults = {
          analyses: [singleResult],
          failed_urls: [],
          total_processed: 1,
          total_successful: 1,
          total_failed: 0
        }
      } else {
        // Batch analysis for multiple posts
        console.log(`Using batch analysis for ${validUrls.length} new URLs`)
        analysisResults = await postAnalyticsApi.monitorBatchAnalysis(validUrls, campaignId)
      }

      console.log('Add posts analysis result:', analysisResults)

      // Create new posts with analytics
      const newPostsWithAnalytics = validUrls.map(url => {
        const analysis = analysisResults.analyses.find((a: any) => a.post_url === url) || null
        return {
          url,
          analytics: analysis
        }
      })

      // Update campaign with new posts
      const updatedCampaign = {
        ...campaign,
        posts: [...campaign.posts, ...newPostsWithAnalytics]
      }

      // Update localStorage
      const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]')
      const updatedCampaigns = campaigns.map((c: any) =>
        c.id === campaignId ? updatedCampaign : c
      )
      localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns))

      // Update local state
      setCampaign(updatedCampaign)

      if (analysisResults.total_failed && analysisResults.total_failed > 0) {
        toast.warning(`Added ${validUrls.length} posts with ${analysisResults.total_failed} analysis failures`)
      } else {
        toast.success(`Successfully added ${validUrls.length} new posts! 🎉`)
      }

      // Reset dialog state
      setNewPosts([''])
      setShowAddPostsDialog(false)
    } catch (error) {
      console.error('Add posts error:', error)
      toast.error("Failed to add new posts")
    } finally {
      setIsAddingPosts(false)
      setAnalyzingPosts(false)
    }
  }

  const handleDeleteCampaign = async () => {
    if (!campaign) return

    try {
      // Remove campaign from localStorage
      const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]')
      const updatedCampaigns = campaigns.filter((c: any) => c.id !== campaignId)
      localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns))

      toast.success(`Campaign "${campaign.name}" deleted successfully`)

      // Redirect to campaigns list
      router.push('/campaigns')
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Failed to delete campaign')
    }
  }

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
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
                <div className="flex items-center gap-4 mb-8">
                  <Skeleton className="h-10 w-10" />
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-4 w-24" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-16" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    )
  }

  if (!campaign) {
    return null
  }

  // Calculate comprehensive aggregate stats with fallbacks
  const postsWithAnalytics = campaign.posts.filter(p => p.analytics)
  const totalLikes = postsWithAnalytics.reduce((sum, p) => {
    const likes = p.analytics?.likes_count || p.analytics?.raw_apify_data?.likesCount || 0
    return sum + (typeof likes === 'number' ? likes : 0)
  }, 0)

  const totalComments = postsWithAnalytics.reduce((sum, p) => {
    const comments = p.analytics?.comments_count || p.analytics?.raw_apify_data?.commentsCount || 0
    return sum + (typeof comments === 'number' ? comments : 0)
  }, 0)

  const totalViews = postsWithAnalytics.reduce((sum, p) => {
    const views = p.analytics?.video_views_count || p.analytics?.raw_apify_data?.videoViewCount || 0
    return sum + (typeof views === 'number' ? views : 0)
  }, 0)

  const totalPlays = postsWithAnalytics.reduce((sum, p) => {
    const plays = p.analytics?.video_plays_count || p.analytics?.raw_apify_data?.videoPlayCount || 0
    return sum + (typeof plays === 'number' ? plays : 0)
  }, 0)

  const avgEngagement = postsWithAnalytics.length > 0
    ? postsWithAnalytics.reduce((sum, p) => {
        const rate = p.analytics?.engagement_rate
        return sum + (typeof rate === 'number' ? rate : 0)
      }, 0) / postsWithAnalytics.length
    : 0

  // Media type distribution
  const mediaTypes = postsWithAnalytics.reduce((acc, p) => {
    const type = p.analytics?.post_type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Content categories
  const categories = postsWithAnalytics.reduce((acc, p) => {
    const category = p.analytics?.content_category || 'Uncategorized'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Sentiment distribution
  const sentiments = postsWithAnalytics.reduce((acc, p) => {
    const sentiment = p.analytics?.sentiment || 'neutral'
    acc[sentiment] = (acc[sentiment] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <AuthGuard requireAuth={true}>
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
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push('/campaigns')}
                    className="h-10 w-10"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold">{campaign.name}</h1>
                    <p className="text-muted-foreground">{campaign.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {campaign.status}
                  </Badge>
                  {analyzingPosts && (
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing posts...
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddPostsDialog(true)}
                    disabled={analyzingPosts}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Posts
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Campaign
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Comprehensive Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                    <BarChart3 className="h-4 w-4 text-[hsl(var(--primary))]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{campaign.posts.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {postsWithAnalytics.length} analyzed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
                    <Heart className="h-4 w-4 text-[hsl(var(--primary))]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{postAnalyticsApi.formatEngagement(totalLikes + totalComments)}</div>
                    <p className="text-xs text-muted-foreground">
                      {postAnalyticsApi.formatEngagement(totalLikes)} likes + {postAnalyticsApi.formatEngagement(totalComments)} comments
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-[hsl(var(--primary))]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{postAnalyticsApi.formatEngagement(totalViews)}</div>
                    {totalPlays > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {postAnalyticsApi.formatEngagement(totalPlays)} plays
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Engagement Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-[hsl(var(--primary))]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{avgEngagement.toFixed(2)}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Analytics Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Media Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(mediaTypes).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm flex items-center">
                            {postAnalyticsApi.getMediaTypeIcon(type)} {type}
                          </span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Content Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(categories).slice(0, 5).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm">{category}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sentiment Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(sentiments).map(([sentiment, count]) => (
                        <div key={sentiment} className="flex items-center justify-between">
                          <Badge className={postAnalyticsApi.getSentimentColor(sentiment)}>
                            {sentiment}
                          </Badge>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Comprehensive Post Analytics */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Post Performance Analysis</h2>
                  <Badge variant="outline">
                    {postsWithAnalytics.length} of {campaign.posts.length} analyzed
                  </Badge>
                </div>
                <div className="grid gap-6">
                  {campaign.posts.map((post, index) => (
                    <ActualPostAnalytics
                      key={index}
                      post={post}
                      index={index}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>
        </SidebarInset>

        {/* Add Posts Dialog */}
        <Dialog open={showAddPostsDialog} onOpenChange={setShowAddPostsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Posts to Campaign
              </DialogTitle>
              <DialogDescription>
                Add new Instagram post URLs to analyze in this campaign
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {newPosts.map((url, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`post-${index}`}>Post URL {index + 1}</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`post-${index}`}
                      placeholder="https://www.instagram.com/p/..."
                      value={url}
                      onChange={(e) => updatePostUrl(index, e.target.value)}
                      className="flex-1"
                    />
                    {newPosts.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removePostField(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addNewPostField}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Post
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddPostsDialog(false)
                  setNewPosts([''])
                }}
                disabled={isAddingPosts}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPosts}
                disabled={isAddingPosts || newPosts.every(url => url.trim() === '')}
              >
                {isAddingPosts ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Posts...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Posts
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Campaign Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Campaign</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{campaign?.name}"? This action cannot be undone and will permanently remove all campaign data and analytics.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCampaign}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </AuthGuard>
  )
}