'use client'

import { useState, useEffect } from "react"
import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Verified,
  Eye,
  Globe,
  Lock,
  Users
} from "lucide-react"

import { 
  superadminApiService, 
  Influencer
} from "@/services/superadminApi"

export default function InfluencersPage() {
  // State Management
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [influencerSearch, setInfluencerSearch] = useState("")
  
  // Dialogs
  const [isInfluencerDetailsOpen, setIsInfluencerDetailsOpen] = useState(false)
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)

  // Load influencer data
  const loadInfluencers = async () => {
    setLoading(true)
    try {
      const filters: any = { limit: 50, sort_by: 'followers_count', sort_order: 'desc' }
      if (influencerSearch.trim()) filters.search = influencerSearch.trim()
      
      const result = await superadminApiService.getInfluencers(filters)
      if (result.success && result.data) {
        setInfluencers(result.data.influencers || [])
      } else {
        console.warn('Influencers API not available - superadmin endpoints not implemented')
        setInfluencers([])
      }
    } catch (error) {
      console.warn('Influencers API not available - superadmin endpoints not implemented')
      setInfluencers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInfluencers()
  }, [])

  useEffect(() => {
    loadInfluencers()
  }, [influencerSearch])

  // Utility functions
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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
              <p className="text-muted-foreground">Loading influencers...</p>
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
                <h1 className="text-3xl font-bold tracking-tight">Influencer Database</h1>
                <p className="text-muted-foreground">Master database of all platform creators with detailed analytics</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => loadInfluencers()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search influencers..."
                  value={influencerSearch}
                  onChange={(e) => setInfluencerSearch(e.target.value)}
                  className="w-[300px] pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
              </div>
            </div>

            {/* Platform Statistics */}
            {influencers.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(influencers.length)}</div>
                    <p className="text-xs text-muted-foreground">In database</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Verified Creators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(influencers.filter(i => i.is_verified).length)}
                    </div>
                    <p className="text-xs text-muted-foreground">Verified accounts</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(influencers.reduce((sum, i) => sum + i.followers_count, 0))}
                    </div>
                    <p className="text-xs text-muted-foreground">Combined reach</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(influencers.reduce((sum, i) => sum + i.platform_metrics.revenue_generated, 0))}
                    </div>
                    <p className="text-xs text-muted-foreground">Platform earnings</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Influencers Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {influencers.map((influencer) => (
                <Card key={influencer.id} className="hover:shadow-md transition-shadow cursor-pointer" 
                      onClick={() => {
                        setSelectedInfluencer(influencer)
                        setIsInfluencerDetailsOpen(true)
                      }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={influencer.profile_image_url} />
                        <AvatarFallback>{influencer.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-semibold text-sm truncate">{influencer.full_name}</h3>
                          {influencer.is_verified && <Verified className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground">@{influencer.username}</p>
                      </div>
                      <Badge className={influencer.is_private ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {influencer.is_private ? <Lock className="h-3 w-3 mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
                        {influencer.is_private ? 'Private' : 'Public'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Followers</span>
                        <span className="font-medium">{formatNumber(influencer.followers_count)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Posts</span>
                        <span className="font-medium">{formatNumber(influencer.posts_count)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Engagement</span>
                        <Badge variant="secondary">{influencer.analytics.engagement_rate.toFixed(1)}%</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Category</span>
                        <Badge variant="outline" className="text-xs">
                          {influencer.analytics.ai_analysis.primary_content_type}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Platform Revenue</span>
                        <span className="font-medium text-green-600">{formatCurrency(influencer.platform_metrics.revenue_generated)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Profile Views</span>
                        <span className="font-medium">{formatNumber(influencer.analytics.total_views)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {influencers.length === 0 && !loading && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No influencers found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Influencer data will appear here once available from the backend. Try adjusting your search criteria or check back later.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Influencer Details Dialog */}
            <Dialog open={isInfluencerDetailsOpen} onOpenChange={setIsInfluencerDetailsOpen}>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>Influencer Details</DialogTitle>
                  <DialogDescription>
                    {selectedInfluencer && `@${selectedInfluencer.username} - Comprehensive analytics and insights`}
                  </DialogDescription>
                </DialogHeader>
                {selectedInfluencer && (
                  <div className="space-y-6 py-4">
                    {/* Profile Header */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedInfluencer.profile_image_url} />
                        <AvatarFallback className="text-lg">{selectedInfluencer.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold">{selectedInfluencer.full_name}</h3>
                          {selectedInfluencer.is_verified && <Verified className="h-5 w-5 text-blue-500" />}
                        </div>
                        <p className="text-muted-foreground">@{selectedInfluencer.username}</p>
                        <p className="text-sm mt-1 line-clamp-2">{selectedInfluencer.biography}</p>
                      </div>
                      <Badge className={selectedInfluencer.is_private ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {selectedInfluencer.is_private ? 'Private' : 'Public'}
                      </Badge>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{formatNumber(selectedInfluencer.followers_count)}</div>
                        <div className="text-sm text-muted-foreground">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{formatNumber(selectedInfluencer.posts_count)}</div>
                        <div className="text-sm text-muted-foreground">Posts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedInfluencer.analytics.engagement_rate.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Engagement</div>
                      </div>
                    </div>

                    {/* Detailed Analytics */}
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="analytics">
                        <AccordionTrigger>Analytics & Insights</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Platform Metrics</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Total Views</span>
                                  <span>{formatNumber(selectedInfluencer.analytics.total_views)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Unique Viewers</span>
                                  <span>{formatNumber(selectedInfluencer.analytics.unique_viewers)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Profile Unlocks</span>
                                  <span>{formatNumber(selectedInfluencer.analytics.unlock_count)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Recent Posts (30d)</span>
                                  <span>{selectedInfluencer.analytics.recent_posts_30d}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Revenue Generated</span>
                                  <span className="font-medium text-green-600">{formatCurrency(selectedInfluencer.platform_metrics.revenue_generated)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Popularity Score</span>
                                  <span>{selectedInfluencer.platform_metrics.popularity_score.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">AI Analysis</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Primary Content</span>
                                  <Badge variant="outline">{selectedInfluencer.analytics.ai_analysis.primary_content_type}</Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Sentiment Score</span>
                                  <span>{(selectedInfluencer.analytics.ai_analysis.avg_sentiment_score * 100).toFixed(0)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Content Quality</span>
                                  <span>{(selectedInfluencer.analytics.ai_analysis.content_quality_score * 100).toFixed(0)}%</span>
                                </div>
                                <div>
                                  <span className="font-medium">Content Distribution:</span>
                                  <div className="mt-1 space-y-1">
                                    {Object.entries(selectedInfluencer.analytics.ai_analysis.content_distribution).map(([category, percentage]) => (
                                      <div key={category} className="flex justify-between">
                                        <span className="text-xs">{category}</span>
                                        <span className="text-xs">{(percentage * 100).toFixed(0)}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium">Languages:</span>
                                  <div className="mt-1 space-y-1">
                                    {Object.entries(selectedInfluencer.analytics.ai_analysis.language_distribution).map(([lang, percentage]) => (
                                      <div key={lang} className="flex justify-between">
                                        <span className="text-xs uppercase">{lang}</span>
                                        <span className="text-xs">{(percentage * 100).toFixed(0)}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsInfluencerDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}