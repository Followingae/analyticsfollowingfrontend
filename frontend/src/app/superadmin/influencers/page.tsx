"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperadminSidebar } from "@/components/superadmin/SuperadminSidebar"
import { superadminApiService, Influencer } from "@/services/superadminApi"
import { SiteHeader } from "@/components/site-header"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  RefreshCw,
  Search,
  Users,
  TrendingUp,
  Eye,
  CheckCircle,
  XCircle,
  Database,
  BarChart3,
  Star,
  Globe
} from "lucide-react"

export const dynamic = 'force-dynamic'

export default function SuperadminInfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [statistics, setStatistics] = useState<any>(null)
  const [topPerformers, setTopPerformers] = useState<Influencer[]>([])
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    followers_min: '',
    followers_max: '',
    sort_by: 'followers_count',
    sort_order: 'desc' as 'asc' | 'desc',
    limit: 25,
    offset: 0
  })

  const loadInfluencers = async () => {
    try {
      setLoading(true)

      const filterParams: any = {
        limit: filters.limit,
        offset: filters.offset,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      }

      if (filters.search.trim()) {
        filterParams.search = filters.search.trim()
      }
      if (filters.followers_min) {
        filterParams.followers_min = parseInt(filters.followers_min)
      }
      if (filters.followers_max) {
        filterParams.followers_max = parseInt(filters.followers_max)
      }

      const result = await superadminApiService.getInfluencers(filterParams)

      if (result.success && result.data) {
        setInfluencers(result.data.influencers || [])
        setTotalCount(result.data.total_count || 0)
        setStatistics(result.data.statistics)
        setTopPerformers(result.data.top_performers || [])
      } else {
        console.warn('Influencers API returned error:', result.error)
        // Don't show toast error immediately, let the UI handle graceful fallback
      }
    } catch (error) {
      toast.error('Network error while loading influencers')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadInfluencerDetails = async (influencerId: string) => {
    try {
      const result = await superadminApiService.getInfluencerDetails(influencerId)
      if (result.success && result.data) {
        setSelectedInfluencer({ ...selectedInfluencer!, ...result.data })
      }
    } catch (error) {
      console.error('Failed to load influencer details:', error)
    }
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      followers_min: '',
      followers_max: '',
      sort_by: 'followers_count',
      sort_order: 'desc',
      limit: 25,
      offset: 0
    })
  }

  useEffect(() => {
    loadInfluencers()
  }, [filters])

  const formatNumber = (num: any) => {
    if (num === undefined || num === null || num === '' || typeof num !== 'number' || isNaN(num)) {
      return '0'
    }
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getEngagementColor = (rate: number) => {
    if (rate >= 5) return 'text-green-600'
    if (rate >= 2) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <AuthGuard requireAuth={true} requireSuperAdmin={true}>
      <SidebarProvider>
        <SuperadminSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Influencer Database</h1>
                  <p className="text-muted-foreground">Master database of influencers with comprehensive analytics</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Clear Filters
                  </Button>
                  <Button variant="outline" onClick={loadInfluencers}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Statistics Overview */}
              {statistics && (
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
                      <Database className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatNumber(statistics.total_profiles)}</div>
                      <p className="text-xs text-muted-foreground">In database</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Verified Profiles</CardTitle>
                      <CheckCircle className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatNumber(statistics.verified_profiles)}</div>
                      <p className="text-xs text-muted-foreground">
                        {((statistics.verified_profiles / statistics.total_profiles) * 100).toFixed(1)}% verified
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                      <TrendingUp className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statistics.average_engagement_rate?.toFixed(2)}%</div>
                      <p className="text-xs text-muted-foreground">Platform average</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Recently Active</CardTitle>
                      <Users className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatNumber(statistics.active_last_30_days)}</div>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Top Performers */}
              {topPerformers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Top Performers
                    </CardTitle>
                    <CardDescription>Highest performing influencers by engagement and reach</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {topPerformers.slice(0, 6).map((performer, index) => (
                        <div key={performer.id} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              #{index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">@{performer.username}</p>
                              <p className="text-xs text-muted-foreground truncate">{performer.full_name}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Followers:</span>
                              <div className="font-medium">{formatNumber(performer.followers_count)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Engagement:</span>
                              <div className={`font-medium ${getEngagementColor(performer.analytics?.engagement_rate || 0)}`}>
                                {performer.analytics?.engagement_rate?.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Search and Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Search & Filters</CardTitle>
                  <CardDescription>Find influencers based on specific criteria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search username or name..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, offset: 0 }))}
                        className="pl-10"
                      />
                    </div>

                    <Input
                      type="number"
                      placeholder="Min followers"
                      value={filters.followers_min}
                      onChange={(e) => setFilters(prev => ({ ...prev, followers_min: e.target.value, offset: 0 }))}
                    />

                    <Input
                      type="number"
                      placeholder="Max followers"
                      value={filters.followers_max}
                      onChange={(e) => setFilters(prev => ({ ...prev, followers_max: e.target.value, offset: 0 }))}
                    />

                    <Select value={filters.sort_by} onValueChange={(value) =>
                      setFilters(prev => ({ ...prev, sort_by: value, offset: 0 }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="followers_count">Followers</SelectItem>
                        <SelectItem value="posts_count">Posts</SelectItem>
                        <SelectItem value="updated_at">Recently Updated</SelectItem>
                        <SelectItem value="created_at">Recently Added</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Influencers Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Influencers ({formatNumber(totalCount)})</CardTitle>
                      <CardDescription>Complete influencer database with analytics</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={filters.sort_order} onValueChange={(value: any) =>
                        setFilters(prev => ({ ...prev, sort_order: value, offset: 0 }))
                      }>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">High to Low</SelectItem>
                          <SelectItem value="asc">Low to High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profile</TableHead>
                        <TableHead>Followers</TableHead>
                        <TableHead>Posts</TableHead>
                        <TableHead>Engagement</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-8 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-8 bg-muted animate-pulse rounded" /></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        influencers.map((influencer) => (
                          <TableRow key={influencer.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {influencer.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">@{influencer.username}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{influencer.full_name}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatNumber(influencer.followers_count)}
                            </TableCell>
                            <TableCell>
                              {formatNumber(influencer.posts_count)}
                            </TableCell>
                            <TableCell>
                              <span className={`font-medium ${getEngagementColor(influencer.analytics?.engagement_rate || 0)}`}>
                                {influencer.analytics?.engagement_rate?.toFixed(2) || '0'}%
                              </span>
                            </TableCell>
                            <TableCell>
                              {influencer.is_verified ? (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-400" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">
                                  {formatNumber(influencer.analytics?.total_views || 0)} views
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedInfluencer(influencer)
                                  setIsDetailsOpen(true)
                                  loadInfluencerDetails(influencer.id)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {!loading && influencers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No influencers found matching your criteria
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pagination */}
              {totalCount > filters.limit && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, totalCount)} of {totalCount} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.offset === 0}
                      onClick={() => setFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.offset + filters.limit >= totalCount}
                      onClick={() => setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Influencer Details Dialog */}
              <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedInfluencer?.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          @{selectedInfluencer?.username}
                          {selectedInfluencer?.is_verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                        </div>
                        <p className="text-sm font-normal text-muted-foreground">{selectedInfluencer?.full_name}</p>
                      </div>
                    </DialogTitle>
                  </DialogHeader>

                  {selectedInfluencer && (
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{formatNumber(selectedInfluencer.followers_count)}</div>
                          <p className="text-xs text-muted-foreground">Followers</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{formatNumber(selectedInfluencer.following_count)}</div>
                          <p className="text-xs text-muted-foreground">Following</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{formatNumber(selectedInfluencer.posts_count)}</div>
                          <p className="text-xs text-muted-foreground">Posts</p>
                        </div>
                      </div>

                      {/* Bio */}
                      {selectedInfluencer.biography && (
                        <div>
                          <h4 className="font-medium mb-2">Biography</h4>
                          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            {selectedInfluencer.biography}
                          </p>
                        </div>
                      )}

                      {/* Analytics */}
                      {selectedInfluencer.analytics && (
                        <div>
                          <h4 className="font-medium mb-3">Performance Analytics</h4>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Engagement Rate:</span>
                                <span className={`text-sm font-medium ${getEngagementColor(selectedInfluencer.analytics.engagement_rate)}`}>
                                  {selectedInfluencer.analytics.engagement_rate.toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Total Views:</span>
                                <span className="text-sm font-medium">{formatNumber(selectedInfluencer.analytics.total_views)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Unique Viewers:</span>
                                <span className="text-sm font-medium">{formatNumber(selectedInfluencer.analytics.unique_viewers)}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Unlock Count:</span>
                                <span className="text-sm font-medium">{formatNumber(selectedInfluencer.analytics.unlock_count)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Recent Posts:</span>
                                <span className="text-sm font-medium">{selectedInfluencer.analytics.recent_posts_30d} (30d)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Quality Score:</span>
                                <span className="text-sm font-medium">{selectedInfluencer.analytics.ai_analysis?.content_quality_score?.toFixed(1) || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI Analysis */}
                      {selectedInfluencer.analytics?.ai_analysis && (
                        <div>
                          <h4 className="font-medium mb-3">AI Content Analysis</h4>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-sm mb-2">Content Type: <span className="font-medium">{selectedInfluencer.analytics.ai_analysis.primary_content_type}</span></p>
                              <p className="text-sm mb-2">Sentiment Score: <span className="font-medium">{selectedInfluencer.analytics.ai_analysis.avg_sentiment_score?.toFixed(2)}</span></p>
                            </div>
                            <div>
                              <p className="text-sm mb-2">Languages:</p>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(selectedInfluencer.analytics.ai_analysis.language_distribution || {}).map(([lang, count]) => (
                                  <Badge key={lang} variant="secondary" className="text-xs">
                                    {lang}: {(count as number * 100).toFixed(0)}%
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Platform Metrics */}
                      {selectedInfluencer.platform_metrics && (
                        <div>
                          <h4 className="font-medium mb-3">Platform Performance</h4>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <p className="text-sm text-muted-foreground">Revenue Generated</p>
                              <p className="text-lg font-medium">${formatNumber(selectedInfluencer.platform_metrics.revenue_generated / 100)}</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <p className="text-sm text-muted-foreground">Popularity Score</p>
                              <p className="text-lg font-medium">{selectedInfluencer.platform_metrics.popularity_score?.toFixed(1)}/10</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="pt-4 border-t border-muted text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Added: {formatDate(selectedInfluencer.created_at)}</span>
                          <span>Updated: {formatDate(selectedInfluencer.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}