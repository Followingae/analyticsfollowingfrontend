"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Balloons } from "@/components/ui/balloons"
import { usePathname } from "next/navigation"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { useMemo, useState, useEffect, useRef } from "react"
import { Crown, Coins, PartyPopper, LogOut } from "lucide-react"
import { creditsApiService } from "@/services/creditsApi"
import { teamApiService, TeamContext } from "@/services/teamApi"
import { useRouter } from 'next/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { NotificationBell } from '@/components/ui/notification'
import { useNotifications } from '@/contexts/NotificationContext'

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const isDashboard = pathname === '/' || pathname === '/dashboard'
  const { user, isLoading, isBrandUser, logout } = useEnhancedAuth()
  const { notifications, unreadCounts, markAsRead, markAllAsRead } = useNotifications()

  const getPageTitle = () => {
    if (pathname === '/campaigns') return 'Campaigns'
    if (pathname === '/campaigns/new') return 'New Campaign'
    if (pathname.startsWith('/campaigns/')) return 'Campaign Details'
    if (pathname === '/creators') return 'Creators'
    if (pathname === '/my-lists') return 'My Lists'
    if (pathname.startsWith('/my-lists/')) return 'List Details'
    if (pathname === '/settings') return 'Settings'
    if (pathname === '/discover') return 'Discover'
    if (pathname === '/billing') return 'Billing'
    if (pathname === '/teams') return 'Teams'
    if (pathname === '/proposals') return 'Proposals'
    return null
  }

  const [teamContext, setTeamContext] = useState<TeamContext | null>(null)
  const [contextLoading, setContextLoading] = useState(true)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const balloonsRef = useRef<{ launchAnimation: () => void }>(null)

  const userDisplayData = useMemo(() => {
    if (!user || isLoading) return null

    const getDisplayName = () => {
      if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`
      }
      if (user.full_name) return user.full_name
      if (user.first_name) return user.first_name
      if (user.email) return user.email.split('@')[0]
      return null
    }

    return {
      displayName: getDisplayName(),
      companyName: user.company || null,
    }
  }, [user, isLoading])

  useEffect(() => {
    const loadTeamContext = async () => {
      if (!user || !isBrandUser) {
        setContextLoading(false)
        return
      }

      try {
        const storedContext = teamApiService.getStoredTeamContext()
        if (storedContext) {
          setTeamContext(storedContext)
          setContextLoading(false)
          return
        }

        const result = await teamApiService.getTeamContext()
        if (result.success && result.data) {
          setTeamContext(result.data)
          teamApiService.updateTeamContext(result.data)
        } else {
          setTeamContext(null)
        }
      } catch {
        setTeamContext(null)
      } finally {
        setContextLoading(false)
      }
    }

    loadTeamContext()

    const handleTeamContextUpdate = (event: CustomEvent<TeamContext>) => {
      setTeamContext(event.detail)
    }

    window.addEventListener('teamContextUpdated', handleTeamContextUpdate as EventListener)
    return () => {
      window.removeEventListener('teamContextUpdated', handleTeamContextUpdate as EventListener)
    }
  }, [user, isBrandUser])

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user || !isBrandUser) return

      // Check cache first
      const cached = sessionStorage.getItem('credits_balance')
      const cachedTime = sessionStorage.getItem('credits_balance_time')
      if (cached && cachedTime && (Date.now() - parseInt(cachedTime)) < 60000) {
        setCreditBalance(parseInt(cached))
        setContextLoading(false)
        return
      }

      try {
        const result = await creditsApiService.getBalance()
        if (result.success && result.data) {
          const balance = result.data.current_balance
          setCreditBalance(balance)
          sessionStorage.setItem('credits_balance', String(balance))
          sessionStorage.setItem('credits_balance_time', String(Date.now()))
        }
      } catch {
        // Silently fail -- balance is a nice-to-have
      }
    }

    fetchBalance()

    const handleCreditChange = () => {
      // Invalidate cache on explicit credit change events
      sessionStorage.removeItem('credits_balance')
      sessionStorage.removeItem('credits_balance_time')
      fetchBalance()
    }
    window.addEventListener('credit-balance-changed', handleCreditChange)
    return () => {
      window.removeEventListener('credit-balance-changed', handleCreditChange)
    }
  }, [user, isBrandUser])

  // Derive the tier label for display
  const tierLabel = (() => {
    if (!isBrandUser) return null
    if (contextLoading) return null
    if (teamContext) {
      return teamContext.subscription_tier.charAt(0).toUpperCase() + teamContext.subscription_tier.slice(1)
    }
    return user?.role?.replace('brand_', '').replace(/^\w/, (c: string) => c.toUpperCase()) || 'Free'
  })()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border/40 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 data-[orientation=vertical]:h-4"
        />

        {/* Page context: welcome greeting or page title */}
        {isDashboard && userDisplayData?.displayName && (
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Welcome,</span>
            <span className="text-sm font-medium text-foreground">{userDisplayData.displayName}</span>
            {userDisplayData.companyName && (
              <>
                <span className="text-muted-foreground/50 text-xs">/</span>
                <span className="text-sm text-muted-foreground hidden md:inline">{userDisplayData.companyName}</span>
              </>
            )}
          </div>
        )}
        {!isDashboard && getPageTitle() && (
          <h1 className="text-sm font-semibold text-foreground truncate">{getPageTitle()}</h1>
        )}

        {/* Right side: badges + actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Superadmin Badge */}
          {user && (user.role === 'superadmin' || user.role === 'admin') && (
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] py-0 px-1.5 h-5 font-normal text-muted-foreground border-muted-foreground/20 uppercase tracking-wider">
              Superadmin
            </Badge>
          )}

          {/* Credit Balance */}
          {isBrandUser && user && creditBalance != null && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs cursor-default transition-colors duration-150 hover:bg-muted/50">
                    <Coins className="w-3 h-3 mr-1 text-muted-foreground" />
                    {creditBalance >= 10000
                      ? `${(creditBalance / 1000).toFixed(1)}K`
                      : creditBalance.toLocaleString()}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{creditBalance.toLocaleString()} credits available</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Subscription Tier Badge */}
          {isBrandUser && user && !contextLoading && tierLabel && (
            <Badge variant="outline" className="hidden sm:inline-flex text-xs transition-colors duration-150">
              <Crown className="w-3 h-3 mr-1 text-muted-foreground" />
              {tierLabel}
            </Badge>
          )}

          {/* Loading skeleton for tier badge */}
          {isBrandUser && contextLoading && (
            <Skeleton className="h-5 w-20 rounded-full" />
          )}

          {/* Separator between info badges and action buttons */}
          <Separator orientation="vertical" className="hidden sm:block mx-0.5 data-[orientation=vertical]:h-4" />

          {/* Action buttons */}
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-1">
              <NotificationBell
                notifications={notifications}
                unreadCounts={unreadCounts}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => balloonsRef.current?.launchAnimation()}
                    className="hidden sm:inline-flex transition-colors duration-150"
                  >
                    <PartyPopper className="h-4 w-4" />
                    <span className="sr-only">Launch balloons</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Launch balloons</p>
                </TooltipContent>
              </Tooltip>

              <ModeToggle />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      logout()
                      router.push('/auth/login')
                    }}
                    className="transition-colors duration-150"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Sign out</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      <Balloons ref={balloonsRef} />
    </header>
  )
}
