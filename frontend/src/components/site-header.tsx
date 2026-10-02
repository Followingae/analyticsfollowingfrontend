"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { planTierLabel } from "@/lib/plan-tier"
import { HelpLifebuoy } from "@/components/help/HelpLifebuoy"
import { usePathname } from "next/navigation"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import React, { useState, useEffect } from "react"
import { Crown, Coins, LogOut, Search } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { getRouteTrail } from '@/lib/routeRegistry'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import Link from 'next/link'

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const isDashboard = pathname === '/' || pathname === '/dashboard'
  const { user, isBrandUser, logout } = useEnhancedAuth()
  const { notifications, unreadCounts, markAsRead, markAllAsRead } = useNotifications()

  // Registry-driven breadcrumb trail (covers brand + operator routes)
  const trail = getRouteTrail(pathname || '/')

  const [teamContext, setTeamContext] = useState<TeamContext | null>(null)
  const [contextLoading, setContextLoading] = useState(true)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)

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

  // Derive the tier label for display.
  //
  // This used to fall back to `user.role` when the team context was missing, so a brand
  // whose role is "brand_premium" but whose team is on Standard saw "Premium" up here and
  // "Standard" on the page underneath, at the same moment. A role is not a purchase, and two
  // answers to "what am I paying for" is worse than none. When we do not know, the badge
  // does not render.
  const tierLabel = (() => {
    if (!isBrandUser) return null
    if (contextLoading) return null
    return planTierLabel(teamContext?.subscription_tier)
  })()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border/40 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 data-[orientation=vertical]:h-4"
        />

        {/* The dashboard greets the client in its own head, at 44px, with their avatar
            beside it. This bar used to greet them again 60px above that, in 14px grey, so
            the one warm moment on the page was immediately undercut by a smaller copy of
            itself. The page keeps the greeting; the bar does not repeat it. */}
        {!isDashboard && trail.length > 0 && (
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap text-sm">
              {trail.map((crumb) => (
                <React.Fragment key={crumb.href}>
                  <BreadcrumbItem className="truncate">
                    {crumb.isLast ? (
                      <BreadcrumbPage className="font-semibold truncate">{crumb.title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild className="hidden sm:inline-flex truncate">
                        <Link href={crumb.href}>{crumb.title}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!crumb.isLast && <BreadcrumbSeparator className="hidden sm:block" />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {/* Right side: badges + actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Guided walkthroughs — re-runnable, role-aware. */}
          <HelpLifebuoy />
          {/* Command-palette entry point — visible affordance for the ⌘K palette */}
          <button
            type="button"
            data-tour="search"
            onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-2.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="Open command palette"
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Search</span>
            <kbd className="hidden lg:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </button>

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
                  {/* The abbreviated figure ("8.8K") is a display convenience; the exact
                      balance used to live only in a hover tooltip on an element with no
                      tabIndex, so it was unreachable by keyboard and by touch. It is now
                      focusable, and the exact number is in the accessible name either way. */}
                  <Badge
                    variant="outline"
                    tabIndex={0}
                    aria-label={`${creditBalance.toLocaleString()} credits available`}
                    className="text-xs cursor-default transition-colors duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Coins className="w-3 h-3 mr-1 text-muted-foreground" aria-hidden />
                    <span aria-hidden>
                      {creditBalance >= 10000
                        ? `${(creditBalance / 1000).toFixed(1)}K`
                        : creditBalance.toLocaleString()}
                    </span>
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

              <ModeToggle />

              {/* Sign out — now behind a confirm dialog (session-ending action) */}
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="transition-colors duration-150"
                        aria-label="Sign out"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Sign out</p>
                  </TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign out?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You&apos;ll be returned to the login screen and need to sign in again to continue.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        logout()
                        router.push('/auth/login')
                      }}
                    >
                      Sign out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* An overflow menu, a trigger and a tooltip used to be built here to house
                  exactly one item: "Launch balloons". A "More" affordance promises density
                  and delivered a toy, while adding an eighth control to a bar that already
                  had seven. The celebration still fires on the dashboard when a credit
                  purchase lands, which is where it means something. */}
            </div>
          </TooltipProvider>
        </div>
      </div>
    </header>
  )
}
