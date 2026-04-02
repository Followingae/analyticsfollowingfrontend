'use client'

import { useMemo, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useDashboardData } from "@/hooks/useDashboardData"
import { useUserStore, useSubscriptionData, useTeamData } from "@/stores/userStore"
import { useNotifications } from "@/contexts/NotificationContext"
import { ChartProfileAnalysisV2 } from "@/components/chart-profile-analysis-v2"
import { ChartRemainingCreditsV2 } from "@/components/chart-remaining-credits-v2"
import { MetricCard } from "@/components/analytics-cards"
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Balloons } from "@/components/ui/balloons"
import { UserAvatar } from "@/components/UserAvatar"
import { SmartDiscovery } from "@/components/smart-discovery"
import { brandPoolApi } from "@/services/faAdminApi"
import {
  Target,
  Users,
  Star,
  AlertTriangle,
  Wallet,
  ArrowRight,
  Bell,
  CreditCard,
  BarChart3,
  FileText,
  Link2,
  UserPlus,
  ChevronRight,
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
  const { notifications, markAsRead } = useNotifications()

  // Balloons celebration for credit events
  const balloonsRef = useRef<{ launchAnimation: () => void }>(null)
  const [celebrationDone, setCelebrationDone] = useState(false)

  useEffect(() => {
    if (celebrationDone || !notifications.length) return
    const creditNotifs = notifications.filter(
      (n) => !n.is_read && (n.notification_type === 'credit_purchase')
    )
    if (creditNotifs.length > 0) {
      // Delay slightly so the page has rendered
      const timer = setTimeout(() => {
        balloonsRef.current?.launchAnimation()
        setCelebrationDone(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [notifications, celebrationDone])

  // Pool balance for low-balance warning — refresh on visibility
  const [poolBalance, setPoolBalance] = useState<{ available_aed: number; total_funded_aed: number } | null>(null)
  useEffect(() => {
    const loadPool = () => {
      brandPoolApi.balance().then((res: any) => {
        if (res?.success && res.data) {
          setPoolBalance({
            available_aed: res.data.available_aed ?? (res.data.available_cents ? res.data.available_cents / 100 : 0),
            total_funded_aed: res.data.total_funded_aed ?? (res.data.total_funded_cents ? res.data.total_funded_cents / 100 : 0),
          })
        }
      }).catch(() => {})
    }
    loadPool()
    const handleFocus = () => { loadPool() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

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

        {/* Pool Low Balance Warning */}
        {poolBalance && poolBalance.total_funded_aed > 0 && (() => {
          const pct = (poolBalance.available_aed / poolBalance.total_funded_aed) * 100
          if (poolBalance.available_aed <= 0) return (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Cashback pool is depleted</p>
                <p className="text-xs text-red-600 dark:text-red-400">Your campaigns cannot process cashbacks. Top up now to continue.</p>
              </div>
              <Link href="/cashback-pool/topup" className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                Top Up Now <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )
          if (pct < 5) return (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Cashback pool critically low — AED {poolBalance.available_aed.toLocaleString("en-AE", { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-red-600 dark:text-red-400">Your campaigns may stop processing cashbacks soon.</p>
              </div>
              <Link href="/cashback-pool/topup" className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                Top Up <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )
          if (pct < 20) return (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Cashback pool running low — AED {poolBalance.available_aed.toLocaleString("en-AE", { minimumFractionDigits: 2 })} remaining</p>
              </div>
              <Link href="/cashback-pool/topup" className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900">
                Top Up <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )
          return null
        })()}

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

        {/* Row 3: Recent Notifications */}
        {notifications.length > 0 && (
          <div className={`transition-all duration-500 ease-out ${
            showAnalytics ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`} style={{ transitionDelay: '240ms' }}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    Recent Activity
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
                    <Link href="/notifications" className="flex items-center gap-1">
                      View All <ChevronRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {notifications.slice(0, 5).map((n) => {
                    const iconMap: Record<string, { icon: typeof Bell; color: string }> = {
                      credit_purchase: { icon: CreditCard, color: "text-green-500 bg-green-50 dark:bg-green-950" },
                      low_balance: { icon: AlertTriangle, color: "text-amber-500 bg-amber-50 dark:bg-amber-950" },
                      analytics_completed: { icon: BarChart3, color: "text-purple-500 bg-purple-50 dark:bg-purple-950" },
                      proposal_received: { icon: FileText, color: "text-blue-500 bg-blue-50 dark:bg-blue-950" },
                      proposal_updated: { icon: FileText, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950" },
                      share_received: { icon: Link2, color: "text-green-500 bg-green-50 dark:bg-green-950" },
                      team_invite: { icon: UserPlus, color: "text-blue-500 bg-blue-50 dark:bg-blue-950" },
                    }
                    const cfg = iconMap[n.notification_type] || { icon: Bell, color: "text-muted-foreground bg-muted" }
                    const Icon = cfg.icon
                    const timeAgo = getTimeAgo(n.created_at)

                    return (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-muted/50 ${!n.is_read ? "bg-primary/[0.03]" : ""}`}
                        onClick={() => {
                          if (!n.is_read) markAsRead(n.id)
                          if (n.action_url) router.push(n.action_url)
                        }}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate ${!n.is_read ? "font-medium" : ""}`}>{n.title}</p>
                            {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">{timeAgo}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>

      {/* Celebration balloons */}
      <Balloons ref={balloonsRef} />
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
