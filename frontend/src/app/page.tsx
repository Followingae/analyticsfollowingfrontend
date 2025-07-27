"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartBarInteractive } from "@/components/chart-bar-interactive"
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export default function Page() {
  // Brand analytics data
  const brandMetrics = [
    {
      title: "Current Plan",
      value: "Pro",
      change: 0,
      icon: <Star className="h-4 w-4 text-primary" />
    },
    {
      title: "Total Creators",
      value: "1,234",
      change: 15.2,
      icon: <Users className="h-4 w-4 text-primary" />
    },
    {
      title: "Monthly Reach",
      value: "2.4M",
      change: 8.7,
      icon: <Eye className="h-4 w-4 text-primary" />
    },
    {
      title: "Credits",
      value: "1,200",
      change: -20.8,
      icon: <TrendingUp className="h-4 w-4 text-primary" />
    }
  ]

  const recentCampaigns = [
    {
      id: 1,
      name: "Summer Fashion 2024",
      status: "active",
      budget: 15000,
      spent: 8500,
      reach: 1200000,
      engagement: 4.2,
      creators: 5,
      endDate: "2024-08-31"
    },
    {
      id: 2,
      name: "Fitness Challenge",
      status: "active", 
      budget: 12000,
      spent: 4200,
      reach: 580000,
      engagement: 6.1,
      creators: 6,
      endDate: "2024-07-30"
    },
    {
      id: 3,
      name: "Tech Product Launch",
      status: "completed",
      budget: 25000,
      spent: 23500,
      reach: 850000,
      engagement: 5.8,
      creators: 3,
      endDate: "2024-05-31"
    }
  ]

  const topCreators = [
    {
      id: 1,
      name: "Sarah Johnson",
      username: "fashionista_sarah",
      avatar: "/avatars/01.png",
      followers: 245000,
      engagement: 4.2,
      category: "Fashion",
      performance: 12.5,
      campaigns: 3
    },
    {
      id: 2,
      name: "Mike Chen", 
      username: "tech_reviewer_mike",
      avatar: "/avatars/02.png",
      followers: 186000,
      engagement: 5.8,
      category: "Technology",
      performance: 25.2,
      campaigns: 2
    },
    {
      id: 3,
      name: "Anna Rodriguez",
      username: "fitness_queen_anna",
      avatar: "/avatars/03.png", 
      followers: 320000,
      engagement: 3.9,
      category: "Fitness",
      performance: 18.7,
      campaigns: 4
    }
  ]

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
                <SectionCards mode="brand" />
              </div>
            </div>

            {/* Performance Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <ChartBarInteractive />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Engagement Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-primary" />
                        <span className="text-sm">Likes</span>
                      </div>
                      <span className="text-sm font-medium">45.2%</span>
                    </div>
                    <Progress value={45.2} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm">Comments</span>
                      </div>
                      <span className="text-sm font-medium">23.1%</span>
                    </div>
                    <Progress value={23.1} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="text-sm">Shares</span>
                      </div>
                      <span className="text-sm font-medium">18.7%</span>
                    </div>
                    <Progress value={18.7} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
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
                            <span>{campaign.engagement}% engagement</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">+{((campaign.reach / 1000000) * 100).toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">ROI</div>
                        </div>
                      </div>
                    ))}
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
                    {topCreators.map((creator) => (
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
                    ))}
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