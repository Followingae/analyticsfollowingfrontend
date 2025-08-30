'use client'

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { ChartBarInteractive } from "@/components/chart-bar-interactive"
import { ChartProfileAnalysis } from "@/components/chart-profile-analysis"
import { ChartPostAnalytics } from "@/components/chart-post-analytics"
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
  const { user, isLoading, isPremium, isAdmin } = useEnhancedAuth()
  const router = useRouter()

  console.log('🚨 BrandDashboardContent RENDER:', {
    isLoading,
    hasUser: !!user,
    userEmail: user?.email,
    userRole: user?.role,
    isPremium,
    isAdmin
  })
  
  // Memoized user display data to prevent flash and avoid hardcoded values
  const userDisplayData = useMemo(() => {
    
    if (!user || isLoading) return null
    
    // Debug: Log user data to identify inconsistency
    console.log('🔍 BrandDashboard: Current user data:', {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      first_name: user.first_name,
      last_name: user.last_name,
      company: user.company,
      avatar_config: user.avatar_config
    })
    
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

  // Teams overview state
  const [teamsOverview, setTeamsOverview] = useState<any>(null)
  const [teamsLoading, setTeamsLoading] = useState(true)
  
  // Unlocked profiles state
  const [unlockedProfilesCount, setUnlockedProfilesCount] = useState<number>(0)
  const [profilesLoading, setProfilesLoading] = useState(true)
  
  // Active campaigns state
  const [activeCampaignsCount, setActiveCampaignsCount] = useState<number>(0)
  const [campaignsLoading, setCampaignsLoading] = useState(true)
  

  // Load teams overview
  useEffect(() => {
    const loadTeamsOverview = async () => {
      if (!user) {
        setTeamsLoading(false)
        return
      }

      try {
        const { API_CONFIG, ENDPOINTS } = await import('@/config/api')
        const { fetchWithAuth } = await import('@/utils/apiInterceptor')
        const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}${ENDPOINTS.teams.overview}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        
        console.log('🏢 BrandDashboard: Teams Overview API Response Status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('🏢 BrandDashboard: Teams Overview Data:', data)
          setTeamsOverview(data)
        } else {
          console.log('🏢 BrandDashboard: Teams overview API failed:', response.status)
        }
      } catch (error) {
        console.error('Failed to load teams overview:', error)
      } finally {
        setTeamsLoading(false)
      }
    }

    loadTeamsOverview()
  }, [user])

  // Load unlocked profiles count
  useEffect(() => {
    const loadUnlockedProfiles = async () => {
      if (!user) {
        setProfilesLoading(false)
        return
      }

      try {
        const { authService } = await import('@/services/authService')
        const result = await authService.getUnlockedProfiles()
        
        console.log('🏢 BrandDashboard: Unlocked Profiles Response:', result)
        
        if (result.success && result.data) {
          const count = Array.isArray(result.data) ? result.data.length : 0
          console.log('🏢 BrandDashboard: Unlocked Profiles Count:', count)
          setUnlockedProfilesCount(count)
        } else {
          console.log('🏢 BrandDashboard: No unlocked profiles or API failed:', result.error)
          setUnlockedProfilesCount(0)
        }
      } catch (error) {
        console.error('Failed to load unlocked profiles:', error)
        setUnlockedProfilesCount(0)
      } finally {
        setProfilesLoading(false)
      }
    }

    loadUnlockedProfiles()
  }, [user])

  // Load active campaigns count
  useEffect(() => {
    const loadActiveCampaigns = async () => {
      if (!user) {
        setCampaignsLoading(false)
        return
      }

      try {
        // Try to fetch campaigns from backend using fetchWithAuth
        const { fetchWithAuth } = await import('@/utils/apiInterceptor')
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/campaigns`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        
        console.log('🎯 BrandDashboard: Campaigns API Response:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('🎯 BrandDashboard: Campaigns Data:', data)
          
          // Count active campaigns
          const campaigns = data.campaigns || data.data || data || []
          const activeCount = Array.isArray(campaigns) 
            ? campaigns.filter((campaign: any) => campaign.status === 'active').length
            : 0
          
          console.log('🎯 BrandDashboard: Active Campaigns Count:', activeCount)
          setActiveCampaignsCount(activeCount)
        } else {
          console.log('🎯 BrandDashboard: No campaigns endpoint or API failed:', response.status)
          // Set to 0 if endpoint doesn't exist yet
          setActiveCampaignsCount(0)
        }
      } catch (error) {
        console.error('Failed to load active campaigns:', error)
        // Set to 0 if there's an error (endpoint may not exist yet)
        setActiveCampaignsCount(0)
      } finally {
        setCampaignsLoading(false)
      }
    }

    loadActiveCampaigns()
  }, [user])


  // Brand analytics data - dynamic Your Plan card
  const brandMetrics = [
    {
      title: "Active Campaigns",
      value: campaignsLoading ? "Loading..." : activeCampaignsCount.toString(),
      change: undefined,
      icon: <Target className="h-4 w-4 text-[#5100f3]" />
    },
    {
      title: "Total Creators",
      value: profilesLoading ? "Loading..." : unlockedProfilesCount.toString(),
      change: undefined,
      icon: <Users className="h-4 w-4 text-[#5100f3]" />
    },
    {
      title: "Your Plan",
      value: (() => {
        if (teamsLoading) return "Loading..."
        
        const tier = teamsOverview?.team_info?.subscription_tier
        
        // Map subscription tiers to display names
        switch (tier) {
          case 'free':
            return 'Free'
          case 'standard':
            return 'Standard'
          case 'premium':
            return 'Premium'
          default:
            return tier || 'Loading...'
        }
      })(),
      change: undefined,
      icon: <Star className="h-4 w-4 text-[#5100f3]" />
    },
    {
      title: "Campaign ROI",
      value: "--",
      change: undefined,
      icon: <TrendingUp className="h-4 w-4 text-[#5100f3]" />
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
          <div className="col-span-4">
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

        {/* Smart Discovery Section */}
        <div className="grid gap-6 grid-cols-12">
          {/* Smart Discovery Component */}
          <div className="col-span-6">
            <SmartDiscovery 
              onDiscover={() => {
                // Navigate to discovery page
                router.push('/discovery')
              }}
            />
          </div>
          {/* Profile Analysis Chart */}
          <div className="col-span-3">
            <div className="h-[320px]">
              <ChartProfileAnalysis />
            </div>
          </div>
          {/* Post Analytics Chart */}
          <div className="col-span-3">
            <div className="h-[320px]">
              <ChartPostAnalytics />
            </div>
          </div>
        </div>

        {/* Recent Campaign Stats Section */}
        <div className="grid gap-6 grid-cols-12">
          {/* Recent Campaign Stats */}
          <div className="col-span-12">
            <div className="h-[320px]">
              <ChartBarInteractive />
            </div>
          </div>
        </div>


      </div>
    </div>
  )
}