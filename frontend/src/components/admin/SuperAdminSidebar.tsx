"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useAdminAccess } from "@/hooks/useAdminAccess"
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
  Coins,
  Database,
  Briefcase,
  FileText,
  LayoutDashboard,
  Store,
  Megaphone,
  ClipboardCheck,
  Banknote,
  Building2,
  Wrench,
  Receipt,
  ListChecks,
  Bell,
} from "lucide-react"

export function SuperAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useEnhancedAuth()
  const { can } = useAdminAccess()
  const pathname = usePathname() || ""

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

  // Each group is gated by an admin module; super_admin sees everything.
  const overviewItems = [
    { title: "Dashboard", url: "/superadmin", icon: BarChart3 },
    ...(can("operations") ? [{ title: "Operations", url: "/superadmin/operations", icon: ListChecks }] : []),
  ]

  const managementItems = [
    ...(can("clients") ? [{ title: "Clients", url: "/superadmin/clients", icon: Building2 }] : []),
    ...(can("users") ? [{ title: "Users", url: "/superadmin/users", icon: Users }] : []),
  ]

  const campaignItems = [
    ...(can("campaigns") ? [{
      title: "Campaigns",
      url: "/superadmin/campaigns",
      icon: Megaphone,
      items: [
        { title: "All Campaigns", url: "/superadmin/campaigns" },
        { title: "Create Campaign", url: "/superadmin/campaigns/create" },
      ],
    }] : []),
    ...(can("proposals") ? [{
      title: "Proposals",
      url: "/superadmin/proposals",
      icon: FileText,
      items: [
        { title: "All Proposals", url: "/superadmin/proposals" },
        { title: "Create Proposal", url: "/superadmin/proposals/create" },
      ],
    }] : []),
    ...(can("influencers") ? [{
      title: "Influencer Database",
      url: "/superadmin/influencers",
      icon: Database,
      items: [
        { title: "Master Database", url: "/superadmin/influencers" },
        { title: "Analyzed Creators", url: "/superadmin/influencers/analyzed" },
        { title: "Add / Import", url: "/superadmin/influencers/add" },
      ],
    }] : []),
  ]

  const followingAppItems = can("fa") ? [
    { title: "Overview", url: "/superadmin/fa", icon: LayoutDashboard },
    { title: "Members", url: "/superadmin/fa/members", icon: Users },
    { title: "Merchants", url: "/superadmin/fa/merchants", icon: Store },
    { title: "FA Campaigns", url: "/superadmin/fa/campaigns", icon: Megaphone },
    { title: "Deliverables", url: "/superadmin/fa/deliverables", icon: ClipboardCheck },
    { title: "Withdrawals", url: "/superadmin/fa/withdrawals", icon: Banknote },
    { title: "Receipt Claims", url: "/superadmin/fa/receipt-claims", icon: Receipt },
    { title: "Notifications", url: "/superadmin/fa/notifications", icon: Bell },
  ] : []

  const systemItems = [
    ...(can("billing") ? [{ title: "Billing", url: "/superadmin/billing", icon: Banknote }] : []),
    ...(can("system") ? [{ title: "System", url: "/superadmin/system", icon: Wrench }] : []),
  ]

  // Content pages not yet built; dead links removed.
  // Backend endpoints exist at /admin/content/profiles and /admin/content/unlocks
  // but frontend pages haven't been created yet.

  // Resolve the single active item as the LONGEST nav URL matching the current
  // path (across every group + sub-item). Without this, section roots like
  // /superadmin and /superadmin/fa prefix-match and light up on every nested page.
  const activeUrl = React.useMemo(() => {
    const urls = [
      ...overviewItems,
      ...managementItems,
      ...campaignItems,
      ...campaignItems.flatMap((i) => i.items ?? []),
      ...followingAppItems,
      ...systemItems,
    ]
      .map((i) => i.url)
      .filter(Boolean) as string[]
    return urls
      .filter((url) => pathname === url || pathname.startsWith(url + "/"))
      .sort((a, b) => b.length - a.length)[0]
  }, [pathname, overviewItems, managementItems, campaignItems, followingAppItems, systemItems])

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
        {overviewItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Overview</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMain items={overviewItems} activeUrl={activeUrl} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Management Section */}
        {managementItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMain items={managementItems} activeUrl={activeUrl} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Campaigns & Proposals */}
        {campaignItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Campaigns</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMain items={campaignItems} activeUrl={activeUrl} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Following App Section */}
        {followingAppItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Following App</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMain items={followingAppItems} activeUrl={activeUrl} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* System Section */}
        {systemItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <NavMain items={systemItems} activeUrl={activeUrl} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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