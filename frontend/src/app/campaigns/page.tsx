"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import {
  Plus,
  BarChart3,
  Target,
  TrendingUp,
  Activity,
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
import { EmptyState } from "@/components/ui/empty-state"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
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
import { toast } from "sonner"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

interface Campaign {
  id: string
  name: string
  description: string
  posts: Array<{
    id: string
    url: string
    analytics?: any
  }>
  createdAt: string
  status: 'active' | 'completed' | 'draft'
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    campaign: Campaign | null
  }>({ open: false, campaign: null })

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = () => {
    try {
      const storedCampaigns = localStorage.getItem('campaigns')
      if (storedCampaigns) {
        setCampaigns(JSON.parse(storedCampaigns))
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewCampaign = () => {
    router.push('/campaigns/new')
  }

  // Calculate real statistics from campaigns data
  const totalPosts = campaigns.reduce((total, campaign) => total + campaign.posts.length, 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'completed').length

  // Calculate average engagement rate from all posts with analytics
  const postsWithAnalytics = campaigns.flatMap(campaign =>
    campaign.posts.filter(post => post.analytics?.engagement_rate)
  )
  const avgEngagement = postsWithAnalytics.length > 0
    ? postsWithAnalytics.reduce((sum, post) => sum + (post.analytics?.engagement_rate || 0), 0) / postsWithAnalytics.length
    : 0

  const handleDeleteCampaign = async (campaign: Campaign) => {
    try {
      // Remove campaign from localStorage
      const storedCampaigns = JSON.parse(localStorage.getItem('campaigns') || '[]')
      const updatedCampaigns = storedCampaigns.filter((c: Campaign) => c.id !== campaign.id)
      localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns))

      // Update local state
      setCampaigns(updatedCampaigns)

      // Close dialog
      setDeleteDialog({ open: false, campaign: null })

      toast.success(`Campaign "${campaign.name}" deleted successfully`)
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Failed to delete campaign')
    }
  }

  const openDeleteDialog = (campaign: Campaign) => {
    setDeleteDialog({ open: true, campaign })
  }

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
                <div>
                  <h1 className="text-3xl font-bold">Campaigns</h1>
                  <p className="text-muted-foreground">Create campaigns and analyze post performance with aggregate reporting</p>
                </div>
                <Button onClick={handleNewCampaign}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                    <Target className="h-4 w-4 text-[hsl(var(--primary))]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{loading ? '...' : campaigns.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                    <Activity className="h-4 w-4 text-[hsl(var(--primary))]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? '...' : activeCampaigns}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Posts Analyzed</CardTitle>
                    <BarChart3 className="h-4 w-4 text-[hsl(var(--primary))]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? '...' : totalPosts}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                    <TrendingUp className="h-4 w-4 text-[hsl(var(--primary))]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? '...' : `${avgEngagement.toFixed(1)}%`}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campaigns Display */}
              {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <div className="space-y-2">
                          <div className="h-6 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="h-10 bg-gray-200 rounded animate-pulse" />
                          <div className="h-10 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="h-9 bg-gray-200 rounded animate-pulse" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : campaigns.length === 0 ? (
                <div className="flex justify-center py-12">
                  <EmptyState
                    title="No campaigns yet"
                    description="Create your first campaign to start tracking your post performance with aggregate analytics and reporting."
                    icons={[Target, BarChart3]}
                    action={{
                      label: "Create Your First Campaign",
                      onClick: handleNewCampaign
                    }}
                  />
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id} className="group">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg font-semibold">{campaign.name}</CardTitle>
                            <CardDescription>{campaign.description}</CardDescription>
                            <div className="text-xs text-muted-foreground">
                              Created: {new Date(campaign.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(campaign)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Campaign
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-semibold">{campaign.posts.length}</div>
                            <div className="text-xs text-muted-foreground">Posts</div>
                          </div>
                          <div>
                            <div className="font-semibold capitalize">{campaign.status}</div>
                            <div className="text-xs text-muted-foreground">Status</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/campaigns/${campaign.id}/analytics`)}
                          >
                            <BarChart3 className="h-4 w-4 mr-1" />
                            View Analytics
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SidebarInset>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, campaign: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Campaign</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deleteDialog.campaign?.name}"? This action cannot be undone and will permanently remove all campaign data and analytics.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, campaign: null })}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteDialog.campaign && handleDeleteCampaign(deleteDialog.campaign)}
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
