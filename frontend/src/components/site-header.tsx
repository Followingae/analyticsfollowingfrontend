"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Balloons } from "@/components/ui/balloons"
import { usePathname } from "next/navigation"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { useMemo, useState, useEffect, useRef } from "react"
import { Crown, Coins, PartyPopper, LogOut } from "lucide-react"
import { creditsApiService, CreditBalance } from "@/services/creditsApi"
import { teamApiService, TeamContext } from "@/services/teamApi"
import { useRouter } from 'next/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const isDashboard = pathname === '/' || pathname === '/dashboard'
  const { user, isLoading, isBrandUser, logout } = useEnhancedAuth()

  // Function to get page title based on current pathname
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
    return null // Don't show title for unknown pages
  }
  
  // Team context state (replaces individual credit balance)
  const [teamContext, setTeamContext] = useState<TeamContext | null>(null)
  const [contextLoading, setContextLoading] = useState(true)
  
  // Balloons ref for triggering animation
  const balloonsRef = useRef<{ launchAnimation: () => void }>(null)
  
  // Memoized dynamic user data to prevent flash
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

    return {
      displayName: getDisplayName(),
      companyName: getCompanyName()
    }
  }, [user, isLoading])
  
  // Load team context (replaces individual credit balance)
  useEffect(() => {
    const loadTeamContext = async () => {
      if (!user || !isBrandUser) {
        setContextLoading(false)
        return
      }

      try {
        // First check for stored team context
        const storedContext = teamApiService.getStoredTeamContext()
        if (storedContext) {
          setTeamContext(storedContext)
          setContextLoading(false)
          return
        }

        // If no stored context, try to fetch from API
        const result = await teamApiService.getTeamContext()

        
        if (result.success && result.data) {

          setTeamContext(result.data)
          teamApiService.updateTeamContext(result.data)
        } else {

          setTeamContext(null)
        }
      } catch (error) {

        setTeamContext(null)
      } finally {
        setContextLoading(false)
      }
    }

    loadTeamContext()

    // Listen for team context updates
    const handleTeamContextUpdate = (event: CustomEvent<TeamContext>) => {
      setTeamContext(event.detail)
    }

    window.addEventListener('teamContextUpdated', handleTeamContextUpdate as EventListener)
    return () => {
      window.removeEventListener('teamContextUpdated', handleTeamContextUpdate as EventListener)
    }
  }, [user, isBrandUser])


  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {isDashboard && userDisplayData && userDisplayData.displayName && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">Welcome,</span>
            <span className="text-sm text-muted-foreground font-medium">{userDisplayData.displayName}</span>
            {userDisplayData.companyName && (
              <>
                <span className="text-sm text-muted-foreground font-medium">•</span>
                <span className="text-sm text-muted-foreground font-medium">{userDisplayData.companyName}</span>
              </>
            )}
          </div>
        )}
        {!isDashboard && getPageTitle() && (
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold">{getPageTitle()}</h1>
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">

          {/* Superadmin Badge */}
          {user && (user.role === 'superadmin' || user.role === 'admin') && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-normal text-muted-foreground border-muted-foreground/30">
              SUPERADMIN
            </Badge>
          )}

          {/* Live Team Context Display for Brand Users */}
          {isBrandUser && user && !contextLoading && teamContext && (
            <div className="flex items-center gap-2">
              {/* Team subscription tier */}
              <Badge variant="outline" className="text-xs">
                <Crown className="w-3 h-3 mr-1" />
                {teamContext.subscription_tier.charAt(0).toUpperCase() + teamContext.subscription_tier.slice(1)}
              </Badge>
            </div>
          )}
          
          {/* Fallback for non-team users */}
          {isBrandUser && user && !contextLoading && !teamContext && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Crown className="w-3 h-3 mr-1" />
                {user.role?.replace('brand_', '') || 'Free'}
              </Badge>
            </div>
          )}
          
          {/* Loading state */}
          {isBrandUser && contextLoading && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Loading...
              </Badge>
            </div>
          )}
          

          {/* Navigation Icons Group */}
          <div className="flex items-center gap-1">
            {/* Balloon Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => balloonsRef.current?.launchAnimation()}
                    title="Launch celebration balloons!"
                  >
                    <PartyPopper className="h-[1.2rem] w-[1.2rem]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Launch balloons</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <ModeToggle />

            {/* Sign out button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      logout()
                      router.push('/auth/login')
                    }}
                    aria-label="Sign out"
                  >
                    <LogOut className="h-[1.2rem] w-[1.2rem]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Sign out</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {/* Balloons Component */}
      <Balloons ref={balloonsRef} />
    </header>
  )
}
