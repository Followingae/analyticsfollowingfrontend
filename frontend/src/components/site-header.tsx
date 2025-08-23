"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationBell } from "@/components/ui/notification"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/contexts/NotificationContext"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { useMemo, useState, useEffect } from "react"
import { Crown, Coins } from "lucide-react"
import { creditsApiService, CreditBalance } from "@/services/creditsApi"
import { teamApiService, TeamContext } from "@/services/teamApi"

export function SiteHeader() {
  const pathname = usePathname()
  const isDashboard = pathname === '/' || pathname === '/dashboard'
  const { user, isLoading } = useAuth()
  const { user: enhancedUser, isBrandUser } = useEnhancedAuth()
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  
  // Team context state (replaces individual credit balance)
  const [teamContext, setTeamContext] = useState<TeamContext | null>(null)
  const [contextLoading, setContextLoading] = useState(true)
  
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
        console.log('🎯 SiteHeader: Team Context API Response:', result)
        
        if (result.success && result.data) {
          console.log('🎯 SiteHeader: Team Context Data:', result.data)
          setTeamContext(result.data)
          teamApiService.updateTeamContext(result.data)
        } else {
          console.log('🎯 SiteHeader: No team context or API failed:', result.error)
          setTeamContext(null)
        }
      } catch (error) {
        console.error('Failed to load team context:', error)
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

  const getCurrentDate = () => {
    const today = new Date()
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = days[today.getDay()]
    const day = today.getDate().toString().padStart(2, '0')
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const year = today.getFullYear()
    
    return `${dayName}, ${day}/${month}/${year}`
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {!isDashboard && userDisplayData && userDisplayData.displayName && (
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight">Welcome,</span>
            <span className="text-base font-bold tracking-tight">{userDisplayData.displayName}</span>
            {userDisplayData.companyName && (
              <>
                <span className="text-base font-bold tracking-tight">•</span>
                <span className="text-base font-bold tracking-tight">{userDisplayData.companyName}</span>
              </>
            )}
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">
          <div className="text-sm text-muted-foreground font-medium">
            {getCurrentDate()}
          </div>
          
          {/* Live Team Context Display for Brand Users */}
          {isBrandUser && enhancedUser && !contextLoading && teamContext && (
            <div className="flex items-center gap-2">
              {/* Team subscription tier */}
              <Badge variant="outline" className="text-xs">
                <Crown className="w-3 h-3 mr-1" />
                {teamContext.subscription_tier.charAt(0).toUpperCase() + teamContext.subscription_tier.slice(1)} Team
              </Badge>
              
              {/* User role in team */}
              <Badge variant="secondary" className="text-xs">
                {teamContext.user_role === 'owner' ? '👑 Owner' : '👤 Member'}
              </Badge>
              
              {/* Team usage summary - profiles remaining */}
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {teamContext.remaining_capacity.profiles} profiles left
              </Badge>
            </div>
          )}
          
          {/* Fallback for non-team users */}
          {isBrandUser && enhancedUser && !contextLoading && !teamContext && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Crown className="w-3 h-3 mr-1" />
                {enhancedUser.role?.replace('brand_', '') || 'Free'}
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
          
          <NotificationBell
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDelete={deleteNotification}
          />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
