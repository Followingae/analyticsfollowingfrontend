/**
 * FINAL AND CONFIRMED DASHBOARD LAYOUT
 * ====================================
 * This is the official, finalized dashboard layout approved by the client.
 * 
 * Layout Structure:
 * - Left Side (30%): Large "Welcome, {Brand Name}" section with avatar
 * - Right Side (70%): 3 metric cards in grid layout
 * - Below: Charts and campaign/creator sections remain unchanged
 * 
 * DO NOT MODIFY THIS LAYOUT WITHOUT EXPLICIT APPROVAL
 * Last confirmed: July 31, 2025
 */

"use client"

import { useState, useMemo } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { useAuth } from "@/contexts/AuthContext"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartBarInteractive } from "@/components/chart-bar-interactive"
import { ChartPieCredits } from "@/components/chart-pie-credits"
import { SiteHeader } from "@/components/site-header"
import { MetricCard, EngagementCard, QuickStatsGrid } from "@/components/analytics-cards"
import { DashboardSkeleton } from "@/components/skeletons"
import { DashboardNotificationsFixed } from "@/components/dashboard-notifications-fixed"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { UserAvatar } from "@/components/UserAvatar"
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

export default function Dashboard() {
  const { user, isLoading } = useAuth()
  
  // Memoized user display data to prevent flash and avoid hardcoded values
  const userDisplayData = useMemo(() => {
    
    if (!user || isLoading) return null
    
    const getDisplayName = () => {
      if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`
      }
      if (user.full_name) {
        return user.full_name
      }
      if (user.first_name) {
        return user.first_name
      }
      if (user.email) {
        return user.email.split('@')[0]
      }
      return null // No fallback to avoid hardcoded values
    }
    
    const getCompanyName = () => {
      return user.company || null // No fallback to avoid hardcoded values
    }
    
    const getUserInitials = () => {
      if (user.first_name && user.last_name) {
        return `${user.first_name[0]}${user.last_name[0]}`
      }
      if (user.full_name) {
        const names = user.full_name.split(' ')
        return names.length > 1 ? `${names[0][0]}${names[names.length-1][0]}` : names[0][0]
      }
      if (user.first_name) {
        return user.first_name[0]
      }
      if (user.email) {
        return user.email[0].toUpperCase()
      }
      return null // No fallback to avoid hardcoded values
    }

    return {
      displayName: getDisplayName(),
      companyName: getCompanyName(),
      initials: getUserInitials()
    }
  }, [user, isLoading])

  // Brand analytics data
  const brandMetrics = [
    {
      title: "Active Campaigns",
      value: "12",
      change: 20,
      icon: <Target className="h-4 w-4 text-[#5100f3]" />
    },
    {
      title: "Total Creators",
      value: "1,234",
      change: 15.2,
      icon: <Users className="h-4 w-4 text-[#5100f3]" />
    },
    {
      title: "Your Plan",
      value: "Pro",
      change: undefined,
      icon: <Star className="h-4 w-4 text-[#5100f3]" />
    },
    {
      title: "Campaign ROI",
      value: "325%",
      change: 12.3,
      icon: <TrendingUp className="h-4 w-4 text-[#5100f3]" />
    }
  ]

  const recentCampaigns = [
    {
      id: 1,
      name: "Summer Fashion 2024",
      status: "active",
      budget: 55050,
      spent: 31175,
      reach: 1200000,
      engagement: 4.2,
      creators: 5,
      endDate: "2024-08-31"
    },
    {
      id: 2,
      name: "Fitness Challenge",
      status: "active", 
      budget: 44040,
      spent: 15414,
      reach: 580000,
      engagement: 6.1,
      creators: 6,
      endDate: "2024-07-30"
    },
    {
      id: 3,
      name: "Tech Product Launch",
      status: "completed",
      budget: 91750,
      spent: 86245,
      reach: 850000,
      engagement: 5.8,
      creators: 3,
      endDate: "2024-05-31"
    }
  ]


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-[#5100f3]/10 text-[#5100f3] dark:bg-[#5100f3]/20 dark:text-[#5100f3]">
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
            "--sidebar-width": "calc(var(--spacing) * 66)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            
            {/* Welcome Header & Analytics */}
            <div className="flex gap-6">
              {/* Welcome Section - 30% width */}
              <div className="w-[30%]">
                <Card className="@container/card h-full welcome-card">
                  <CardHeader>
                    {userDisplayData && (
                      <div className="flex items-center gap-4">
                        <UserAvatar 
                          key={`dashboard-avatar-${JSON.stringify(user?.avatar_config) || 'default'}`}
                          user={user || undefined}
                          size={90}
                          className="h-22 w-22"
                        />
                        <div className="flex flex-col">
                          <div className="welcome-text-primary font-semibold italic text-muted-foreground">Welcome,</div>
                          {userDisplayData.companyName && (
                            <div className="welcome-text-brand font-bold tracking-tight">{userDisplayData.companyName}</div>
                          )}
                          {!userDisplayData.companyName && userDisplayData.displayName && (
                            <div className="welcome-text-brand font-bold tracking-tight">{userDisplayData.displayName}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardHeader>
                </Card>
              </div>

              {/* Brand Metrics Overview - 70% width */}
              <div className="flex-1">
                <div className="grid gap-4 grid-cols-3">
                  {brandMetrics.slice(0, 3).map((metric, index) => (
                    <MetricCard
                      key={index}
                      title={metric.title}
                      value={metric.value}
                      change={metric.change}
                      icon={metric.icon}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Charts */}
            <div className="grid gap-6 grid-cols-10">
              <div className="col-span-7">
                <ChartBarInteractive />
              </div>
              <div className="col-span-3">
                <ChartPieCredits />
              </div>
            </div>

            {/* Recent Campaigns & Notifications */}
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
                      Your latest campaign performance
                    </CardDescription>
                  </div>
                  <Button size="sm" className="ml-auto gap-1">
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

              {/* Notifications */}
              <DashboardNotificationsFixed />
            </div>

            {/* AI-Powered Insights */}
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
                      <div className="w-2 h-2 rounded-full bg-[#5100f3]" />
                      <h4 className="text-sm font-medium">Performance Trend</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your campaigns are performing 23% better than industry average. Consider increasing budget allocation.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#5100f3]" />
                      <h4 className="text-sm font-medium">Optimal Posting Times</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Peak engagement occurs between 2-4 PM and 7-9 PM. Schedule content accordingly for maximum reach.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#5100f3]" />
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
        )}
      </SidebarInset>
    </SidebarProvider>
    </AuthGuard>
  )
}
