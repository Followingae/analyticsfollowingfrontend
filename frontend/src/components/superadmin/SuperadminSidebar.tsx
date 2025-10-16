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
  IconCurrencyDollar,
  IconSearch,
  IconTool,
  IconHeartHandshake,
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
        title: "Users",
        url: "/superadmin/users",
        icon: IconUsers,
      },
      {
        title: "Security",
        url: "/superadmin/security",
        icon: IconShield,
      },
      {
        title: "Analytics",
        url: "/superadmin/analytics",
        icon: IconChartBar,
        items: [
          {
            title: "Completeness",
            url: "/superadmin/analytics/completeness",
          },
          {
            title: "Scan Profiles",
            url: "/superadmin/analytics/completeness/scan",
          },
          {
            title: "Repair Profiles",
            url: "/superadmin/analytics/completeness/repair",
          },
          {
            title: "System Health",
            url: "/superadmin/analytics/completeness/health",
          }
        ]
      }
    ]

    const platformOversight = [
      {
        title: "Influencers",
        url: "/superadmin/influencers",
        icon: IconDatabase,
      },
      {
        title: "Proposals",
        url: "/admin/proposals",
        icon: IconFileText,
        items: [
          {
            title: "Overview",
            url: "/admin/proposals",
          },
          {
            title: "Create",
            url: "/admin/proposals/create",
          },
          {
            title: "Pricing",
            url: "/admin/proposals/pricing",
          },
          {
            title: "Campaigns",
            url: "/admin/proposals/campaigns",
          }
        ]
      },
      {
        title: "Billing",
        url: "/superadmin/credits",
        icon: IconCreditCard,
      },
      {
        title: "Currency",
        url: "/superadmin/currency",
        icon: IconCurrencyDollar,
      }
    ]

    const communications = [
      {
        title: "Workers",
        url: "/superadmin/workers",
        icon: IconServer,
      },
      {
        title: "Notifications",
        url: "/superadmin/notifications",
        icon: IconBell,
      },
      {
        title: "Logs",
        url: "/superadmin/logs",
        icon: IconActivity,
      }
    ]

    const administration = [
      {
        title: "Settings",
        url: "/superadmin/settings",
        icon: IconSettings,
      },
      {
        title: "Access",
        url: "/superadmin/access",
        icon: IconLock,
      }
    ]

    return { systemManagement, platformOversight, communications, administration }
  }

  const data = getNavigationData()

  return (
    <Sidebar
      collapsible="icon"
      className="border-r"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/" className="flex items-center">
                <ThemeLogo />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Core Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Core</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.systemManagement} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Platform Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.platformOversight} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Monitoring Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Monitoring</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.communications} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
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