"use client"

import * as React from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useEnhancedAuth } from "@/contexts/EnhancedAuthContext"
import { useCommercialAccount } from "@/hooks/useCommercialAccount"
import { brandProposalViewApi } from "@/services/adminProposalMasterApi"

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
  Crown,
  LayoutDashboard as IconDashboard,
  HelpCircle as IconHelp,
  Settings as IconSettings,
  Users as IconUsers,
  Target as IconTarget,
  CreditCard as IconCreditCard,
  Compass as IconCompass,
  List as IconList,
  FileText as IconFileText,
  Megaphone as IconMegaphone,
  Wallet as IconWallet,
  Bell as IconBell,
} from "lucide-react"

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
        height={32}
        className="object-contain w-30 h-8"
      />
    )
  }
  
  const isDark = resolvedTheme === 'dark' || theme === 'dark'
  const logoSrc = isDark ? "/Following Logo Dark Mode.svg" : "/followinglogo.svg"
  
  return (
    <Image
      src={logoSrc}
      alt="Following Logo"
      width={120}
      height={32}
      className="object-contain w-30 h-8"
    />
  )
}

export function EnhancedAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading, hasRole } = useEnhancedAuth()

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

  // Which modules this account holds. Drives what is in the menu at all.
  const { owns } = useCommercialAccount()

  /* Proposals waiting on this client, as a count on the nav item.
   *
   * A proposal we have sent is the one thing in the product where WE are waiting on THEM,
   * and until now nothing said so anywhere they would look: it sat on /proposals and a
   * client who did not open that page had no idea it had arrived. The server counts sent,
   * in_review and more_requested - everything not yet answered - and has always returned it
   * as `pending_count`.
   *
   * limit: 1 because we want the count, not the list. The count is computed over all of
   * them regardless of the page size. */
  const [pendingProposals, setPendingProposals] = React.useState(0)
  React.useEffect(() => {
    let dead = false
    brandProposalViewApi.listProposals({ limit: 1 })
      .then((r) => { if (!dead) setPendingProposals(r?.pending_count ?? 0) })
      .catch(() => { /* a badge that cannot load is no badge, never a zero shown as news */ })
    return () => { dead = true }
  }, [])

  // Base navigation items - only actual existing pages
  const getNavigationData = () => {
    const searchAnalytics = [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
      },
      // One Creators hub: every creator surface lives under a single group
      // (Discover | My Creators | Shared With Me | Lists) instead of being
      // scattered across 4 top-level destinations.
      {
        title: "Creators",
        url: "/creators",
        icon: IconUsers,
        items: [
          { title: "Discover", url: "/discover" },
          { title: "My Creators", url: "/creators" },
          { title: "Shared With Me", url: "/shared-influencers" },
          { title: "Lists", url: "/my-lists" },
        ],
      },
    ]

    const management = [
      {
        title: "Campaigns",
        url: "/campaigns",
        icon: IconTarget,
      },
      {
        title: "Proposals",
        url: "/proposals",
        icon: IconFileText,
        badge: pendingProposals,
      },
      // Run: the brand posts a brief, creators come back with their own price.
      // The other direction to Proposals, which is us pitching a roster.
      {
        title: "Briefs",
        url: "/run",
        icon: IconMegaphone,
      },
      // Merchant of Record, and ONLY for an account that holds it. It is bought, never
      // granted by a tier, so there is nothing to tease here: an account without it has no
      // route to buy it from this menu and a dead link would be worse than an absent one.
      // `owns.mor` is answered by the billing status, which reports the account's real
      // entitlements. It used to report none, which is why switching the module on for a
      // client changed nothing they could see.
      ...(owns.mor ? [{
        title: "Merchant of Record",
        url: "/mor",
        icon: IconWallet,
      }] : []),
    ]

    const more = [
      // Cashback Pool lives inside Billing now (/billing?tab=cashback-pool) —
      // one commercial home, no duplicate destination.
      {
        title: "Billing",
        url: "/billing",
        icon: IconCreditCard,
      },
      {
        title: "Notifications",
        url: "/notifications",
        icon: IconBell,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: IconSettings,
      },
      {
        // Above support on purpose: most of what people email to ask is answered here, and
        // an unread guide is the same as no guide.
        title: "How this works",
        url: "/guide",
        icon: IconHelp,
      },
      {
        // Clients get support, not our internal walkthroughs.
        title: "Help & Support",
        url: "mailto:partners@following.ae",
        icon: IconHelp,
      },
      // Include upgrade for free users only — point at the plan comparison, not
      // /billing (which is already the "Billing" item above).
      ...(hasRole('brand_free') ? [{
        title: "Upgrade Plan",
        url: "/pricing",
        icon: Crown,
      }] : [])
    ]

    return { searchAnalytics, management, more }
  }

  const data = getNavigationData()

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

        {/* More Section — pinned to the bottom only on desktop; on the mobile
            sheet it follows Management directly (no dead void mid-menu). */}
        <SidebarGroup className="md:mt-auto">
          <SidebarGroupLabel>More</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.more} />
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