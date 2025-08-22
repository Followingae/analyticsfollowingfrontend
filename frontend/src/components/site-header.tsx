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

export function SiteHeader() {
  const pathname = usePathname()
  const isDashboard = pathname === '/' || pathname === '/dashboard'
  const { user, isLoading } = useAuth()
  const { user: enhancedUser, isBrandUser } = useEnhancedAuth()
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  
  // Real credit balance state
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null)
  const [creditLoading, setCreditLoading] = useState(true)
  
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
  
  // Load real credit balance
  useEffect(() => {
    const loadCreditBalance = async () => {
      if (!user || !isBrandUser) {
        setCreditLoading(false)
        return
      }

      try {
        const result = await creditsApiService.getBalance()
        console.log('🎯 SiteHeader: Credit API Response:', result)
        
        if (result.success && result.data) {
          console.log('🎯 SiteHeader: Credit Balance Data:', result.data)
          setCreditBalance(result.data)
        } else {
          console.log('🎯 SiteHeader: No credit data or API failed:', result.error)
          // API call succeeded but no data - user might not have a credit wallet yet
          setCreditBalance(null)
        }
      } catch (error) {
        console.error('Failed to load credit balance:', error)
        setCreditBalance(null)
      } finally {
        setCreditLoading(false)
      }
    }

    loadCreditBalance()
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
          
          {/* Live Tier and Credit Display for Brand Users */}
          {isBrandUser && enhancedUser && !creditLoading && (
            <div className="flex items-center gap-2">
              {/* Real plan name from credit API */}
              <Badge variant="outline" className="text-xs">
                <Crown className="w-3 h-3 mr-1" />
                {creditBalance?.package_name || enhancedUser.role?.replace('brand_', '') || 'Free'}
              </Badge>
              
              {/* Real credit balance */}
              {creditBalance && creditBalance.current_balance !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  <Coins className="w-3 h-3 mr-1" />
                  {creditBalance.current_balance.toLocaleString()}
                </Badge>
              )}
              
              {/* Monthly allowance for users with allowances */}
              {creditBalance && creditBalance.monthly_allowance > 0 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {creditBalance.monthly_allowance} monthly
                </Badge>
              )}
            </div>
          )}
          
          {/* Loading state */}
          {isBrandUser && creditLoading && (
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
