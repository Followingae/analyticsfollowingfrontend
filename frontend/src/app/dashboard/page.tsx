"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { instagramApiService } from "@/services/instagramApi"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SiteHeader } from "@/components/site-header"
import { MetricCard, EngagementCard, QuickStatsGrid } from "@/components/analytics-cards"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Target, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Eye, 
  Heart,
  BarChart3,
  Calendar,
  Star,
  Play,
  Plus,
  ArrowRight,
  Activity
} from "lucide-react"

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

function formatCurrency(amount: number) {
  const formattedAmount = new Intl.NumberFormat('ar-AE', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return (
    <>
      <span className="aed-currency">AED</span> {formattedAmount}
    </>
  );
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load dashboard data from backend
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        // Using a sample profile for demonstration - in real app this would be from user context
        const result = await instagramApiService.getBasicProfile('cristiano')
        
        if (result.success && result.data) {
          setDashboardData(result.data)
        } else {
          setError(result.error || 'Failed to load dashboard data')
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Brand analytics data - now using real backend data
  const brandMetrics = dashboardData ? [
    {
      title: "Influence Score",
      value: dashboardData.influence_score?.toFixed(1) || "0",
      change: 12.5,
      icon: <Target className="h-4 w-4 text-blue-500" />
    },
    {
      title: "Total Followers",
      value: dashboardData.quick_stats?.followers_formatted || formatNumber(dashboardData.followers),
      change: 8.3,
      icon: <Users className="h-4 w-4 text-green-500" />
    },
    {
      title: "Engagement Rate",
      value: `${dashboardData.engagement_rate?.toFixed(1)}%` || "0%",
      change: dashboardData.engagement_rate > 3 ? 15.2 : -5.2,
      icon: <Eye className="h-4 w-4 text-purple-500" />
    },
    {
      title: "Profile Status",
      value: dashboardData.is_verified ? "Verified" : "Standard",
      change: dashboardData.is_verified ? 25.0 : 0,
      icon: <TrendingUp className="h-4 w-4 text-orange-500" />
    }
  ] : [
    {
      title: "Active Campaigns",
      value: "--",
      change: 0,
      icon: <Target className="h-4 w-4 text-blue-500" />
    },
    {
      title: "Total Creators",
      value: "--",
      change: 0,
      icon: <Users className="h-4 w-4 text-green-500" />
    },
    {
      title: "Monthly Reach",
      value: "--",
      change: 0,
      icon: <Eye className="h-4 w-4 text-purple-500" />
    },
    {
      title: "Campaign ROI",
      value: "--",
      change: 0,
      icon: <TrendingUp className="h-4 w-4 text-orange-500" />
    }
  ]

  // Sample campaigns data - replace with real backend data when campaigns API is ready
  const recentCampaigns = dashboardData ? [
    {
      id: 1,
      name: `Campaign for ${dashboardData.full_name}`,
      status: "active",
      budget: 75000,
      spent: 45000,
      reach: dashboardData.followers * 0.15, // 15% reach rate
      engagement: dashboardData.engagement_rate,
      creators: 1,
      endDate: "2024-08-31"
    }
  ] : []

  // Top creators data - now using real backend data
  const topCreators = dashboardData ? [
    {
      id: 1,
      name: dashboardData.full_name,
      username: dashboardData.username,
      avatar: dashboardData.profile_pic_url,
      followers: dashboardData.followers,
      engagement: dashboardData.engagement_rate,
      category: "Lifestyle",
      performance: dashboardData.influence_score * 10, // Convert to percentage
      campaigns: 1
    }
  ] : []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          <Play className="h-3 w-3 mr-1" />
          Active
        </Badge>
      case "completed":
        return <Badge variant="secondary">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  {loading ? "Loading Dashboard..." : 
                   error ? "Dashboard Error" :
                   dashboardData ? `Analytics for ${dashboardData.full_name}` :
                   "Brand Analytics Dashboard"}
                </h1>
                <p className="text-muted-foreground">
                  {loading ? "Fetching latest data from backend..." :
                   error ? error :
                   dashboardData ? `Real-time insights for @${dashboardData.username}` :
                   "Monitor your influencer marketing performance and campaign insights"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </div>

            {/* Brand Metrics Overview */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1,2,3,4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="border-red-200">
                <CardContent className="p-6 text-center">
                  <div className="text-red-500 mb-2">Failed to load dashboard data</div>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {brandMetrics.map((metric, index) => (
                  <MetricCard
                    key={index}
                    title={metric.title}
                    value={metric.value}
                    change={metric.change}
                    icon={metric.icon}
                  />
                ))}
              </div>
            )}

            {/* Performance Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <ChartAreaInteractive />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Engagement Overview
                  </CardTitle>
                  <CardDescription>
                    Your overall campaign engagement metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Likes</span>
                      </div>
                      <span className="text-sm font-medium">45.2%</span>
                    </div>
                    <Progress value={45.2} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Comments</span>
                      </div>
                      <span className="text-sm font-medium">23.1%</span>
                    </div>
                    <Progress value={23.1} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Shares</span>
                      </div>
                      <span className="text-sm font-medium">18.7%</span>
                    </div>
                    <Progress value={18.7} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Saves</span>
                      </div>
                      <span className="text-sm font-medium">13.0%</span>
                    </div>
                    <Progress value={13.0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Campaigns & Top Creators */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Recent Campaigns */}
              <Card>
                <CardHeader className="flex flex-row items-center">
                  <div className="grid gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Recent Campaigns
                    </CardTitle>
                    <CardDescription>
                      {loading ? "Loading campaigns..." : "Your latest campaign performance"}
                    </CardDescription>
                  </div>
                  <Button size="sm" className="ml-auto gap-1">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1,2,3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentCampaigns.length > 0 ? (
                    <div className="space-y-4">
                      {recentCampaigns.map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between space-x-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium leading-none">{campaign.name}</p>
                              {getStatusBadge(campaign.status)}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}</span>
                              <span>{formatNumber(campaign.reach)} reach</span>
                              <span>{campaign.engagement.toFixed(1)}% engagement</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">+{((campaign.reach / 1000000) * 100).toFixed(1)}%</div>
                            <div className="text-xs text-muted-foreground">ROI</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No campaigns available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Performing Creators */}
              <Card>
                <CardHeader className="flex flex-row items-center">
                  <div className="grid gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Top Performing Creators
                    </CardTitle>
                    <CardDescription>
                      {loading ? "Loading creators..." : "Your highest ROI influencers"}
                    </CardDescription>
                  </div>
                  <Button size="sm" className="ml-auto gap-1">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1,2,3].map((i) => (
                        <div key={i} className="flex items-center space-x-4 animate-pulse">
                          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : topCreators.length > 0 ? (
                    <div className="space-y-4">
                      {topCreators.map((creator) => (
                        <div key={creator.id} className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={creator.avatar} alt={creator.name} />
                            <AvatarFallback>
                              {creator.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium leading-none">{creator.name}</p>
                              <Badge variant="outline" className="text-xs">{creator.category}</Badge>
                              {dashboardData?.is_verified && (
                                <Badge variant="secondary" className="text-xs">✓</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatNumber(creator.followers)} followers</span>
                              <span>{creator.engagement.toFixed(1)}% engagement</span>
                              <span>{creator.campaigns} campaigns</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">+{creator.performance.toFixed(1)}%</div>
                            <div className="text-xs text-muted-foreground">Performance</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No creators available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI-Powered Insights
                </CardTitle>
                <CardDescription>
                  Actionable recommendations to optimize your influencer marketing strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <h4 className="text-sm font-medium">Performance Trend</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your campaigns are performing 23% better than industry average. Consider increasing budget allocation.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <h4 className="text-sm font-medium">Optimal Posting Times</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Peak engagement occurs between 2-4 PM and 7-9 PM. Schedule content accordingly for maximum reach.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <h4 className="text-sm font-medium">Creator Recommendations</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Fashion category creators show 18% higher engagement. Consider expanding partnerships in this niche.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </AuthGuard>
  )
}
