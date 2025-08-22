'use client'

import { useState, useMemo, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { ChartBarInteractive } from "@/components/chart-bar-interactive"
import { ChartPieCredits } from "@/components/chart-pie-credits"
import { MetricCard } from "@/components/analytics-cards"
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton"
import { Card, CardHeader } from "@/components/ui/card"
import { UserAvatar } from "@/components/UserAvatar"
import { 
  Target, 
  Users, 
  Star,
  TrendingUp
} from "lucide-react"

export function BrandDashboardContent() {
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

  // Credit balance state
  const [creditBalance, setCreditBalance] = useState<any>(null)
  const [creditLoading, setCreditLoading] = useState(true)

  // Load credit balance
  useEffect(() => {
    const loadCreditBalance = async () => {
      try {
        const { creditsApiService } = await import('@/services/creditsApi')
        const result = await creditsApiService.getBalance()
        
        if (result.success && result.data) {
          setCreditBalance(result.data)
        }
      } catch (error) {
        console.error('Failed to load credit balance:', error)
      } finally {
        setCreditLoading(false)
      }
    }

    loadCreditBalance()
  }, [])

  // Brand analytics data - dynamic Your Plan card
  const brandMetrics = [
    {
      title: "Active Campaigns",
      value: "--",
      change: undefined,
      icon: <Target className="h-4 w-4 text-[#5100f3]" />
    },
    {
      title: "Total Creators",
      value: "--",
      change: undefined,
      icon: <Users className="h-4 w-4 text-[#5100f3]" />
    },
    {
      title: "Your Plan",
      value: creditLoading ? "Loading..." : (creditBalance?.package_name || "Free"),
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
          <div className="col-span-8">
            <ChartBarInteractive />
          </div>
          <div className="col-span-2">
            <ChartPieCredits />
          </div>
        </div>

      </div>
    </div>
  )
}