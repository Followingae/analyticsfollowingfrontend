import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useMemo } from "react"

export function SiteHeader() {
  const pathname = usePathname()
  const isDashboard = pathname === '/' || pathname === '/dashboard'
  const { user, isLoading } = useAuth()
  
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
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
