"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { Skeleton } from "@/components/ui/skeleton"
import { shortName } from "@/lib/destinations"
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
  Send,
  Map,
  FileSignature,
  BookOpen,
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
    // Ungated. Everybody has a role and the manual describes all of them, so putting it
    // behind the permissions it explains would be a closed loop.
    { title: "The manual", url: "/work/guide", icon: BookOpen },
  ]

  /**
   * ONE menu, for everybody.
   *
   * What was here before: `managementItems` was a four-branch ternary, one arm per role,
   * each producing a structurally different menu, and all four rendered under the same
   * heading "Work". Two colleagues looking at the same product saw different words in a
   * different order, so neither could tell the other where anything was. A superadmin got
   * twenty-nine rows across five groups; a bizdev user got seven.
   *
   * Now there is one list in one order with one name per destination. A role changes which
   * entries are PRESENT and nothing else - never the wording, never the order, never the
   * grouping. That is what makes it possible to say "it's under Creators" and be understood.
   *
   * Names are not written here at all. `named()` fills every title from `destinations.ts`,
   * which is why the entries below carry a url and no label: a hand-typed name is how
   * /work/goals came to be "My target" in one arm and "Daily targets" twelve lines down.
   */
  const talentOnly = !isSuperAdmin && staffRole === "talent_manager"
  const bizdevOnly = !isSuperAdmin && staffRole === "business_development"
  const accountOnly = !isSuperAdmin && staffRole === "account_manager"
  const leadership = isSuperAdmin || isFullAccessStaff

  const scope = leadership ? "leadership"
    : talentOnly ? "talent"
    : bizdevOnly ? "business_development"
    : accountOnly ? "account"
    : "leadership"

  /** Any-of on modules, any-of on scopes, and leadership passes everything. */
  const allowed = (i: { modules?: string[]; scopes?: string[] }) => {
    if (i.modules && !i.modules.some(m => can(m as Parameters<typeof can>[0]))) return false
    if (i.scopes && !leadership && !i.scopes.includes(scope)) return false
    return true
  }

  type Entry = {
    url: string
    icon: typeof Users2
    badge?: string
    modules?: string[]
    scopes?: string[]
  }

  // The order is the order the work happens in: who we sell to, what we sell them, who
  // delivers it, what it costs and who signs it off.
  const WORK: Entry[] = [
    { url: "/work/clients", icon: Building2,
      modules: ["clients", "proposals"], scopes: ["leadership", "account"] },
    { url: "/work/brands", icon: Building2, badge: "brands",
      modules: ["clients"], scopes: ["leadership", "account", "business_development"] },
    { url: "/work/proposals", icon: FileText, badge: "proposals", modules: ["proposals"] },
    { url: "/work/share", icon: Send,
      modules: ["clients"], scopes: ["leadership", "account", "business_development"] },
    { url: "/work/areas", icon: Database, badge: "areas", modules: ["influencers"] },
    { url: "/work/influencers", icon: Users2, modules: ["influencers"] },
    { url: "/work/influencers/review", icon: Coins, badge: "needs-price",
      modules: ["influencers"], scopes: ["leadership", "talent"] },
    { url: "/work/coverage", icon: Map,
      modules: ["influencers"], scopes: ["leadership", "talent"] },
    { url: "/work/campaigns", icon: Megaphone,
      modules: ["campaigns", "operations", "fa"] },
    { url: "/work/chasing", icon: ClipboardCheck, badge: "chasing",
      modules: ["campaigns", "influencers"],
      scopes: ["leadership", "talent", "account"] },
    { url: "/work/enrolments", icon: FileSignature, badge: "enrolments",
      modules: ["influencers", "proposals"], scopes: ["leadership", "talent"] },
    { url: "/work/payables", icon: Banknote, badge: "payables",
      modules: ["influencers"], scopes: ["leadership", "talent"] },
    { url: "/work/money", icon: Wallet,
      modules: ["billing", "influencers"], scopes: ["leadership"] },
    { url: "/work/approvals", icon: ClipboardCheck, badge: "signoffs",
      scopes: ["leadership"] },
  ]

  const managementItems = accessLoading ? [] : WORK.filter(allowed).map(e => ({
    title: "", url: e.url, icon: e.icon,
    ...(e.badge ? { badge: badges[e.badge] } : {}),
  }))

  /**
   * Admin: three collapsed parents and the guide.
   *
   * These are categories, not destinations, so a parent is never also its own child - the
   * bug the brand sidebar still has, where clicking "Creators" opens a group containing an
   * item called "My Creators" pointing at the same page. Twelve rows of plumbing sit behind
   * three, and nothing has been taken away.
   */
  const companyChildren = leadership && !accessLoading
    ? [
        { title: shortName("/work/goals"), url: "/work/goals" },
        { title: shortName("/work/team"), url: "/work/team" },
        { title: shortName("/work/system/displays"), url: "/work/system/displays" },
      ]
    : []

  const appChildren = !accessLoading && can("fa") && (isSuperAdmin || !accountOnly)
    ? [
        "/work/fa/campaigns", "/work/fa/merchants", "/work/fa/members",
        "/work/fa/reliability", "/work/fa/activity", "/work/fa/ad-banners",
        "/work/fa/notifications",
      ].map(url => ({ title: shortName(url), url }))
    : []

  const settingsChildren = [
    ...(can("users") ? [{ title: shortName("/work/users"), url: "/work/users" }] : []),
    ...(can("users") ? [{ title: shortName("/work/staff"), url: "/work/staff" }] : []),
    ...(can("system") ? [{ title: shortName("/work/notifications"), url: "/work/notifications" }] : []),
    ...(can("system") ? [{ title: shortName("/work/whatsapp"), url: "/work/whatsapp" }] : []),
    ...(can("system") ? [{ title: shortName("/work/system"), url: "/work/system" }] : []),
  ]

  const systemItems = [
    ...(companyChildren.length
      ? [{ title: "Company", url: "#company", icon: BarChart3, items: companyChildren }] : []),
    ...(appChildren.length
      ? [{ title: "Creator app", url: "#app", icon: Store, items: appChildren }] : []),
    ...(settingsChildren.length
      ? [{ title: "Settings", url: "#settings", icon: Wrench, items: settingsChildren }] : []),
  ]

  // Kept so the render below does not have to change shape; the app group is inside Admin now.

  // Content pages not yet built; dead links removed.
  // Backend endpoints exist at /admin/content/profiles and /admin/content/unlocks
  // but frontend pages haven't been created yet.

  // Resolve the single active item as the LONGEST nav URL matching the current
  // path (across every group + sub-item). Without this, section roots like
  // /superadmin and /superadmin/fa prefix-match and light up on every nested page.
  // One name per destination, read from src/lib/destinations.ts. Titles written by hand in
  // this file are exactly how /work/goals came to be "My target" here and "Daily targets"
  // twelve lines down.
  const named = <T extends { url: string; title: string }>(items: T[]): T[] =>
    items.map((i) => ({ ...i, title: shortName(i.url) || i.title }))

  const overviewNamed = named(overviewItems)
  const managementNamed = named(managementItems)

  const activeUrl = React.useMemo(() => {
    // Sub-items came from campaignItems, which is permanently empty — so a nested page like
    // /work/proposals/create highlighted its parent instead of itself. Collect them from the
    // group that actually has children.
    const urls = [
      ...overviewItems,
      ...managementItems,
      ...systemItems,
      // Admin's three parents are categories, not destinations: their urls are anchors and
      // the real screens are their children. Leaving the children out here meant every page
      // under Settings highlighted nothing at all.
      ...systemItems.flatMap((i) => ('items' in i && i.items ? i.items : [])),
    ]
      // An entry may carry a query (sample packs), which is not part of the path it matches.
      // A category anchor (#settings) is not a path and never matches one.
      .map((i) => i.url?.split("?")[0])
      .filter((u): u is string => Boolean(u) && !u.startsWith("#"))
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
        {/* No heading. Two entries everybody has, whatever they do here, and a label above
            them would only be naming the fact that they are at the top. */}
        {overviewItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <NavMain items={overviewNamed} activeUrl={activeUrl} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Permissions arrive a beat after the first paint. The menu used to render three
            items and then triple under the reader's hand: the page jumps and anyone tabbing
            through has their focus thrown off whatever they were on. Reserving the space
            costs nothing and keeps the menu still. */}
        {accessLoading && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="space-y-1.5 px-2 py-1.5" aria-hidden>
                {Array.from({ length: 9 }).map((_, n) => (
                  <Skeleton key={n} className="h-7 w-full rounded-md" />
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* The work itself: one list, one order, one name per screen, for every role. */}
        {managementItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Work</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMain items={managementNamed} activeUrl={activeUrl} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Everything that is set once and read occasionally, behind three collapsed parents
            rather than twelve rows competing with the daily work. Five groups became three. */}
        {systemItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
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