"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconReport,
  IconSettings,
  IconUsers,
  IconTarget,
  IconCreditCard,
  IconCompass,
  IconList,
  IconFileText,
} from "@tabler/icons-react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
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
import { Button } from "@/components/ui/button"

const data = {
  searchAnalytics: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Discovery",
      url: "/discover",
      icon: IconCompass,
    },
    {
      title: "Creators",
      url: "/creators",
      icon: IconUsers,
    },
  ],
  management: [
    {
      title: "Campaigns",
      url: "/campaigns",
      icon: IconTarget,
    },
    {
      title: "Lists",
      url: "/my-lists",
      icon: IconList,
    },
    {
      title: "Proposals",
      url: "/brand-proposals",
      icon: IconFileText,
    },
  ],
  more: [
    {
      title: "Billing",
      url: "/billing",
      icon: IconCreditCard,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Help & Support",
      url: "#",
      icon: IconHelp,
    },
  ],
}

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useEnhancedAuth()

  // Dynamic user data - avoid hardcoded values
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
      return null // No fallback to avoid hardcoded values
    }

    return {
      name: getDisplayName(),
      email: user.email,
      avatar: user.profile_picture_url || null,
      avatar_config: user.avatar_config,
    }
  }, [user])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
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
        {/* Search & Analytics Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Search & Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.searchAnalytics} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.management} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* More Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>More</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.more} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!isLoading && dynamicUser && (
          <NavUser
            key={`nav-user-${JSON.stringify(user?.avatar_config) || 'default'}`}
            user={dynamicUser}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
