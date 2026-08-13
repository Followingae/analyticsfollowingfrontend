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
  Users2,
  Inbox,

  Bell,
  MailCheck,
  MessageCircle,
  Wallet,
  Image as ImageIcon,
  Activity,
} from "lucide-react"

export function SuperAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useEnhancedAuth()
  const { can, isSuperAdmin, canSeeCost, staffRole } = useAdminAccess()
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
  // ── Six destinations ─────────────────────────────────────────────────────────────────
  //
  // This was forty-four entries. Forty-four is not a menu, it is a filing cabinet, and the
  // people who have to use it every day could not tell what they were looking at. Almost
  // none of those entries were places: they were jobs done on one of six things. So the nav
  // is now the six things, and the jobs are tabs inside them.
  //
  // Nothing was removed. Every screen still exists at its own URL and is reachable from the
  // hub it belongs to, from search, or from the object it hangs off. What changed is that a
  // talent manager opens a sidebar with five items in it instead of twenty.
  const overviewItems = [
    { title: "Today", url: "/work/today", icon: ListChecks },
    // Everything waiting on a decision from this person, wherever it came from. Ungated on
    // purpose: the page shows only the queues the viewer's role can act on, and for someone
    // with none it says so rather than hiding.
    { title: "Inbox", url: "/work/inbox", icon: Inbox },
  ]

  const managementItems = [
    ...(can("clients") || can("proposals") ? [{
      title: "Clients",
      url: "/work/clients",
      icon: Building2,
    }] : []),
    ...(can("campaigns") || can("operations") || can("fa") ? [{
      title: "Campaigns",
      url: "/work/campaigns",
      icon: Megaphone,
    }] : []),
    ...(can("influencers") || can("fa") ? [{
      title: "Creators",
      url: "/work/creators",
      icon: Users2,
    }] : []),
    ...(can("billing") || can("influencers") ? [{
      title: "Money",
      url: "/work/money",
      icon: Banknote,
    }] : []),
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
      // Hubs have no sub-items now — the jobs live as tabs inside each hub.
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
                  <span className="font-semibold">Following</span>
                  {/* A talent manager is not a superadmin, and telling her she is every time
                      she opens the platform is both wrong and slightly alarming. */}
                  <span className="text-xs capitalize text-muted-foreground">
                    {staffRole ? String(staffRole).replace(/_/g, " ") : "Control panel"}
                  </span>
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