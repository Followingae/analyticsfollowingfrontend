'use client'

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useDashboardData } from "@/hooks/useDashboardData"
import { useUserStore, useSubscriptionData, useTeamData } from "@/stores/userStore"
import { ChartProfileAnalysisV2 } from "@/components/chart-profile-analysis-v2"
import { ChartRemainingCreditsV2 } from "@/components/chart-remaining-credits-v2"
import { MetricCard } from "@/components/analytics-cards"
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton"
import { Card, CardHeader } from "@/components/ui/card"
import { UserAvatar } from "@/components/UserAvatar"
import { SmartDiscovery } from "@/components/smart-discovery"
import {
  Target,
  Users,
  Star,
} from "lucide-react"

export function BrandDashboardContent() {
  const router = useRouter()

  const {
    teamsOverview,
    teamsLoading,
    unlockedProfilesCount,
    profilesLoading,
    activeCampaignsCount,
    campaignsLoading,
    isLoading,
  } = useDashboardData()

  const subscription = useSubscriptionData()
  const team = useTeamData()
  const { isLoading: userStoreLoading, user } = useUserStore()

  const userDisplayData = useMemo(() => {
    if (!user || isLoading) return null

    const getDisplayName = () => {
      if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
      if (user.full_name) return user.full_name
      if (user.first_name) return user.first_name
      if (user.email) return user.email.split('@')[0]
      return null
    }

    const getUserInitials = () => {
      if (user.first_name && user.last_name) return `${user.first_name[0]}${user.last_name[0]}`
      if (user.full_name) {
        const names = user.full_name.split(' ')
        return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : names[0][0]
      }
      if (user.first_name) return user.first_name[0]
      if (user.email) return user.email[0].toUpperCase()
      return null
    }

    return {
      displayName: getDisplayName(),
      companyName: user.company || null,
      initials: getUserInitials(),
    }
  }, [user, isLoading])

  // PERF FIX: No artificial delays - show content immediately when data is ready
  const showWelcome = !isLoading && !!user
  const showMetrics = !isLoading && !!user
  const showDiscovery = !isLoading && !!user
  const showAnalytics = !isLoading && !!user

  // Derive subscription tier display
  const tierValue = useMemo(() => {
    if (userStoreLoading || teamsLoading) return "Loading..."

    const tier = team?.subscription_tier
      || subscription?.tier
      || teamsOverview?.team_info?.subscription_tier

    const tierMap: Record<string, string> = {
      free: 'Free',
      standard: 'Standard',
      premium: 'Premium',
      enterprise: 'Enterprise',
    }

    return tier ? (tierMap[tier] || tier) : 'Free'
  }, [userStoreLoading, teamsLoading, team, subscription, teamsOverview])

  const brandMetrics = [
    {
      title: "Active Campaigns",
      value: campaignsLoading ? "Loading..." : activeCampaignsCount.toString(),
      icon: <Target className="h-4 w-4 text-primary" />,
    },
    {
      title: "Unlocked Creators",
      value: profilesLoading ? "Loading..." : unlockedProfilesCount.toString(),
      icon: <Users className="h-4 w-4 text-primary" />,
    },
    {
      title: "Your Plan",
      value: tierValue,
      icon: <Star className="h-4 w-4 text-primary" />,
    },
  ]

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="w-full min-h-0">
      <div className="@container/main w-full max-w-full space-y-6 p-4 md:p-6">

        {/* Row 1: Welcome + Metric Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-12">
          {/* Welcome Section */}
          <div className={`md:col-span-4 transition-all duration-500 ease-out ${
            showWelcome ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}>
            <Card className="@container/card h-full welcome-card">
              <CardHeader className="flex items-start justify-center h-full">
                {userDisplayData ? (
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      key={`dashboard-avatar-${JSON.stringify(user?.avatar_config) || 'default'}`}
                      user={user || undefined}
                      size={90}
                      className="h-22 w-22 shrink-0"
                    />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="welcome-text-primary font-semibold italic text-muted-foreground">Welcome,</span>
                      {userDisplayData.companyName && (
                        <span
                          className="welcome-text-brand font-bold tracking-tight"
                          title={userDisplayData.companyName}
                        >
                          {userDisplayData.companyName}
                        </span>
                      )}
                      {!userDisplayData.companyName && userDisplayData.displayName && (
                        <span
                          className="welcome-text-brand font-bold tracking-tight"
                          title={userDisplayData.displayName}
                        >
                          {userDisplayData.displayName}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="h-22 w-22 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="flex flex-col gap-2">
                      <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                      <div className="h-6 w-32 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                )}
              </CardHeader>
            </Card>
          </div>

          {/* Metric Cards */}
          <div className="md:col-span-8">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              {brandMetrics.map((metric, index) => (
                <div
                  key={metric.title}
                  className={`transition-all duration-500 ease-out ${
                    showMetrics ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
                  <MetricCard
                    title={metric.title}
                    value={metric.value}
                    icon={metric.icon}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Discovery + Charts */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-12">
          {/* Smart Discovery */}
          <div className={`md:col-span-6 transition-all duration-500 ease-out ${
            showDiscovery ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}>
            <div className="h-[320px]">
              <SmartDiscovery
                onDiscover={() => router.push('/discover')}
                className="h-full"
              />
            </div>
          </div>

          {/* Profile Analysis Chart */}
          <div
            className={`md:col-span-3 transition-all duration-500 ease-out ${
              showAnalytics ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
            style={{ transitionDelay: '80ms' }}
          >
            <div className="h-[320px]">
              <ChartProfileAnalysisV2 />
            </div>
          </div>

          {/* Remaining Credits Chart */}
          <div
            className={`md:col-span-3 transition-all duration-500 ease-out ${
              showAnalytics ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
            style={{ transitionDelay: '160ms' }}
          >
            <div className="h-[320px]">
              <ChartRemainingCreditsV2 />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
