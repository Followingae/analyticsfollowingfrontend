"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartBarInteractive } from "@/components/chart-bar-interactive"
import { ChartPieCredits } from "@/components/chart-pie-credits"
import { SiteHeader } from "@/components/site-header"
import { SectionCards } from "@/components/section-cards"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
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
  Activity,
  Hand
} from "lucide-react"

function formatNumber(num: number): string {
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

export default function Page() {
  // TODO: Replace with real backend data
  const [brandData, setBrandData] = useState(null)
  const [recentCampaigns, setRecentCampaigns] = useState([])
  const [topCreators, setTopCreators] = useState([])
  
  // Load data from backend
  useEffect(() => {
    // TODO: Implement actual API calls to fetch dashboard data
    // fetchBrandAnalytics().then(setBrandData)
    // fetchRecentCampaigns().then(setRecentCampaigns)
    // fetchTopCreators().then(setTopCreators)
  }, [])

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
            
            {/* Welcome Header & Analytics */}
            <div className="flex gap-6">
              {/* Welcome Section - 35% width */}
              <div className="w-[35%]">
                <Card className="@container/card h-full welcome-card">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src="/logo-acme.png" alt="Acme Corp" />
                        <AvatarFallback className="text-2xl font-bold">AC</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="welcome-text-primary font-semibold italic text-muted-foreground">Welcome,</div>
                        <div className="welcome-text-brand font-bold tracking-tight">Acme Corp</div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>

              {/* Brand Metrics Overview - 65% width */}
              <div className="flex-1">
                <SectionCards mode="brand" brandData={brandData} />
              </div>
            </div>

            {/* Performance Charts */}
            <div className="flex gap-6">
              {/* Recent Campaign Stats - 70% width */}
              <div className="w-[70%]">
                <ChartBarInteractive />
              </div>
              
              {/* Credits Consumption - 30% width */}
              <div className="w-[30%]">
                <ChartPieCredits />
              </div>
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
                  </div>
                  <Button 
                    size="sm" 
                    className="ml-auto gap-1"
                    onClick={() => toast.info("Redirecting to campaigns page...")}
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentCampaigns.length > 0 ? (
                      recentCampaigns.map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between space-x-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium leading-none">{campaign.name}</p>
                              {getStatusBadge(campaign.status)}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}</span>
                              <span>{formatNumber(campaign.reach)} reach</span>
                              <span>{campaign.engagement}% engagement</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">+{((campaign.reach / 1000000) * 100).toFixed(1)}%</div>
                            <div className="text-xs text-muted-foreground">ROI</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No campaigns found</p>
                        <p className="text-sm">Connect to backend to load campaign data</p>
                      </div>
                    )}
                  </div>
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
                  </div>
                  <Button 
                    size="sm" 
                    className="ml-auto gap-1"
                    onClick={() => toast.info("Redirecting to campaigns page...")}
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topCreators.length > 0 ? (
                      topCreators.map((creator) => (
                        <div key={creator.id} className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={creator.avatar} alt={creator.name} />
                            <AvatarFallback>
                              {creator.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium leading-none">{creator.name}</p>
                              <Badge variant="outline" className="text-xs">{creator.category}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatNumber(creator.followers)} followers</span>
                              <span>{creator.engagement}% engagement</span>
                              <span>{creator.campaigns} campaigns</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-primary">+{creator.performance}%</div>
                            <div className="text-xs text-muted-foreground">Performance</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No creators found</p>
                        <p className="text-sm">Connect to backend to load creator data</p>
                      </div>
                    )}
                  </div>
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
  )
}