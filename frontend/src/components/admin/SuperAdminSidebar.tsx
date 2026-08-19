"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
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
  const { can, isSuperAdmin, canSeeCost, staffRole, isFullAccessStaff, loading: accessLoading } =
    useAdminAccess()
  const pathname = usePathname() || ""

  // What is waiting behind each entry. One call, keyed by the menu's own keys, so a bubble
  // never depends on a URL that might be renamed. Zeros never come back, so the menu is
  // quiet when the work is done.
  const [badges, setBadges] = React.useState<Record<string, number>>({})
  React.useEffect(() => {
    let alive = true
    fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/admin/today/badges`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (alive && j?.data) setBadges(j.data) })
      .catch(() => { /* the menu works without its numbers */ })
    return () => { alive = false }
  }, [pathname])

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
    { title: "Waiting on me", url: "/work/inbox", icon: Inbox },
  ]

  /**
   * The menu is the job, not the filing cabinet.
   *
   * Six nouns was fewer entries than the forty-four before them, but it still asked people to
   * know which noun their work lived under and then to find it behind two tab rows. So each
   * role now gets the handful of screens their day is actually made of, named after the job:
   * a talent manager opens "Creators needing a price", not Creators → Waiting room.
   *
   * Nothing is lost. Every screen keeps its address, the hub tabs still sit on top of the
   * screens themselves, and search reaches everything — which it could not do for staff until
   * the palette stopped mistaking them for brand customers.
   */
  // Permissions arrive a beat after the first paint. Until they do, show the two entries
  // everyone has rather than a menu that is briefly wrong for whoever is looking at it —
  // an ungated item rendered during that beat is an item shown to the wrong person.
  const talentOnly = !isSuperAdmin && staffRole === "talent_manager"
  const bizdevOnly = !isSuperAdmin && staffRole === "business_development"
  const accountOnly = !isSuperAdmin && staffRole === "account_manager"
  const leadership = isSuperAdmin || isFullAccessStaff

  const managementItems = accessLoading ? [] : talentOnly
    ? [
        { title: "Creators & rates", url: "/work/influencers", icon: Users2 },
        { title: "Creators needing a price", url: "/work/influencers/review", icon: Coins,
          badge: badges["needs-price"] },
        { title: "Brand rosters", url: "/work/areas", icon: Database },
        { title: "Campaigns", url: "/work/campaigns", icon: Megaphone },
        { title: "Creators to chase", url: "/work/chasing", icon: ClipboardCheck,
          badge: badges["chasing"] },
        { title: "Creator payments", url: "/work/payables", icon: Banknote,
          badge: badges["payables"] },
        { title: "My target", url: "/work/goals", icon: BarChart3 },
      ]
    : bizdevOnly
    ? [
        { title: "Brands", url: "/work/brands", icon: Building2, badge: badges["brands"] },
        { title: "Quotes", url: "/work/proposals", icon: FileText, badge: badges["proposals"] },
        { title: "Sample packs", url: "/work/areas?kind=sample", icon: Database },
      ]
    : accountOnly
    ? [
        { title: "My clients", url: "/work/clients", icon: Building2 },
        { title: "Quotes", url: "/work/proposals", icon: FileText },
        { title: "Campaigns", url: "/work/campaigns", icon: Megaphone },
        { title: "Late & chasing", url: "/work/chasing", icon: ClipboardCheck,
          badge: badges["chasing"] },
        { title: "Brand rosters", url: "/work/areas", icon: Database },
        { title: "App creators", url: "/work/fa/members", icon: Users2 },
      ]
    : [
        // Leadership: the six surfaces, plus the two decisions that are theirs alone and had
        // no entry anywhere — sign-offs, and the targets they set for everybody else.
        ...(can("clients") || can("proposals") ? [{
          title: "Clients", url: "/work/clients", icon: Building2,
        }] : []),
        ...(can("campaigns") || can("operations") || can("fa") ? [{
          title: "Campaigns", url: "/work/campaigns", icon: Megaphone,
        }] : []),
        ...(can("influencers") || can("fa") ? [{
          title: "Creators", url: "/work/creators", icon: Users2,
        }] : []),
        ...(can("billing") || can("influencers") ? [{
          title: "Money", url: "/work/money", icon: Banknote,
        }] : []),
        ...(leadership
          ? [{ title: "Sign-offs", url: "/work/approvals", icon: ClipboardCheck,
              badge: badges["signoffs"] }]
          : []),
      ]

  // Running the company: set once a month, read every week, and until now reachable only by
  // typing the address.
  const companyItems = accessLoading || !leadership
    ? []
    : [
        { title: "Daily targets", url: "/work/goals", icon: BarChart3 },
        { title: "My team", url: "/work/team", icon: Users },
        { title: "Office screens", url: "/work/system/displays", icon: Activity },
      ]

  // Settings: the plumbing. Real screens, just not competing with daily work. The four
  // Following-App entries are set-once screens, so they sit behind the app's own hub rather
  // than taking four rows off a client manager's menu.
  const systemItems = [
    ...(can("users") ? [{ title: "Users", url: "/work/users", icon: Users }] : []),
    ...(can("users") ? [{ title: "Staff", url: "/work/staff", icon: ShieldCheck }] : []),
    // A client manager's job is clients; the app's plumbing cost her four menu rows. It keeps
    // every address and stays in search — a founder still sees them listed out.
    ...(can("fa") && (isSuperAdmin || !accountOnly)
      ? [
          { title: "Merchants", url: "/work/fa/merchants", icon: Store },
          { title: "App activity", url: "/work/fa/activity", icon: Activity },
          { title: "Ad banners", url: "/work/fa/ad-banners", icon: ImageIcon },
          { title: "App notifications", url: "/work/fa/notifications", icon: Bell },
        ]
      : []),
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
      ...companyItems,
      // Hubs have no sub-items now — the jobs live as tabs inside each hub.
      ...systemItems,
    ]
      // An entry may carry a query (sample packs), which is not part of the path it matches.
      .map((i) => i.url?.split("?")[0])
      .filter(Boolean) as string[]
    return urls
      .filter((url) => pathname === url || pathname.startsWith(url + "/"))
      .sort((a, b) => b.length - a.length)[0]
  }, [pathname, overviewItems, managementItems, companyItems, systemItems])

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

        {/* Running the company — leadership's own screens, which had no entry at all */}
        {companyItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Running the company</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMain items={companyItems} activeUrl={activeUrl} />
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