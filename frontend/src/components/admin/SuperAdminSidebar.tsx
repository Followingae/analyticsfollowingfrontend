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
  ShieldCheck,
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
  ListTodo,
  Bell,
  MailCheck,
  MessageCircle,
  Wallet,
  Image as ImageIcon,
  Activity,
} from "lucide-react"

export function SuperAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useEnhancedAuth()
  const { can, isSuperAdmin } = useAdminAccess()
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

  // Six working surfaces plus Settings.
  //
  // Nothing was deleted to get here: every screen that existed before is still reachable,
  // it just hangs off the surface it belongs to instead of competing for attention in a
  // thirty-item list. Anything not surfaced directly stays one keystroke away in ⌘K.
  // Each group is still gated by an admin module; super_admin sees everything.
  const overviewItems = [
    { title: "Today", url: "/work/today", icon: ListChecks },
    // Staff have their own task list (content uploads assigned to them). Founders do not,
    // so it only appears for the people it belongs to rather than as a dead link.
    ...(!isSuperAdmin ? [{ title: "My tasks", url: "/staff", icon: ListTodo }] : []),
  ]

  const managementItems = [
    ...(can("campaigns") || can("proposals") ? [{
      title: "Pipeline",
      url: "/superadmin/proposals",
      icon: Megaphone,
      items: [
        ...(can("proposals") ? [{ title: "Proposals", url: "/superadmin/proposals" }] : []),
        ...(can("proposals") ? [{ title: "Create proposal", url: "/superadmin/proposals/create" }] : []),
        ...(can("campaigns") ? [{ title: "Campaigns", url: "/superadmin/campaigns" }] : []),
        ...(can("campaigns") ? [{ title: "Create campaign", url: "/superadmin/campaigns/create" }] : []),
        ...(can("campaigns") ? [{ title: "Reports", url: "/superadmin/report-campaigns" }] : []),
        ...(can("fa") ? [{ title: "App campaigns", url: "/superadmin/fa/campaigns" }] : []),
        // Production already renders inside this shell; it was simply never in the nav,
        // which is what made it feel like a separate system.
        ...(can("operations") ? [{ title: "Production", url: "/ops/campaigns" }] : []),
      ],
    }] : []),
    ...(can("clients") ? [{
      title: "Clients",
      url: "/superadmin/clients",
      icon: Building2,
      items: [
        { title: "All clients", url: "/superadmin/clients" },
        { title: "Brand heartbeat", url: "/work/brands" },
      ],
    }] : []),
    ...(can("influencers") ? [{
      title: "Creators",
      url: "/superadmin/influencers",
      icon: Database,
      items: [
        { title: "Master database", url: "/superadmin/influencers" },
        { title: "Waiting room", url: "/superadmin/influencers/review" },
        { title: "Sourcing rounds", url: "/work/sourcing" },
        { title: "Coverage", url: "/work/coverage" },
        { title: "Lists", url: "/superadmin/influencers/lists" },
        { title: "Analyzed creators", url: "/superadmin/influencers/analyzed" },
        { title: "Add / import", url: "/superadmin/influencers/add" },
        ...(can("fa") ? [{ title: "App members", url: "/superadmin/fa/members" }] : []),
        ...(can("fa") ? [{ title: "Reliability", url: "/superadmin/fa/reliability" }] : []),
      ],
    }] : []),
    // Everything awaiting a human decision, in one place. These queues previously existed in
    // three: Operations, the FA section, and the ops shell.
    {
      title: "Queues",
      url: "/superadmin/operations",
      icon: ClipboardCheck,
      items: [
        ...(can("operations") ? [{ title: "All queues", url: "/superadmin/operations" }] : []),
        ...(can("fa") ? [{ title: "Content review", url: "/superadmin/fa/deliverables" }] : []),
        ...(can("fa") ? [{ title: "Receipt claims", url: "/superadmin/fa/receipt-claims" }] : []),
        ...(can("fa") ? [{ title: "Withdrawals", url: "/superadmin/fa/withdrawals" }] : []),
        ...(can("influencers") ? [{ title: "Creator approvals", url: "/superadmin/influencers/review" }] : []),
      ],
    },
    ...(can("billing") ? [{
      title: "Money",
      url: "/superadmin/billing",
      icon: Banknote,
      items: [
        { title: "Billing & revenue", url: "/superadmin/billing" },
        { title: "Creator payments", url: "/work/payables" },
        ...(can("fa") ? [{ title: "Creator wallets", url: "/superadmin/fa/wallets" }] : []),
      ],
    }] : []),
    { title: "Creator team", url: "/work/team", icon: Users },
    { title: "Goals", url: "/work/goals", icon: BarChart3 },
  ]

  const campaignItems: never[] = []
  const followingAppItems: never[] = []

  // Settings: the plumbing. Real screens, just not competing with daily work.
  const systemItems = [
    ...(can("users") ? [{ title: "Users", url: "/superadmin/users", icon: Users }] : []),
    ...(can("users") ? [{ title: "Staff", url: "/superadmin/staff", icon: ShieldCheck }] : []),
    ...(can("fa") ? [{ title: "Merchants", url: "/superadmin/fa/merchants", icon: Store }] : []),
    ...(can("fa") ? [{ title: "App activity", url: "/superadmin/fa/activity", icon: Activity }] : []),
    ...(can("fa") ? [{ title: "Ad banners", url: "/superadmin/fa/ad-banners", icon: ImageIcon }] : []),
    ...(can("fa") ? [{ title: "App notifications", url: "/superadmin/fa/notifications", icon: Bell }] : []),
    ...(can("system") ? [{ title: "Email alerts", url: "/superadmin/notifications", icon: MailCheck }] : []),
    ...(can("system") ? [{ title: "WhatsApp", url: "/superadmin/whatsapp", icon: MessageCircle }] : []),
    ...(can("system") ? [{ title: "System", url: "/superadmin/system", icon: Wrench }] : []),
    { title: "Dashboard", url: "/superadmin", icon: BarChart3 },
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

        {/* The working surfaces */}
        {managementItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Work</SidebarGroupLabel>
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

        {/* Settings — the plumbing, kept out of the daily path */}
        {systemItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
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