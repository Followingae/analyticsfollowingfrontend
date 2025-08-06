"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconTarget,
  IconCreditCard,
  IconCompass,
} from "@tabler/icons-react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"

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
} from "@/components/ui/sidebar"

const data = {
  navMain: [
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
    {
      title: "Campaigns",
      url: "/campaigns",
      icon: IconTarget,
    },
  ],
  navSecondary: [
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
        width={120} 
        height={40}
        className="object-contain w-24 h-10"
      />
    )
  }
  
  const isDark = resolvedTheme === 'dark' || theme === 'dark'
  const logoSrc = isDark ? "/Following Logo Dark Mode.svg" : "/followinglogo.svg"
  
  return (
    <Image 
      src={logoSrc}
      alt="Following Logo" 
      width={0} 
      height={0}
      sizes="(min-width: 640px) 60vw, 60vw"
      className="object-contain w-4/5 h-auto max-w-full"
    />
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useAuth()

  // Dynamic user data - avoid hardcoded values
  const dynamicUser = React.useMemo(() => {
    console.log('🔍 AppSidebar: Recalculating dynamicUser with user:', user)
    console.log('🎨 AppSidebar: Current avatar_config:', user?.avatar_config)
    
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

    const result = {
      name: getDisplayName(),
      email: user.email,
      avatar: user.profile_picture_url || null,
      avatar_config: user.avatar_config,
    }
    
    console.log('🔍 AppSidebar: Final dynamicUser:', result)
    return result
  }, [user])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="flex justify-center items-center py-2">
        <SidebarMenu className="w-full flex justify-center">
          <SidebarMenuItem className="w-full flex justify-center">
            <SidebarMenuButton
              asChild
              className="w-full flex justify-center data-[slot=sidebar-menu-button]:!py-6 data-[slot=sidebar-menu-button]:!px-0"
            >
              <a className="w-2/5 flex justify-center">
                <ThemeLogo />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
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
