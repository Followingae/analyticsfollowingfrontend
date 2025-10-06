'use client'

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { useDashboardData } from "@/hooks/useDashboardData"
import { useUserStore, useSubscriptionData, useTeamData } from "@/stores/userStore"
import { ChartProfileAnalysisV2 } from "@/components/chart-profile-analysis-v2"
import { ChartRemainingCreditsV2 } from "@/components/chart-remaining-credits-v2"
import { MetricCard } from "@/components/analytics-cards"
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { UserAvatar } from "@/components/UserAvatar"
import { SmartDiscovery } from "@/components/smart-discovery"
import { 
  Target, 
  Users, 
  Star,
  TrendingUp
} from "lucide-react"

export function BrandDashboardContent() {
  const { isPremium, isAdmin } = useEnhancedAuth()
  const router = useRouter()
  
  // Use both dashboard data and user store for comprehensive data
  const {
    teamsOverview,
    teamsLoading,
    unlockedProfilesCount,
    profilesLoading,
    activeCampaignsCount,
    campaigns,
    campaignsLoading,
    isLoading
  } = useDashboardData()
  
  // Get all user data from UserStore (including avatar) for consistency
  const subscription = useSubscriptionData()
  const team = useTeamData()
  const { isLoading: userStoreLoading, user } = useUserStore()
  
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

  // Animation states for sequential loading
  const [showWelcome, setShowWelcome] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)
  const [showDiscovery, setShowDiscovery] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Sequential loading animation effect
  useEffect(() => {
    if (!isLoading && user) {
      const timeouts = [
        setTimeout(() => setShowWelcome(true), 100),        // Welcome first
        setTimeout(() => setShowMetrics(true), 300),        // Metrics after 300ms
        setTimeout(() => setShowDiscovery(true), 600),      // Discovery after 600ms
        setTimeout(() => setShowAnalytics(true), 900),      // Analytics after 900ms
      ]

      return () => timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [isLoading, user])


  // Brand analytics data - dynamic Your Plan card
  const brandMetrics = [
    {
      title: "Active Campaigns",
      value: campaignsLoading ? "Loading..." : activeCampaignsCount.toString(),
      change: undefined,
      icon: <Target className="h-4 w-4 text-primary" />
    },
    {
      title: "Total Creators",
      value: (() => {
        if (profilesLoading) return "Loading..."
        
        
        return unlockedProfilesCount.toString()
      })(),
      change: undefined,
      icon: <Users className="h-4 w-4 text-primary" />
    },
    {
      title: "Your Plan",
      value: (() => {
        if (userStoreLoading || teamsLoading) return "Loading..."
        
        // Priority order: team subscription > individual subscription > teams overview fallback
        let tier = null
        
        // First try: team subscription tier (most reliable)
        if (team?.subscription_tier) {
          tier = team.subscription_tier
        }
        // Second try: individual subscription tier
        else if (subscription?.tier) {
          tier = subscription.tier
        }
        // Fallback: teams overview data
        else if (teamsOverview?.team_info?.subscription_tier) {
          tier = teamsOverview.team_info.subscription_tier
        }
        
        
        // Map subscription tiers to display names
        switch (tier) {
          case 'free':
            return 'Free'
          case 'standard':
            return 'Standard'
          case 'premium':
            return 'Premium'
          case 'enterprise':
            return 'Enterprise'
          default:
            return tier || 'Loading...'
        }
      })(),
      change: undefined,
      icon: <Star className="h-4 w-4 text-primary" />
    },
    {
      title: "Campaign ROI",
      value: "--",
      change: undefined,
      icon: <TrendingUp className="h-4 w-4 text-primary" />
    }
  ]

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="w-full min-h-screen">
      <div className="@container/main w-full max-w-full space-y-8 p-4 md:p-6">
        
        {/* Welcome Header & Analytics */}
        <div className="grid gap-6 grid-cols-12">
          {/* Welcome Section - 30% width */}
          <div className={`col-span-4 transition-all duration-500 ease-out ${
            showWelcome ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
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
                    </div>
                  </div>
                )}
              </CardHeader>
            </Card>
          </div>

          {/* Brand Metrics Overview - 70% width */}
          <div className="col-span-8">
            <div className="grid gap-4 grid-cols-3">
              {brandMetrics.slice(0, 3).map((metric, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ease-out ${
                    showMetrics ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <MetricCard
                    title={metric.title}
                    value={metric.value}
                    change={metric.change}
                    icon={metric.icon}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Discovery Section */}
        <div className="grid gap-6 grid-cols-12">
          {/* Smart Discovery Component */}
          <div className={`col-span-6 transition-all duration-500 ease-out ${
            showDiscovery ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="h-[320px]">
              <SmartDiscovery 
                onDiscover={() => {
                  // Navigate to discover page
                  router.push('/discover')
                }}
                className="h-full"
              />
            </div>
          </div>
          {/* Profile Analysis Chart */}
          <div className={`col-span-3 transition-all duration-500 ease-out ${
            showAnalytics ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '100ms' }}>
            <div className="h-[320px]">
              <ChartProfileAnalysisV2 />
            </div>
          </div>
          {/* Remaining Credits Chart */}
          <div className={`col-span-3 transition-all duration-500 ease-out ${
            showAnalytics ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '200ms' }}>
            <div className="h-[320px]">
              <ChartRemainingCreditsV2 />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}