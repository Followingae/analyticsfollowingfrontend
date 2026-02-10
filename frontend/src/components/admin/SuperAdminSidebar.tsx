"use client"

import * as React from "react"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { NavMain } from "@/components/nav-main"
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
import {
  Shield,
  BarChart3,
  Users,
  DollarSign,
  Database,
  Lock,
  Briefcase,
} from "lucide-react"

export function SuperAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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

  // ONLY items we have endpoints for
  const overviewItems = [
    {
      title: "Dashboard",
      url: "/superadmin",
      icon: BarChart3,
    },
  ]

  const managementItems = [
    {
      title: "Users",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Billing",
      url: "/admin/billing",
      icon: DollarSign,
    },
    {
      title: "HRM",
      url: "/admin/hrm",
      icon: Briefcase,
    },
  ]

  const contentItems = [
    {
      title: "Profiles",
      url: "/admin/content/profiles",
      icon: Database,
    },
    {
      title: "Unlocks",
      url: "/admin/content/unlocks",
      icon: Lock,
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/superadmin" className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="ml-2 flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Superadmin</span>
                  <span className="text-xs text-muted-foreground">Control Panel</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Overview Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={overviewItems} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={managementItems} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Content Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={contentItems} />
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