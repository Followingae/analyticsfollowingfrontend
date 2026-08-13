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

  Bell,
  MailCheck,
  MessageCircle,
  Wallet,
  Image as ImageIcon,
  Activity,
} from "lucide-react"

export function SuperAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useEnhancedAuth()
  const { can, isSuperAdmin, canSeeCost } = useAdminAccess()
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
  ]

  const managementItems = [
    ...(can("campaigns") || can("proposals") ? [{
      title: "Pipeline",
      url: "/work/proposals",
      icon: Megaphone,
      items: [
        ...(can("proposals") ? [{ title: "Proposals", url: "/work/proposals" }] : []),
        ...(can("proposals") ? [{ title: "Create proposal", url: "/work/proposals/create" }] : []),
        ...(can("campaigns") ? [{ title: "Campaigns", url: "/work/campaigns" }] : []),
        ...(can("campaigns") ? [{ title: "Create campaign", url: "/work/campaigns/create" }] : []),
        ...(can("campaigns") ? [{ title: "Reports", url: "/work/report-campaigns" }] : []),
        ...(can("fa") ? [{ title: "App campaigns", url: "/work/fa/campaigns" }] : []),
        // Production already renders inside this shell; it was simply never in the nav,
        // which is what made it feel like a separate system.
        ...(can("operations") ? [{ title: "Production", url: "/ops/campaigns" }] : []),
      ],
    }] : []),
    ...(can("clients") ? [{
      title: "Clients",
      url: "/work/clients",
      icon: Building2,
      items: [
        { title: "All clients", url: "/work/clients" },
        { title: "Brand heartbeat", url: "/work/brands" },
      ],
    }] : []),
    ...(can("influencers") ? [{
      title: "Creators",
      url: "/work/influencers",
      icon: Database,
      items: [
        { title: "Master database", url: "/work/influencers" },
        { title: "Waiting room", url: "/work/influencers/review" },
        { title: "Sourcing rounds", url: "/work/sourcing" },
        { title: "Coverage", url: "/work/coverage" },
        { title: "Lists", url: "/work/influencers/lists" },
        { title: "Analyzed creators", url: "/work/influencers/analyzed" },
        { title: "Add / import", url: "/work/influencers/add" },
        ...(can("fa") ? [{ title: "App members", url: "/work/fa/members" }] : []),
        ...(can("fa") ? [{ title: "Reliability", url: "/work/fa/reliability" }] : []),
      ],
    }] : []),
    // Everything awaiting a human decision, in one place. These queues previously existed in
    // three: Operations, the FA section, and the ops shell.
    ...(can("operations") || can("fa") || can("influencers") ? [{
      title: "Queues",
      url: "/work/operations",
      icon: ClipboardCheck,
      items: [
        ...(can("operations") ? [{ title: "All queues", url: "/work/operations" }] : []),
        ...(can("fa") ? [{ title: "Content review", url: "/work/fa/deliverables" }] : []),
        ...(can("fa") && canSeeCost ? [{ title: "Receipt claims", url: "/work/fa/receipt-claims" }] : []),
        ...(can("fa") && canSeeCost ? [{ title: "Withdrawals", url: "/work/fa/withdrawals" }] : []),
      ],
    }] : []),
    ...(can("billing") || can("influencers") ? [{
      title: "Money",
      url: "/work/billing",
      icon: Banknote,
      items: [
        ...(can("billing") ? [{ title: "Billing & revenue", url: "/work/billing" }] : []),
        // Creator payments are cost. Talent negotiate it and leadership own it; an account
        // manager who opened this would be refused by the server, so we do not offer it.
        ...(can("influencers") ? [{ title: "Creator payments", url: "/work/payables" }] : []),
        ...(can("fa") ? [{ title: "Creator wallets", url: "/work/fa/wallets" }] : []),
      ],
    }] : []),
    // A view of how colleagues are doing belongs to whoever manages them.
    ...(can("users") ? [{ title: "Creator team", url: "/work/team", icon: Users }] : []),
    ...(can("influencers") ? [{ title: "Goals", url: "/work/goals", icon: BarChart3 }] : []),
  ]

  // Settings: the plumbing. Real screens, just not competing with daily work.
  const systemItems = [
    ...(can("users") ? [{ title: "Users", url: "/work/users", icon: Users }] : []),
    ...(can("users") ? [{ title: "Staff", url: "/work/staff", icon: ShieldCheck }] : []),
    ...(can("fa") ? [{ title: "Merchants", url: "/work/fa/merchants", icon: Store }] : []),
    ...(can("fa") ? [{ title: "App activity", url: "/work/fa/activity", icon: Activity }] : []),
    ...(can("fa") ? [{ title: "Ad banners", url: "/work/fa/ad-banners", icon: ImageIcon }] : []),
    ...(can("fa") ? [{ title: "App notifications", url: "/work/fa/notifications", icon: Bell }] : []),
    ...(can("system") ? [{ title: "Email alerts", url: "/work/notifications", icon: MailCheck }] : []),
    ...(can("system") ? [{ title: "WhatsApp", url: "/work/whatsapp", icon: MessageCircle }] : []),
    ...(can("system") ? [{ title: "System", url: "/work/system", icon: Wrench }] : []),
  ]

  // Content pages not yet built; dead links removed.
  // Backend endpoints exist at /admin/content/profiles and /admin/content/unlocks
  // but frontend pages haven't been created yet.

  // Resolve the single active item as the LONGEST nav URL matching the current
  // path (across every group + sub-item). Without this, section roots like
  // /superadmin and /superadmin/fa prefix-match and light up on every nested page.
  const activeUrl = React.useMemo(() => {
    // Sub-items came from campaignItems, which is permanently empty — so a nested page like
    // /work/proposals/create highlighted its parent instead of itself. Collect them from the
    // group that actually has children.
    const urls = [
      ...overviewItems,
      ...managementItems,
      ...managementItems.flatMap((i: { items?: { url: string }[] }) => i.items ?? []),
      ...systemItems,
    ]
      .map((i) => i.url)
      .filter(Boolean) as string[]
    return urls
      .filter((url) => pathname === url || pathname.startsWith(url + "/"))
      .sort((a, b) => b.length - a.length)[0]
  }, [pathname, overviewItems, managementItems, systemItems])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/work/today" className="flex items-center">
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

        {/* Following App Section */}

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