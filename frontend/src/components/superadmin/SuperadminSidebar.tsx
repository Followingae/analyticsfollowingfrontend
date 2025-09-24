"use client"

import * as React from "react"
import {
  IconShield,
  IconDashboard,
  IconUsers,
  IconSettings,
  IconChartBar,
  IconDatabase,
  IconBell,
  IconReport,
  IconLock,
  IconActivity,
  IconCreditCard,
  IconMail,
  IconFileText,
  IconServer,
} from "@tabler/icons-react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

function ThemeLogo() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <Image 
        src="/followinglogo.svg" 
        alt="Following Logo" 
        width={128} 
        height={40}
        className="object-contain w-28 h-10"
      />
    )
  }
  
  const isDark = resolvedTheme === 'dark' || theme === 'dark'
  const logoSrc = isDark ? "/Following Logo Dark Mode.svg" : "/followinglogo.svg"
  
  return (
    <Image 
      src={logoSrc}
      alt="Following Logo" 
      width={128} 
      height={40}
      className="object-contain w-28 h-10"
    />
  )
}

export function SuperadminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useEnhancedAuth()

  // Dynamic user data
  const dynamicUser = React.useMemo(() => {
    if (!user) return null
    
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
      return null
    }

    return {
      name: getDisplayName(),
      email: user.email,
      avatar: user.profile_picture_url || null,
      avatar_config: user.avatar_config,
    }
  }, [user])

  // Superadmin navigation items
  const getNavigationData = () => {
    const systemManagement = [
      {
        title: "Dashboard",
        url: "/superadmin",
        icon: IconDashboard,
      },
      {
        title: "User Management",
        url: "/superadmin/users",
        icon: IconUsers,
      },
      {
        title: "Security & System Health",
        url: "/superadmin/security",
        icon: IconShield,
      },
      {
        title: "Analytics & Reports",
        url: "/superadmin/analytics",
        icon: IconChartBar,
      }
    ]

    const platformOversight = [
      {
        title: "Influencer Database",
        url: "/superadmin/influencers",
        icon: IconDatabase,
      },
      {
        title: "Proposal Management",
        url: "/superadmin/proposals",
        icon: IconFileText,
      },
      {
        title: "Credits & Billing",
        url: "/superadmin/credits",
        icon: IconCreditCard,
      }
    ]

    const communications = [
      {
        title: "System Notifications",
        url: "/superadmin/notifications",
        icon: IconBell,
      },
      {
        title: "Activity Logs",
        url: "/superadmin/logs",
        icon: IconActivity,
      }
    ]

    const administration = [
      {
        title: "Platform Settings",
        url: "/superadmin/settings",
        icon: IconSettings,
      },
      {
        title: "Access Control",
        url: "/superadmin/access",
        icon: IconLock,
      }
    ]

    return { systemManagement, platformOversight, communications, administration }
  }

  const data = getNavigationData()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/" className="flex items-center gap-2">
                <ThemeLogo />
                <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  SUPERADMIN
                </Badge>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {/* System Management Section */}
        <SidebarGroup>
          <SidebarGroupLabel>System Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.systemManagement} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Platform Oversight Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform Oversight</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.platformOversight} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Communications Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Communications</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.communications} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.administration} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        {!isLoading && dynamicUser && dynamicUser.name && (
          <NavUser 
            key={`nav-user-${JSON.stringify(user?.avatar_config) || 'default'}`}
            user={dynamicUser} 
          />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}